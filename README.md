# 台灣軟體工程師薪水分布

以匿名薪資調查資料製作的互動式資料網站，協助台灣軟體工程師了解自己的薪資落點，並從年資、職務與公司類型等角度觀察市場差異。

網站不只呈現薪資數字，也整理了職涯洞察、推薦公司、談薪定位工具與面試問題，讓資料能實際應用在求職決策上。

## 線上網站

- [GitHub 前端網站](https://hikari-tsai.github.io/software-salary/)

## 主要功能

- 顯示總年薪、月底薪與工時的市場百分位
- 依年資、職務及公司類型比較薪資中位數與 P75
- 依工作年資快速定位合理薪資與進取目標
- 綜合薪資、爽度、Loading、工時及樣本數整理公司候選名單
- 提供不同年資階段的職涯策略與面試檢核問題
- 使用 Anime.js，在數字與圖表進入畫面時播放累加及展開動畫
- 支援桌面與手機版面，並尊重「減少動態效果」設定

## 資料來源

資料來自 [DCard 科技業版－軟體工程師調查表](https://docs.google.com/spreadsheets/d/1GMYKVBxRlMv6oNVNzpXYoLUSyT8ZnLEjGcRbn0b4KsA/edit?gid=788239997#gid=788239997)。

- 原始資料：769 筆
- 薪資分析樣本：635 筆
- 工時統計樣本：590 筆
- 金額單位：新台幣萬元

資料由使用者匿名自填，可能存在樣本偏差、欄位理解差異與時間差。網站適合用來觀察市場訊號與相對趨勢，不應把單一數字視為特定職缺的精準定價。

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

## 自動部署

推送到 `main` 後，[GitHub Actions](./.github/workflows/deploy-pages.yml) 會自動：

1. 安裝相依套件。
2. 建置網站。
3. 產生適用於專案子路徑的靜態頁面。
4. 發布至 GitHub Pages。

部署不需要 Cloudflare API Token，使用 GitHub Pages 內建權限完成。

## 專案定位

本專案是一個以公開資料為基礎的探索型作品，不代表 DCard、資料填寫者或任何被提及公司背書。公司與薪資排名應搭配職務、職級、部門、年份及樣本數一起判讀。

## 授權

本專案採用 [MIT License](./LICENSE) 授權。Copyright © 2026 Hikari Tsai.
