import { notFound } from "next/navigation";
import { getAll, slugForEntry, bySlug } from "@/lib/catalog";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DetailView } from "@/components/detail/DetailView";

export function generateStaticParams() {
  return getAll().map((e) => ({ slug: slugForEntry(e).split("/") }));
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const entry = bySlug(slug.join("/"));
  if (!entry) notFound();
  return <><Header /><DetailView entry={entry} /><Footer /></>;
}
