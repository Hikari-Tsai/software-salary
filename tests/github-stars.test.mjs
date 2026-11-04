import assert from "node:assert/strict";
import test from "node:test";

let moduleId = 0;
const freshLoader = () => import(`../app/github-stars.ts?test=${++moduleId}`);

test("loads this repository's count once for multiple consumers", async t => {
  const requests = [];
  t.mock.method(globalThis, "fetch", async (url, options) => {
    requests.push({ url, options });
    return Response.json({ stargazers_count: 1234 });
  });
  const { loadGithubStars } = await freshLoader();
  assert.deepEqual(await Promise.all([loadGithubStars(), loadGithubStars()]), [1234, 1234]);
  assert.equal(await loadGithubStars(), 1234);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, "https://api.github.com/repos/Hikari-Tsai/software-salary");
  assert.equal(requests[0].options.headers.Accept, "application/vnd.github+json");
  assert.equal(requests[0].options.headers.Authorization, undefined);
  assert.ok(requests[0].options.signal instanceof AbortSignal);
});

test("preserves zero and rejects invalid star counts", async t => {
  for (const count of [0, -1, 1.5, "123", null, undefined]) {
    t.mock.method(globalThis, "fetch", async () => Response.json({ stargazers_count: count }));
    const { loadGithubStars } = await freshLoader();
    assert.equal(await loadGithubStars(), count === 0 ? 0 : null);
    t.mock.restoreAll();
  }
});

test("API errors, malformed JSON and network failures fall back without retries", async t => {
  for (const result of [
    () => new Response("Rate limited", { status: 403 }),
    () => new Response("Too many requests", { status: 429 }),
    () => new Response("invalid JSON"),
    () => Response.json(null),
    () => { throw new TypeError("offline"); },
  ]) {
    let calls = 0;
    t.mock.method(globalThis, "fetch", async () => { calls++; return result(); });
    const { loadGithubStars } = await freshLoader();
    assert.equal(await loadGithubStars(), null);
    assert.equal(await loadGithubStars(), null);
    assert.equal(calls, 1);
    t.mock.restoreAll();
  }
});
