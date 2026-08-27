import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "台灣軟體工程師薪水分布｜薪資透視",
  description: "635 筆有效樣本，拆解台灣軟體職缺的薪資分布、職涯洞察與求職策略。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-Hant"><body>{children}</body></html>;
}
