"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { animate } from "animejs";
import { companyRankings } from "./company-rankings";
import { floatingActions, navStarAction } from "./floating-actions";
import { interpolateSalary } from "./salary-interpolation";

const experience = [
  { label: "0–1 年", median: 84.5, p75: 120, n: 76 },
  { label: "1–3 年", median: 77, p75: 109.5, n: 138 },
  { label: "3–5 年", median: 98, p75: 130, n: 149 },
  { label: "5–8 年", median: 120, p75: 180, n: 140 },
  { label: "8–12 年", median: 150, p75: 198.8, n: 70 },
  { label: "12 年＋", median: 153, p75: 240, n: 16 },
];

const experienceAnchors = experience.map((item, index) => ({
  year: [0, 2, 4, 6.5, 10, 14][index],
  median: item.median,
  p75: item.p75,
}));

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

const advice = [
  { range: "0–2 年", title: "先練到能獨立交付", text: "優先找有 code review、測試、部署流程和資深工程師帶領的團隊。起薪要看，能不能在一兩年後接下更難的工作也很重要。", accent: "lime" },
  { range: "2–5 年", title: "讓履歷說清楚你解決了什麼", text: "只列工具很難看出能力。把效能改善、穩定度提升或省下的工時寫成具體成果，面試時也比較容易談價值。", accent: "blue" },
  { range: "5 年＋", title: "資深價值在決策與影響範圍", text: <>把架構取捨、跨團隊協作和事故處理講清楚。若年薪目標在 <strong>200</strong> 萬以上，英文能力與專業領域通常會影響可選職缺的範圍。</>, accent: "violet" },
];

const offerQuestions = [
  { question: "總年薪包含哪些項目？保障月數、績效、分紅和 RSU 各是多少？", why: "同樣寫著年薪 150 萬，固定月薪、保障年終與不保證獎金的組成可能完全不同。只比較總數，容易高估真正能穩定拿到的收入。", benefit: "確認固定薪資與浮動薪酬的比例，也能提早看出獎金門檻、股票歸屬期與離職時可能放棄的報酬。", followUp: "如果以一般績效估算，去年同職級實際拿到的固定與浮動薪酬各是多少？" },
  { question: "過去兩年的實際發放結果如何？平均調薪幅度是多少？", why: "制度寫得漂亮，不代表公司每年都照目標發放。實際紀錄比招募簡報更能反映公司營運、預算與績效評等的可信度。", benefit: "判斷第一年的 offer 是長期基準還是一次性高點，也能估計留任兩三年後，薪資是否跟得上市場。", followUp: "團隊多數人在正常績效下，近兩年的獎金達成率與年度調薪大約落在哪個區間？" },
  { question: "每週工時、on-call 和假日支援的頻率如何？有什麼補償？", why: "平均工時常會掩蓋上線前、月底結算或事故期間的尖峰。on-call 是否輪值、是否真的會被叫醒，也會大幅改變生活品質。", benefit: "把薪資換算成真實投入時間，確認加班費、補休與輪值津貼，避免入職後才發現隱性的固定工時。", followUp: "最近三個月團隊發生過幾次下班後支援？通常由幾個人輪值，隔天可以補休嗎？" },
  { question: "團隊近半年的流動率是多少？上一位同事為什麼離開？", why: "頻繁補人可能來自成長，也可能是主管、工作量或職涯停滯。離職原因比籠統的『文化契合』更接近團隊現況。", benefit: "辨認團隊是否長期處於人力不足，並了解新人加入後要承接的是正常職缺、擴編，還是尚未解決的組織問題。", followUp: "這個職缺是擴編還是補人？過去半年有多少人加入與離開，團隊目前最缺的是哪種能力？" },
  { question: "團隊如何執行 code review、測試、CI/CD、監控和事故檢討？", why: "工程流程決定你每天是在持續交付，還是不斷救火。口頭上『都有做』不夠，頻率、責任人和實際案例才看得出成熟度。", benefit: "確認能否累積市場認可的工程經驗，也能預估上線風險、技術債與你入職後需要獨自承擔的範圍。", followUp: "可以分享最近一次上線與事故檢討的流程嗎？從開 PR 到部署通常需要哪些檢查？" },
  { question: "做滿一年後，履歷上可以多出哪些具體經驗？", why: "職稱與技術棧不等於成長。真正有價值的是能否負責更大的範圍，做出可量化成果，並取得下一個市場也認可的經驗。", benefit: "判斷這份工作能不能提高下一次轉職的選擇權，同時確認主管對職責、升等與成功標準是否有清楚期待。", followUp: "表現良好的人在第一年通常會獨立負責什麼？能否舉一位近期升等同事的成果為例？" },
];

const careerDirections = [
  { no: "01", title: "薪資突破", accent: "lime", text: "把外商、大型科技與高價值產品團隊列為目標；補強英文、系統設計與跨團隊協作，讓能力能對應更高職級。", focus: "適合：想提高總年薪上限" },
  { no: "02", title: "技術成長", accent: "blue", text: "選擇有 code review、測試、部署與監控的團隊，主動承接效能、穩定性或架構問題，累積可以量化的成果。", focus: "適合：想建立長期競爭力" },
  { no: "03", title: "穩定生活", accent: "violet", text: "優先研究成熟產品線、金融或大型企業；比較實際工時、on-call、休假與獎金穩定性，不只看名目月薪。", focus: "適合：重視可預期的節奏" },
  { no: "04", title: "轉型升級", accent: "paper", text: "從現有經驗延伸到 Tech Lead、管理、資料／AI、雲端或資安；先用小型專案驗證方向，再決定是否全面轉換。", focus: "適合：想打開新的職涯選項" },
];

const roadmapSteps = [
  { time: "現在", title: "先定義你要優化什麼", text: "在薪資、成長、生活與轉型中排出前兩名，寫下不能妥協的條件。" },
  { time: "未來 6–12 個月", title: "累積下一步需要的證據", text: "完成一項可量化成果，補上一個關鍵能力，並持續蒐集目標公司的職缺條件。" },
  { time: "下一次選 offer", title: "用同一張表比較總價值", text: "一起比較總年薪、工時、主管、工程流程、成長空間與一年後的履歷價值。" },
];

function ArrowUpRight() {
  return <span aria-hidden="true">↗</span>;
}

function AnimatedNumber({ value, decimals, strong = false }: { value: number; decimals?: number; strong?: boolean }) {
  const ref = useRef<HTMLElement>(null);
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

  return strong
    ? <strong ref={ref}>{value.toFixed(places)}</strong>
    : <span ref={ref}>{value.toFixed(places)}</span>;
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
  const estimatedSalary = useMemo(() => interpolateSalary(experienceAnchors, years), [years]);

  return (
    <main>
      <nav className="nav shell">
        <a className="brand" href="#top" aria-label="軟工薪資透視首頁"><span className="brand-mark">S</span>軟工薪資透視<span className="brand-en">SALARY LENS</span></a>
        <div className="nav-links"><a href="#distribution">薪資分布</a><a href="#insights">市場洞察</a><a href="#companies">推薦公司</a><a href="#advice">求職建議</a></div>
        <div className="nav-actions">
          <a className="nav-star" href={navStarAction.href} target="_blank" rel="noreferrer" aria-label="前往 GitHub 賞個 Star"><span aria-hidden="true">★</span><b>{navStarAction.label}</b><i>{navStarAction.shortLabel}</i></a>
          <a className="nav-cta" href="https://docs.google.com/forms/d/e/1FAIpQLSex_qWWtuEYO0rmxFs7bsJof4KAzlQ4qveLH4IGxhff7FXcDg/viewform?usp=publish-editor" target="_blank" rel="noreferrer">匿名貢獻資料 <ArrowUpRight /></a>
        </div>
      </nav>

      <figure className="hero-banner shell">
        <img src="images/salary-data-banner.webp" alt="台灣軟體工程師薪資成長與資料趨勢視覺" fetchPriority="high" />
        <figcaption><span>TAIWAN SOFTWARE SALARY LENS</span><b>用公開回報，對照你的薪資位置</b></figcaption>
      </figure>

      <section className="hero shell" id="top">
        <div className="eyebrow"><span></span>2025 台灣軟體職缺匿名資料</div>
        <div className="hero-grid">
          <div>
            <h1>台灣軟體<br />工程師<span>薪水分布</span></h1>
            <p className="hero-copy">整理 635 筆有效樣本，依年資、職務和公司類型比較薪資。先確認自己大致落在哪裡，再決定下一步怎麼談。</p>
            <div className="hero-actions"><a className="primary" href="#distribution">查看市場分布 <ArrowUpRight /></a><a className="text-link" href="#method">了解資料怎麼讀 <span>↓</span></a></div>
          </div>
          <div className="hero-card" aria-label="年薪分布摘要">
            <div className="card-kicker">TOTAL COMPENSATION · 萬／年</div>
            <div className="median"><div><span>市場中位數</span><AnimatedNumber value={100} strong /><small>萬</small></div><div className="sample">有效樣本<br /><b><AnimatedNumber value={635} /></b> 筆</div></div>
            <div className="range"><div className="range-line"><i style={{left:"8%"}}></i><i className="dot" style={{left:"29%"}}></i><i className="dot main" style={{left:"50%"}}></i><i className="dot" style={{left:"71%"}}></i><i style={{left:"92%"}}></i></div><div className="range-labels"><span>P10<br /><b><AnimatedNumber value={58} /></b></span><span>P25<br /><b><AnimatedNumber value={72} /></b></span><span className="active">P50<br /><b><AnimatedNumber value={100} /></b></span><span>P75<br /><b><AnimatedNumber value={140} /></b></span><span>P90<br /><b><AnimatedNumber value={200} /></b></span></div></div>
            <div className="card-note"><span>↑</span><p>P75 表示這筆年薪高於資料中 <b>75%</b> 的有效樣本。</p></div>
          </div>
        </div>
        <div className="hero-stats"><div><span>月底薪中位數</span><AnimatedNumber value={6.7} strong /><small> 萬</small></div><div><span>年薪平均</span><AnimatedNumber value={119.9} strong /><small> 萬</small></div><div><span>每日工時中位數</span><AnimatedNumber value={8} strong /><small> 小時</small></div><div><span>年薪 P90</span><AnimatedNumber value={200} strong /><small> 萬</small></div></div>
      </section>

      <section className="distribution" id="distribution">
        <div className="shell">
          <div className="section-head"><div><div className="section-no">01 — DISTRIBUTION</div><h2>同樣是軟體工程師，<br /><span>薪資差距可以很大。</span></h2></div><p>依年資、職務或公司類型切換，查看各群體的年薪中位數與 P75。樣本較少的類別容易波動，適合用來抓範圍，不適合直接替職缺定價。</p></div>
          <div className="tabs" role="tablist" aria-label="比較維度">{([['experience','依年資'],['role','依職務'],['company','依公司類型']] as const).map(([key,label])=><button key={key} onClick={()=>setView(key)} className={view===key?'active':''} role="tab" aria-selected={view===key}>{label}</button>)}</div>
          <div className="chart-card">
            <div className="chart-legend"><span><i className="median-key"></i>年薪中位數</span><span><i className="p75-key"></i>P75</span><small>單位：萬元／年</small></div>
            <div className="bars">{currentData.map((d)=><div className="bar-row" key={d.label}><div className="bar-label"><b>{d.label}</b><small>n = {d.n}</small></div><div className="bar-track"><AnimatedBars outer={Math.max(12,d.p75/max*100)} inner={d.median/d.p75*100} /></div><div className="bar-value"><b><AnimatedNumber value={d.median} /></b><span>/ <AnimatedNumber value={d.p75} /></span></div></div>)}</div>
          </div>
        </div>
      </section>

      <section className="insights shell" id="insights">
        <div className="section-no">02 — WHAT THE DATA SAYS</div><div className="insights-title"><h2>資料裡有幾個<br />值得注意的差異。</h2><p>年資會影響薪資，但公司類型、專業能力和工作責任也會拉開差距。以下數字適合拿來檢查自己的假設。</p></div>
        <div className="insight-grid">
          <article className="feature-insight"><div className="index">01</div><div className="visual-jump"><span>3–5 年</span><div><i></i><i></i><i className="hot"></i><i></i><i></i></div><strong>常見的第一次跳薪區間</strong></div><h3>3–5 年的議價空間<br />通常比前期更明顯。</h3><p>這個階段若能獨立負責功能、處理線上問題，或參與系統設計，履歷會比單純累積年資更有說服力。</p></article>
          <article><div className="index">02</div><div className="big-number"><AnimatedNumber value={2} /><span>×</span></div><h3>外商與大型科技公司的年薪中位數，約為一般軟體公司的 2.2 倍。</h3><p>這類職缺通常也要求英文溝通、系統設計和跨國協作。比較薪資時，記得把職級與績效制度一起算進去。</p><div className="compare"><span>一般軟體 <AnimatedNumber value={90} strong /> 萬</span><span>外商科技 <AnimatedNumber value={200} strong /> 萬</span></div></article>
          <article><div className="index">03</div><div className="balance"><span>薪資</span><i></i><span>生活</span></div><h3>工作強度變高，<br />薪資未必等幅增加。</h3><p>高工作強度樣本的年薪中位數是 <strong>110</strong> 萬，低工作強度樣本是 <strong>88</strong> 萬，相差 <strong>22</strong> 萬。面試時可再確認工時、on-call 和加班補償。</p><div className="mini-stat"><b><AnimatedNumber value={90} /></b><span>筆高加班／高壓樣本<br />年薪中位數 <strong>115</strong> 萬</span></div></article>
        </div>
      </section>

      <section className="positioning" id="positioning"><div className="shell positioning-grid"><div><div className="section-no light">03 — YOUR POSITION</div><h2>先找市場基準，<br />再準備談薪。</h2><p>拖曳工作年資，查看相近樣本的薪資範圍。中位數可當作基本參考；若履歷上有明確成果，再把 P75 列為談薪目標。</p></div><div className="calculator"><label htmlFor="years">你的軟體工作總年資 <output>{years} 年</output></label><input id="years" type="range" min="0" max="15" step="1" value={years} onChange={(e)=>setYears(Number(e.target.value))} /><div className="ticks"><span>0</span><span>3</span><span>5</span><span>8</span><span>12</span><span>15＋</span></div><div className="result"><div><span>市場中位數</span><strong>{estimatedSalary.median}</strong><small> 萬／年</small></div><div><span>進取目標 · P75</span><strong>{estimatedSalary.p75}</strong><small> 萬／年</small></div></div><p className="calc-note">數值由相鄰年資區間線性估算。目前對應「{benchmark.label}」，仍需搭配職務和公司類型判讀。</p></div></div></section>

      <section className="advice shell" id="advice"><div className="section-head"><div><div className="section-no">04 — CAREER PLAYBOOK</div><h2>年資不同，<br />求職時該看的<span>重點也不同。</span></h2></div><p>選下一份工作時，除了薪水，也要看團隊能否讓你接觸更完整的工程流程，並累積下一次轉職用得上的經驗。</p></div><div className="advice-grid">{advice.map((item,i)=><article key={item.range} className={item.accent}><span className="stage">STAGE 0{i+1}</span><div className="range-title">{item.range}</div><h3>{item.title}</h3><p>{item.text}</p><div className="line"></div></article>)}</div>
        <div className="questions"><div><div className="section-no">INTERVIEW CHECKLIST</div><h3>談 offer 時，<br />這 6 題比月薪更有用。</h3><p>點開每一題，了解它能幫你確認哪些風險，以及面試時可以怎麼繼續追問。</p></div><div className="offer-questions">{offerQuestions.map((item,index)=><details className="offer-question" key={item.question}><summary><span>0{index + 1}</span><b>{item.question}</b><i aria-hidden="true"></i></summary><div className="offer-answer"><div><strong>為什麼要問</strong><p>{item.why}</p></div><div><strong>你能看出什麼</strong><p>{item.benefit}</p></div><div className="follow-up"><strong>可以這樣追問</strong><p>「{item.followUp}」</p></div></div></details>)}</div></div>
      </section>

      <section className="method" id="method"><div className="shell method-grid"><div><div className="section-no">ABOUT THE DATA</div><h2>資料先拿來抓方向，<br />再回到職缺條件判斷。</h2></div><div><p>原始資料有 <b>769</b> 筆。排除測試資料、無效值和無法合理判讀的極端值後，薪資分析採用 <b>635</b> 筆，工時統計採用 590 筆。</p><p>這些資料由使用者匿名填寫，可能受到樣本組成、欄位理解和填寫時間影響。適合比較相對差異與大致區間，不能直接代表某一個職缺的合理薪資。</p><p><b>資料來源：</b><a href="https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997" target="_blank" rel="noreferrer" style={{textDecoration:"underline",textUnderlineOffset:"4px",fontWeight:700}}>DCard 科技業版－軟體工程師調查表 ↗</a></p><div className="method-tags"><span>金額單位：新台幣萬元</span><span>統計：中位數與百分位</span><span>資料年度：2025</span></div></div></div></section>
      <section className="companies" id="companies"><div className="shell">
        <div className="section-head"><div><div className="section-no">COMPANY SHORTLIST</div><h2>哪些公司<br />值得<span>優先研究？</span></h2></div><p>排行綜合年薪中位數、爽度、工作強度和樣本數計算。只列入至少 3 筆有效回報的公司，常見中英文別名已合併。</p></div>
        <div className="company-podium">{companyRankings.slice(0,3).map((c)=><article className={`company-card ${c.tone}`} key={c.company}><div className="company-rank">{c.rank}<span>{c.tag}</span></div>{c.logo && <div className="company-logo"><img src={c.logo} alt={`${c.company} Logo`} loading="lazy" /></div>}<div className="company-salary"><AnimatedNumber value={c.salary} strong /><span>萬／年<br />薪資中位數</span></div><div className="company-signals"><span>爽度 <b><AnimatedNumber value={c.chill} /></b>/5</span><span>工作強度 <b><AnimatedNumber value={c.工作強度} /></b>/5</span><span>工時 <b><AnimatedNumber value={c.hours} /></b>h</span></div><small>有效樣本 n = {c.n}</small></article>)}</div>
        <div className="company-table" role="table" aria-label="符合樣本門檻的完整公司薪資比較"><div className="company-row head" role="row"><span>排名／公司</span><span>年薪中位數</span><span>爽度</span><span>工作強度</span><span>工時</span><span>樣本</span><span>觀察</span></div>{companyRankings.slice(3).map((c)=><div className="company-row" role="row" key={c.company}><span><i>{c.rank}</i><b>{c.company}</b></span><span><AnimatedNumber value={c.salary} strong /> 萬</span><span><AnimatedNumber value={c.chill} /> / 5</span><span><AnimatedNumber value={c.工作強度} /> / 5</span><span><AnimatedNumber value={c.hours} /> h</span><span>n = {c.n}</span><span><em>{c.tag}</em></span></div>)}</div>
        <p className="company-threshold-note">僅列入有效樣本數 n ≥ 3 的公司。</p>
        <div className="company-caveat"><b>這份排行怎麼看？</b><p>排名較前表示樣本中的薪資和工作體驗整體較好，不代表每個部門或職缺都一樣。職務、職級和填寫年份都會影響結果；n = 3 的數字尤其容易波動，面試時仍需逐項確認。</p></div>
      </div></section>
      <section className="career-summary" id="summary"><div className="shell">
        <div className="summary-intro"><div><div className="section-no light">05 — NEXT MOVE</div><h2>找到適合你的路線，<br />再把下一步走具體。</h2></div><p>市場數字只能提供座標，真正的選擇取決於你現在最想改善什麼。先確定優先順序，再用同一套標準比較職缺，會比追逐單一高薪數字更可靠。</p></div>
        <div className="direction-grid">{careerDirections.map((item)=><article className={item.accent} key={item.title}><span>{item.no}</span><h3>{item.title}</h3><p>{item.text}</p><small>{item.focus}</small></article>)}</div>
        <div className="roadmap"><div className="roadmap-title"><span>ACTION PLAN</span><h3>把方向變成<br />可以執行的計畫。</h3></div><ol>{roadmapSteps.map((step,index)=><li key={step.time}><span>0{index + 1}</span><div><small>{step.time}</small><h4>{step.title}</h4><p>{step.text}</p></div></li>)}</ol></div>
        <p className="summary-note"><b>最後提醒：</b>同一條路線沒有固定答案。每半年重新檢查一次優先順序，確認目前的工作仍在替下一步累積籌碼。</p>
      </div></section>
      <style>{`.companies{background:#dddcd3;padding:130px 0}.company-podium{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin:56px 0 18px}.company-card{background:#f7f5ed;padding:28px;min-height:310px;display:flex;flex-direction:column;border-top:9px solid #aeb7b1}.company-card.lime{border-color:var(--lime)}.company-card.blue{border-color:var(--blue)}.company-card.violet{border-color:var(--violet)}.company-rank{display:flex;justify-content:space-between;font:700 12px monospace}.company-rank span{font:700 10px sans-serif;border:1px solid #aeb7b1;border-radius:99px;padding:5px 9px}.company-card h3{font-size:27px;margin:34px 0 13px}.company-salary{display:flex;align-items:end;gap:12px}.company-salary strong{font-size:62px;line-height:1;letter-spacing:-.06em}.company-salary span{font-size:10px;line-height:1.45;color:var(--muted);padding-bottom:5px}.company-signals{display:flex;gap:7px;margin-top:auto}.company-signals span{font-size:10px;background:#e4e3db;padding:7px}.company-card small{font:10px monospace;color:#7c8781;margin-top:15px}.company-table{background:#f7f5ed;padding:0 25px;overflow-x:auto}.company-row{display:grid;grid-template-columns:1.6fr 1fr .7fr .8fr .7fr .65fr 1fr;align-items:center;min-width:900px;border-bottom:1px solid #d5d9d4;padding:16px 0;font-size:12px}.company-row.head{font:10px monospace;color:#738078;text-transform:uppercase}.company-row>span:first-child{display:flex;align-items:center;gap:14px}.company-row i{font:11px monospace;color:#7b8780;font-style:normal}.company-row strong{font-size:18px}.company-row em{font-style:normal;background:#e5e4dc;padding:6px 8px;border-radius:99px;font-size:10px}.company-threshold-note{margin:9px 0 0;text-align:right;color:#68736d;font:10px monospace}.company-caveat{display:grid;grid-template-columns:170px 1fr;gap:20px;margin-top:22px;border-top:1px solid #b9c0bb;padding-top:22px}.company-caveat b{font-size:13px}.company-caveat p{margin:0;color:var(--muted);font-size:12px;line-height:1.7}@media(max-width:800px){.companies{padding:90px 0}.company-podium{grid-template-columns:1fr}.company-caveat{grid-template-columns:1fr;gap:8px}}`}</style>
      <style>{`.company-card{min-height:340px}.company-logo{height:58px;margin:28px 0 22px;display:flex;align-items:center}.company-logo img{display:block;max-width:180px;max-height:46px;width:auto;height:auto;object-fit:contain}`}</style>
      <footer><div className="shell footer-grid">
        <div className="footer-about"><div className="brand"><span className="brand-mark">S</span>軟工薪資透視</div><p><b>作者 Hikari Tsai</b><br />平常關注軟體開發、資料分析和 AI 應用。這個網站把公開回報整理成容易比較的資料，供求職與談薪時參考。</p></div>
        <div className="footer-links"><span>PROJECT</span><a href="https://github.com/Hikari-Tsai/software-salary" target="_blank" rel="noreferrer">GitHub Repo ↗</a><a href="https://docs.google.com/forms/d/e/1FAIpQLSex_qWWtuEYO0rmxFs7bsJof4KAzlQ4qveLH4IGxhff7FXcDg/viewform?usp=publish-editor" target="_blank" rel="noreferrer">匿名貢獻資料 ↗</a></div>
        <div className="footer-links"><span>DATA</span><a href="https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997" target="_blank" rel="noreferrer">DCard 科技業版<br />軟體工程師調查表 ↗</a></div>
        <a className="footer-top" href="#top">回到頂端 ↑</a>
      </div><div className="shell footer-bottom"><span>© 2026 Hikari Tsai</span><span>公開資料僅供市場趨勢參考</span></div></footer>
      <div className="floating-actions" aria-label="專案快速連結">
        {floatingActions.map((action) => <a className={`github-star ${action.kind}`} href={action.href} target="_blank" rel="noreferrer" key={action.kind}><span aria-hidden="true">{action.icon}</span>{action.label}</a>)}
      </div>
    </main>
  );
}
