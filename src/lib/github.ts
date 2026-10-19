export interface Profile {
  login: string;
  name: string | null;
  avatar_url: string;
  html_url: string;
  bio: string | null;
  company: string | null;
  blog: string;
  location: string | null;
  email: string | null;
  twitter_username: string | null;
  followers: number;
  following: number;
  public_repos: number;
  public_gists: number;
  created_at: string;
  updated_at: string;
  type: string;
}
export interface Repo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  size: number;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
  homepage: string | null;
  default_branch: string;
  license: { name: string; spdx_id: string } | null;
  owner: { login: string };
  subscribers_count?: number;
}
export interface PublicEvent {
  id: string;
  type: string;
  created_at: string;
  repo: { name: string };
  payload: Record<string, any>;
}
export interface Person {
  login: string;
  avatar_url: string;
  html_url: string;
  description?: string;
}
export interface Gist {
  id: string;
  description: string;
  html_url: string;
  updated_at: string;
  files: Record<
    string,
    { filename: string; language: string | null; size: number }
  >;
}
export interface Page<T> {
  items: T[];
  next: string | null;
}
export interface Dataset {
  profile: Profile;
  repos: Repo[];
  next: string | null;
  loadedAt: number;
  warning?: string;
}
export class GitHubError extends Error {
  status: number;
  reset?: number;
  constructor(message: string, status: number, reset?: number) {
    super(message);
    this.status = status;
    this.reset = reset;
  }
}
const memory = new Map<string, { expires: number; data: unknown }>();
const TTL = 5 * 60 * 1000;
const API = 'https://api.github.com';
let remaining: number | null = null;
let resetAt: number | null = null;
export function quota() {
  return { remaining, resetAt };
}
export function normalizeUsername(raw: string) {
  const value = raw
    .trim()
    .replace(/^https?:\/\/(?:www\.)?github\.com\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
  if (
    !/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(value) ||
    value.includes('--')
  )
    throw new GitHubError('Enter a GitHub username or profile URL.', 422);
  return value;
}
export function safeURL(raw: string | null | undefined) {
  if (!raw) return null;
  try {
    const url = new URL(/^[\w+.-]+:/.test(raw) ? raw : `https://${raw}`);
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}
function readCache(key: string) {
  const local = memory.get(key);
  if (local && local.expires > Date.now()) return local.data;
  try {
    const raw = sessionStorage.getItem(`parallax:${key}`);
    if (raw) {
      const c = JSON.parse(raw);
      if (c.expires > Date.now()) {
        memory.set(key, c);
        return c.data;
      }
    }
  } catch {}
  return undefined;
}
export async function api<T>(
  path: string,
  signal?: AbortSignal,
): Promise<{ data: T; next: string | null }> {
  const url = new URL(path, API);
  if (url.origin !== API) throw new Error('Unexpected API host.');
  const key = url.href;
  const cached = readCache(key);
  if (cached) return cached as { data: T; next: string | null };
  const response = await fetch(key, {
    signal,
    headers: {
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2026-03-10',
    },
  });
  const count = response.headers.get('x-ratelimit-remaining');
  if (count !== null) remaining = Number(count);
  const reset = response.headers.get('x-ratelimit-reset');
  if (reset) resetAt = Number(reset) * 1000;
  if (!response.ok) {
    if (response.status === 404)
      throw new GitHubError(
        'This GitHub profile or resource could not be found.',
        404,
      );
    if (response.status === 403 || response.status === 429) {
      const retry = response.headers.get('retry-after');
      const until = retry
        ? Date.now() + Number(retry) * 1000
        : resetAt || undefined;
      throw new GitHubError(
        remaining === 0
          ? 'GitHub’s public API allowance has been used. Try again after the reset time.'
          : 'GitHub temporarily limited this request. Wait a little and retry.',
        response.status,
        until,
      );
    }
    throw new GitHubError(
      `GitHub returned ${response.status}. Please try again.`,
      response.status,
    );
  }
  const data = (await response.json()) as T;
  const next =
    response.headers.get('link')?.match(/<([^>]+)>; rel="next"/)?.[1] ?? null;
  const result = { data, next };
  const entry = { expires: Date.now() + TTL, data: result };
  memory.set(key, entry);
  try {
    sessionStorage.setItem(`parallax:${key}`, JSON.stringify(entry));
  } catch {}
  return result;
}
export async function collection<T>(
  path: string,
  signal?: AbortSignal,
): Promise<Page<T>> {
  const { data, next } = await api<T[]>(path, signal);
  return { items: data, next };
}
export async function loadProfile(
  raw: string,
  signal?: AbortSignal,
): Promise<Dataset> {
  const name = normalizeUsername(raw);
  const { data: profile } = await api<Profile>(
    `/users/${encodeURIComponent(name)}`,
    signal,
  );
  try {
    const repos = await collection<Repo>(
      `/users/${encodeURIComponent(name)}/repos?per_page=100&sort=pushed&type=owner`,
      signal,
    );
    return {
      profile,
      repos: repos.items,
      next: repos.next,
      loadedAt: Date.now(),
    };
  } catch (error) {
    if (signal?.aborted) throw error;
    return {
      profile,
      repos: [],
      next: `/users/${encodeURIComponent(name)}/repos?per_page=100&sort=pushed&type=owner`,
      loadedAt: Date.now(),
      warning:
        error instanceof Error
          ? error.message
          : 'Repositories could not be loaded.',
    };
  }
}
export function summarize(repos: Repo[]) {
  const original = repos.filter((repo) => !repo.fork);
  const languages: Record<string, number> = {};
  for (const repo of original) {
    const language = repo.language || 'Not specified';
    languages[language] = (languages[language] || 0) + 1;
  }
  return {
    total: repos.length,
    original: original.length,
    forks: repos.length - original.length,
    archived: repos.filter((r) => r.archived).length,
    stars: original.reduce((n, r) => n + r.stargazers_count, 0),
    forkCount: original.reduce((n, r) => n + r.forks_count, 0),
    issues: original.reduce((n, r) => n + r.open_issues_count, 0),
    languages: Object.entries(languages).sort((a, b) => b[1] - a[1]),
  };
}
export function dailyActivity(events: PublicEvent[], now = new Date()) {
  const counts = new Map<string, number>();
  for (const event of events) {
    const day = event.created_at.slice(0, 10);
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - 29 + i);
    const day = d.toISOString().slice(0, 10);
    return { day, count: counts.get(day) || 0 };
  });
}
export const languageColors: Record<string, string> = {
  TypeScript: '#4266c9',
  JavaScript: '#a88a19',
  Vue: '#21845f',
  Astro: '#be4b38',
  Python: '#4c75a3',
  Go: '#198391',
  Rust: '#ab6346',
  HTML: '#b45d43',
  CSS: '#8059ad',
  SCSS: '#a84f84',
  Swift: '#bd613e',
  Ruby: '#b54a5b',
  Shell: '#668746',
  Java: '#9a714c',
  Kotlin: '#8960b2',
  Dart: '#258ca5',
  C: '#677590',
  'C++': '#b85b85',
  'C#': '#639046',
  Svelte: '#c25932',
};
