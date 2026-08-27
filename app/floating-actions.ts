const githubRepoUrl = "https://github.com/Hikari-Tsai/software-salary";

export const navStarAction = {
  label: "賞個 Star",
  shortLabel: "Star",
  href: githubRepoUrl,
} as const;

export const floatingActions = [
  {
    label: "賞個 Star",
    icon: "★",
    href: githubRepoUrl,
    kind: "star",
  },
  {
    label: "提供資料",
    icon: "✎",
    href: "https://docs.google.com/forms/d/e/1FAIpQLSex_qWWtuEYO0rmxFs7bsJof4KAzlQ4qveLH4IGxhff7FXcDg/viewform?usp=publish-editor",
    kind: "contribute",
  },
] as const;
