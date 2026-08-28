import type { Metadata } from "next";
import "./globals.css";

const assetBase = process.env.GITHUB_PAGES === "true" ? "/software-salary" : "";
const siteUrl = "https://hikari-tsai.github.io/software-salary";
const socialImageUrl = `${siteUrl}/images/og-salary-thumbnail.png`;
const title = "台灣軟體工程師薪水分布｜薪資透視";
const description = "整理 635 筆有效樣本，比較台灣軟體工程師在不同年資、職務與公司類型下的薪資分布。";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  icons: { icon: `${assetBase}/favicon.svg`, shortcut: `${assetBase}/favicon.svg` },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: "軟工薪資透視",
    locale: "zh_TW",
    type: "website",
    images: [{ url: socialImageUrl, width: 1200, height: 630, alt: "台灣軟體工程師薪水分布" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImageUrl],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
