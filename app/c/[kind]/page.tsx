import { notFound } from "next/navigation";
import type { ExtensionKindT } from "@/contract/types";
import { CategoryView } from "@/components/category/CategoryView";

const KINDS: ExtensionKindT[] = ["skill", "plugin", "mcp"];
export function generateStaticParams() { return KINDS.map((kind) => ({ kind })); }

export default async function Page({ params }: { params: Promise<{ kind: string }> }) {
  const { kind } = await params;
  if (!KINDS.includes(kind as ExtensionKindT)) notFound();
  return <CategoryView kind={kind as ExtensionKindT} />;
}
