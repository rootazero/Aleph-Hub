import type { HubCatalogEntryT, ExtensionKindT } from "@/contract/types";

const k: ExtensionKindT = "mcp";
// @ts-expect-error 'workflow' is not a kind
const bad: ExtensionKindT = "workflow";
const e: HubCatalogEntryT = {
  id: "aleph-hub:a/b", kind: k, category: "developer", name: "n", description: "d",
  repo_url: "https://github.com/a/b", trust_tier: "verified",
  install_spec: { type: "git_dir", git_url: "https://github.com/a/b" },
  requires_config: false, tags: [],
};
void e; void bad;
