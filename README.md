# 台灣軟體工程師薪水分布

這是一個整理台灣軟體工程師匿名薪資回報的互動網站。你可以依年資、職務和公司類型比較薪資，先確認自己的大致位置。

網站也提供公司排行、年資薪資估算和面試問題，方便求職或談薪時查閱。

## 線上網站

- [GitHub 前端網站](https://hikari-tsai.github.io/software-salary/)

## 主要功能

- 顯示總年薪、月底薪與工時的市場百分位
- 依年資、職務及公司類型比較薪資中位數與 P75
- 依工作年資估算薪資中位數與 P75
- 綜合薪資、爽度、工作強度、工時和樣本數排列公司名單
- 整理不同年資階段的求職重點與面試問題
- 使用 Anime.js，在數字與圖表進入畫面時播放動畫
- 支援桌面與手機版面，也會遵循系統的「減少動態效果」設定

## 資料來源

資料來自 [DCard 科技業版－軟體工程師調查表](https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997)。

- 原始資料：786 筆
- 薪資分析樣本：652 筆
- 資料更新：2026 年 8 月 28 日 13:11
- 金額單位：新台幣萬元

資料由使用者匿名填寫，可能受到樣本組成、欄位理解和填寫時間影響。這些數字適合用來比較相對差異和大致區間，不能直接代表某個職缺的合理薪資。

## 技術組成

- React 19
- TypeScript
- vinext / Vite
- Tailwind CSS
- Anime.js
- GitHub Actions 與 GitHub Pages
- Cloudflare Workers 相容建置

## 主要檔案結構

```text
software-salary/
├── app/
│   ├── page.tsx                 # 首頁內容、圖表與互動介面
│   ├── layout.tsx               # 全站版型、SEO 與社群分享設定
│   ├── globals.css              # 全站樣式與響應式版面
│   ├── company-rankings.ts      # 公司名稱統一與排行資料
│   ├── salary-interpolation.ts  # 年資薪資的線性內插計算
│   └── floating-actions.ts      # Star 與提供資料按鈕設定
├── public/                      # 圖片、Logo 與 favicon 等靜態資源
├── data/                        # 原始資料、清理結果與分析摘要
├── etl/
│   └── csv_to_readable_json.py # 將表單 CSV 轉成網站分析用 JSON
├── scripts/
│   └── cleanup.mjs             # 本地快取與舊檔清理工具
├── tests/                       # 頁面輸出、排行與計算邏輯測試
├── .github/workflows/
│   └── deploy-pages.yml        # GitHub Pages 自動部署流程
├── next.config.ts              # 網站路徑與 GitHub Pages 建置設定
├── vite.config.ts              # vinext／Vite 設定
├── package.json                # 套件、開發指令與測試指令
└── README.md                   # 專案說明
```

一般文字與頁面區塊主要在 `app/page.tsx` 修改；視覺樣式集中在 `app/globals.css`。網站標題、說明與 `og:image` 等分享資訊則放在 `app/layout.tsx`。

## ETL：將表單 CSV 轉成 JSON

`etl/csv_to_readable_json.py` 會讀取 Google 表單匯出的 CSV，保留既有 JSON key，並將可辨識的數字轉成數值格式。薪資欄位統一使用「萬元」：例如 `54,000` 會轉成 `5.4`，`1,050,000` 會轉成 `105`；填成 `66萬` 或明顯多出一萬倍的數字也會自動修正。

在專案根目錄執行：

```bash
python3 etl/csv_to_readable_json.py \
  "data/軟體工程師薪資調查(匿名) (回覆) - 表單回覆 1.csv" \
  --output data/sheet_data_readable_keys_from_csv.json
```

程式會自動在輸出檔名後加上執行時間，例如：

```text
data/sheet_data_readable_keys_from_csv_20260828_131146.json
```

執行 ETL 測試：

```bash
python3 -m unittest tests/test_csv_to_readable_json.py
```

## 更新網站資料

1. 從 Google 表單下載最新 CSV，放進 `data/`。
2. 執行上述 ETL，產生帶有時間戳記的新 JSON。
3. 將新 JSON 與 `data/sheet_data_readable_dcard.json` 比對，先排除重複填答、測試資料、無效值和無法合理判讀的極端值。
4. 合併公司別名。同一家公司常見的中英文名稱與縮寫統一放在 `app/company-rankings.ts` 的 `companyAliases`。
5. 重新計算有效樣本數、薪資平均、中位數、百分位與公司排行，再更新 `app/page.tsx` 和 `app/company-rankings.ts`。若樣本數改變，也同步更新 `app/layout.tsx` 的網站說明及本 README。
6. 在公司排行下方更新資料日期與時間。
7. 執行完整驗證：

```bash
python3 -m unittest tests/test_csv_to_readable_json.py
npm test
npm run lint
```

所有檢查通過後再提交並推送；推送到 `main` 會觸發 GitHub Pages 自動部署。

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
