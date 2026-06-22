import { readFileSync } from "node:fs";
import { validateContentArtifact } from "@/contract/content-schema";
import { validateContentSiteCatalog } from "@/contract/content-site";

const catalog = validateContentArtifact(JSON.parse(readFileSync("public/catalog-content.json", "utf8")));
validateContentSiteCatalog(JSON.parse(readFileSync("data/site-content.json", "utf8")));
console.log(`content OK: ${catalog.entries.length} entries, schema v${catalog.manifest.content_schema_version}`);
