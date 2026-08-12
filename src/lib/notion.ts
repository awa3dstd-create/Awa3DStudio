/**
 * Notion API helper for creating + updating lead rows in the "Leads" database.
 *
 * Docs:
 *   - https://developers.notion.com/reference/post-page
 *   - https://developers.notion.com/reference/patch-page
 *   - https://developers.notion.com/reference/post-database-query
 *
 * Env vars:
 *   NOTION_API_KEY      — integration secret (ntn_xxx)
 *   NOTION_LEADS_DB_ID  — database ID (32-char hex from URL)
 *
 * Schema (Phase 1):
 *   Name (title), Email (email), Phone (phone_number), Service (select),
 *   Message (rich_text), Source (select: contact|course),
 *   Country (rich_text), Created (date)
 *
 * Schema additions (Phase 2):
 *   Status (select: Nuevo | Contactado | Cotización enviada | Cerrado | Rechazado)
 *   QuoteSentDate (date)
 *   LastFollowUpDate (date)
 *   FollowUpCount (number)
 *   QuoteId (rich_text)
 *
 * If env vars are not set, every function returns { ok: false, skipped: true }
 * so the API route degrades gracefully (email + Telegram still fire).
 */

const NOTION_API_KEY = process.env.NOTION_API_KEY;
const NOTION_LEADS_DB_ID = process.env.NOTION_LEADS_DB_ID;
const NOTION_VERSION = "2022-06-28";

export interface LeadData {
  name: string;
  email: string;
  phone?: string;
  service?: string;
  message: string;
  source: "contact" | "course";
  country?: string;
  ip?: string;
}

export interface NotionResult {
  ok: boolean;
  pageId?: string;
  url?: string;
  error?: string;
  skipped?: boolean;
}

export async function createLeadInNotion(
  lead: LeadData
): Promise<NotionResult> {
  if (!NOTION_API_KEY || !NOTION_LEADS_DB_ID) {
    console.warn("[notion] env vars not set — skipping");
    return { ok: false, skipped: true, error: "Missing Notion env vars" };
  }

  try {
    const res = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_LEADS_DB_ID },
        properties: {
          Name: { title: [{ text: { content: lead.name.slice(0, 2000) } }] },
          Email: { email: lead.email },
          ...(lead.phone
            ? { Phone: { phone_number: lead.phone } }
            : {}),
          ...(lead.service
            ? { Service: { select: { name: lead.service.slice(0, 100) } } }
            : {}),
          Message: {
            rich_text: [
              { text: { content: lead.message.slice(0, 2000) } },
            ],
          },
          Source: { select: { name: lead.source } },
          ...(lead.country
            ? {
                Country: {
                  rich_text: [
                    { text: { content: lead.country.slice(0, 2000) } },
                  ],
                },
              }
            : {}),
          Status: { select: { name: "Nuevo" } },
          Created: { date: { start: new Date().toISOString() } },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notion] error:", res.status, errText);
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    const data = await res.json();
    return { ok: true, pageId: data.id, url: data.url };
  } catch (err) {
    console.error("[notion] createLeadInNotion exception:", err);
    return { ok: false, error: String(err) };
  }
}

// ============ Phase 2: Status + quote tracking ============

export type LeadStatus =
  | "Nuevo"
  | "Contactado"
  | "Cotización enviada"
  | "Cerrado"
  | "Rechazado";

export async function updateLeadStatus(
  pageId: string,
  status: LeadStatus
): Promise<NotionResult> {
  if (!NOTION_API_KEY) {
    return { ok: false, skipped: true, error: "Missing Notion env vars" };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          Status: { select: { name: status } },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notion] updateLeadStatus error:", res.status, errText);
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    const data = await res.json();
    return { ok: true, pageId: data.id, url: data.url };
  } catch (err) {
    console.error("[notion] updateLeadStatus exception:", err);
    return { ok: false, error: String(err) };
  }
}

export async function markQuoteSent(
  pageId: string,
  quoteId: string
): Promise<NotionResult> {
  if (!NOTION_API_KEY) {
    return { ok: false, skipped: true, error: "Missing Notion env vars" };
  }

  try {
    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          Status: { select: { name: "Cotización enviada" } },
          QuoteSentDate: {
            date: { start: new Date().toISOString() },
          },
          QuoteId: {
            rich_text: [{ text: { content: quoteId.slice(0, 200) } }],
          },
          FollowUpCount: { number: 0 },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notion] markQuoteSent error:", res.status, errText);
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    const data = await res.json();
    return { ok: true, pageId: data.id, url: data.url };
  } catch (err) {
    console.error("[notion] markQuoteSent exception:", err);
    return { ok: false, error: String(err) };
  }
}

export async function markFollowUpSent(
  pageId: string,
  day: 3 | 7 | 14
): Promise<NotionResult> {
  if (!NOTION_API_KEY) {
    return { ok: false, skipped: true, error: "Missing Notion env vars" };
  }

  const newStatus: LeadStatus = day === 14 ? "Rechazado" : "Cotización enviada";

  try {
    // Get current FollowUpCount first (need a read-modify-write)
    const currentRes = await fetch(
      `https://api.notion.com/v1/pages/${pageId}`,
      {
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": NOTION_VERSION,
        },
      }
    );
    if (!currentRes.ok) {
      const errText = await currentRes.text();
      return { ok: false, error: `${currentRes.status}: ${errText}` };
    }
    const currentData = await currentRes.json();
    const currentCount =
      (currentData.properties?.FollowUpCount?.number as number) ?? 0;

    const res = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          Status: { select: { name: newStatus } },
          LastFollowUpDate: {
            date: { start: new Date().toISOString() },
          },
          FollowUpCount: { number: currentCount + 1 },
        },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[notion] markFollowUpSent error:", res.status, errText);
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    const data = await res.json();
    return { ok: true, pageId: data.id, url: data.url };
  } catch (err) {
    console.error("[notion] markFollowUpSent exception:", err);
    return { ok: false, error: String(err) };
  }
}

// ============ Query leads needing follow-up ============

export interface LeadForFollowUp {
  pageId: string;
  name: string;
  email: string;
  service?: string;
  country?: string;
  quoteSentDate: Date | null;
  lastFollowUpDate: Date | null;
  followUpCount: number;
}

/**
 * Query Notion for leads with Status = "Cotización enviada".
 * Returns the data needed by the follow-up cron.
 */
export async function getLeadsNeedingFollowUp(): Promise<{
  ok: boolean;
  leads?: LeadForFollowUp[];
  error?: string;
  skipped?: boolean;
}> {
  if (!NOTION_API_KEY || !NOTION_LEADS_DB_ID) {
    return { ok: false, skipped: true, error: "Missing Notion env vars" };
  }

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_LEADS_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "Status",
            select: { equals: "Cotización enviada" },
          },
          page_size: 100,
        }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error(
        "[notion] getLeadsNeedingFollowUp error:",
        res.status,
        errText
      );
      return { ok: false, error: `${res.status}: ${errText}` };
    }

    const data = await res.json();
    const leads: LeadForFollowUp[] = (data.results || []).map(
      (page: any) => extractLeadForFollowUp(page)
    );

    return { ok: true, leads };
  } catch (err) {
    console.error("[notion] getLeadsNeedingFollowUp exception:", err);
    return { ok: false, error: String(err) };
  }
}

function extractLeadForFollowUp(page: any): LeadForFollowUp {
  const p = page.properties || {};
  const titleProp = p.Name?.title?.[0]?.plain_text || "";
  const emailProp = p.Email?.email || "";
  const serviceSelect = p.Service?.select?.name;
  const countryProp =
    p.Country?.rich_text?.[0]?.plain_text || undefined;
  const quoteSentStr = p.QuoteSentDate?.date?.start || null;
  const lastFollowUpStr = p.LastFollowUpDate?.date?.start || null;
  const followUpCount = p.FollowUpCount?.number ?? 0;

  return {
    pageId: page.id,
    name: titleProp,
    email: emailProp,
    service: serviceSelect,
    country: countryProp,
    quoteSentDate: quoteSentStr ? new Date(quoteSentStr) : null,
    lastFollowUpDate: lastFollowUpStr ? new Date(lastFollowUpStr) : null,
    followUpCount,
  };
}

// ============ Schema migration (idempotent) ============

/**
 * Ensure the Notion DB has the Phase 2 properties:
 *   Status (select), QuoteSentDate (date), LastFollowUpDate (date),
 *   FollowUpCount (number), QuoteId (rich_text)
 *
 * Idempotent: safe to call multiple times. If a property already exists,
 * Notion returns 400 with validation_error — we treat that as success.
 */
export async function ensureNotionSchema(): Promise<{
  ok: boolean;
  added: string[];
  skipped: string[];
  error?: string;
}> {
  if (!NOTION_API_KEY || !NOTION_LEADS_DB_ID) {
    return {
      ok: false,
      added: [],
      skipped: [],
      error: "Missing Notion env vars",
    };
  }

  const properties = {
    Status: {
      type: "select",
      select: {
        options: [
          { name: "Nuevo", color: "blue" },
          { name: "Contactado", color: "yellow" },
          { name: "Cotización enviada", color: "green" },
          { name: "Cerrado", color: "purple" },
          { name: "Rechazado", color: "red" },
        ],
      },
    },
    QuoteSentDate: { type: "date", date: {} },
    LastFollowUpDate: { type: "date", date: {} },
    FollowUpCount: { type: "number", number: { format: "number" } },
    QuoteId: { type: "rich_text", rich_text: {} },
  };

  try {
    const res = await fetch(
      `https://api.notion.com/v1/databases/${NOTION_LEADS_DB_ID}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${NOTION_API_KEY}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ properties }),
      }
    );

    if (!res.ok) {
      const errText = await res.text();
      // Notion returns 400 if a property already exists with conflicts —
      // treat as success because the schema is what matters.
      if (res.status === 400 && errText.includes("already")) {
        return {
          ok: true,
          added: [],
          skipped: Object.keys(properties),
        };
      }
      return {
        ok: false,
        added: [],
        skipped: [],
        error: `${res.status}: ${errText}`,
      };
    }

    return {
      ok: true,
      added: Object.keys(properties),
      skipped: [],
    };
  } catch (err) {
    console.error("[notion] ensureNotionSchema exception:", err);
    return { ok: false, added: [], skipped: [], error: String(err) };
  }
}
