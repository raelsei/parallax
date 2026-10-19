import {
  createIcons,
  PanelsTopLeft,
  GitFork,
  Activity,
  Users,
  CircleHelp,
  GitBranch as Github,
  ArrowUpRight,
  ChevronRight,
  Link,
  ArrowLeftRight,
  ScanLine,
  X,
  MapPin,
  Building2,
  CalendarDays,
  Globe,
  Box,
  Rows3,
  Star,
  Search,
  ArrowRight,
  RotateCcw,
  Plus,
  Minus,
  Move,
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  BookOpen,
  FileCode2,
  Download,
  ExternalLink,
  Check,
  Code,
  Clock3,
} from 'lucide';
import {
  api,
  collection,
  loadProfile,
  summarize,
  normalizeUsername,
  safeURL,
  dailyActivity,
  quota,
  GitHubError,
  languageColors,
  type Dataset,
  type Repo,
  type PublicEvent,
  type Person,
  type Gist,
  type Page,
} from '../lib/github';
const icons = {
  PanelsTopLeft,
  GitFork,
  Activity,
  Users,
  CircleHelp,
  Github,
  ArrowUpRight,
  ChevronRight,
  Link,
  ArrowLeftRight,
  ScanLine,
  X,
  MapPin,
  Building2,
  CalendarDays,
  Globe,
  Box,
  Rows3,
  Star,
  Search,
  ArrowRight,
  RotateCcw,
  Plus,
  Minus,
  Move,
  GitCommitHorizontal,
  GitPullRequest,
  CircleDot,
  BookOpen,
  FileCode2,
  Download,
  ExternalLink,
  Check,
  Code,
  Clock3,
};
const $ = <T extends HTMLElement = HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const esc = (value: unknown) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[
        c
      ]!,
  );
const icon = (name: string) =>
  `<i data-lucide="${name}" aria-hidden="true"></i>`;
const fmt = (n: number) =>
  new Intl.NumberFormat('en', {
    notation: n >= 10000 ? 'compact' : 'standard',
    maximumFractionDigits: 1,
  }).format(n);
const exact = (n: number) => n.toLocaleString('en');
const date = (value: string) =>
  new Date(value).toLocaleDateString('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
const age = (value: string) => {
  const d = Math.max(
    0,
    Math.floor((Date.now() - new Date(value).getTime()) / 86400000),
  );
  return d === 0
    ? 'Today'
    : d === 1
      ? '1 day ago'
      : d < 30
        ? `${d} days ago`
        : new Date(value).toLocaleDateString('en', {
            month: 'short',
            day: 'numeric',
            year:
              new Date(value).getFullYear() !== new Date().getFullYear()
                ? 'numeric'
                : undefined,
          });
};
const errorText = (error: unknown) =>
  error instanceof GitHubError
    ? `${error.message}${error.reset ? ` Resets at ${new Date(error.reset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.` : ''}`
    : error instanceof Error
      ? error.message
      : 'Something went wrong. Please try again.';
const link = (url: string | null | undefined, label: string, cls = '') => {
  const safe = safeURL(url);
  return safe
    ? `<a class="${cls}" href="${esc(safe)}" target="_blank" rel="noreferrer">${label}</a>`
    : label;
};
function refreshIcons() {
  createIcons({ icons, attrs: { 'aria-hidden': 'true', 'stroke-width': 1.7 } });
}
const state: {
  data: (Dataset | null)[];
  errors: string[];
  tab: string;
  view: string;
  metric: string;
  filter: string;
  owner: string;
  language: string;
  sort: string;
  repoLimit: number;
  community: string;
  busy: boolean;
  events: Map<string, Page<PublicEvent>>;
  extras: Map<string, Page<any>>;
} = {
  data: [null, null],
  errors: ['', ''],
  tab: 'overview',
  view: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'table' : '3d',
  metric: 'stars',
  filter: '',
  owner: 'all',
  language: 'all',
  sort: 'stars',
  repoLimit: 12,
  community: 'orgs',
  busy: false,
  events: new Map(),
  extras: new Map(),
};
let controller = new AbortController();
let generation = 0;
let scene:
  | { dispose: () => void; reset: () => void; zoom: (n: number) => void }
  | undefined;
let viewGeneration = 0;
let detailGeneration = 0;
let toastTimer: ReturnType<typeof setTimeout>;
function notify(message: string) {
  $('toast').textContent = message;
  $('toast').hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ($('toast').hidden = true), 3500);
}
function updateQuota() {
  const q = quota();
  $('quota').textContent =
    q.remaining === null
      ? 'GitHub REST API'
      : `${q.remaining} API requests remaining${q.resetAt ? ` · resets ${new Date(q.resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}`;
}
function setStatus(message = '', error = false) {
  $('global-status').textContent = message;
  $('global-status').className = `status${error ? ' error' : ''}`;
}
function saveURL() {
  const u = new URL(location.href);
  const a = state.data[0]?.profile.login,
    b = state.data[1]?.profile.login;
  if (a) u.searchParams.set('a', a);
  else u.searchParams.delete('a');
  if (b) u.searchParams.set('b', b);
  else u.searchParams.delete('b');
  u.searchParams.set('tab', state.tab);
  history.replaceState({}, '', u);
  document.title = a
    ? `${a}${b ? ` vs ${b}` : ''} · Parallax`
    : 'Parallax — Open source, in perspective.';
}
function allRepos() {
  return state.data.flatMap((d, owner) =>
    d ? d.repos.map((repo) => ({ repo, owner })) : [],
  );
}
function profiles() {
  $('profiles').innerHTML = state.data
    .map((d, i) => {
      const cls = i === 0 ? 'a' : 'b';
      let html = '';
      if (state.busy && !d)
        html = `<article class="profile ${cls}"><div class="profile-loading"><span class="loader"></span>Loading perspective ${i === 0 ? 'A' : 'B'}…</div></article>`;
      else if (!d)
        html = `<article class="profile ${cls}"><span class="identity-chip ${cls}">${i === 0 ? 'A' : 'B'}</span><div class="profile-empty">${esc(state.errors[i] || 'Add a developer above to see their side of the story.')}</div></article>`;
      else {
        const p = d.profile;
        const blog = safeURL(p.blog);
        html = `<article class="profile ${cls}"><img src="${esc(p.avatar_url)}" alt="${esc(p.login)} avatar" width="49" height="49" referrerpolicy="no-referrer"/><div class="profile-identity"><h2>${esc(p.name || p.login)}</h2>${link(p.html_url, `@${esc(p.login)} ${icon('arrow-up-right')}`, 'handle')}</div><div class="profile-side"><strong>${fmt(p.followers)}</strong>followers</div><p class="bio">${esc(p.bio || 'A public body of work, ready to explore.')}</p><div class="profile-meta">${p.company ? `<span>${icon('building-2')}${esc(p.company)}</span>` : ''}${p.location ? `<span>${icon('map-pin')}${esc(p.location)}</span>` : ''}<span>${icon('calendar-days')}Joined ${new Date(p.created_at).getFullYear()}</span>${blog ? link(blog, `${icon('globe')}${esc(new URL(blog).hostname)}`) : ''}<span class="optional-meta">${fmt(p.public_repos)} public repos</span></div></article>`;
      }
      return (
        (i === 1 ? '<div class="versus" aria-label="versus">VS</div>' : '') +
        html
      );
    })
    .join('');
  refreshIcons();
}
async function compare() {
  let names: string[];
  try {
    names = [
      $<HTMLInputElement>('handle-a').value,
      $<HTMLInputElement>('handle-b').value,
    ].map((s, i) =>
      s.trim() ? normalizeUsername(s) : i === 0 ? normalizeUsername(s) : '',
    );
  } catch (e) {
    setStatus(errorText(e), true);
    return;
  }
  controller.abort();
  controller = new AbortController();
  const run = ++generation;
  state.busy = true;
  state.data = [null, null];
  state.errors = ['', ''];
  state.events.clear();
  state.extras.clear();
  state.owner = 'all';
  state.language = 'all';
  state.filter = '';
  state.repoLimit = 12;
  detailGeneration++;
  $('repo-detail').hidden = true;
  disposeScene();
  setStatus();
  $<HTMLButtonElement>('compare').disabled = true;
  profiles();
  $('content').setAttribute('aria-busy', 'true');
  $('content').innerHTML =
    '<div class="initial-loading"><span class="loader"></span><p>Reading public GitHub profiles…</p></div>';
  await Promise.all(
    names.map(async (name, i) => {
      if (!name) return;
      try {
        const result = await loadProfile(name, controller.signal);
        if (run === generation) state.data[i] = result;
      } catch (e) {
        if (run === generation && !controller.signal.aborted)
          state.errors[i] = errorText(e);
      }
    }),
  );
  if (run !== generation) return;
  state.busy = false;
  $<HTMLButtonElement>('compare').disabled = false;
  $('content').setAttribute('aria-busy', 'false');
  profiles();
  updateQuota();
  const warnings = state.data
    .filter(Boolean)
    .map((d) => d!.warning)
    .filter(Boolean);
  setStatus(
    [...state.errors.filter(Boolean), ...warnings].join(' '),
    state.errors.some(Boolean),
  );
  saveURL();
  render();
}
function disposeScene() {
  viewGeneration++;
  scene?.dispose();
  scene = undefined;
}
function setTab(tab: string) {
  if (state.busy) return;
  state.tab = tab;
  state.repoLimit = 12;
  $('repo-detail').hidden = true;
  detailGeneration++;
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab);
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  $('breadcrumb-current').textContent = tab[0].toUpperCase() + tab.slice(1);
  saveURL();
  render();
}
function render() {
  disposeScene();
  $('nav-repos').textContent = fmt(allRepos().length);
  if (!state.data.some(Boolean)) {
    $('content').innerHTML =
      '<div class="empty-state"><h3>A perspective starts with a profile.</h3><p>Enter a GitHub username above and try again.</p></div>';
    return;
  }
  if (state.tab === 'overview') overview();
  else if (state.tab === 'repositories') repositories();
  else if (state.tab === 'activity') void activity();
  else void community();
  refreshIcons();
  updateQuota();
}
function metrics() {
  const s = state.data.map((d) => (d ? summarize(d.repos) : null));
  const values = [
    {
      label: 'Original repos',
      icon: 'git-fork',
      vals: s.map((v) => v?.original),
      note: 'Loaded, excluding forks',
    },
    {
      label: 'Stars received',
      icon: 'star',
      vals: s.map((v) => v?.stars),
      note: 'Across loaded original repos',
    },
    {
      label: 'Forks received',
      icon: 'git-fork',
      vals: s.map((v) => v?.forkCount),
      note: 'Across loaded original repos',
    },
    {
      label: 'Followers',
      icon: 'users',
      vals: state.data.map((d) => d?.profile.followers),
      note: 'Public profile total',
    },
  ];
  return `<div class="comparison-strip">${values.map((m) => `<div class="metric-cell"><div class="metric-label">${icon(m.icon)}${m.label}</div><div class="metric-values"><strong class="a-text" title="${m.vals[0] ?? 'Not loaded'}">${m.vals[0] === undefined ? '—' : fmt(m.vals[0])}</strong><span>vs</span><strong class="b-text" title="${m.vals[1] ?? 'Not loaded'}">${m.vals[1] === undefined ? '—' : fmt(m.vals[1])}</strong></div><div class="metric-foot">${m.note}</div></div>`).join('')}</div>`;
}
function coverage() {
  return state.data
    .map((d, i) =>
      d
        ? `<span><span class="dot ${i ? 'b' : 'a'}"></span> ${esc(d.profile.login)}: ${exact(d.repos.length)}${d.next ? ` of ${exact(d.profile.public_repos)}` : ''} repos loaded${d.next ? ` · <button class="text-button" data-load-repos="${i}">Load next 100</button>` : ''}</span>`
        : '',
    )
    .join('');
}
function overview() {
  const d = state.data;
  const legend = d
    .map((p, i) =>
      p
        ? `<span class="legend-item"><span class="dot ${i ? 'b' : 'a'}"></span>${esc(p.profile.login)}</span>`
        : '',
    )
    .join('');
  $('content').innerHTML =
    `<section aria-labelledby="landscape-heading"><div class="section-heading"><div class="heading-text"><h2 id="landscape-heading">The shape of your work</h2><p>Every column is a repository. Every angle, a new perspective.</p></div><div class="section-controls"><label class="sr-only" for="scene-metric">3D column height</label><select id="scene-metric" class="compact-select"><option value="stars" ${state.metric === 'stars' ? 'selected' : ''}>Height: stars</option><option value="forks" ${state.metric === 'forks' ? 'selected' : ''}>Height: forks</option><option value="size" ${state.metric === 'size' ? 'selected' : ''}>Height: size</option></select><div class="segmented" aria-label="Repository visualization"><button data-view="3d" aria-pressed="${state.view === '3d'}">${icon('box')}3D</button><button data-view="table" aria-pressed="${state.view === 'table'}">${icon('rows-3')}List</button></div></div></div>${state.view === '3d' ? `<div class="landscape" id="landscape"><div class="landscape-top"><div class="landscape-legend">${legend}</div><span class="landscape-label">Original repositories<br/>Shared log scale</span></div><div id="scene-fallback" class="scene-fallback">Preparing your repository landscape…</div><div id="scene-tooltip" class="scene-tooltip" hidden></div><div class="landscape-bottom"><span class="landscape-hint">${icon('move')}Drag to orbit · select a column to explore</span><div class="view-buttons"><button class="icon-button" data-action="zoom-in" aria-label="Zoom into 3D view">${icon('plus')}</button><button class="icon-button" data-action="zoom-out" aria-label="Zoom out of 3D view">${icon('minus')}</button><button class="icon-button" data-action="reset-scene" aria-label="Reset 3D view">${icon('rotate-ccw')}</button></div></div></div>` : `<div class="scene-table">${repoTable(sceneRepos(), true)}</div>`}<div class="coverage-line"><span>Top 30 loaded original repos per profile · column height = log(1 + ${state.metric === 'size' ? 'size in KB' : state.metric}) · minimum height keeps zero values visible</span><button class="text-button" data-action="about">How to read this</button></div></section><div class="coverage-line">${coverage()}</div>${metrics()}<div class="overview-bottom"><section class="subsection"><h3>A different mix of languages</h3><p>Primary language per loaded original repository.</p>${languages()}</section><section class="subsection"><h3>Beyond the headline numbers</h3><p>The details that put each body of work in context.</p>${insights()}</section></div><section class="repository-section"><div class="section-heading"><div><h2>Repository spotlight</h2><p>The most starred loaded original repositories in this matchup.</p></div><button class="button small" data-tab="repositories">All repositories ${icon('arrow-right')}</button></div><div class="table-scroll">${repoTable(
      allRepos()
        .filter((x) => !x.repo.fork)
        .sort((a, b) => b.repo.stargazers_count - a.repo.stargazers_count)
        .slice(0, 6),
    )}</div><div class="coverage-line">${coverage()}</div></section>`;
  if (state.view === '3d') void startScene();
}
function sceneRepos() {
  const key =
    state.metric === 'forks'
      ? 'forks_count'
      : state.metric === 'size'
        ? 'size'
        : 'stargazers_count';
  return state.data.flatMap((d, owner) =>
    d
      ? d.repos
          .filter((r) => !r.fork)
          .sort((a, b) => b[key] - a[key])
          .slice(0, 30)
          .map((repo) => ({ repo, owner }))
      : [],
  );
}
async function startScene() {
  const run = ++viewGeneration;
  try {
    const { createLandscape } = await import('../lib/landscape');
    if (run !== viewGeneration || !$('landscape')) return;
    scene = createLandscape(
      $('landscape'),
      sceneRepos(),
      state.metric,
      (repo) => void detail(repo),
    );
    $('scene-fallback').hidden = true;
  } catch {
    if (run === viewGeneration && $('scene-fallback')) {
      $('scene-fallback').innerHTML =
        '3D is unavailable in this browser. <button class="text-button" data-view="table">Explore the same repositories in the list</button>';
      refreshIcons();
    }
  }
}
function languages() {
  const stats = state.data.map((d) => (d ? summarize(d.repos) : null));
  const names = [
    ...new Set(stats.flatMap((s) => s?.languages.map((l) => l[0]) || [])),
  ]
    .sort(
      (a, b) =>
        stats.reduce(
          (n, s) => n + (s?.languages.find((l) => l[0] === b)?.[1] || 0),
          0,
        ) -
        stats.reduce(
          (n, s) => n + (s?.languages.find((l) => l[0] === a)?.[1] || 0),
          0,
        ),
    )
    .slice(0, 6);
  if (!names.length)
    return '<p class="content-note">No language data in the loaded repositories.</p>';
  const max = Math.max(
    1,
    ...stats.flatMap((s) => s?.languages.map((x) => x[1]) || []),
  );
  return names
    .map((name) => {
      const vals = stats.map(
        (s) => s?.languages.find((x) => x[0] === name)?.[1] || 0,
      );
      return `<div class="language-row"><span class="language-name"><span class="dot" style="background:${languageColors[name] || '#8a7c98'}"></span>${esc(name)}</span><div class="dual-bars" aria-hidden="true"><div class="bar-track"><div class="bar-fill" style="width:${(vals[0] / max) * 100}%"></div></div><div class="bar-track"><div class="bar-fill b" style="width:${(vals[1] / max) * 100}%"></div></div></div><span class="language-counts"><span class="a-text" aria-label="Profile A repositories">${vals[0]}</span> / <span class="b-text" aria-label="Profile B repositories">${vals[1]}</span></span></div>`;
    })
    .join('');
}
function insights() {
  const s = state.data.map((d) => (d ? summarize(d.repos) : null));
  const rows = [
    [
      'Public gists',
      ...state.data.map((d) => (d ? fmt(d.profile.public_gists) : '—')),
    ],
    [
      'Following',
      ...state.data.map((d) => (d ? fmt(d.profile.following) : '—')),
    ],
    ['Forked repositories', ...s.map((x) => (x ? fmt(x.forks) : '—'))],
    ['Archived repositories', ...s.map((x) => (x ? fmt(x.archived) : '—'))],
    ['Open issues + PRs', ...s.map((x) => (x ? fmt(x.issues) : '—'))],
  ];
  return `<table class="insights-table"><caption class="sr-only">Additional public profile and loaded repository metrics</caption><thead><tr><th scope="col">Measure</th>${state.data.map((d, i) => `<th scope="col" class="${i ? 'b' : 'a'}-text">${esc(d?.profile.login || (i ? 'Profile B' : 'Profile A'))}</th>`).join('')}</tr></thead><tbody>${rows.map((row) => `<tr><th scope="row">${row[0]}</th><td class="a-text">${row[1]}</td><td class="b-text">${row[2]}</td></tr>`).join('')}</tbody></table>`;
}
function repoTable(items: { repo: Repo; owner: number }[], compact = false) {
  if (!items.length)
    return '<div class="empty-state"><h3>No repositories here yet.</h3><p>Try a different filter, load more repositories, or compare another profile.</p></div>';
  return `<table><thead><tr><th scope="col" class="repo-name-cell">Repository</th>${compact ? '' : `<th scope="col" class="language-cell">Language</th>`}<th scope="col" class="number-cell">Stars</th><th scope="col" class="number-cell">Forks</th>${compact ? '' : `<th scope="col" class="updated-cell">Last push</th>`}<th scope="col" class="table-actions"><span class="sr-only">Details</span></th></tr></thead><tbody>${items
    .map(
      ({ repo: r, owner: i }) =>
        `<tr><td><span class="repo-owner"><span class="dot ${i ? 'b' : 'a'}"></span>${esc(r.owner.login)}</span>${link(r.html_url, esc(r.name), 'repo-name')}${
          compact
            ? ''
            : `<p class="repo-description">${esc(r.description || 'No description provided.')}</p><div class="repo-badges">${r.fork ? '<span class="badge fork">Fork</span>' : ''}${r.archived ? '<span class="badge archived">Archived</span>' : ''}${r.topics
                .slice(0, 3)
                .map((t) => `<span class="badge">${esc(t)}</span>`)
                .join('')}</div>`
        }</td>${compact ? '' : `<td><span class="table-lang"><span class="dot" style="background:${languageColors[r.language || ''] || '#9a8ca8'}"></span>${esc(r.language || '—')}</span></td>`}<td class="number-cell" title="${exact(r.stargazers_count)}">${fmt(r.stargazers_count)}</td><td class="number-cell" title="${exact(r.forks_count)}">${fmt(r.forks_count)}</td>${compact ? '' : `<td>${age(r.pushed_at)}</td>`}<td class="table-actions"><button data-repo="${r.id}" aria-label="Explore ${esc(r.full_name)}">${icon('arrow-up-right')}</button></td></tr>`,
    )
    .join('')}</tbody></table>`;
}
function filteredRepos() {
  let r = allRepos();
  if (state.owner !== 'all')
    r = r.filter((x) => x.owner === Number(state.owner));
  if (state.language !== 'all')
    r = r.filter(
      (x) => (x.repo.language || 'Not specified') === state.language,
    );
  if (state.filter) {
    const q = state.filter.toLowerCase();
    r = r.filter((x) =>
      `${x.repo.full_name} ${x.repo.description || ''} ${x.repo.topics.join(' ')}`
        .toLowerCase()
        .includes(q),
    );
  }
  return r.sort((a, b) =>
    state.sort === 'name'
      ? a.repo.name.localeCompare(b.repo.name)
      : state.sort === 'updated'
        ? new Date(b.repo.pushed_at).getTime() -
          new Date(a.repo.pushed_at).getTime()
        : state.sort === 'forks'
          ? b.repo.forks_count - a.repo.forks_count
          : b.repo.stargazers_count - a.repo.stargazers_count,
  );
}
function repositories() {
  const langs = [
    ...new Set(allRepos().map((x) => x.repo.language || 'Not specified')),
  ].sort();
  $('content').innerHTML =
    `<section><div class="section-heading"><div><h2>Repositories, side by side.</h2><p>Follow the ideas. Inspect the details. Find your next rabbit hole.</p></div><button class="button small" data-action="export">${icon('download')}Export CSV</button></div><div class="filter-bar"><label class="search-filter">${icon('search')}<span class="sr-only">Filter repositories</span><input id="repo-search" placeholder="Find a repository, topic, or idea…" value="${esc(state.filter)}"/></label><label class="sr-only" for="owner-filter">Repository owner</label><select class="compact-select" id="owner-filter"><option value="all">Both developers</option>${state.data.map((d, i) => (d ? `<option value="${i}" ${state.owner === String(i) ? 'selected' : ''}>${esc(d.profile.login)}</option>` : '')).join('')}</select><label class="sr-only" for="language-filter">Repository language</label><select class="compact-select" id="language-filter"><option value="all">All languages</option>${langs.map((l) => `<option ${state.language === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select><label class="sr-only" for="sort-filter">Sort repositories</label><select class="compact-select" id="sort-filter">${[
      ['stars', 'Most stars'],
      ['forks', 'Most forks'],
      ['updated', 'Recently pushed'],
      ['name', 'Name A–Z'],
    ]
      .map(
        ([v, l]) =>
          `<option value="${v}" ${state.sort === v ? 'selected' : ''}>${l}</option>`,
      )
      .join(
        '',
      )}</select></div><div id="repo-results"></div><div class="coverage-line">${coverage()}</div></section>`;
  repoResults();
}
function repoResults() {
  const repos = filteredRepos();
  $('repo-results').innerHTML =
    `<div class="table-scroll">${repoTable(repos.slice(0, state.repoLimit))}</div><div class="table-end"><span>${Math.min(repos.length, state.repoLimit)} of ${exact(repos.length)} matching repositories · includes forks</span>${repos.length > state.repoLimit ? '<button class="button small" data-action="show-more">Show 24 more</button>' : ''}</div>`;
  refreshIcons();
}
async function moreRepos(i: number, button: HTMLButtonElement) {
  const d = state.data[i];
  if (!d?.next) return;
  const run = generation;
  button.disabled = true;
  button.textContent = 'Loading…';
  try {
    const page = await collection<Repo>(d.next, controller.signal);
    if (run !== generation) return;
    const seen = new Set(d.repos.map((r) => r.id));
    d.repos.push(...page.items.filter((r) => !seen.has(r.id)));
    d.next = page.next;
    d.warning = undefined;
    render();
    profiles();
    setStatus();
  } catch (e) {
    if (run === generation) {
      setStatus(errorText(e), true);
      button.disabled = false;
      button.textContent = 'Retry loading repositories';
    }
  }
  updateQuota();
}
async function activity() {
  const run = generation;
  $('content').innerHTML =
    `<section><div class="section-heading"><div><h2>What’s been happening</h2><p>Recent public activity. Two timelines, one view.</p></div></div><p class="content-note">Up to 300 events from GitHub’s last 30 days. Events can be delayed and aren’t a complete contribution history.</p><div class="activity-grid">${state.data.map((d, i) => `<section id="activity-${i}" class="activity-column ${i ? 'b' : 'a'}">${d ? `<div class="detail-loading"><span class="loader"></span>Loading ${esc(d.profile.login)}…</div>` : '<div class="empty-state">Add a second developer to compare activity.</div>'}</section>`).join('')}</div></section>`;
  await Promise.all(
    state.data.map(async (d, i) => {
      if (!d) return;
      try {
        if (!state.events.has(d.profile.login)) {
          const p = await collection<PublicEvent>(
            `/users/${d.profile.login}/events/public?per_page=100`,
            controller.signal,
          );
          if (run !== generation) return;
          state.events.set(d.profile.login, p);
        }
        if (state.tab === 'activity' && run === generation) renderActivities();
      } catch (e) {
        if (run === generation && state.tab === 'activity')
          $(`activity-${i}`).innerHTML =
            `<h3>${esc(d.profile.login)}</h3><p class="error-inline">${esc(errorText(e))}</p><button class="button small" data-action="retry-tab">Retry activity</button>`;
      }
    }),
  );
  refreshIcons();
  updateQuota();
}
function eventDescription(e: PublicEvent) {
  const p = e.payload;
  const type: Record<string, [string, string]> = {
    PushEvent: [
      'git-commit-horizontal',
      `Pushed to ${String(p.ref || 'a branch').replace('refs/heads/', '')}`,
    ],
    WatchEvent: ['star', 'Starred a repository'],
    ForkEvent: ['git-fork', 'Forked a repository'],
    CreateEvent: ['plus', `Created ${p.ref_type || 'a resource'}`],
    DeleteEvent: ['minus', `Deleted ${p.ref_type || 'a resource'}`],
    IssuesEvent: ['circle-dot', `${p.action || 'Updated'} an issue`],
    PullRequestEvent: [
      'git-pull-request',
      `${p.action || 'Updated'} a pull request`,
    ],
    IssueCommentEvent: ['book-open', 'Commented on an issue or pull request'],
    ReleaseEvent: ['box', `${p.action || 'Published'} a release`],
    PublicEvent: ['globe', 'Made a repository public'],
    PullRequestReviewEvent: ['git-pull-request', 'Reviewed a pull request'],
    PullRequestReviewCommentEvent: [
      'git-pull-request',
      'Commented on a review',
    ],
  };
  return (
    type[e.type] || [
      'activity',
      e.type.replace(/Event$/, '').replace(/([a-z])([A-Z])/g, '$1 $2'),
    ]
  );
}
function renderActivities() {
  state.data.forEach((d, i) => {
    if (d && state.events.has(d.profile.login)) renderActivity(i);
  });
}
function renderActivity(i: number) {
  const d = state.data[i]!;
  const p = state.events.get(d.profile.login)!;
  const days = dailyActivity(p.items);
  const max = Math.max(
    1,
    ...state.data.flatMap((d) =>
      d
        ? dailyActivity(state.events.get(d.profile.login)?.items || []).map(
            (day) => day.count,
          )
        : [],
    ),
  );
  $(`activity-${i}`).innerHTML =
    `<h3 class="${i ? 'b' : 'a'}-text">${esc(d.profile.login)}</h3><p class="activity-summary">${exact(p.items.length)} public events loaded${p.next ? ' · more available' : ''}.<br/>Bars count loaded events per UTC day. Shared scale: 0–${max} events.</p><div class="activity-chart" role="img" aria-label="${esc(d.profile.login)}: ${p.items.length} loaded public events across the last 30 days, shared scale 0 to ${max} events per day">${days.map((d) => `<div class="activity-bar" style="height:${d.count ? Math.max(3, (d.count / max) * 100) : 1}%" title="${d.day}: ${d.count} events"></div>`).join('')}</div><div class="chart-dates"><span>${date(days[0].day)}</span><span>Today · UTC</span></div>${
      p.items.length
        ? [...p.items]
            .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
            .slice(0, 30)
            .map((e) => {
              const [ic, label] = eventDescription(e);
              return `<div class="event"><span class="event-icon">${icon(ic)}</span><div class="event-content">${esc(label)}<p>${link(`https://github.com/${e.repo.name}`, esc(e.repo.name))}</p><time datetime="${esc(e.created_at)}">${date(e.created_at)} · ${new Date(e.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</time></div></div>`;
            })
            .join('')
        : '<div class="empty-state">No public events in this window. Private activity is not included.</div>'
    }${p.items.length > 30 ? `<p class="content-note">Showing the latest 30 event details. The chart includes all ${p.items.length} loaded events.</p>` : ''}${p.next && p.items.length < 300 ? `<div class="load-controls"><button class="button small" data-more-events="${i}">Load next 100 events</button></div>` : ''}`;
  refreshIcons();
}
async function moreEvents(i: number, b: HTMLButtonElement) {
  const d = state.data[i]!;
  const p = state.events.get(d.profile.login);
  if (!p?.next) return;
  const run = generation;
  b.disabled = true;
  try {
    const next = await collection<PublicEvent>(p.next, controller.signal);
    if (run !== generation) return;
    const ids = new Set(p.items.map((x) => x.id));
    p.items.push(...next.items.filter((x) => !ids.has(x.id)));
    p.items = p.items.slice(0, 300);
    p.next = next.next;
    if (state.tab === 'activity') renderActivities();
  } catch (e) {
    if (run === generation) {
      setStatus(errorText(e), true);
      b.disabled = false;
    }
  }
  updateQuota();
}
async function community() {
  const type = state.community;
  const run = generation;
  const names: { [k: string]: string } = {
    orgs: 'Organizations',
    followers: 'Followers',
    following: 'Following',
    gists: 'Gists',
    starred: 'Starred repos',
  };
  $('content').innerHTML =
    `<section><div class="section-heading"><div><h2>The people, projects & little things.</h2><p>Explore each developer’s public open-source neighborhood.</p></div></div><div class="community-types" aria-label="Community data type">${Object.entries(
      names,
    )
      .map(
        ([id, name]) =>
          `<button data-community="${id}" aria-pressed="${type === id}">${name}</button>`,
      )
      .join(
        '',
      )}</div><div class="community-grid">${state.data.map((d, i) => `<section class="community-column" id="community-${i}">${d ? `<div class="detail-loading"><span class="loader"></span>Loading ${esc(d.profile.login)}…</div>` : '<div class="empty-state">Add a second developer to explore their community.</div>'}</section>`).join('')}</div></section>`;
  await Promise.all(
    state.data.map(async (d, i) => {
      if (!d) return;
      const key = `${d.profile.login}:${type}`;
      try {
        if (!state.extras.has(key)) {
          const p = await collection<any>(
            `/users/${d.profile.login}/${type}?per_page=30`,
            controller.signal,
          );
          if (run !== generation) return;
          state.extras.set(key, p);
        }
        if (
          run === generation &&
          state.tab === 'community' &&
          state.community === type
        )
          renderCommunity(i);
      } catch (e) {
        if (
          run === generation &&
          state.tab === 'community' &&
          state.community === type
        )
          $(`community-${i}`).innerHTML =
            `<h3>${esc(d.profile.login)}</h3><p class="error-inline">${esc(errorText(e))}</p><button class="button small" data-action="retry-tab">Retry ${names[type].toLowerCase()}</button>`;
      }
    }),
  );
  refreshIcons();
  updateQuota();
}
function renderCommunity(i: number) {
  const d = state.data[i]!;
  const type = state.community;
  const p = state.extras.get(`${d.profile.login}:${type}`)!;
  let body = '';
  if (['orgs', 'followers', 'following'].includes(type))
    body = `<div class="people-grid">${(p.items as Person[]).map((person) => link(person.html_url || `https://github.com/${person.login}`, `<img loading="lazy" src="${esc(person.avatar_url)}" alt="" width="30" height="30"/><span>${esc(person.login)}</span>`, 'person')).join('')}</div>`;
  else if (type === 'gists')
    body = (p.items as Gist[])
      .map(
        (g) =>
          `<div class="gist-row">${link(g.html_url, esc(g.description || Object.values(g.files)[0]?.filename || 'Untitled gist'))}<p>${Object.keys(g.files).length} files · ${esc(
            [
              ...new Set(
                Object.values(g.files)
                  .map((f) => f.language)
                  .filter(Boolean),
              ),
            ].join(', ') || 'Plain text',
          )} · ${date(g.updated_at)}</p></div>`,
      )
      .join('');
  else
    body = (p.items as Repo[])
      .map(
        (r) =>
          `<div class="starred-row">${link(r.html_url, esc(r.full_name))}<p>${esc(r.description || 'No description provided.')}</p><p>${fmt(r.stargazers_count)} stars · ${esc(r.language || 'No primary language')}</p></div>`,
      )
      .join('');
  $(`community-${i}`).innerHTML =
    `<div class="community-header"><h3 class="${i ? 'b' : 'a'}-text">${esc(d.profile.login)}</h3><small>${p.items.length} loaded</small></div>${p.items.length ? body : `<div class="empty-state">No public ${type === 'orgs' ? 'organizations' : type === 'starred' ? 'starred repositories' : type} found.</div>`}${p.next ? `<div class="load-controls"><button class="button small" data-more-community="${i}">Load more</button></div>` : ''}`;
  refreshIcons();
}
async function moreCommunity(i: number, b: HTMLButtonElement) {
  const d = state.data[i]!;
  const type = state.community;
  const p = state.extras.get(`${d.profile.login}:${type}`);
  if (!p?.next) return;
  const run = generation;
  b.disabled = true;
  try {
    const next = await collection<any>(p.next, controller.signal);
    if (run !== generation) return;
    const ids = new Set(p.items.map((x) => x.id ?? x.login));
    p.items.push(...next.items.filter((x) => !ids.has(x.id ?? x.login)));
    p.next = next.next;
    if (state.tab === 'community' && state.community === type)
      renderCommunity(i);
  } catch (e) {
    if (run === generation) {
      setStatus(errorText(e), true);
      b.disabled = false;
    }
  }
  updateQuota();
}
async function detail(repo: Repo) {
  const target = $('repo-detail');
  const run = ++detailGeneration;
  target.hidden = false;
  target.innerHTML = `<div class="section-heading"><div><h2 id="detail-heading">${esc(repo.full_name)}</h2><p>Inside the repository</p></div><button class="icon-button" data-action="close-detail" aria-label="Close repository details">${icon('x')}</button></div><p class="content-note">${esc(repo.description || 'No description provided.')}</p><div class="detail-meta"><span>${esc(repo.license?.name || 'No license declared')}</span><span>Created ${date(repo.created_at)}</span><span>Branch: ${esc(repo.default_branch)}</span><span>${exact(repo.size)} KB</span><span>${exact(repo.open_issues_count)} open issues + PRs</span>${repo.archived ? '<span>Archived</span>' : ''}${repo.fork ? '<span>Forked repository</span>' : ''}</div><div class="repo-badges">${repo.topics.map((t) => link(`https://github.com/topics/${encodeURIComponent(t)}`, esc(t), 'badge')).join('')}</div><div class="detail-actions">${link(repo.html_url, `${icon('github')}Open on GitHub`, 'button small')}${safeURL(repo.homepage) ? link(repo.homepage, `${icon('external-link')}Visit project`, 'button small') : ''}<button class="button small" data-detail-more="${repo.id}">${icon('code')}Load languages, releases & commits</button></div><div id="detail-extra"><p class="content-note">Extra repository data loads on request (3 API requests).</p></div>`;
  refreshIcons();
  target.scrollIntoView({
    behavior: matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 'instant'
      : 'smooth',
    block: 'start',
  });
  target
    .querySelector<HTMLButtonElement>('[data-action="close-detail"]')
    ?.focus({ preventScroll: true });
  if (run !== detailGeneration) return;
}
async function detailMore(repo: Repo, b: HTMLButtonElement) {
  const run = detailGeneration;
  b.disabled = true;
  b.textContent = 'Loading repository details…';
  const path = `/repos/${repo.full_name}`;
  const results = await Promise.allSettled([
    api<Record<string, number>>(`${path}/languages`, controller.signal),
    api<any[]>(`${path}/releases?per_page=3`, controller.signal),
    api<any[]>(`${path}/commits?per_page=5`, controller.signal),
  ]);
  if (run !== detailGeneration) return;
  const [langs, releases, commits] = results;
  const fail = (r: PromiseRejectedResult) =>
    `<p class="error-inline">${esc(errorText(r.reason))}</p>`;
  const languagesHTML =
    langs.status === 'fulfilled'
      ? (() => {
          const list = Object.entries(langs.value.data).sort(
            (a, b) => b[1] - a[1],
          );
          const total = list.reduce((n, v) => n + v[1], 0);
          return list.length
            ? list
                .map(
                  ([name, bytes]) =>
                    `<div class="insight-row"><span>${esc(name)}</span><strong>${fmt(bytes)} B</strong><span>${((bytes / total) * 100).toFixed(1)}%</span></div>`,
                )
                .join('')
            : '<p>No language bytes reported.</p>';
        })()
      : fail(langs);
  const releasesHTML =
    releases.status === 'fulfilled'
      ? releases.value.data.length
        ? `<ul class="detail-list">${releases.value.data.map((r) => `<li>${link(r.html_url, esc(r.name || r.tag_name))}<small>${esc(r.tag_name)} · ${date(r.published_at || r.created_at)}</small></li>`).join('')}</ul>`
        : '<p>No published releases.</p>'
      : fail(releases);
  const commitsHTML =
    commits.status === 'fulfilled'
      ? commits.value.data.length
        ? `<ul class="detail-list">${commits.value.data.map((c) => `<li>${link(c.html_url, esc(c.commit.message.split('\n')[0]))}<small>${esc(c.sha.slice(0, 7))} · ${esc(c.commit.author?.name || 'Unknown author')} · ${date(c.commit.author?.date || c.commit.committer.date)}</small></li>`).join('')}</ul>`
        : '<p>No commits found.</p>'
      : fail(commits);
  $('detail-extra').innerHTML =
    `<div class="detail-grid"><section><h3>Languages by bytes</h3>${languagesHTML}<h3>Recent releases</h3>${releasesHTML}</section><section><h3>Latest 5 commits</h3>${commitsHTML}</section></div>`;
  b.textContent = 'Reload repository details';
  b.disabled = false;
  refreshIcons();
  updateQuota();
}
function exportCSV() {
  const header = [
    'owner',
    'repository',
    'description',
    'language',
    'stars',
    'forks',
    'open_issues_and_prs',
    'is_fork',
    'archived',
    'license',
    'size_kb',
    'last_push',
    'url',
  ];
  const rows = filteredRepos().map(({ repo: r }) => [
    r.owner.login,
    r.name,
    r.description || '',
    r.language || '',
    r.stargazers_count,
    r.forks_count,
    r.open_issues_count,
    r.fork,
    r.archived,
    r.license?.spdx_id || '',
    r.size,
    r.pushed_at,
    r.html_url,
  ]);
  const cell = (value: unknown) => {
    let s = String(value);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    [
      '\uFEFF' +
        [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n'),
    ],
    { type: 'text/csv;charset=utf-8' },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `parallax-${state.data
    .map((d) => d?.profile.login)
    .filter(Boolean)
    .join('-vs-')}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(`Exported ${rows.length} loaded repositories.`);
}
async function share() {
  saveURL();
  try {
    await navigator.clipboard.writeText(location.href);
    notify('Matchup link copied. Share a different perspective.');
  } catch {
    const status = $('global-status');
    status.innerHTML = `<label class="share-fallback">Copy this matchup link<input id="share-url" readonly value="${esc(location.href)}"/></label>`;
    $<HTMLInputElement>('share-url').select();
  }
}
$('matchup-form').addEventListener('submit', (event) => {
  event.preventDefault();
  void compare();
});
$('swap').addEventListener('click', () => {
  const a = $<HTMLInputElement>('handle-a'),
    b = $<HTMLInputElement>('handle-b');
  [a.value, b.value] = [b.value, a.value];
  void compare();
});
$('share').addEventListener('click', () => void share());
document.addEventListener('click', (event) => {
  const b = (event.target as HTMLElement).closest<HTMLElement>(
    'button,[data-repo]',
  );
  if (!b) return;
  if (b.dataset.tab) {
    setTab(b.dataset.tab);
    return;
  }
  if (b.dataset.view) {
    state.view = b.dataset.view;
    render();
    return;
  }
  if (b.dataset.repo) {
    const r = allRepos().find((x) => x.repo.id === Number(b.dataset.repo));
    if (r) void detail(r.repo);
    return;
  }
  if (b.dataset.loadRepos) {
    void moreRepos(Number(b.dataset.loadRepos), b as HTMLButtonElement);
    return;
  }
  if (b.hasAttribute('data-more-events')) {
    void moreEvents(Number(b.dataset.moreEvents), b as HTMLButtonElement);
    return;
  }
  if (b.hasAttribute('data-more-community')) {
    void moreCommunity(Number(b.dataset.moreCommunity), b as HTMLButtonElement);
    return;
  }
  if (b.dataset.community) {
    state.community = b.dataset.community;
    void community();
    return;
  }
  if (b.dataset.detailMore) {
    const r = allRepos().find(
      (x) => x.repo.id === Number(b.dataset.detailMore),
    );
    if (r) void detailMore(r.repo, b as HTMLButtonElement);
    return;
  }
  switch (b.dataset.action) {
    case 'about':
      $('about').hidden = false;
      $('about').scrollIntoView({ behavior: 'smooth' });
      break;
    case 'close-about':
      $('about').hidden = true;
      break;
    case 'close-detail':
      detailGeneration++;
      $('repo-detail').hidden = true;
      break;
    case 'zoom-in':
      scene?.zoom(0.8);
      break;
    case 'zoom-out':
      scene?.zoom(1.2);
      break;
    case 'reset-scene':
      scene?.reset();
      break;
    case 'show-more':
      state.repoLimit += 24;
      repoResults();
      break;
    case 'retry-tab':
      render();
      break;
    case 'export':
      exportCSV();
      break;
  }
});
document.addEventListener('input', (event) => {
  const input = event.target as HTMLInputElement;
  if (input.id === 'repo-search') {
    state.filter = input.value;
    state.repoLimit = 24;
    repoResults();
  }
});
document.addEventListener('change', (event) => {
  const input = event.target as HTMLSelectElement;
  if (input.id === 'scene-metric') {
    state.metric = input.value;
    render();
  } else if (input.id === 'owner-filter') {
    state.owner = input.value;
    repoResults();
  } else if (input.id === 'language-filter') {
    state.language = input.value;
    repoResults();
  } else if (input.id === 'sort-filter') {
    state.sort = input.value;
    repoResults();
  }
});
const params = new URLSearchParams(location.search);
if (params.has('a')) $<HTMLInputElement>('handle-a').value = params.get('a')!;
if (params.has('b')) $<HTMLInputElement>('handle-b').value = params.get('b')!;
else if (params.has('a')) $<HTMLInputElement>('handle-b').value = '';
const tab = params.get('tab');
if (
  tab &&
  ['overview', 'repositories', 'activity', 'community'].includes(tab)
) {
  state.tab = tab;
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === tab);
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  $('breadcrumb-current').textContent = tab[0].toUpperCase() + tab.slice(1);
}
refreshIcons();
void compare();
