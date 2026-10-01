#!/usr/bin/env node
/* ============================================================================
 * Reads the latest Dreamward release and writes what the site needs:
 *   src/data/release.json  version, installer URLs, SHA-256 per installer, stars
 *   public/install.sh      the release's verified installer (dreamward.life/install.sh)
 *   public/version.txt     the deployed release tag (the hourly deploy compares it)
 *
 * REQUIRE_RELEASE=1 (CI) fails the build when anything is missing. Locally,
 * without network, it falls back to the "latest release" page so dev works.
 * ========================================================================= */
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = process.env.DREAMWARD_REPO || 'SufZen/Dreamward';
const strict = process.env.REQUIRE_RELEASE === '1';
const fallback = `https://github.com/${REPO}/releases/latest`;

const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'dreamward-site' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

/** Installer keys → asset-name patterns (same as the app's release assets). */
const INSTALLERS = {
  win: /Setup-.*\.exe$/,
  macArm: /mac-arm64\.dmg$/,
  macIntel: /mac-x64\.dmg$/,
  appImage: /\.AppImage$/,
  deb: /\.deb$/,
};

async function get(url, as = 'json') {
  const res = await fetch(url, { headers: as === 'json' ? headers : { 'User-Agent': 'dreamward-site' }, redirect: 'follow' });
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return as === 'json' ? res.json() : as === 'text' ? res.text() : Buffer.from(await res.arrayBuffer());
}

function fail(msg) {
  if (strict) {
    console.error(`[release-data] ${msg}`);
    process.exit(1);
  }
  console.warn(`[release-data] ${msg} — using fallbacks (set REQUIRE_RELEASE=1 to fail instead)`);
}

const data = { version: '', tag: '', downloads: {}, sha256: {}, stars: null };
for (const key of Object.keys(INSTALLERS)) data.downloads[key] = fallback;

try {
  const rel = await get(`https://api.github.com/repos/${REPO}/releases/latest`);
  data.tag = rel.tag_name;
  data.version = rel.tag_name.replace(/^v/, '');
  const assets = rel.assets ?? [];
  for (const [key, re] of Object.entries(INSTALLERS)) {
    const asset = assets.find((a) => re.test(a.name));
    if (asset) data.downloads[key] = asset.browser_download_url;
    else fail(`no ${key} installer in ${rel.tag_name}`);
  }

  // Checksums (releases from v0.6 on publish SHA256SUMS).
  const sums = assets.find((a) => a.name === 'SHA256SUMS');
  const byName = new Map();
  if (sums) {
    for (const line of (await get(sums.browser_download_url, 'text')).split('\n')) {
      const m = line.match(/^([a-f0-9]{64})\s+\*?(.+)$/);
      if (m) byName.set(m[2].trim(), m[1]);
    }
    for (const [key, href] of Object.entries(data.downloads)) {
      const name = decodeURIComponent(href.split('/').pop() ?? '');
      if (byName.has(name)) data.sha256[key] = byName.get(name);
    }
  }

  // The self-host installer, served at /install.sh — verified when sums exist.
  const installer = assets.find((a) => a.name === 'install.sh');
  if (installer) {
    const body = await get(installer.browser_download_url, 'buffer');
    const want = byName.get('install.sh');
    const got = createHash('sha256').update(body).digest('hex');
    if (want && want !== got) throw new Error(`install.sh checksum mismatch (${got} ≠ ${want})`);
    writeFileSync(join(root, 'public/install.sh'), body);
  } else {
    fail(`no install.sh in ${rel.tag_name}`);
  }

  try {
    data.stars = (await get(`https://api.github.com/repos/${REPO}`)).stargazers_count ?? null;
  } catch {
    /* stars are decoration */
  }
} catch (err) {
  fail(String(err instanceof Error ? err.message : err));
}

mkdirSync(join(root, 'src/data'), { recursive: true });
writeFileSync(join(root, 'src/data/release.json'), JSON.stringify(data, null, 2) + '\n');
writeFileSync(join(root, 'public/version.txt'), (data.tag || 'unknown') + '\n');
console.log(`[release-data] ${data.tag || 'no release'} · ${Object.keys(data.sha256).length} checksums · ${data.stars ?? '?'} stars`);
