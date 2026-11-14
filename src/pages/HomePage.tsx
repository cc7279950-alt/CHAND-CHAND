import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ChevronDown,
  GitCompare,
  MessageCircle,
  Search,
  Star,
} from 'lucide-react';
import { motion } from 'motion/react';
import { SEO } from '../components/SEO.tsx';
import { BikeCard } from '../components/BikeCard.tsx';
import { BikeImage } from '../components/BikeImage.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_DISPLAY, formatPkr } from '../lib/format.ts';
import { heroFlagshipImg } from '../lib/imageMap.ts';

const HOME_FAQS = [
  {
    q: 'Are motorcycle prices on CHAND MOTORS guaranteed final on-road prices?',
    a: 'Prices shown are estimates rather than live dealer offers. Registration, taxes, and freight may not be included. Confirm current pricing and availability on WhatsApp 03217293026.',
  },
  {
    q: 'Which motorcycle brands are listed on CHAND MOTORS?',
    a: 'The catalog includes Honda, Yamaha, Suzuki, Kawasaki, BMW Motorrad, Benelli, United, Road Prince, Super Power, Hi-Speed, Yadea, and Evee. A listing is not a guarantee of local stock or authorized-dealer status.',
  },
  {
    q: 'Can I compare commuter, sports, and electric motorcycles side by side?',
    a: 'Yes. Use the Compare tool on this page or open the full Compare Workbench to evaluate up to three motorcycles simultaneously across engine CC, horsepower, braking hardware, weight, and estimated PKR price.',
  },
  {
    q: 'How do I book an inspection or request a motorcycle quotation?',
    a: 'Every motorcycle listing links to WhatsApp (03217293026) with the selected model prefilled, or you can submit an inquiry on a bike detail page.',
  },
];

export function HomePage() {
  const navigate = useNavigate();
  const { motorcycles, brands, categories, guides, reviews, siteContent, loading, error } = useCatalog();

  const [searchQuery, setSearchQuery] = useState('');
  const [lineupTab, setLineupTab] = useState<'featured' | 'latest'>('featured');
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [compareLeftSlug, setCompareLeftSlug] = useState('honda-cg-125-2026');
  const [compareRightSlug, setCompareRightSlug] = useState('yamaha-ybr-125g');

  const showcasedBikes = useMemo(() => {
    const filtered =
      lineupTab === 'featured'
        ? motorcycles.filter((b) => b.isFeatured)
        : motorcycles.filter((b) => b.isLatestArrival);
    return filtered.slice(0, 6);
  }, [motorcycles, lineupTab]);

  const leftBike = useMemo(
    () => motorcycles.find((m) => m.slug === compareLeftSlug) || motorcycles[0],
    [motorcycles, compareLeftSlug],
  );
  const rightBike = useMemo(
    () => motorcycles.find((m) => m.slug === compareRightSlug) || motorcycles[1] || motorcycles[0],
    [motorcycles, compareRightSlug],
  );

  function handleHeroSearch(e: React.FormEvent) {
    e.preventDefault();
    navigate(searchQuery.trim() ? `/catalog?search=${encodeURIComponent(searchQuery.trim())}` : '/catalog');
  }

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: HOME_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  return (
    <>
      <SEO
        title="CHAND MOTORS – Luxury Motorcycle Catalog & Pakistan Specs"
        description="Explore motorcycle specifications, estimated PKR prices, side-by-side comparisons, and direct WhatsApp inquiries at CHAND MOTORS Pakistan."
        path="/"
        image="/src/assets/images/hero_flagship_superbike_1794636799761.jpg"
        structuredData={faqSchema}
      />

      {/* 1. Full-Screen Luxury Motorcycle Hero */}
      <section className="relative min-h-[84vh] flex items-center bg-[#0A0A0B] overflow-hidden border-b border-zinc-800/80">
        <div className="absolute inset-0">
          <img
            src={heroFlagshipImg}
            alt="Illustrative black and crimson superbike artwork for the CHAND MOTORS catalog"
            loading="eager"
            decoding="sync"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center opacity-75"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A0B] via-[#0A0A0B]/85 to-[#0A0A0B]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] via-transparent to-[#0A0A0B]/40" />
        </div>

        <div className="relative z-10 max-w-[1280px] mx-auto w-full px-4 sm:px-6 py-20 lg:py-28">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl space-y-6"
          >
            <p className="text-xs sm:text-sm font-medium tracking-[0.16em] uppercase text-[#D91E2A]">
              CHAND MOTORS · Pakistan Motorcycle Catalog
            </p>

            <h1 className="font-display font-bold text-white tracking-tight leading-[0.98] text-[clamp(2.65rem,5vw,4.5rem)]">
              {siteContent?.heroHeadline || 'Precision Two-Wheel Engineering for Pakistan'}
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-xl">
              {siteContent?.heroSubheadline ||
                'Explore popular petrol and electric motorcycles, compare specifications, review estimated PKR prices, and ask about current availability on WhatsApp.'}
            </p>

            {/* Primary Search & Action Row */}
            <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row gap-2.5 max-w-xl pt-1">
              <div className="relative flex-1">
                <Search
                  className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Honda CG 125, Yamaha YBR, Ninja 400, Yadea..."
                  aria-label="Search motorcycles by model or brand"
                  className="w-full h-12 pl-10 pr-4 rounded-md bg-[#141417]/95 border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="h-12 px-6 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {siteContent?.heroCtaLabel || 'Explore Catalog'}
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-6 pt-2 text-sm">
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 text-zinc-200 hover:text-white font-medium transition-colors"
              >
                <GitCompare className="w-4 h-4 text-[#D91E2A]" aria-hidden="true" />
                <span>Compare Specs Side-by-Side</span>
              </Link>
              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-zinc-200 hover:text-white font-medium transition-colors tabular-nums"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                <span>WhatsApp Desk: {siteContent?.whatsappNumber || DEFAULT_WHATSAPP_DISPLAY}</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. Featured Bikes & Latest Arrivals */}
      <section className="py-16 lg:py-20 bg-[#0A0A0B] border-b border-zinc-800/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
                Curated Lineup
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Featured Motorcycles &amp; Latest Arrivals
              </h2>
            </div>

            <div className="flex items-center gap-3">
              <div className="inline-flex p-1 bg-[#141417] border border-zinc-800 rounded-md" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={lineupTab === 'featured'}
                  onClick={() => setLineupTab('featured')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    lineupTab === 'featured'
                      ? 'bg-[#D91E2A] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Featured Bikes
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={lineupTab === 'latest'}
                  onClick={() => setLineupTab('latest')}
                  className={`px-4 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap cursor-pointer ${
                    lineupTab === 'latest'
                      ? 'bg-[#D91E2A] text-white'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Latest Arrivals
                </button>
              </div>
              <Link
                to="/catalog"
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-200 hover:text-[#D91E2A] transition-colors whitespace-nowrap"
              >
                <span>View All ({motorcycles.length})</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="h-[420px] rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="p-8 rounded-lg bg-[#141417] border border-red-900/50 text-center">
              <p className="text-red-300 text-sm mb-3">{error}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {showcasedBikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link
              to="/catalog"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-md bg-zinc-900 border border-zinc-800 text-sm font-semibold text-white"
            >
              <span>Browse Full Catalog ({motorcycles.length} Models)</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Categories & Popular Manufacturers */}
      <section className="py-16 lg:py-20 bg-[#101013] border-b border-zinc-800/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-14">
          <div>
            <div className="mb-8">
              <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
                Riding Segments
              </p>
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                Browse by Motorcycle Category
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/catalog?category=${encodeURIComponent(cat.name)}`}
                  className="group relative rounded-lg overflow-hidden bg-[#141417] border border-zinc-800/90 hover:border-zinc-600 transition-colors"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-black">
                    <BikeImage
                      src={cat.imageUrl}
                      alt={`${cat.name} in Pakistan`}
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-300"
                      fallbackLabel={cat.name}
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="font-display text-xl font-bold text-white group-hover:text-[#D91E2A] transition-colors">
                        {cat.name}
                      </h3>
                      <ArrowRight
                        className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors shrink-0"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Popular Manufacturers */}
          <div className="pt-4 border-t border-zinc-800/80">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Popular Motorcycle Brands
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  Select a manufacturer to filter catalog models and estimated PKR pricing.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {brands.map((brand) => (
                <Link
                  key={brand.slug}
                  to={`/catalog?brand=${encodeURIComponent(brand.name)}`}
                  className="p-4 rounded-md bg-[#141417] border border-zinc-800 hover:border-[#D91E2A] transition-colors flex flex-col justify-between"
                >
                  <span className="font-display text-xl font-bold text-white">{brand.name}</span>
                  <span className="text-[11px] text-zinc-500 mt-1">{brand.country}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Interactive Comparison Workbench Preview */}
      {leftBike && rightBike && (
        <section className="py-16 lg:py-20 bg-[#0A0A0B] border-b border-zinc-800/80">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
                  Side-by-Side Technical Evaluation
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Compare Motorcycles Instantly
                </h2>
              </div>
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors whitespace-nowrap self-start md:self-auto"
              >
                <GitCompare className="w-4 h-4" aria-hidden="true" />
                <span>Open 3-Bike Compare Tool</span>
              </Link>
            </div>

            <div className="bg-[#141417] border border-zinc-800 rounded-lg overflow-hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 border-b border-zinc-800 bg-[#111114]">
                <div>
                  <label htmlFor="home-compare-left" className="block text-xs text-zinc-400 mb-1.5">
                    Motorcycle A
                  </label>
                  <select
                    id="home-compare-left"
                    value={leftBike.slug}
                    onChange={(e) => setCompareLeftSlug(e.target.value)}
                    className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                  >
                    {motorcycles.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name} ({formatPkr(m.estimatedPricePkr)})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="home-compare-right" className="block text-xs text-zinc-400 mb-1.5">
                    Motorcycle B
                  </label>
                  <select
                    id="home-compare-right"
                    value={rightBike.slug}
                    onChange={(e) => setCompareRightSlug(e.target.value)}
                    className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                  >
                    {motorcycles.map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name} ({formatPkr(m.estimatedPricePkr)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800 text-xs text-zinc-400">
                      <th className="py-3.5 px-5 font-medium w-1/4">Specification</th>
                      <th className="py-3.5 px-5 font-semibold text-white w-[37.5%]">
                        <Link to={`/motorcycles/${leftBike.slug}`} className="hover:text-[#D91E2A]">
                          {leftBike.name}
                        </Link>
                      </th>
                      <th className="py-3.5 px-5 font-semibold text-white w-[37.5%]">
                        <Link to={`/motorcycles/${rightBike.slug}`} className="hover:text-[#D91E2A]">
                          {rightBike.name}
                        </Link>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/70 font-mono text-xs sm:text-sm tabular-nums">
                    <tr>
                      <td className="py-3 px-5 font-sans text-zinc-400">PKR Price / Estimate</td>
                      <td className="py-3 px-5 text-white font-semibold">
                        {formatPkr(leftBike.estimatedPricePkr)}
                      </td>
                      <td className="py-3 px-5 text-white font-semibold">
                        {formatPkr(rightBike.estimatedPricePkr)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans text-zinc-400">Engine Displacement</td>
                      <td className="py-3 px-5 text-zinc-200">
                        {leftBike.verifiedFields?.includes('cc') ? leftBike.engineCapacityLabel : 'Not verified'}
                      </td>
                      <td className="py-3 px-5 text-zinc-200">
                        {rightBike.verifiedFields?.includes('cc') ? rightBike.engineCapacityLabel : 'Not verified'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans text-zinc-400">Transmission</td>
                      <td className="py-3 px-5 text-zinc-200 font-sans">{leftBike.transmission}</td>
                      <td className="py-3 px-5 text-zinc-200 font-sans">{rightBike.transmission}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans text-zinc-400">Braking System</td>
                      <td className="py-3 px-5 text-zinc-200 font-sans">{leftBike.brakingSystem}</td>
                      <td className="py-3 px-5 text-zinc-200 font-sans">{rightBike.brakingSystem}</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans text-zinc-400">Fuel / Battery</td>
                      <td className="py-3 px-5 text-zinc-200 font-sans">
                        {leftBike.verifiedFields?.includes('fuelTankCapacity') ? leftBike.fuelTankCapacity : 'Not verified'}
                      </td>
                      <td className="py-3 px-5 text-zinc-200 font-sans">
                        {rightBike.verifiedFields?.includes('fuelTankCapacity') ? rightBike.fuelTankCapacity : 'Not verified'}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-3 px-5 font-sans text-zinc-400">Weight</td>
                      <td className="py-3 px-5 text-zinc-200">{leftBike.weight}</td>
                      <td className="py-3 px-5 text-zinc-200">{rightBike.weight}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Buying Guides & Customer Reviews */}
      <section className="py-16 lg:py-20 bg-[#101013] border-b border-zinc-800/80">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 space-y-16">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
              <div>
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
                  Research &amp; Advisory
                </p>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
                  Motorcycle Buying Guides &amp; Market News
                </h2>
              </div>
              <Link
                to="/guides"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-zinc-200 hover:text-[#D91E2A] transition-colors whitespace-nowrap"
              >
                <span>All Guides</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {guides.map((guide) => (
                <article
                  key={guide.slug}
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
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                      <span className="text-[#D91E2A] font-medium">{guide.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{guide.publishedAt}</span>
                      <span aria-hidden="true">·</span>
                      <span>{guide.readTime}</span>
                    </div>
                    <h3 className="font-display text-xl font-bold text-white leading-snug mb-2">
                      <Link to={`/guides/${guide.slug}`} className="hover:text-[#D91E2A] transition-colors">
                        {guide.title}
                      </Link>
                    </h3>
                    <p className="text-sm text-zinc-400 line-clamp-3 mb-4">{guide.excerpt}</p>
                    <Link
                      to={`/guides/${guide.slug}`}
                      className="mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-white hover:text-[#D91E2A]"
                    >
                      <span>Read Full Guide</span>
                      <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {reviews.length > 0 && (
            <section className="pt-10 border-t border-zinc-800/80" aria-labelledby="rider-reviews">
              <div className="mb-8">
                <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
                  Rider Feedback
                </p>
                <h2 id="rider-reviews" className="font-display text-3xl font-bold text-white tracking-tight">
                  Rider Reviews
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((review) => (
                  <blockquote
                    key={review.id}
                    className="p-6 rounded-lg bg-[#141417] border border-zinc-800 flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-[#D91E2A] mb-3" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: review.rating }).map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" aria-hidden="true" />
                        ))}
                      </div>
                      <p className="text-sm text-zinc-200 leading-relaxed">“{review.quote}”</p>
                    </div>
                    <footer className="pt-3 border-t border-zinc-800/80 text-xs text-zinc-400">
                      <p className="font-semibold text-white">{review.customerName}</p>
                      <p>
                        {review.city} · {review.bikePurchased}
                      </p>
                    </footer>
                  </blockquote>
                ))}
              </div>
            </section>
          )}
        </div>
      </section>

      {/* 6. GEO-Structured Frequently Asked Questions */}
      <section className="py-16 lg:py-20 bg-[#0A0A0B]">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6">
          <div className="mb-8">
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
              Buyer Knowledge Base
            </p>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="divide-y divide-zinc-800 border-y border-zinc-800">
            {HOME_FAQS.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div key={faq.q}>
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left cursor-pointer"
                  >
                    <span className="text-base font-semibold text-white">{faq.q}</span>
                    <ChevronDown
                      className={`w-5 h-5 text-zinc-400 shrink-0 transition-transform duration-150 ${
                        isOpen ? 'rotate-180 text-[#D91E2A]' : ''
                      }`}
                      aria-hidden="true"
                    />
                  </button>
                  {isOpen && (
                    <p className="pb-5 text-sm text-zinc-400 leading-relaxed">{faq.a}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
