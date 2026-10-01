# dreamward.life

The website of [Dreamward](https://github.com/SufZen/Dreamward): *your dream, one step at a time.*

English at `/`, Hebrew at `/he/` (right-to-left, written natively). Static
[Astro](https://astro.build), self-hosted fonts, no cookies, no analytics, no
third-party requests, and a strict Content-Security-Policy.

## Develop

```bash
pnpm install
pnpm dev        # http://localhost:4321
pnpm build      # release data → type check → build → dist checks
```

`scripts/release-data.mjs` reads the latest Dreamward release: installer
links, SHA-256 checksums, and the release's `install.sh` (served at
`/install.sh`). Locally it falls back to the releases page when offline; CI
sets `REQUIRE_RELEASE=1` so a broken release never ships.

## Layout

| Path | What |
|---|---|
| `src/i18n/en.ts`, `he.ts` | all copy; `he.ts` is typed against `en.ts`, so a missing key fails the build |
| `src/components/` | page sections (`Home.astro` is the home page in either language) |
| `src/illustrations/` | the inline-SVG drawings and charts, in brand tokens; direction-aware |
| `public/site.js` | one-click download per OS, tabs, copy, reveal-on-scroll, language hint |
| `scripts/check-dist.mjs` | post-build: both languages exist, links resolve, nothing third-party |

## Deploy

`.github/workflows/deploy.yml` publishes to GitHub Pages on every push, on
demand, and hourly when a new Dreamward release is out. Repository variables
`SITE_URL` and `SITE_BASE` point it at the domain (`https://dreamward.life`, `/`).

## License

Code: AGPL-3.0-only. Site text: CC BY-SA 4.0. The Dreamward name and logo are
the project's marks.
