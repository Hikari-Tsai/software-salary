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
  assert.match(html, /652 筆有效樣本/);
  assert.match(html, /資料更新：2026 年 8 月 28 日 13:11/);
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

test("renders a closing career roadmap with four planning directions", async () => {
  const response = await render();
  const html = await response.text();

  assert.match(html, /05 — NEXT MOVE/);
  assert.match(html, /找到適合你的路線，<br\/>再把下一步走具體。/);
  assert.match(html, /薪資突破/);
  assert.match(html, /技術成長/);
  assert.match(html, /穩定生活/);
  assert.match(html, /轉型升級/);
  assert.match(html, /現在/);
  assert.match(html, /未來 6–12 個月/);
  assert.match(html, /下一次選 offer/);
});

test("renders six expandable offer questions with practical guidance", async () => {
  const response = await render();
  const html = await response.text();

  assert.equal((html.match(/<details class="offer-question"/g) ?? []).length, 6);
  assert.match(html, /為什麼要問/);
  assert.match(html, /你能看出什麼/);
  assert.match(html, /可以這樣追問/);
  assert.match(html, /確認固定薪資與浮動薪酬的比例/);
  assert.match(html, /辨認團隊是否長期處於人力不足/);
  assert.match(html, /判斷這份工作能不能提高下一次轉職的選擇權/);
});
