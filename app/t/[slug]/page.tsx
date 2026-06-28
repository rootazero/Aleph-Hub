import { notFound } from "next/navigation";
import { allTagSlugs, tagBySlug } from "@/lib/tags";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { TagView } from "@/components/tag/TagView";

export function generateStaticParams() {
  return allTagSlugs().map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const tag = tagBySlug(slug);
  if (!tag) notFound();
  return (
    <>
      <Header />
      <TagView tag={tag} />
      <Footer />
    </>
  );
}
