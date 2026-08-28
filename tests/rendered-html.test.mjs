import assert from "node:assert/strict";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Taiwan software salary report", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-Hant">/);
  assert.match(html, /<title>台灣軟體工程師薪水分布｜薪資透視<\/title>/);
  assert.match(html, /台灣軟體(?:<br\/>|\s*)工程師/);
  assert.match(html, /635 筆有效樣本/);
  assert.match(html, /同樣是軟體工程師，<br\/><span>薪資差距可以很大。<\/span>/);
  assert.match(html, /資料先拿來抓方向，<br\/>再回到職缺條件判斷。/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(html, /市場不是一條線|把資料當羅盤|要累積不同的/);
});

test("renders an absolute social sharing image", async () => {
  const response = await render();
  const html = await response.text();
  const imageUrl = "https://hikari-tsai.github.io/software-salary/images/og-salary-thumbnail.png";

  assert.match(html, new RegExp(`<meta property="og:image" content="${imageUrl}"`));
  assert.match(html, new RegExp(`<meta name="twitter:image" content="${imageUrl}"`));
});

test("renders contribution and GitHub Star actions", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /https:\/\/github\.com\/Hikari-Tsai\/software-salary/);
  assert.match(html, /賞個 Star/);
  assert.match(html, /提供資料/);
  assert.match(html, /匿名貢獻資料/);
  assert.match(html, /DCard 科技業版/);
  assert.match(html, /僅列入有效樣本數 n ≥ 3 的公司/);
  assert.equal((html.match(/class="github-star(?: [^"]*)?"/g) ?? []).length, 2);
});
