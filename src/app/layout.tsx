import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { ServiceWorkerRegister } from "@/components/awa/sw-register";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://awa3dstudio.pages.dev"),
  title: "AWA 3D STUDIO | Visualización Arquitectónica & Modelado 3D",
  description:
    "Estudio de visualización arquitectónica y modelado 3D de alta gama. Renders fotorrealistas, recorridos 360°, animación y más. La Habana, Cuba.",
  keywords: [
    "visualización arquitectónica",
    "renders fotorrealistas",
    "recorridos 360",
    "animación arquitectónica",
    "modelado 3D",
    "AWA 3D Studio",
    "La Habana",
    "Cuba",
  ],
  authors: [{ name: "AWA 3D Studio" }],
  creator: "AWA 3D Studio",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
    ],
    shortcut: ["/favicon.ico", "/favicon-32.png"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "icon", url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { rel: "icon", url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
  },
  openGraph: {
    title: "AWA 3D STUDIO | Visualización Arquitectónica & Modelado 3D",
    description:
      "Renders fotorrealistas, recorridos 360° y animación que transforman sus proyectos en experiencias visuales impactantes.",
    url: "https://awa3dstudio.pages.dev",
    siteName: "AWA 3D STUDIO",
    images: [
      {
        url: "/portfolio/salon-luminoso.jpg",
        width: 2400,
        height: 1500,
        alt: "Render fotorrealista de salón luminoso por AWA 3D Studio",
      },
    ],
    locale: "es_LA",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AWA 3D STUDIO | Visualización Arquitectónica",
    description:
      "Renders fotorrealistas, recorridos 360° y animación arquitectónica de alta gama.",
    images: ["/portfolio/salon-luminoso.jpg"],
  },
  robots: { index: true, follow: true },
  alternates: {
    canonical: "https://awa3dstudio.pages.dev",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning className="dark">
      <body
        className={`${spaceGrotesk.variable} antialiased bg-[#0a0a0f] text-[#e4e4e7] min-h-screen flex flex-col`}
      >
        {children}
        <ServiceWorkerRegister />
        <Toaster
          position="bottom-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#0f0f17",
              border: "1px solid #1e1e2a",
              color: "#e4e4e7",
              borderRadius: "6px",
            },
          }}
        />
      </body>
    </html>
  );
}
