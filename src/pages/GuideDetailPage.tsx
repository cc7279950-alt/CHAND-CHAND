import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronRight, MessageCircle } from 'lucide-react';
import type { GuideArticle } from '../types/motorcycle.ts';
import { SEO } from '../components/SEO.tsx';
import { BikeImage } from '../components/BikeImage.tsx';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_DISPLAY } from '../lib/format.ts';

export function GuideDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [guide, setGuide] = useState<GuideArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadGuide() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/guides/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Guide not found.');
        if (!cancelled) setGuide(data.guide);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Unable to load guide.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadGuide();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 py-14">
        <div className="h-96 rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
        <SEO title="Guide Not Found | CHAND MOTORS" description="Guide not found." noindex />
        <h1 className="font-display text-4xl font-bold text-white">Guide Not Found</h1>
        <p className="text-sm text-zinc-400">{error}</p>
        <Link to="/guides" className="inline-flex px-5 py-2.5 rounded-md bg-[#D91E2A] text-sm font-semibold text-white">
          Back to Guides
        </Link>
      </div>
    );
  }

  const schemas: Record<string, unknown>[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: guide.title,
      description: guide.excerpt,
      datePublished: guide.publishedAt,
      publisher: { '@type': 'Organization', name: 'CHAND MOTORS' },
    },
  ];

  if (guide.faqs.length > 0) {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: guide.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    });
  }

  return (
    <>
      <SEO
        title={`${guide.title} | CHAND MOTORS`}
        description={guide.excerpt}
        path={`/guides/${guide.slug}`}
        image={guide.imageUrl}
        type="article"
        structuredData={schemas}
      />

      <article className="max-w-[900px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-zinc-400 mb-6">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
          <Link to="/guides" className="hover:text-white">
            Guides
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
          <span className="text-zinc-200 truncate">{guide.category}</span>
        </nav>

        <header className="space-y-4 mb-8">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <span className="text-[#D91E2A] font-semibold">{guide.category}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">{guide.publishedAt}</span>
            <span aria-hidden="true">·</span>
            <span>{guide.readTime}</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            {guide.title}
          </h1>
          <p className="text-base sm:text-lg text-zinc-300 leading-relaxed">{guide.excerpt}</p>
        </header>

        <div className="aspect-[16/9] rounded-lg overflow-hidden bg-black border border-zinc-800 mb-10">
          <BikeImage
            src={guide.imageUrl}
            alt={guide.title}
            className="w-full h-full object-cover"
            priority
            fallbackLabel={guide.category}
          />
        </div>

        <div className="space-y-5 text-base text-zinc-300 leading-relaxed">
          {guide.content.map((para, idx) => (
            <p key={idx}>{para}</p>
          ))}
        </div>

        {guide.faqs.length > 0 && (
          <section className="mt-12 pt-10 border-t border-zinc-800">
            <h2 className="font-display text-3xl font-bold text-white mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-5">
              {guide.faqs.map((faq) => (
                <div key={faq.q} className="p-5 rounded-lg bg-[#141417] border border-zinc-800">
                  <h3 className="text-base font-semibold text-white mb-2">{faq.q}</h3>
                  <p className="text-sm text-zinc-300 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <div className="mt-12 p-6 rounded-lg bg-[#141417] border border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-white">Need Personalized Advice?</h2>
            <p className="text-sm text-zinc-400">
              Speak directly with our showroom team on WhatsApp or explore the live catalog.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/catalog"
              className="px-4 py-2.5 rounded-md bg-white text-zinc-950 text-xs font-semibold"
            >
              Browse Motorcycles
            </Link>
            <a
              href={buildWhatsAppUrl(undefined, `Assalam-o-Alaikum CHAND MOTORS, I read "${guide.title}" and have a question.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#16A34A] text-xs font-semibold text-white"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp {DEFAULT_WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        </div>
      </article>
    </>
  );
}
