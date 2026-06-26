import { notFound } from "next/navigation";
import type { ExtensionKindT } from "@/contract/types";
import type { ContentKindT } from "@/contract/content-schema";
import { CategoryView } from "@/components/category/CategoryView";
import { listByKind } from "@/lib/list";

type AnyKind = ExtensionKindT | ContentKindT;
const KINDS: AnyKind[] = ["skill", "plugin", "mcp", "prompt", "workflow"];
export function generateStaticParams() { return KINDS.map((kind) => ({ kind })); }

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!KINDS.includes(kind as AnyKind)) notFound();
  // Project to slim entries server-side so heavy detail-only fields stay out of the
  // client bundle (see lib/list).
  return <CategoryView kind={kind as AnyKind} entries={listByKind(kind as AnyKind)} />;
}
