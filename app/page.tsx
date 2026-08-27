"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";

const experience = [
  { label: "0–1 年", median: 84.5, p75: 120, n: 76 },
  { label: "1–3 年", median: 77, p75: 109.5, n: 138 },
  { label: "3–5 年", median: 98, p75: 130, n: 149 },
  { label: "5–8 年", median: 120, p75: 180, n: 140 },
  { label: "8–12 年", median: 150, p75: 198.8, n: 70 },
  { label: "12 年＋", median: 153, p75: 240, n: 16 },
];

const roleData = [
  { label: "一般軟體", median: 110, p75: 160, n: 293 },
  { label: "資料 / AI", median: 120, p75: 151.5, n: 32 },
  { label: "DevOps / SRE", median: 120, p75: 142, n: 17 },
  { label: "後端", median: 82, p75: 105, n: 53 },
  { label: "全端", median: 90, p75: 102, n: 9 },
  { label: "行動端", median: 86.8, p75: 125, n: 13 },
  { label: "QA / 測試", median: 85, p75: 91, n: 13 },
  { label: "前端", median: 70, p75: 95, n: 32 },
];

const companyData = [
  { label: "外商 / 大型科技", median: 200, p75: 300, n: 37 },
  { label: "遊戲 / 博弈", median: 122.5, p75: 148.8, n: 18 },
  { label: "電商 / 平台", median: 122, p75: 159.4, n: 22 },
  { label: "資安", median: 115, p75: 140, n: 44 },
  { label: "新創", median: 100, p75: 144.5, n: 43 },
  { label: "傳統企業", median: 100, p75: 115, n: 17 },
  { label: "半導體 / 硬體", median: 97.5, p75: 117.5, n: 19 },
  { label: "金融", median: 94.5, p75: 118.8, n: 42 },
  { label: "一般軟體公司", median: 90, p75: 131.5, n: 358 },
  { label: "SI / 外包", median: 68.4, p75: 103, n: 35 },
];

const companyRankings = [
  { rank: "01", company: "Synopsys", salary: 255, chill: 5, loading: 1.5, hours: 6, n: 8, tag: "高薪 × 體驗最佳", tone: "lime", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Synopsys%20Logo.svg" },
  { rank: "02", company: "Google", salary: 325, chill: 3, loading: 3, hours: 7.5, n: 8, tag: "薪資領先", tone: "blue", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Google%202026%20logo.svg" },
  { rank: "03", company: "微軟", salary: 245, chill: 4, loading: 4, hours: 8, n: 7, tag: "高薪 × 高成長", tone: "violet", logo: "https://commons.wikimedia.org/wiki/Special:Redirect/file/Microsoft%20logo%20%282012%29.svg" },
  { rank: "04", company: "GoGoX", salary: 176, chill: 3, loading: 3, hours: 8, n: 3, tag: "均衡型", tone: "plain" },
  { rank: "05", company: "Appier 沛星", salary: 180, chill: 3, loading: 4, hours: 9, n: 9, tag: "高薪 × 高強度", tone: "plain" },
  { rank: "06", company: "群暉 Synology", salary: 160, chill: 3, loading: 4, hours: 8, n: 11, tag: "樣本較穩定", tone: "plain" },
  { rank: "07", company: "趨勢科技", salary: 120, chill: 3, loading: 3, hours: 7.8, n: 23, tag: "高可信度樣本", tone: "plain" },
];

const advice = [
  { range: "0–2 年", title: "先累積可轉移的工程基本功", text: "優先選有 code review、測試、部署、監控與資深帶領的團隊。第一份薪水重要，但 1–2 年後的選擇權更重要。", accent: "lime" },
  { range: "2–5 年", title: "把技術翻譯成可量化的影響", text: "這是第一次大跳薪窗口。履歷別只列工具，要說清楚你讓系統快多少、穩多少，或替團隊省下多少時間。", accent: "blue" },
  { range: "5 年＋", title: "賣判斷力與槓桿，不只賣年資", text: "用架構決策、跨團隊推進、事故處理與成本優化證明資深價值。想突破 200 萬，英文與高價值領域很關鍵。", accent: "violet" },
];

function ArrowUpRight() {
  return <span aria-hidden="true">↗</span>;
}

function AnimatedNumber({ value, decimals }: { value: number; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const places = decimals ?? (Number.isInteger(value) ? 0 : 1);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const format = (current: number) => current.toFixed(places);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      node.textContent = format(value);
      return;
    }
    node.textContent = format(0);
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      const counter = { value: 0 };
      animate(counter, {
        value,
        duration: 1200,
        ease: "outExpo",
        onUpdate: () => { node.textContent = format(counter.value); },
      });
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [places, value]);

  return <span ref={ref}>{value.toFixed(places)}</span>;
}

function AnimatedBars({ outer, inner }: { outer: number; inner: number }) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const outerNode = outerRef.current;
    const innerNode = innerRef.current;
    if (!outerNode || !innerNode) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      outerNode.style.width = `${outer}%`;
      innerNode.style.width = `${inner}%`;
      return;
    }
    outerNode.style.width = "0%";
    innerNode.style.width = "0%";
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      animate(outerNode, { width: `${outer}%`, duration: 1100, ease: "outExpo" });
      animate(innerNode, { width: `${inner}%`, duration: 900, delay: 180, ease: "outExpo" });
      observer.disconnect();
    }, { threshold: 0.3 });
    observer.observe(outerNode.parentElement ?? outerNode);
    return () => observer.disconnect();
  }, [inner, outer]);

  return <div ref={outerRef} className="p75-bar"><div ref={innerRef} className="median-bar"></div></div>;
}

export default function Home() {
  const [view, setView] = useState<"experience" | "role" | "company">("experience");
  const [years, setYears] = useState(4);
  const currentData = view === "experience" ? experience : view === "role" ? roleData : companyData;
  const max = Math.max(...currentData.map((d) => d.p75));
  const benchmark = useMemo(() => {
    if (years < 1) return experience[0];
    if (years < 3) return experience[1];
    if (years < 5) return experience[2];
    if (years < 8) return experience[3];
    if (years < 12) return experience[4];
    return experience[5];
  }, [years]);

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="薪資透視首頁"><span className="brand-mark">S</span>薪資透視<span className="brand-en">SALARY LENS</span></a>
        <div className="nav-links"><a href="#distribution">薪資分布</a><a href="#insights">市場洞察</a><a href="#companies">推薦公司</a><a href="#advice">求職建議</a></div>
        <a className="nav-cta" href="#positioning">定位你的薪資 <ArrowUpRight /></a>
      </nav>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span></span>2025 台灣軟體職缺匿名資料</div>
        <div className="hero-grid">
          <div>
            <h1>台灣軟體<br />工程師<span>薪水分布</span></h1>
            <p className="hero-copy">拆解 635 筆有效樣本，從年資、職務到公司類型，幫你看懂薪資落點，也看見下一步。</p>
            <div className="hero-actions"><a className="primary" href="#distribution">查看市場分布 <ArrowUpRight /></a><a className="text-link" href="#method">了解資料怎麼讀 <span>↓</span></a></div>
          </div>
          <div className="hero-card" aria-label="年薪分布摘要">
            <div className="card-kicker">TOTAL COMPENSATION · 萬／年</div>
            <div className="median"><div><span>市場中位數</span><strong><AnimatedNumber value={100} /></strong><small>萬</small></div><div className="sample">有效樣本<br /><b><AnimatedNumber value={635} /></b> 筆</div></div>
            <div className="range"><div className="range-line"><i style={{left:"8%"}}></i><i className="dot" style={{left:"29%"}}></i><i className="dot main" style={{left:"50%"}}></i><i className="dot" style={{left:"71%"}}></i><i style={{left:"92%"}}></i></div><div className="range-labels"><span>P10<br /><b><AnimatedNumber value={58} /></b></span><span>P25<br /><b><AnimatedNumber value={72} /></b></span><span className="active">P50<br /><b><AnimatedNumber value={100} /></b></span><span>P75<br /><b><AnimatedNumber value={140} /></b></span><span>P90<br /><b><AnimatedNumber value={200} /></b></span></div></div>
            <div className="card-note"><span>↑</span><p>站上 P75，代表年薪超過市場中 <b>75%</b> 的樣本。</p></div>
          </div>
        </div>
        <div className="hero-stats"><div><span>月底薪中位數</span><b><AnimatedNumber value={6.7} /><small> 萬</small></b></div><div><span>年薪平均</span><b><AnimatedNumber value={119.9} /><small> 萬</small></b></div><div><span>每日工時中位數</span><b><AnimatedNumber value={8} /><small> 小時</small></b></div><div><span>年薪 P90</span><b><AnimatedNumber value={200} /><small> 萬</small></b></div></div>
      </section>

      <section className="distribution" id="distribution">
        <div className="shell">
          <div className="section-head"><div><div className="section-no">01 — DISTRIBUTION</div><h2>市場不是一條線，<br />而是一段<span>選擇的距離。</span></h2></div><p>切換維度，比較各群體的年薪中位數與 P75。樣本小的類別波動較大，適合作為方向，不是定價表。</p></div>
          <div className="tabs" role="tablist" aria-label="比較維度">{([['experience','依年資'],['role','依職務'],['company','依公司類型']] as const).map(([key,label])=><button key={key} onClick={()=>setView(key)} className={view===key?'active':''} role="tab" aria-selected={view===key}>{label}</button>)}</div>
          <div className="chart-card">
            <div className="chart-legend"><span><i className="median-key"></i>年薪中位數</span><span><i className="p75-key"></i>P75</span><small>單位：萬元／年</small></div>
            <div className="bars">{currentData.map((d)=><div className="bar-row" key={d.label}><div className="bar-label"><b>{d.label}</b><small>n = {d.n}</small></div><div className="bar-track"><AnimatedBars outer={Math.max(12,d.p75/max*100)} inner={d.median/d.p75*100} /></div><div className="bar-value"><b><AnimatedNumber value={d.median} /></b><span>/ <AnimatedNumber value={d.p75} /></span></div></div>)}</div>
          </div>
        </div>
      </section>

      <section className="insights shell" id="insights">
        <div className="section-no">02 — WHAT THE DATA SAYS</div><div className="insights-title"><h2>數字背後，<br />有三個更重要的訊號。</h2><p>薪資不只由年資決定。產業位置、能力稀缺度，以及你承擔的問題規模，才是拉開差距的主因。</p></div>
        <div className="insight-grid">
          <article className="feature-insight"><div className="index">01</div><div className="visual-jump"><span>3–5 年</span><div><i></i><i></i><i className="hot"></i><i></i><i></i></div><strong>第一次明顯跳薪窗口</strong></div><h3>年資成長不是直線，<br />關鍵在能力是否跟著升級。</h3><p>3–5 年開始有明顯議價空間；5 年以上如果仍停在純執行，薪資曲線容易變平。</p></article>
          <article><div className="index">02</div><div className="big-number"><AnimatedNumber value={2} /><span>×</span></div><h3>外商／大型科技的中位數，約是一般軟體公司的 2.2 倍。</h3><p>高總包也伴隨英文、系統設計、跨國協作與績效門檻。不是免費溢價，而是不同競技場。</p><div className="compare"><span>一般軟體 <b><AnimatedNumber value={90} /> 萬</b></span><span>外商科技 <b><AnimatedNumber value={200} /> 萬</b></span></div></article>
          <article><div className="index">03</div><div className="balance"><span>薪資</span><i></i><span>生活</span></div><h3>高薪不等於爽，<br />高壓也不一定有補償。</h3><p>高 loading 樣本年薪中位數 110 萬，僅比低 loading 的 88 萬多 22 萬。面試時要驗證這份交換值不值得。</p><div className="mini-stat"><b><AnimatedNumber value={90} /></b><span>筆高加班／高壓樣本<br />年薪中位數 115 萬</span></div></article>
        </div>
      </section>

      <section className="positioning" id="positioning"><div className="shell positioning-grid"><div><div className="section-no light">03 — YOUR POSITION</div><h2>先知道位置，<br />才知道怎麼談。</h2><p>拖曳你的總年資，快速查看對應市場帶。談薪時建議把中位數當合理基準、P75 當有證據支撐的進取目標。</p></div><div className="calculator"><label htmlFor="years">你的軟體工作總年資 <output><AnimatedNumber value={years} /> 年</output></label><input id="years" type="range" min="0" max="15" step="1" value={years} onChange={(e)=>setYears(Number(e.target.value))} /><div className="ticks"><span>0</span><span>3</span><span>5</span><span>8</span><span>12</span><span>15＋</span></div><div className="result"><div><span>市場中位數</span><b><AnimatedNumber value={benchmark.median} /><small> 萬／年</small></b></div><div><span>進取目標 · P75</span><b><AnimatedNumber value={benchmark.p75} /><small> 萬／年</small></b></div></div><p className="calc-note">基於「{benchmark.label}」的 {benchmark.n} 筆樣本；仍需搭配職務與公司類型判讀。</p></div></div></section>

      <section className="advice shell" id="advice"><div className="section-head"><div><div className="section-no">04 — CAREER PLAYBOOK</div><h2>不同階段，<br />要累積不同的<span>籌碼。</span></h2></div><p>最好的下一份工作，不一定是此刻薪水最高，而是能同時提高收入、能力與未來選擇權。</p></div><div className="advice-grid">{advice.map((item,i)=><article key={item.range} className={item.accent}><span className="stage">STAGE 0{i+1}</span><div className="range-title">{item.range}</div><h3>{item.title}</h3><p>{item.text}</p><div className="line"></div></article>)}</div>
        <div className="questions"><div><div className="section-no">INTERVIEW CHECKLIST</div><h3>別只問月薪。<br />這 6 題更接近真實報酬。</h3></div><ol><li><span>01</span>總年薪由哪些項目組成？保障月數、績效、分紅、RSU 各是多少？</li><li><span>02</span>過去兩年實際發放是否打折？平均調薪幅度多少？</li><li><span>03</span>每週工時、on-call 與假日支援頻率？補償制度是什麼？</li><li><span>04</span>團隊近半年流動率？上一位同事為什麼離開？</li><li><span>05</span>code review、測試、CI/CD、監控與事故檢討是否真的存在？</li><li><span>06</span>一年後，這份工作會讓履歷多出什麼市場認可的能力？</li></ol></div>
      </section>

      <section className="method" id="method"><div className="shell method-grid"><div><div className="section-no">ABOUT THE DATA</div><h2>把資料當羅盤，<br />別當成絕對答案。</h2></div><div><p>原始資料共 <b>769</b> 筆，排除測試、無效與無法合理判斷的極端資料後，薪資分析使用 <b>635</b> 筆。工時統計使用 590 筆。</p><p>資料來自匿名自填表單，可能有樣本偏差、欄位理解差異與時間差。適合觀察市場訊號與相對趨勢，不適合拿單一數字替任何職缺精準定價。</p><p><b>資料來源：</b><a href="https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997" target="_blank" rel="noreferrer" style={{textDecoration:"underline",textUnderlineOffset:"4px",fontWeight:700}}>DCard 科技業版－軟體工程師調查表 ↗</a></p><div className="method-tags"><span>金額單位：新台幣萬元</span><span>統計：中位數與百分位</span><span>資料年度：2025</span></div></div></div></section>
      <section className="companies" id="companies"><div className="shell">
        <div className="section-head"><div><div className="section-no">COMPANY SHORTLIST</div><h2>薪資夠高，<br />也值得放進<span>候選名單。</span></h2></div><p>綜合年薪中位數、爽度、工作負荷與樣本可信度排序。只納入至少 3 筆有效回報，並合併常見中英文公司名稱。</p></div>
        <div className="company-podium">{companyRankings.slice(0,3).map((c)=><article className={`company-card ${c.tone}`} key={c.company}><div className="company-rank">{c.rank}<span>{c.tag}</span></div>{c.logo && <div className="company-logo"><img src={c.logo} alt={`${c.company} Logo`} loading="lazy" /></div>}<h3>{c.company}</h3><div className="company-salary"><b><AnimatedNumber value={c.salary} /></b><span>萬／年<br />薪資中位數</span></div><div className="company-signals"><span>爽度 <b><AnimatedNumber value={c.chill} /></b>/5</span><span>Loading <b><AnimatedNumber value={c.loading} /></b>/5</span><span>工時 <b><AnimatedNumber value={c.hours} /></b>h</span></div><small>有效樣本 n = {c.n}</small></article>)}</div>
        <div className="company-table" role="table" aria-label="推薦公司薪資比較"><div className="company-row head" role="row"><span>排名／公司</span><span>年薪中位數</span><span>爽度</span><span>Loading</span><span>工時</span><span>樣本</span><span>觀察</span></div>{companyRankings.slice(3).map((c)=><div className="company-row" role="row" key={c.company}><span><i>{c.rank}</i><b>{c.company}</b></span><span><strong><AnimatedNumber value={c.salary} /></strong> 萬</span><span><AnimatedNumber value={c.chill} /> / 5</span><span><AnimatedNumber value={c.loading} /> / 5</span><span><AnimatedNumber value={c.hours} /> h</span><span>n = {c.n}</span><span><em>{c.tag}</em></span></div>)}</div>
        <div className="company-caveat"><b>怎麼看這份名單？</b><p>「綜合推薦」偏好高薪且工作體驗不差的公司，不等於無條件推薦。職務、職級、部門與年份都會讓同公司出現很大差異；n = 3 的結果尤其容易波動，面試時仍要逐項驗證。</p></div>
      </div></section>
      <style>{`.companies{background:#dddcd3;padding:130px 0}.company-podium{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:56px 0 18px}.company-card{background:#f7f5ed;padding:28px;min-height:310px;display:flex;flex-direction:column;border-top:9px solid #aeb7b1}.company-card.lime{border-color:var(--lime)}.company-card.blue{border-color:var(--blue)}.company-card.violet{border-color:var(--violet)}.company-rank{display:flex;justify-content:space-between;font:700 12px monospace}.company-rank span{font:700 10px sans-serif;border:1px solid #aeb7b1;border-radius:99px;padding:5px 9px}.company-card h3{font-size:27px;margin:34px 0 13px}.company-salary{display:flex;align-items:end;gap:12px}.company-salary b{font-size:62px;line-height:1;letter-spacing:-.06em}.company-salary span{font-size:10px;line-height:1.45;color:var(--muted);padding-bottom:5px}.company-signals{display:flex;gap:7px;margin-top:auto}.company-signals span{font-size:10px;background:#e4e3db;padding:7px}.company-card small{font:10px monospace;color:#7c8781;margin-top:15px}.company-table{background:#f7f5ed;padding:0 25px;overflow-x:auto}.company-row{display:grid;grid-template-columns:1.6fr 1fr .7fr .8fr .7fr .65fr 1fr;align-items:center;min-width:900px;border-bottom:1px solid #d5d9d4;padding:16px 0;font-size:12px}.company-row.head{font:10px monospace;color:#738078;text-transform:uppercase}.company-row>span:first-child{display:flex;align-items:center;gap:14px}.company-row i{font:11px monospace;color:#7b8780;font-style:normal}.company-row strong{font-size:18px}.company-row em{font-style:normal;background:#e5e4dc;padding:6px 8px;border-radius:99px;font-size:10px}.company-caveat{display:grid;grid-template-columns:170px 1fr;gap:20px;margin-top:22px;border-top:1px solid #b9c0bb;padding-top:22px}.company-caveat b{font-size:13px}.company-caveat p{margin:0;color:var(--muted);font-size:12px;line-height:1.7}@media(max-width:800px){.companies{padding:90px 0}.company-podium{grid-template-columns:1fr}.company-caveat{grid-template-columns:1fr;gap:8px}}`}</style>
      <style>{`.company-card{min-height:360px}.company-logo{height:58px;margin:28px 0 4px;display:flex;align-items:center}.company-logo img{display:block;max-width:180px;max-height:46px;width:auto;height:auto;object-fit:contain}.company-logo+h3{margin-top:18px}`}</style>
      <footer><div className="shell"><div className="brand"><span className="brand-mark">S</span>薪資透視</div><p>看懂市場，也看清自己的下一步。</p><a href="#top">回到頂端 ↑</a></div></footer>
    </main>
  );
}
