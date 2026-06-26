import { AllView } from "@/components/all/AllView";
import { listAll } from "@/lib/list";

// The "browse all" destination (Hero CTA): both catalogs, searchable. Read + projected
// to slim entries here on the server so the heavy fields (body/long_*/install_spec)
// never reach the client bundle.
export default function Page() {
  return <AllView entries={listAll()} />;
}
