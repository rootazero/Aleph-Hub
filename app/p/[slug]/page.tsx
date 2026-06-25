import { notFound } from "next/navigation";
import { allPublisherSlugs, publisherBySlug } from "@/lib/publishers";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PublisherView } from "@/components/publisher/PublisherView";

export function generateStaticParams() {
  return allPublisherSlugs().map((slug) => ({ slug }));
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const publisher = publisherBySlug(slug);
  if (!publisher) notFound();
  return (
    <>
      <Header />
      <PublisherView publisher={publisher} />
      <Footer />
    </>
  );
}
