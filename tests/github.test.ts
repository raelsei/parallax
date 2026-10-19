import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeUsername,
  safeURL,
  summarize,
  dailyActivity,
  type Repo,
} from '../src/lib/github.ts';
test('accepts handles and GitHub URLs; rejects API path injection', () => {
  assert.equal(normalizeUsername(' https://github.com/raelsei/ '), 'raelsei');
  assert.equal(normalizeUsername('@octocat'), 'octocat');
  for (const input of ['', '../users', 'a?per_page=5', 'a/b', 'a--b'])
    assert.throws(() => normalizeUsername(input));
});
test('public website links cannot execute script', () => {
  assert.equal(safeURL('javascript:alert(1)'), null);
  assert.equal(safeURL('data:text/html,hi'), null);
  assert.equal(safeURL('koray.dev'), 'https://koray.dev/');
});
test('comparison totals exclude borrowed stars and language counts from forks', () => {
  const repos = [
    {
      fork: false,
      language: 'TypeScript',
      stargazers_count: 4,
      forks_count: 2,
      open_issues_count: 3,
      archived: false,
    },
    {
      fork: true,
      language: 'Rust',
      stargazers_count: 1000,
      forks_count: 80,
      open_issues_count: 20,
      archived: true,
    },
  ] as Repo[];
  const stats = summarize(repos);
  assert.equal(stats.stars, 4);
  assert.equal(stats.forkCount, 2);
  assert.equal(stats.archived, 1);
  assert.deepEqual(stats.languages, [['TypeScript', 1]]);
});
test('activity uses UTC dates, includes zero days and does not fabricate commits', () => {
  const days = dailyActivity(
    [
      {
        id: '1',
        type: 'PushEvent',
        created_at: '2026-10-19T10:00:00Z',
        repo: { name: 'a/b' },
        payload: {},
      },
    ],
    new Date('2026-10-19T23:00:00Z'),
  );
  assert.equal(days.length, 30);
  assert.equal(days[29].count, 1);
  assert.equal(days[0].count, 0);
  assert.equal(days[29].day, '2026-10-19');
});

test('pagination preserves GitHub next link and cached pages do not spend more requests', async () => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = (async () => {
    calls++;
    return new Response(JSON.stringify([{ id: 1 }]), {
      status: 200,
      headers: {
        link: '<https://api.github.com/test-pagination?page=2>; rel="next", <https://api.github.com/test-pagination?page=3>; rel="last"',
        'x-ratelimit-remaining': '20',
      },
    });
  }) as typeof fetch;
  try {
    const { collection } = await import('../src/lib/github.ts');
    const first = await collection('/test-pagination?page=1');
    const second = await collection('/test-pagination?page=1');
    assert.equal(calls, 1);
    assert.equal(first.next, 'https://api.github.com/test-pagination?page=2');
    assert.deepEqual(first, second);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
test('rate limit error retains reset time and refuses external pagination hosts', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () =>
    new Response('{}', {
      status: 403,
      headers: {
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1900000000',
      },
    })) as typeof fetch;
  try {
    const { api, GitHubError } = await import('../src/lib/github.ts');
    await assert.rejects(
      api('/test-rate'),
      (error) => error instanceof GitHubError && error.reset === 1900000000000,
    );
    await assert.rejects(
      api('https://evil.example/api'),
      /Unexpected API host/,
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
