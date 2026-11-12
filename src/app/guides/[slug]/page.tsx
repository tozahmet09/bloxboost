import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES, getGuide } from "@/lib/guides";

export function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const g = getGuide((await params).slug);
  if (!g) return {};
  return {
    title: g.title,
    description: g.description,
    alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title: g.title, description: g.description, type: "article" },
  };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const g = getGuide((await params).slug);
  if (!g) notFound();
  const others = GUIDES.filter((o) => o.slug !== g.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    dateModified: g.updated,
    publisher: { "@type": "Organization", name: "Spawnswap" },
  };
  return (
    <article className="mx-auto max-w-2xl">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <p className="eyebrow"><Link href="/guides" className="hover:text-cream">Guides</Link></p>
      <h1 className="mt-2 text-[30px] font-bold leading-[1.1] sm:text-[38px]">{g.title}</h1>
      <p className="mt-2 text-xs text-mute">Updated {g.updated}</p>
      <p className="mt-6 leading-relaxed text-cream/90">{g.intro}</p>
      <div className="mt-10 space-y-9">
        {g.sections.map((s) => (
          <section key={s.h}>
            <h2 className="text-xl font-bold">{s.h}</h2>
            {s.p?.map((p, i) => (
              <p key={i} className="mt-3 leading-relaxed text-mute">{p}</p>
            ))}
            {s.list && (
              <ul className="mt-3 list-disc space-y-1.5 pl-5 leading-relaxed text-mute marker:text-lime">
                {s.list.map((li) => <li key={li}>{li}</li>)}
              </ul>
            )}
          </section>
        ))}
      </div>
      <section className="mt-12 border-l-2 border-lime pl-5">
        <h2 className="text-xl font-bold">Try a play swap</h2>
        <p className="mt-2 text-sm leading-relaxed text-mute">Play other developers&apos; games, earn credits, get real players on yours. Free to start.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/signup" className="btn">Get players</Link>
          <Link href="/how-it-works" className="btn-quiet">How it works</Link>
        </div>
      </section>
      {others.length > 0 && (
        <nav className="mt-12">
          <h2 className="text-sm font-semibold text-mute">More guides</h2>
          <ul className="mt-2 space-y-1.5">
            {others.map((o) => (
              <li key={o.slug}><Link href={`/guides/${o.slug}`} className="link">{o.title}</Link></li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}
