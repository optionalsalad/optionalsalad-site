// Builds the site: wraps each page body in src/pages/ with the shared header and
// footer and writes it to public/. Company details come from src/site.json.
//
//   node tools/build.mjs
//
// Then commit public/ — Cloudflare serves public/ as-is (see wrangler.jsonc).

import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const site = JSON.parse(readFileSync(join(root, 'src/site.json'), 'utf8'));

// Every page: title, description, which nav item is current.
const pages = {
  'index.html': { title: 'Optional Salad — software for ordinary life', desc: 'Optional Salad is an independent UK software studio building calm, useful apps for everyday life. Makers of DoWeDontWe.', nav: '/' },
  'contact.html': { title: 'Contact — Optional Salad', desc: 'How to contact Optional Salad.', nav: '/contact' },
  'privacy.html': { title: 'Website privacy — Optional Salad', desc: 'How optionalsalad.com handles your data, and links to each app\'s privacy policy.', nav: '' },
  '404.html': { title: 'Page not found — Optional Salad', desc: 'This page does not exist.', nav: '' },
  'dowedontwe/index.html': { title: 'DoWeDontWe — decide things together', desc: 'DoWeDontWe is a calm app for deciding things together — holidays, gifts, playlists, chores. Coming soon to Android and iPhone.', nav: '/dowedontwe' },
  'dowedontwe/privacy.html': { title: 'DoWeDontWe privacy policy — Optional Salad', desc: 'How DoWeDontWe handles your data.', nav: '/dowedontwe' },
  'dowedontwe/terms.html': { title: 'DoWeDontWe terms of service — Optional Salad', desc: 'The terms for using DoWeDontWe.', nav: '/dowedontwe' },
  'dowedontwe/delete-account.html': { title: 'Delete your DoWeDontWe account — Optional Salad', desc: 'How to delete your DoWeDontWe account and data.', nav: '/dowedontwe' },
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');

function companyBlock() {
  // UK law (Companies Act 2006 / 2015 trading disclosures): a company website must show its registered
  // name, number, place of registration and registered office. Until registration, say so plainly.
  if (!site.companyName) {
    return '<p>Optional Salad is being set up as a private limited company in England and Wales. Our company details will appear here once registered.</p>';
  }
  const lines = [
    `${esc(site.companyName)} is a private limited company registered in England and Wales` +
      (site.companyNumber ? `, company number ${esc(site.companyNumber)}` : '') + '.',
    site.registeredOffice ? `Registered office: ${esc(site.registeredOffice)}.` : '',
    site.vatNumber ? `VAT number: ${esc(site.vatNumber)}.` : '',
    site.icoRegistration ? `Registered with the Information Commissioner's Office: ${esc(site.icoRegistration)}.` : '',
  ].filter(Boolean);
  return lines.map((l) => `<p>${l}</p>`).join('\n      ');
}

function layout(file, body) {
  const p = pages[file];
  const navLink = (href, label) =>
    `<a href="${href}"${p.nav === href ? ' aria-current="page"' : ''}>${label}</a>`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(p.title)}</title>
  <meta name="description" content="${esc(p.desc)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header">
    <a class="wordmark" href="/">Optional <span class="green">Salad</span></a>
    <nav class="site-nav" aria-label="Main">
      ${navLink('/', 'Home')}
      ${navLink('/dowedontwe', 'DoWeDontWe')}
      ${navLink('/contact', 'Contact')}
    </nav>
  </header>
  <main>
${body.replace(/\s+$/, '')}
  </main>
  <footer class="site-footer">
    <div class="company">
      <!-- Company details: edit src/site.json, then run node tools/build.mjs -->
      ${companyBlock()}
      <p>© ${year} Optional Salad.</p>
    </div>
    <nav class="footer-links" aria-label="Footer">
      <a href="/contact">Contact</a>
      <a href="/privacy">Website privacy</a>
      <a href="/dowedontwe/privacy">DoWeDontWe privacy</a>
      <a href="/dowedontwe/terms">DoWeDontWe terms</a>
      <a href="/dowedontwe/delete-account">Delete your account</a>
    </nav>
  </footer>
</body>
</html>
`;
}

for (const file of Object.keys(pages)) {
  const body = readFileSync(join(root, 'src/pages', file), 'utf8').split('\r\n').join('\n');
  const out = join(root, 'public', file);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, layout(file, body));
  console.log('built', relative(root, out));
}
