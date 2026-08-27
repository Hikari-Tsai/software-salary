import type { Metadata } from "next";
import { SkeletonPreview } from "./_sites-preview/SkeletonPreview";

export const metadata: Metadata = {
  title: "Your site is taking shape",
  description:
    "Your first version will appear here automatically when it’s ready.",
  other: {
    "codex-preview": "development",
  },
};

export default function Home() {
  return <SkeletonPreview />;
}
