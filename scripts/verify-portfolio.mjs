import { AgentBrowser } from '/home/z/.bun/install/global/node_modules/agent-browser-sdk/index.js';

const browser = new AgentBrowser({ headless: true, timeout: 60000 });

try {
  await browser.start();
  await browser.navigate('http://localhost:3000/#portfolio');

  // Wait for portfolio section to render
  await browser.waitForSelector('section#portfolio', { timeout: 30000 });
  await new Promise(r => setTimeout(r, 2500));

  // Scroll to portfolio
  await browser.evaluate(() => {
    document.querySelector('section#portfolio')?.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
  await new Promise(r => setTimeout(r, 2000));

  // Desktop screenshot
  await browser.setViewport({ width: 1440, height: 900 });
  await new Promise(r => setTimeout(r, 1500));
  await browser.screenshot('/home/z/my-project/scripts/portfolio-desktop.png');

  // Inspect: gallery controls in third card (salon-chimenea-negro)
  const inspection = await browser.evaluate(() => {
    const cards = document.querySelectorAll('section#portfolio .group');
    const thirdCard = cards[2];
    if (!thirdCard) return { error: 'no third card' };
    const imgs = thirdCard.querySelectorAll('img');
    const dots = thirdCard.querySelectorAll('[class*="bg-[#00c8b4]"], [class*="bg-white/35"]');
    const arrows = thirdCard.querySelectorAll('button[aria-label*="Imagen"]');
    const counter = thirdCard.querySelector('[class*="tabular-nums"]');
    return {
      imgCount: imgs.length,
      imgSrcs: Array.from(imgs).map(i => i.src),
      arrowCount: arrows.length,
      arrowLabels: Array.from(arrows).map(a => a.getAttribute('aria-label')),
      // Find vignette overlay divs (they have inline style with gradient)
      vignetteDivs: Array.from(thirdCard.querySelectorAll('div[style*="gradient"]')).map(d => d.getAttribute('style')),
    };
  });
  console.log('INSPECTION:', JSON.stringify(inspection, null, 2));

  // Hover over the third card to reveal the gallery arrows
  const hoverResult = await browser.evaluate(() => {
    const cards = document.querySelectorAll('section#portfolio .group');
    const thirdCard = cards[2];
    if (!thirdCard) return 'no card';
    // Find the button container
    const btn = thirdCard.querySelector('button');
    if (!btn) return 'no btn';
    btn.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
    btn.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    return 'hovered';
  });
  console.log('HOVER:', hoverResult);
  await new Promise(r => setTimeout(r, 800));

  await browser.screenshot('/home/z/my-project/scripts/portfolio-hover.png');

  // Now open the lightbox by clicking the third card
  await browser.evaluate(() => {
    const cards = document.querySelectorAll('section#portfolio .group');
    const thirdCard = cards[2];
    const btn = thirdCard.querySelector('button');
    btn?.click();
  });
  await new Promise(r => setTimeout(r, 1500));

  await browser.screenshot('/home/z/my-project/scripts/portfolio-lightbox.png');

  // Inspect lightbox
  const lightboxInspect = await browser.evaluate(() => {
    const lb = document.querySelector('[class*="fixed inset-0"][class*="z-[100]"]');
    if (!lb) return { error: 'no lightbox' };
    const imgs = lb.querySelectorAll('img');
    const dots = lb.querySelectorAll('button[class*="rounded-full"][aria-label*="imagen"]');
    const arrows = lb.querySelectorAll('button[aria-label*="Proyecto"], button[aria-label*="Imagen"]');
    return {
      imgCount: imgs.length,
      imgSrcs: Array.from(imgs).map(i => i.src),
      arrowCount: arrows.length,
      arrowLabels: Array.from(arrows).map(a => a.getAttribute('aria-label')),
    };
  });
  console.log('LIGHTBOX:', JSON.stringify(lightboxInspect, null, 2));

  // Click next image button (the one inside the lightbox image stage)
  await browser.evaluate(() => {
    const lb = document.querySelector('[class*="fixed inset-0"][class*="z-[100]"]');
    const nextImgBtn = Array.from(lb.querySelectorAll('button')).find(b => b.getAttribute('aria-label') === 'Imagen siguiente del proyecto');
    nextImgBtn?.click();
  });
  await new Promise(r => setTimeout(r, 1200));
  await browser.screenshot('/home/z/my-project/scripts/portfolio-lightbox-img2.png');

  const img2Check = await browser.evaluate(() => {
    const lb = document.querySelector('[class*="fixed inset-0"][class*="z-[100]"]');
    const img = lb.querySelector('img');
    return { src: img?.src, alt: img?.alt };
  });
  console.log('IMG2:', JSON.stringify(img2Check, null, 2));

  console.log('OK');
} catch (e) {
  console.error('ERR:', e.message);
  console.error(e.stack);
} finally {
  await browser.stop();
}
