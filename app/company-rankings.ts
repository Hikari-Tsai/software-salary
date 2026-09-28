import salaryData from "./salary-data.json" with { type: "json" };

export type CompanyRanking = {
  rank: string;
  company: string;
  salary: number;
  chill: number | null;
  工作強度: number | null;
  hours: number | null;
  score: number;
  n: number;
  tag: string;
  tone: "lime" | "blue" | "violet" | "plain";
  logo?: string;
};

const companyAliases: Record<string, string> = {
  synopsys: "Synopsys 新思科技",
  synopsis: "Synopsys 新思科技",
  "synopsys 新思": "Synopsys 新思科技",
  新思科技: "Synopsys 新思科技",
  google: "Google 谷歌",
  微軟: "Microsoft 微軟",
  中華電信: "Chunghwa Telecom 中華電信",
  中華電信股份有限公司: "Chunghwa Telecom 中華電信",
  中華電信研究所: "Chunghwa Telecom 中華電信",
  cht: "Chunghwa Telecom 中華電信",
  gogox: "GOGOX 高高客",
  appier: "Appier 沛星互動科技",
  工研院: "ITRI 工業技術研究院",
  緯創軟體: "Wistron ITS 緯創軟體",
  台灣大哥大: "Taiwan Mobile 台灣大哥大",
  kkcompany: "KKCompany 科科科技",
  將來銀行: "NEXT BANK 將來銀行",
  奧義智慧: "CyCraft 奧義智慧",
  ibm: "IBM 國際商業機器",
  精誠資訊: "SYSTEX 精誠資訊",
  遠傳: "Far EasTone 遠傳電信",
  訊連科技: "CyberLink 訊連科技",
  cyberlink: "CyberLink 訊連科技",
  玉山銀行: "E.SUN Bank 玉山銀行",
  國泰世華: "Cathay United Bank 國泰世華銀行",
  天堂遊戲: "Heaven Games 天堂遊戲",
  昕力資訊: "TPIsoftware 昕力資訊",
  德義資訊: "DEInfo 德義資訊",
  "91app": "91APP 九易宇軒",
  東森購物: "Eastern Home Shopping 東森購物",
  pinkoi: "Pinkoi 果翼科技",
  叡揚資訊: "Galaxy Software Services 叡揚資訊",
  遊戲橘子: "Gamania 遊戲橘子",
  "trend micro": "Trend Micro 趨勢科技",
  趨勢科技: "Trend Micro 趨勢科技",
  趨勢: "Trend Micro 趨勢科技",
  synology: "Synology 群暉科技",
  群暉: "Synology 群暉科技",
  群暉科技: "Synology 群暉科技",
  沛星: "Appier 沛星互動科技",
  國泰: "Cathay United Bank 國泰世華銀行",
  國泰世華銀行: "Cathay United Bank 國泰世華銀行",
  國泰世華銀行股份有限公司: "Cathay United Bank 國泰世華銀行",
  "cathay united bank 國泰世華銀行": "Cathay United Bank 國泰世華銀行",
  玉山: "E.SUN Bank 玉山銀行",
  昕力: "TPIsoftware 昕力資訊",
  精誠: "SYSTEX 精誠資訊",
  叡揚: "Galaxy Software Services 叡揚資訊",
  訊連: "CyberLink 訊連科技",
  訊連科技股份有限公司: "CyberLink 訊連科技",
  谷歌: "Google 谷歌",
  中華電信研究院: "Chunghwa Telecom 中華電信",
  遠傳電信: "Far EasTone 遠傳電信",
  資拓: "資拓宏宇",
  tsmc: "TSMC 台灣積體電路製造",
  台積電: "TSMC 台灣積體電路製造",
  cmoney: "CMoney",
  shopline: "SHOPLINE 商線科技",
  奧義智慧科技股份有限公司: "CyCraft 奧義智慧",
  奧義智慧科技: "CyCraft 奧義智慧",
  txone: "TXOne Networks 睿控網安",
  "txone networks": "TXOne Networks 睿控網安",
  "txone network": "TXOne Networks 睿控網安",
  "txone networks   睿控網安": "TXOne Networks 睿控網安",
  itri: "ITRI 工業技術研究院",
  工業技術研究院: "ITRI 工業技術研究院",
  viewsonic: "ViewSonic 優派國際",
  cadence: "Cadence 益華電腦",
  益華電腦: "Cadence 益華電腦",
  supermicro: "Supermicro 美超微",
  美超微: "Supermicro 美超微",
  dcard: "Dcard 狄卡",
  三竹: "Mitake 三竹資訊",
  三竹資訊: "Mitake 三竹資訊",
  三竹資訊股份有限公司: "Mitake 三竹資訊",
  鴻海: "Hon Hai 鴻海精密工業",
  鴻海精密工業: "Hon Hai 鴻海精密工業",
  普鴻資訊: "Provision Information 普鴻資訊",
};

export function normalizeCompanyName(name: string) {
  const trimmed = name.trim();
  return companyAliases[trimmed.toLocaleLowerCase("en-US")] ?? companyAliases[trimmed] ?? trimmed;
}

const logos: Record<string, string> = {
  "Google 谷歌": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Google%202026%20logo.svg",
  "Synopsys 新思科技": "https://commons.wikimedia.org/wiki/Special:Redirect/file/Synopsys%20Logo.svg",
  "TSMC 台灣積體電路製造": "images/tsmc-wordmark.svg",
};

export const companyRankings: CompanyRanking[] = salaryData.rankings.map((company, index) => ({
  ...company,
  tone: (["blue", "lime", "violet"] as const)[index] ?? "plain",
  logo: logos[company.company],
}));
