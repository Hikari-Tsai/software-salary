"use client";

import { useState, type ReactNode } from "react";
import type { CompanyMetric, CompanyRanking } from "./company-rankings";

export function CompanySalaryRange({ company }: { company: CompanyRanking }) {
  const available = company.n >= 5 && company.p25 !== null && company.p75 !== null;
  return <div className="company-range">
    <span className="range-caption">P25–P75</span>
    {available
      ? <span><strong>{company.p25}</strong>–<strong>{company.p75}</strong><small> 萬／年</small></span>
      : <span className="range-unavailable">樣本不足<small>（n &lt; 5）</small></span>}
  </div>;
}

function Metric({ label, value, unit }: { label: string; value: CompanyMetric; unit: string }) {
  return <div className="company-detail-metric">
    <dt>{label}</dt>
    <dd>{value.median === null ? "—" : <><strong>{value.median}</strong> {unit}</>}<small>n = {value.n}</small></dd>
  </div>;
}

export function CompanyDetails({ company }: { company: CompanyRanking }) {
  return <details className="company-details">
    <summary aria-label={`${company.company}：展開或收合回報摘要`}>
      <span className="details-closed-label">查看回報摘要</span>
      <span className="details-open-label">收合回報摘要</span>
      <span className="details-chevron" aria-hidden="true">⌄</span>
    </summary>
    <CompanyDetailContent company={company} />
  </details>;
}

export function CompanyRankingRow({ company, salaryDisplay }: { company: CompanyRanking; salaryDisplay: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const panelId = `company-report-${company.rank}`;
  return <div className="company-entry">
    <div className="company-row">
      <span className="company-name"><i>{company.rank}</i><b>{company.company}</b></span>
      <div className="company-median"><small className="company-cell-label">年薪中位數</small>{salaryDisplay}<small> 萬</small></div>
      <CompanySalaryRange company={company} />
      <span className="company-sample">n = {company.n}</span>
      <span className="company-observation"><em>{company.tag}</em></span>
      <button type="button" className="company-expand-button" aria-expanded={expanded} aria-controls={panelId}
        aria-label={`${expanded ? "收合" : "展開"}${company.company}的回報摘要`} onClick={() => setExpanded(value => !value)}>
        {expanded ? "收合" : "展開"}<span className="details-chevron" aria-hidden="true">⌄</span>
      </button>
    </div>
    <div id={panelId} hidden={!expanded}>
      <CompanyDetailContent company={company} />
    </div>
  </div>;
}

function CompanyDetailContent({ company }: { company: CompanyRanking }) {
  const { details } = company;
  return <div className="company-detail-content">
      <h4>工作與薪酬參考</h4>
      <p className="detail-method">以下為有效值的中位數，各欄位樣本數可能不同。</p>
      <dl className="company-detail-metrics">
        <Metric label="月底薪" value={details.base} unit="萬" />
        <Metric label="每日工時" value={details.hours} unit="小時" />
        <Metric label="軟體工作年資" value={details.experience} unit="年" />
        <Metric label="爽度" value={details.chill} unit="/ 5" />
        <Metric label="工作強度" value={details.loading} unit="/ 5" />
        <Metric label="加班頻率" value={details.overtime} unit="/ 5" />
      </dl>
      <p className="detail-method">爽度 5 分為最滿意；工作強度與加班頻率 5 分為最高。自由填寫的加班描述不換算成每月時數。</p>
      <h4>回報職務組成</h4>
      <ul className="company-role-chips">{details.roles.map(role => <li key={role.label}>{role.label}<span>{role.n} 筆</span></li>)}</ul>
      <h4>匿名文字回饋摘要 <small>{details.feedbackCount} 筆文字回報</small></h4>
      {details.feedback.status === "reviewed"
        ? <p className="company-feedback">{details.feedback.text}</p>
        : <p className="company-feedback empty">{details.feedback.status === "empty"
          ? "目前有效樣本中沒有可整理的文字回饋，不推測工作體驗。"
          : "這份資料的文字回饋尚待整理，暫不沿用舊版摘要。"}</p>}
      <p className="company-feedback-disclaimer">摘要整理自本次有效薪資樣本的匿名填答，未經逐筆查證，不代表公司整體制度。可能涵蓋不同年份、部門或尚未入職的經驗；單一意見不代表共識，請以應徵職缺再確認。</p>
    </div>;
}
