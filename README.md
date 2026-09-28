# 台灣軟體工程師薪水分布

這是一個整理台灣軟體工程師匿名薪資回報的互動網站。你可以依年資、職務和公司類型比較薪資，先確認自己的大致位置。

網站也提供公司排行、年資薪資估算和面試問題，方便求職或談薪時查閱。

## 線上網站

- [GitHub 前端網站](https://hikari-tsai.github.io/software-salary/)

## 主要功能

- 顯示總年薪、月底薪與工時的市場百分位
- 依年資、職務及公司類型比較薪資中位數與 P75
- 依工作年資估算薪資中位數與 P75
- 綜合薪資、爽度、工作強度和樣本數排列公司名單，另提供工時參考
- 整理不同年資階段的求職重點與面試問題
- 使用 Anime.js，在數字與圖表進入畫面時播放動畫
- 支援桌面與手機版面，也會遵循系統的「減少動態效果」設定

## 資料來源

資料來自：

- [DCard 科技業版－軟體工程師調查表](https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997)
- [自行調查匿名表單](https://docs.google.com/spreadsheets/d/134kDFDnJIBFJLr1HEHktWnlZ015ATELy8YwahHE3ZDo/edit?usp=sharing)

- 原始資料：877 筆
- 薪資分析樣本：753 筆
- 工時統計樣本：698 筆
- 資料更新：2026 年 9 月 27 日 18:35（最新填答時間）
- 符合 n ≥ 3 的具名公司：39 間
- 年薪中位數：100 萬；平均：124.8 萬；P90：210 萬
- 金額單位：新台幣萬元

資料由使用者匿名填寫，可能受到樣本組成、欄位理解和填寫時間影響。這些數字適合用來比較相對差異和大致區間，不能直接代表某個職缺的合理薪資。

## 技術組成

- React 19
- TypeScript
- vinext / Vite
- Tailwind CSS
- Anime.js
- GitHub Actions 與 GitHub Pages

## 主要檔案結構

```text
software-salary/
├── app/
│   ├── page.tsx                 # 首頁內容、圖表與互動介面
│   ├── layout.tsx               # 全站版型、SEO 與社群分享設定
│   ├── globals.css              # 全站樣式與響應式版面
│   ├── company-rankings.ts      # 排行展示與 Logo 設定
│   ├── salary-data.json         # ETL 產生的前端統計，無個別填答內容
│   ├── salary-interpolation.ts  # 年資薪資的線性內插計算
│   └── floating-actions.ts      # Star 與提供資料按鈕設定
├── public/                      # 圖片、Logo 與 favicon 等靜態資源
├── data/                        # 原始資料、清理結果與分析摘要
├── etl/
│   ├── csv_to_readable_json.py # 將表單 CSV 轉成網站分析用 JSON
│   ├── merge_json.py           # 依序合併多個 JSON 並加上時間戳記
│   ├── build_salary_dataset.py # CSV 轉換、公司別名統一、合併去重
│   └── analyze_salary.py       # 分析合併資料，輸出前端統計與排除清單
├── scripts/
│   ├── cleanup.mjs             # 本地快取與舊檔清理工具
│   └── update-og-sample.mjs    # 更新社群縮圖的有效樣本數
├── tests/                       # 頁面輸出、排行與計算邏輯測試
├── .github/workflows/
│   └── deploy-pages.yml        # GitHub Pages 自動部署流程
├── next.config.ts              # 網站路徑與 GitHub Pages 建置設定
├── vite.config.ts              # vinext／Vite 設定
├── package.json                # 套件、開發指令與測試指令
└── README.md                   # 專案說明
```

一般文字與頁面區塊主要在 `app/page.tsx` 修改；視覺樣式集中在 `app/globals.css`。網站標題、說明與 `og:image` 等分享資訊則放在 `app/layout.tsx`。

## 更新網站資料

以下指令均在專案根目錄執行，Python 僅使用標準函式庫。

### 1. CSV 轉換、統一別名並合併

下載最新表單 CSV，覆蓋 `data/軟體工程師薪資調查(匿名) (回覆) - 表單回覆 1.csv`，執行：

```bash
python3 etl/build_salary_dataset.py
```

預設讀取上述 CSV 與 `data/sheet_data_readable_dcard.json`，保留既有 JSON key，輸出 `data/salary_data_merged_YYYYMMDD_HHMMSS.json`。自訂路徑可使用 `--csv`、`--dcard`、`--output-dir`。

公司別名維護在 `etl/build_salary_dataset.py` 的 `COMPANY_ALIAS_GROUPS`，已知別名統一為「英文 中文」。未知名稱保留原文，不猜測翻譯或把匿名類別當成同一家公司。先合併別名，再比對除了 `sheet_row` 之外的所有欄位；完全一致才去重，因此不能辨識改過時間或內容的重複填答。

CSV 薪資欄位沿用 `csv_to_readable_json.py` 的單位修正：辨識「萬」、逗號與幣別，數值 ≥ 10,000 時除以 10,000；月底薪修正後 > 30 時除以 12，年薪介於 0 和 30 之間時乘以 10。這些是推測規則，可能誤判高月薪、低年薪或非整年收入，請檢查輸出；DCard JSON 不會再次套用 CSV 修正。

### 2. 產生網頁統計

將路徑換成上一步輸出的檔案；本次更新使用：

```bash
python3 etl/analyze_salary.py data/salary_data_merged_20260928_125422.json
```

程式會覆寫：

- `app/salary-data.json`：首頁摘要、年資／職務／公司類型圖表、洞察與完整公司排行。
- `data/salary_analysis_audit.json`：排除原因、來源陣列索引（從 0 起算）、原始列號與重複項目。

兩檔都記錄來源檔名及 SHA-256，方便追溯。頁面與 SEO 說明直接讀取統計檔，不需再手動更改數字。資料更新時間取所有可辨識填答時間的最大值，不是檔名中的合併時間。原始填答與個人備註不會打包到前端。

### 3. 分析口徑與限制

自 2026/9/28 起改為可重現的程式統計，舊版人工整理的 709 筆無法重現，因此本次 753 筆與舊版的差異不全是新增樣本，不能當作薪資漲跌。

- 薪資分析需同時有數值月底薪 2–30 萬、總年薪 30–600 萬，含上下界。排除公司或職務完整欄位為 `test`、`測試`、`假的`、`只想看結果`、`123` 的填答，以及職務為 `廚師` 的紀錄。不會因為職稱包含 Test 就排除測試工程師。
- 超出範圍只代表不納入本報告，不代表不實。這次共排除 124 筆；沒有重複紀錄。
- 工時只取薪資樣本中每日 4–16 小時的有效數值；爽度與工作強度只取 1–5 分。各指標的有效樣本數可能不同。
- 年資僅接受 0–60 的數值，區間含下界、不含上界；本次 51 筆無法分組。職務與公司類型由 `ROLE_RULES`、`COMPANY_RULES` 按順序匹配關鍵字，每筆僅分一類，其餘列為未分類。分類是方便比較的粗分，不是經核實的產業名錄。
- 百分位使用排序後位置 `(n - 1) × p` 線性內插，顯示值四捨五入至一位小數。
- 公司排行只列具名且薪資樣本 n ≥ 3 的公司。綜合分數為 `60 × 年薪中位數 / 入榜最高中位數 + 20 × (爽度 - 1) / 4 + 15 × (5 - 工作強度) / 4 + 5 × min(n, 10) / 10`。缺漏評分不加分；工時不計分。同分依薪資、樣本數、名稱排序。這是本站的比較權重，不是客觀公司品質評鑑。

### 4. 更新縮圖並驗證

安裝 Node 相依套件後，更新分享縮圖的樣本數（使用隨相依套件安裝的 Sharp）：

```bash
node scripts/update-og-sample.mjs
python3 -m unittest discover -s tests -p 'test_*.py'
node --test tests/company-rankings.test.mjs tests/salary-interpolation.test.mjs tests/floating-actions.test.mjs
npm test
npm run lint
```

檢查排除清單、分類及公司排名，並同步 README 的資料摘要。確認後再提交並推送；推送到 `main` 會觸發 GitHub Pages 自動部署。需要提交新來源 JSON、前端統計、稽核檔及縮圖，才能重現這次更新。

## 本地開發

需要 Node.js 22 或更新版本。

```bash
npm install
npm run dev
```

啟動後開啟 [http://localhost:3000](http://localhost:3000)。

正式建置檢查：

```bash
npm run build
```

## 清理本地檔案

請在專案根目錄執行清理指令。預設只會列出準備清除的項目，不會刪除檔案：

```bash
npm run cleanup
```

確認清單後，再執行實際清理：

```bash
npm run cleanup:apply
```

這會清除建置快取、輸出目錄和專案內已停用的重複檔案，並保留 `node_modules`。若需要連相依套件一起刪除，可執行：

```bash
node scripts/cleanup.mjs --apply --include-dependencies
npm ci
```

刪除 `node_modules` 後，必須先執行 `npm ci` 重新安裝套件，才能再次啟動或建置網站。

## 自動部署

推送到 `main` 後，[GitHub Actions](./.github/workflows/deploy-pages.yml) 會依序：

1. 安裝相依套件。
2. 建置網站。
3. 產生適用於專案子路徑的靜態頁面。
4. 發布至 GitHub Pages。

部署使用 GitHub Pages 內建權限，不需要 Cloudflare API Token。

## 專案定位

這是個人整理的公開資料專案，不代表 DCard、填寫者或資料中提到的公司。閱讀公司與薪資排行時，請一併考量職務、職級、部門、年份和樣本數。

## 授權

本專案採用 [MIT License](./LICENSE) 授權。Copyright © 2026 Hikari Tsai.
