import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/home/Hero";
import { EditorsPick } from "@/components/home/EditorsPick";
import { StatsBar } from "@/components/home/StatsBar";
import { CategoryIndex } from "@/components/home/CategoryIndex";
import { Trending } from "@/components/home/Trending";
import { Collection } from "@/components/home/Collection";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <section style={{ maxWidth: 1480, margin: "0 auto", padding: "52px 48px 40px", display: "grid", gridTemplateColumns: "1.05fr .95fr", gap: 56, alignItems: "center" }}>
          <Hero />
          <EditorsPick />
        </section>
        <StatsBar />
        <CategoryIndex />
        <Trending />
        <Collection />
      </main>
      <Footer />
    </>
  );
}
