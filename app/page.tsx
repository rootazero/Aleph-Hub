import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/home/Hero";
import { EditorsPick } from "@/components/home/EditorsPick";
import { StatsBar } from "@/components/home/StatsBar";
import { CategoryIndex } from "@/components/home/CategoryIndex";
import { ContentIndex } from "@/components/home/ContentIndex";
import { Trending } from "@/components/home/Trending";
import { Collection } from "@/components/home/Collection";
import { homeModel } from "@/lib/home";

// Server Component: build every section's slim view model once (lib/home reads the
// full catalog server-side) and pass it down, so no homepage client component imports
// the heavy catalog JSON.
export default function Home() {
  const m = homeModel();
  return (
    <>
      <Header />
      <main>
        <section className="hero-grid" style={{ maxWidth: 1480, margin: "0 auto", padding: "52px 48px 40px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 56, alignItems: "center" }}>
          <Hero total={m.total} />
          <EditorsPick pick={m.editorsPick} />
        </section>
        <StatsBar total={m.total} />
        <CategoryIndex regions={m.installRegions} />
        <ContentIndex regions={m.contentRegions} />
        <Trending entries={m.trending} />
        <Collection picks={m.collection} />
      </main>
      <Footer />
    </>
  );
}
