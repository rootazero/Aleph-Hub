// Official external MCP presets: vendor MCP servers that Aleph ships as one-click
// presets (mirrors Aleph src/mcp/presets/catalog.json). Unlike first-party Aleph
// extensions, these carry an EXPLICIT install_spec (mcp_stdio / mcp_remote) and bypass
// source discovery, so they ride the same "official, pre-built FinalEntry" track as
// loadFirstParty — merged into the run's finals (trust_tier=official) before buildArtifacts.
import { InstallSpec } from "@/contract/schema";
import { coverColorFor } from "@/scripts/pipeline/enrich";
import { requiresConfig } from "@/scripts/pipeline/install_spec";
import type { FinalEntry } from "@/scripts/pipeline/model";
import type { FileStore } from "@/scripts/pipeline/ports";
import type { ExtensionKindT, ExtensionCategoryT, InstallSpecT } from "@/contract/types";

const SEED_PATH = "data/seeds/mcp-presets.json";

interface PresetSeed {
  id: string;
  full_name: string;        // synthetic identity; owner/repo derived for internal use
  kind: ExtensionKindT;     // "mcp"
  name: string;
  author: string;
  category: ExtensionCategoryT;
  tags: string[];
  install_spec: InstallSpecT;
  repo_url: string;         // real upstream (铁律) — GitHub or the official package page
  description_en: string; description_zh: string;
  long_en: string; long_zh: string;
  sec_note_en: string; sec_note_zh: string;
  stars: number;
  license: string | null;
  updated: string;          // YYYY-MM-DD (baked, deterministic — no network)
}

interface PresetFile { entries: PresetSeed[]; }

export function loadMcpPresets(fs: FileStore): FinalEntry[] {
  const seed = fs.readJson<PresetFile>(SEED_PATH);
  if (!seed) return [];
  return seed.entries.map(toFinal);
}

// A faithful copy-paste hint: the stdio command line, or the remote endpoint URL.
function installCmdFor(spec: InstallSpecT): string {
  if (spec.type === "mcp_stdio") return [spec.command, ...spec.args].join(" ");
  if (spec.type === "mcp_remote") return spec.url;
  return "";
}

function toFinal(e: PresetSeed): FinalEntry {
  const install_spec = InstallSpec.parse(e.install_spec);   // fail loud on a malformed spec
  const [owner = "", repo = ""] = e.full_name.split("/");
  return {
    id: e.id,
    repo_url: e.repo_url,
    via: "aleph-mcp-preset",
    full_name: e.full_name, owner, repo,
    kind: e.kind,
    name: e.name,
    author: e.author,
    category: e.category,
    tags: e.tags,
    install_spec,
    description_en: e.description_en, description_zh: e.description_zh,
    long_en: e.long_en, long_zh: e.long_zh,
    sec_note_en: e.sec_note_en, sec_note_zh: e.sec_note_zh,
    requires_config: requiresConfig(install_spec),
    // EnrichData — baked repo-level metrics (deterministic, no network).
    stars: e.stars,
    license: e.license ?? undefined,
    updated: e.updated,
    trend: null,
    spark: [],
    cover_color: coverColorFor(e.full_name),
    install_cmd: installCmdFor(install_spec),
    // trust
    trust_tier: "official",
  };
}
