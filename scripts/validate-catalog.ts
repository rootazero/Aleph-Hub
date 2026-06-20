// CI gate: the committed public/catalog.json must satisfy the contract schema.
import { readFileSync } from "node:fs";
import { HubCatalogArtifact } from "@/contract/schema";

const raw = JSON.parse(readFileSync("public/catalog.json", "utf8"));
const result = HubCatalogArtifact.safeParse(raw);
if (!result.success) {
  console.error("catalog.json failed contract validation:");
  console.error(JSON.stringify(result.error.issues, null, 2));
  process.exit(1);
}
console.log(
  `catalog.json OK — ${result.data.entries.length} entries, schema_version ${result.data.manifest.schema_version}`
);
