# Parallax

**Open source, in perspective.**

Two developers. Two bodies of work. One new angle.

Parallax is a public GitHub comparison workspace: put two profiles head to head, explore their repositories as a three-dimensional landscape, and follow the details behind the numbers. Built with Astro, TypeScript and Three.js. No sign-in, personal token or backend required.

[Open Parallax](https://parallax.koray.dev) · [Try a matchup](https://parallax.koray.dev/?a=yyx990803&b=antfu)

## What you can explore

- **Developer vs developer** — public profiles, original repositories, stars received, forks received, followers, gists, and account context.
- **A real 3D repository landscape** — up to 30 loaded original repositories per side, orbit and zoom, choose stars/forks/size, and select a column to explore the repo. An accessible list offers the same data.
- **Repository explorer** — search names, descriptions and topics; filter by owner and language; sort by stars, forks, recency or name; export the filtered loaded set as CSV.
- **Repository details** — license, topics, branch, size, dates, issues/PR count and project links. Load language bytes, the three latest releases and five recent commits on demand.
- **Activity** — side-by-side public timelines and UTC daily event counts, with progressive loading.
- **Community** — public organizations, followers, following, gists and starred repositories, with pagination.
- **Shareable matchups** — the URL preserves both profiles and the active section. Leave the second handle blank to explore one profile.

## Run locally

Requires Node.js **22.22+** (Node 24 LTS recommended) and npm **9.6.5+**.

```sh
git clone https://github.com/raelsei/parallax.git
cd parallax
npm ci
npm run dev
```

```sh
npm test          # Data integrity, pagination, rate-limit and input tests
npm run build    # Astro / TypeScript checks and static production build
npm run preview  # Preview the built site
```

Astro's development command prints the local URL. Production output is written to `dist/`.

## Understand the comparison

Parallax is an exploration tool, not a developer ranking. Public GitHub activity cannot describe someone's ability, private work, employment, or complete contribution history.

| Measure | Definition |
| --- | --- |
| Original repos | Loaded repositories whose `fork` flag is false |
| Stars / forks received | Sums across loaded original repositories; forked projects' inherited counts are excluded |
| Languages overview | Number of loaded original repositories by primary language, not bytes or lines of code |
| Language detail | GitHub's language-byte breakdown for one repository |
| Open issues + PRs | GitHub's `open_issues_count`, which includes pull requests |
| 3D height | Shared `log(1 + value)` scale with a visible minimum height for zero values |
| Activity | Loaded public events in GitHub's recent window; events are not commits |

Each profile initially loads up to 100 repositories, sorted by last push. **Load next 100** follows GitHub's pagination link. Comparative totals are explicitly based on the loaded set. The landscape shows the top 30 of that loaded original set, not an unqualified all-time top 30.

GitHub exposes at most **300 public events from the last 30 days**, and events may be delayed. The timeline shows the latest 30 loaded event details; the chart counts all loaded events. Empty public activity does not mean no work happened.

## API & privacy

Requests go directly from the visitor's browser to `api.github.com`. There is no server proxy, analytics tracker, login, or secret bundled into the site. Profile images are loaded from GitHub's avatar service; the typeface is self-hosted.

GitHub normally allows **60 unauthenticated requests per hour per IP**. The footer displays the remaining allowance from response headers when available. A pair initially costs four requests. Results are cached in memory and `sessionStorage` for five minutes. Details and extra pages load only when requested. Clearing or closing the browser tab clears its session cache.

Public profile handles are included in shared URLs. Never add a GitHub token to this client-only project. Data can be missing, incomplete, unavailable or rate limited; the interface preserves those distinctions.

## Deployment

GitHub Actions builds, tests and deploys the static site to GitHub Pages on each push to `main`. Actions are pinned to reviewed release commits. Enable **GitHub Actions** as the repository's Pages source.

The dedicated domain is **parallax.koray.dev**. DNS uses a Cloudflare CNAME (`parallax` → `raelsei.github.io`, DNS only). GitHub Pages owns the HTTPS certificate.

The workflow defaults to `SITE_URL=https://parallax.koray.dev` and `BASE_PATH=/`. For another domain or a project subpath, override these repository Actions variables and update `public/CNAME` and the repository's Pages custom domain together.

`astro.config.mjs` reads the same two environment variables for local build overrides. Query-string routing works on static hosting without rewrite rules.

## Project map

```text
src/pages/index.astro       Static shell, metadata and semantic landmarks
src/scripts/app.ts         Comparison state, views and progressive data loading
src/lib/github.ts          Typed API client, cache, pagination and metrics
src/lib/landscape.ts       Optional, dynamically imported Three.js scene
src/styles/global.css     Responsive Material Atlas design system
tests/github.test.ts      Data-integrity and API-behavior tests
PRODUCT.md / DESIGN.md     Product truth and design contract
```

The 3D engine loads separately, renders only on interaction or resize, and is disposed when leaving the view. Reduced-motion users start in list view. WebGL failure falls back to the list.

## Credits & license

Created by [Koray Güler](https://koray.dev). Parallax is a complete Astro rebuild of the earlier [Githup](https://github.com/raelsei/githup) project; its Git history and MIT attribution are preserved.

[MIT](LICENSE). GitHub is a trademark of GitHub, Inc. Parallax is an independent project.
