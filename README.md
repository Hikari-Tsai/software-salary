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

- 原始資料：769 筆
- 薪資分析樣本：635 筆
- 工時統計樣本：590 筆
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
