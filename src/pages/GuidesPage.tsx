import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { BikeImage } from '../components/BikeImage.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';

export function GuidesPage() {
  const { guides, loading } = useCatalog();

  return (
    <>
      <SEO
        title="Pakistan Motorcycle Buying Guides & Market Insights | CHAND MOTORS"
        description="Factual motorcycle buying guides for Pakistan: 125cc vs 150cc comparisons, electric scooter running costs, and superbike import inspection checklists."
        path="/guides"
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="pb-8 border-b border-zinc-800">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
            Editorial &amp; Buyer Research
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Motorcycle Guides &amp; News
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
            Structured comparisons, maintenance fundamentals, and transparent ownership guidance tailored for riders across Pakistan.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="h-96 rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            {guides.map((guide) => (
              <article
                key={guide.id}
                className="bg-[#141417] border border-zinc-800 rounded-lg overflow-hidden flex flex-col"
              >
                <Link to={`/guides/${guide.slug}`} className="aspect-[16/10] bg-black overflow-hidden">
                  <BikeImage
                    src={guide.imageUrl}
                    alt={guide.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    fallbackLabel={guide.category}
                  />
                </Link>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                    <span className="text-[#D91E2A] font-semibold">{guide.category}</span>
                    <span aria-hidden="true">·</span>
                    <span className="tabular-nums">{guide.publishedAt}</span>
                    <span aria-hidden="true">·</span>
                    <span>{guide.readTime}</span>
                  </div>
                  <h2 className="font-display text-2xl font-bold text-white leading-snug mb-3">
                    <Link to={`/guides/${guide.slug}`} className="hover:text-[#D91E2A] transition-colors">
                      {guide.title}
                    </Link>
                  </h2>
                  <p className="text-sm text-zinc-400 leading-relaxed mb-5">{guide.excerpt}</p>
                  <Link
                    to={`/guides/${guide.slug}`}
                    className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-[#D91E2A]"
                  >
                    <span>Read Guide</span>
                    <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
