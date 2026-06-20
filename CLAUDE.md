# CLAUDE.md — Aleph Hub

## 这是什么 (What this is)

**Aleph Hub** 是 [Aleph](../Aleph) 的**中心化扩展目录服务**。它负责把散落在 GitHub
及其他来源的扩展（**skills / plugins / MCP servers**）统一**搜寻、整理、撰写简介与安装说明、
服务端分类**，产出一份**版本化静态目录产物**，供全网每一个 Aleph 实例消费。

> **核心价值**：让所有 Aleph 用户看到**同一份、逐字相同**的扩展浏览体验。整理工作集中在中心，
> 而不是每个用户的 Aleph 各自上 GitHub 搜寻、各自写简介（那会导致体验分裂）。

- **栈**: Next.js (App Router) + TypeScript
- **部署**: Vercel（auto-detect，无需额外配置）
- **角色**: Aleph 侧 `StaticHubProvider` 的**契约生产者 (contract producer)**

## 与 Aleph 的边界 (Boundary)

| 谁 | 做什么 |
|----|--------|
| **Aleph Hub（本项目）** | 搜寻 / 整理 / 撰写简介与 `install_spec` / 服务端分类 / 发布静态产物 / 人面浏览站 |
| **Aleph（消费端）** | 只**拉取 + 缓存 + 展示 + 安装**。不搜寻、不整理、不自造目录条目 |

设计来源（single source of truth）：
`../Aleph/docs/superpowers/specs/2026-06-20-extension-hub-federation-design.md`

## 契约：必须发布的静态产物 (The Contract — 不可破坏)

产物 = `manifest` + `entries[]`，HTTP/git 可拉取，mirror-safe、可 CDN/git 缓存。
**Aleph 侧按此 schema 解析，改动需双方同步。**

### Manifest

```jsonc
{
  "schema_version": 1,          // 整数；client 校验兼容性
  "hub_id": "aleph-hub",        // 全局唯一，作消费端 cache 的 source_id
  "name": "Aleph Hub",
  "generated_at": "2026-06-20T00:00:00Z",
  "entry_count": 1234,
  "content_hash": "sha256:…"    // 可选；client 用于"未变则跳过"。签名为 fast-follow
}
```

### Entry

```jsonc
{
  "id": "aleph-hub:io.github.acme/foo",   // "hub_id:identifier"
  "kind": "mcp",                          // skill | plugin | mcp
  "category": "developer",                // 服务端已分类（消费端直接信任）
  "name": "Acme Foo",
  "description": "…",
  "author": "acme",
  "icon": "https://…",                    // 可选
  "tags": ["git", "ci"],
  "version": "1.2.0",                     // 可选
  "repo_url": "https://github.com/acme/foo",
  "trust_tier": "verified",               // official | verified | community | unverified
  "requires_config": true,
  "config_schema": { /* JSON Schema */ }, // 可选
  "install_spec": { /* 见 ../Aleph/src/store/types.rs 的 InstallSpec */ }
}
```

**铁律**：
- 产物**绝不包含** `installed` / `enabled` 等 per-user 状态（那是 Aleph 本地的）。
- `schema_version` 变更 = 破坏性变更，必须与 Aleph 侧 `HubCatalogManifest` / `HubCatalogEntry` 同步。
- 传输支持 `ETag` / `content_hash`，让 client "未变则跳过"。

## 待实施 (Roadmap — 尚未开始)

1. **爬取/整理流水线**：从 GitHub（及 clawhub 等）抓取候选扩展 → 去重 → 撰写简介 →
   推断/校验 `install_spec` → 服务端分类 → 注入扫描 → 产出 `manifest + entries`。
2. **静态产物发布**：版本化、可缓存的产物（Vercel 静态托管 / git 仓库 / CDN）。
3. **公开浏览站**：同一份产物之上的人面前端（按 category 浏览、详情、安装说明）。
4. **fast-follow**：产物签名链、大目录分片/增量、第三方 hub 互通。

## 开发约定 (Conventions)

- 回复用中文，代码注释用英文（与 Aleph 主项目一致）。
- 提交规范：`<scope>: <description>`（英文 commit message）。
- 产物 schema 是**对外契约**，任何字段增删先确认是否需要同步 Aleph 侧解析器。
- 优先静态产物（mirror-safe、零后端运维），避免引入不必要的常驻后端服务。
