import type { ExtensionCategoryT } from "@/contract/types";

export type Lang = "zh" | "en";

export interface Strings {
  submit: string; kicker: string; heroA: string; heroEm: string; heroB: string; heroSub: string;
  ctaExplore: string; ctaAll: string; editorPick: string; searchPh: string;
  stProjects: string; stCats: string; stDailyN: string; stSync: string;
  indexTitle: string; browseByCat: string; trendingTitle: string; collectionTitle: string;
  latestLabel: string; alsoNew: string; latestPrefix: string; comingSoon: string;
  viewAll: string; catalogKicker: string; results: string; sortBy: string; sortTrend: string;
  noResults: string; allCats: string; back: string; tabOverview: string; tabSecurity: string;
  secScan: string; secReview: string; secReviewNote: string;
  mBy: string; mCategory: string; mStars: string; mLicense: string; mUpdated: string;
  viewGithub: string; related: string; copy: string; copied: string;
  submitKicker: string; submitTitle: string; submitSub: string;
  fRepo: string; fName: string; fCategory: string; fDesc: string; fDescPh: string; fTags: string;
  submitNote: string; submitBtn: string; cancel: string; footer: string; footerTag: string;
}

// Ported verbatim from the mockup (Aleph Hub.dc.html lines 334-335).
export const STRINGS: Record<Lang, Strings> = {
  zh: {
    submit: "提交", kicker: "The Agent Capability Atlas", heroA: "为你的 Agent", heroEm: "精挑细选", heroB: "每一件能力",
    heroSub: "像逛精品店一样发现 Agent Skills、MCP 插件与集成。每一件都经过安全审核与编辑甄选，开源、可安装、持续更新。",
    ctaExplore: "开始探索", ctaAll: "浏览全部 622 件", editorPick: "编辑推荐", searchPh: "搜索 skill、MCP、集成…",
    stProjects: "收录项目", stCats: "大分类", stDailyN: "每日", stSync: "同步星标",
    indexTitle: "目录 · Index", browseByCat: "按类别浏览 →", trendingTitle: "本周趋势 · Trending", collectionTitle: "精选合辑 · Collection",
    latestLabel: "最新收录", alsoNew: "近期更新", latestPrefix: "最新", comingSoon: "即将上线",
    viewAll: "查看全部", catalogKicker: "目录 · Catalog", results: "个结果", sortBy: "排序", sortTrend: "🔥 趋势",
    noResults: "没有找到匹配的项目，换个关键词试试。", allCats: "全部项目", back: "← 返回", tabOverview: "概览", tabSecurity: "安全",
    secScan: "已通过安全扫描", secReview: "人工复核中", secReviewNote: "每个项目纳入前都会经过审核者人工复核；社区项目请在安装前阅读源码。",
    mBy: "作者", mCategory: "分类", mStars: "Stars", mLicense: "许可", mUpdated: "更新于",
    viewGithub: "在 GitHub 查看", related: "相关推荐", copy: "复制安装命令", copied: "已复制 ✓",
    submitKicker: "Contribute", submitTitle: "提交你的作品", submitSub: "把你的 Skill、MCP 插件或集成提交到 Aleph Hub。我们会做安全扫描与人工复核，通过后即收录进目录。",
    fRepo: "GitHub 仓库地址", fName: "名称", fCategory: "分类", fDesc: "一句话描述", fDescPh: "用一句话说清它解决什么问题…", fTags: "标签（逗号分隔）",
    submitNote: "提交后通常 1–3 个工作日完成审核，我们会通过仓库 issue 与你联系。", submitBtn: "提交审核", cancel: "取消",
    footer: "为 Agent 生态绘制的能力地图", footerTag: "开源 · 社区驱动",
  },
  en: {
    submit: "Submit", kicker: "The Agent Capability Atlas", heroA: "Hand-pick every", heroEm: "capability ", heroB: "for your agent",
    heroSub: "Discover Agent Skills, MCP plugins and integrations like browsing a boutique. Every piece is security-reviewed and editor-curated — open source, installable, always fresh.",
    ctaExplore: "Start exploring", ctaAll: "Browse all 622", editorPick: "Editor's Pick", searchPh: "Search skills, MCP, integrations…",
    stProjects: "Projects", stCats: "Categories", stDailyN: "Daily", stSync: "Star sync",
    indexTitle: "Index", browseByCat: "Browse by category →", trendingTitle: "Trending this week", collectionTitle: "Editor's Collection",
    latestLabel: "Latest", alsoNew: "Also new", latestPrefix: "Latest", comingSoon: "Coming soon",
    viewAll: "View all", catalogKicker: "Catalog", results: "results", sortBy: "Sort", sortTrend: "🔥 Trending",
    noResults: "No matching projects — try another keyword.", allCats: "All projects", back: "← Back", tabOverview: "Overview", tabSecurity: "Security",
    secScan: "Passed security scan", secReview: "Human review", secReviewNote: "Every project is human-reviewed before inclusion; read the source of community projects before installing.",
    mBy: "By", mCategory: "Category", mStars: "Stars", mLicense: "License", mUpdated: "Updated",
    viewGithub: "View on GitHub", related: "Related", copy: "Copy install command", copied: "Copied ✓",
    submitKicker: "Contribute", submitTitle: "Submit your project", submitSub: "Submit your Skill, MCP plugin or integration to Aleph Hub. We run a security scan and human review; once approved it joins the catalog.",
    fRepo: "GitHub repo URL", fName: "Name", fCategory: "Category", fDesc: "One-line description", fDescPh: "In one sentence, what problem does it solve…", fTags: "Tags (comma-separated)",
    submitNote: "Review usually takes 1–3 business days; we reach out via a repo issue.", submitBtn: "Submit for review", cancel: "Cancel",
    footer: "An atlas of capabilities for the agent ecosystem", footerTag: "Open source · Community-driven",
  },
};

// Human labels for the 13 contract categories (mockup has no catName for these).
export const CATEGORY_LABELS: Record<ExtensionCategoryT, { zh: string; en: string }> = {
  search: { zh: "搜索", en: "Search" },
  developer: { zh: "开发者", en: "Developer" },
  data: { zh: "数据", en: "Data" },
  productivity: { zh: "效率", en: "Productivity" },
  writing: { zh: "写作", en: "Writing" },
  communication: { zh: "沟通", en: "Communication" },
  knowledge: { zh: "知识", en: "Knowledge" },
  files: { zh: "文件", en: "Files" },
  design: { zh: "设计", en: "Design" },
  automation: { zh: "自动化", en: "Automation" },
  finance: { zh: "金融", en: "Finance" },
  utilities: { zh: "工具", en: "Utilities" },
  other: { zh: "其他", en: "Other" },
};
