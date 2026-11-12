import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.join(__dirname, '..', 'dist');
const ssrEntry = path.join(__dirname, '..', 'dist-ssr', 'entry-ssr.js');

async function fetchSettings() {
  try {
    const res = await fetch('https://apnikhareedari.pk/api/settings/public');
    const json = await res.json();
    return json.data || {};
  } catch {
    // Build-time network failure shouldn't break the whole deploy — fall back
    // to an empty object; the page still renders, just without store details.
    return {};
  }
}

async function main() {
  const { renderStaticPage, STATIC_PAGES } = await import(pathToFileURL(ssrEntry).href);
  const settings = await fetchSettings();
  const template = await readFile(path.join(distDir, 'index.html'), 'utf-8');

  // Matches the <title>/<meta>/<link rel="canonical"> tags Seo/Helmet renders
  // inline (see entry-ssr.jsx) so they can be moved into <head> and stripped
  // out of the body.
  const headTagPattern = /<title>.*?<\/title>|<meta[^>]*\/>|<link rel="canonical"[^>]*\/>/gs;

  for (const routePath of Object.keys(STATIC_PAGES)) {
    const rawHtml = renderStaticPage(routePath, settings);
    const headTags = rawHtml.match(headTagPattern) || [];
    const bodyHtml = rawHtml.replace(headTagPattern, '');

    let page = template.replace('<div id="root"></div>', `<div id="root">${bodyHtml}</div>`);
    if (headTags.length) {
      page = page.replace(/<title>.*?<\/title>/s, headTags.join('\n    '));
    }

    const outDir = path.join(distDir, routePath.replace(/^\//, ''));
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, 'index.html'), page, 'utf-8');
    console.log(`Prerendered ${routePath} -> ${path.relative(distDir, path.join(outDir, 'index.html'))}`);
  }
}

main().catch((err) => {
  console.error('Prerender failed:', err);
  process.exit(1);
});
