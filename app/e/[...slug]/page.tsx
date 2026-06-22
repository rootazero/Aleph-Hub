import { notFound } from "next/navigation";
import { allSlugs, anyBySlug, isContent } from "@/lib/site";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { DetailView } from "@/components/detail/DetailView";
import { ContentDetailView } from "@/components/detail/ContentDetailView";

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  const entry = anyBySlug(slug.join("/"));
  if (!entry) notFound();
  return (
    <>
      <Header />
      {isContent(entry) ? <ContentDetailView entry={entry} /> : <DetailView entry={entry} />}
      <Footer />
    </>
  );
}
