#!/usr/bin/env node
/* Post-build checks: every page exists in both languages, no unfilled
   placeholders, internal links resolve, and nothing loads from another origin. */
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '../dist');
const base = (process.env.SITE_BASE || '/').replace(/\/+$/, '');
const errors = [];
const pages = [];
(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p);
    else if (f.endsWith('.html')) pages.push(p);
  }
})(dist);

for (const need of ['index.html', 'he/index.html', 'privacy/index.html', 'he/privacy/index.html', '404.html', 'site.js']) {
  if (!existsSync(join(dist, need))) errors.push(`missing ${need}`);
}

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  const rel = page.slice(dist.length + 1);
  if (/__[A-Z_]+__|undefined|\[object Object\]/.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, ''))) errors.push(`${rel}: placeholder or undefined in output`);
  for (const m of html.matchAll(/<(script|link|img)\b[^>]*?\s(?:src|href)="(https?:)?\/\/(?!dreamward\.life)[^"]+"/g)) {
    if (!/rel="(canonical|alternate)"/.test(m[0])) errors.push(`${rel}: third-party resource ${m[0].slice(0, 100)}`);
  }
  for (const m of html.matchAll(/\shref="(\/[^"#?]*)/g)) {
    let target = m[1];
    if (base && target.startsWith(base)) target = target.slice(base.length) || '/';
    const file = target.endsWith('/') ? join(dist, target, 'index.html') : join(dist, target);
    if (!existsSync(file)) errors.push(`${rel}: broken link ${m[1]}`);
  }
}

if (errors.length) {
  console.error(`[check-dist] ${errors.length} problem(s):\n  ` + [...new Set(errors)].join('\n  '));
  process.exit(1);
}
console.log(`[check-dist] ${pages.length} pages OK`);
