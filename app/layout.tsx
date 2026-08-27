import type { Metadata } from "next";
import "./globals.css";

const assetBase = process.env.GITHUB_PAGES === "true" ? "/software-salary" : "";

export const metadata: Metadata = {
  title: "台灣軟體工程師薪水分布｜薪資透視",
  description: "整理 635 筆有效樣本，比較台灣軟體工程師在不同年資、職務與公司類型下的薪資分布。",
  icons: { icon: `${assetBase}/favicon.svg`, shortcut: `${assetBase}/favicon.svg` },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
