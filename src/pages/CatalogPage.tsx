import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { SlidersHorizontal, Search, X, GitCompare } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { BikeCard } from '../components/BikeCard.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';

type CcFilter = 'all' | 'ev' | '70-115' | '125-155' | '200-500' | '600+';
type PriceFilter = 'all' | 'under-250k' | '250k-600k' | '600k-2.5m' | '2.5m+';
type SortOption = 'popular' | 'price-asc' | 'price-desc' | 'cc-desc';

export function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { motorcycles, brands, categories, compareSlugs, loading, error } = useCatalog();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [brand, setBrand] = useState(searchParams.get('brand') || 'All');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [ccRange, setCcRange] = useState<CcFilter>('all');
  const [priceRange, setPriceRange] = useState<PriceFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSearch(searchParams.get('search') || '');
    setBrand(searchParams.get('brand') || 'All');
    setCategory(searchParams.get('category') || 'All');
  }, [searchParams]);

  function updateQueryParam(key: string, value: string) {
    const next = new URLSearchParams(searchParams);
    if (!value || value === 'All') {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    setSearchParams(next, { replace: true });
  }

  function resetAllFilters() {
    setSearch('');
    setBrand('All');
    setCategory('All');
    setCcRange('all');
    setPriceRange('all');
    setSortBy('popular');
    setSearchParams({}, { replace: true });
  }

  const filteredBikes = useMemo(() => {
    let list = [...motorcycles];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.brand.toLowerCase().includes(q) ||
          b.category.toLowerCase().includes(q),
      );
    }

    if (brand !== 'All') {
      list = list.filter((b) => b.brand.toLowerCase() === brand.toLowerCase());
    }

    if (category !== 'All') {
      list = list.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }

    if (ccRange !== 'all') {
      list = list.filter((b) => {
        if (!b.verifiedFields?.includes('cc')) return false;
        if (ccRange === 'ev') return b.cc === 0;
        if (ccRange === '70-115') return b.cc >= 70 && b.cc <= 115;
        if (ccRange === '125-155') return b.cc >= 120 && b.cc <= 160;
        if (ccRange === '200-500') return b.cc >= 200 && b.cc <= 550;
        if (ccRange === '600+') return b.cc >= 600;
        return true;
      });
    }

    if (priceRange !== 'all') {
      list = list.filter((b) => {
        const p = b.estimatedPricePkr;
        if (priceRange === 'under-250k') return p < 250000;
        if (priceRange === '250k-600k') return p >= 250000 && p <= 600000;
        if (priceRange === '600k-2.5m') return p > 600000 && p <= 2500000;
        if (priceRange === '2.5m+') return p > 2500000;
        return true;
      });
    }

    if (sortBy === 'price-asc') {
      list.sort((a, b) => a.estimatedPricePkr - b.estimatedPricePkr);
    } else if (sortBy === 'price-desc') {
      list.sort((a, b) => b.estimatedPricePkr - a.estimatedPricePkr);
    } else if (sortBy === 'cc-desc') {
      list.sort(
        (a, b) =>
          Number(b.verifiedFields?.includes('cc')) - Number(a.verifiedFields?.includes('cc')) || b.cc - a.cc,
      );
    } else {
      list.sort((a, b) => b.popularityScore - a.popularityScore);
    }

    return list;
  }, [motorcycles, search, brand, category, ccRange, priceRange, sortBy]);

  const pageTitle =
    brand !== 'All'
      ? `${brand} Motorcycles Price & Specs in Pakistan | CHAND MOTORS`
      : category !== 'All'
        ? `${category} in Pakistan – Specs & PKR Prices | CHAND MOTORS`
        : 'Motorcycle Catalog & Pakistan PKR Price Guide | CHAND MOTORS';

  return (
    <>
      <SEO
        title={pageTitle}
        description="Search Pakistan motorcycle listings by brand and category, review dated PKR estimates, and check source-verified specifications at CHAND MOTORS."
        path="/catalog"
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-800">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
              Pakistan Motorcycle Catalog
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              {category !== 'All' ? category : brand !== 'All' ? `${brand} Motorcycles` : 'All Motorcycles'}
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Showing <span className="text-white font-semibold tabular-nums">{filteredBikes.length}</span> of{' '}
              <span className="tabular-nums">{motorcycles.length}</span> models · Estimated PKR pricing
            </p>
          </div>

          <div className="flex items-center gap-3">
            {compareSlugs.length > 0 && (
              <Link
                to="/compare"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#141417] border border-[#D91E2A] text-xs font-semibold text-white hover:bg-[#D91E2A]/15 transition-colors whitespace-nowrap"
              >
                <GitCompare className="w-4 h-4 text-[#D91E2A]" aria-hidden="true" />
                <span>Compare Selected ({compareSlugs.length})</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileFiltersOpen((o) => !o)}
              className="lg:hidden inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#141417] border border-zinc-700 text-xs font-semibold text-white cursor-pointer"
            >
              <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
              <span>Filters</span>
            </button>
          </div>
        </div>

        {/* Main Grid: Filter Sidebar + Catalog Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[270px_1fr] gap-8 pt-8">
          {/* Filter Panel */}
          <aside
            className={`${
              mobileFiltersOpen ? 'block' : 'hidden'
            } lg:block space-y-6 bg-[#141417] border border-zinc-800 rounded-lg p-5 h-fit lg:sticky lg:top-24`}
            aria-label="Motorcycle Filters"
          >
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold text-white">Filter Models</h2>
              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs font-medium text-zinc-400 hover:text-white cursor-pointer"
              >
                Reset All
              </button>
            </div>

            {/* Search */}
            <div>
              <label htmlFor="catalog-search" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Search Model
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" aria-hidden="true" />
                <input
                  id="catalog-search"
                  type="search"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    updateQueryParam('search', e.target.value);
                  }}
                  placeholder="CG 125, Ninja, TRK..."
                  className="w-full h-10 pl-9 pr-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white placeholder:text-zinc-500 focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            {/* Brand */}
            <div>
              <label htmlFor="filter-brand" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Manufacturer
              </label>
              <select
                id="filter-brand"
                value={brand}
                onChange={(e) => {
                  setBrand(e.target.value);
                  updateQueryParam('brand', e.target.value);
                }}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              >
                <option value="All">All Brands</option>
                {brands.map((b) => (
                  <option key={b.slug} value={b.name}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="filter-category" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Category
              </label>
              <select
                id="filter-category"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  updateQueryParam('category', e.target.value);
                }}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              >
                <option value="All">All Categories</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Engine CC */}
            <div>
              <label htmlFor="filter-cc" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Engine Displacement (CC)
              </label>
              <select
                id="filter-cc"
                value={ccRange}
                onChange={(e) => setCcRange(e.target.value as CcFilter)}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              >
                <option value="all">Any Displacement</option>
                <option value="ev">Electric Motor (0 cc)</option>
                <option value="70-115">70cc – 115cc</option>
                <option value="125-155">125cc – 155cc</option>
                <option value="200-500">200cc – 500cc</option>
                <option value="600+">600cc &amp; Above</option>
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label htmlFor="filter-price" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Estimated Price Range (PKR)
              </label>
              <select
                id="filter-price"
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as PriceFilter)}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              >
                <option value="all">All Budgets</option>
                <option value="under-250k">Under PKR 250,000</option>
                <option value="250k-600k">PKR 250,000 – 600,000</option>
                <option value="600k-2.5m">PKR 600,000 – 2,500,000</option>
                <option value="2.5m+">Over PKR 2,500,000</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label htmlFor="filter-sort" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Sort Results
              </label>
              <select
                id="filter-sort"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              >
                <option value="popular">Popularity</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="cc-desc">Engine CC: High to Low</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="lg:hidden w-full py-2.5 rounded-md bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
            >
              Apply Filters ({filteredBikes.length})
            </button>
          </aside>

          {/* Results Grid */}
          <div>
            {(brand !== 'All' || category !== 'All' || search || ccRange !== 'all' || priceRange !== 'all') && (
              <div className="flex flex-wrap items-center gap-2 mb-6 text-xs">
                <span className="text-zinc-500">Active filters:</span>
                {brand !== 'All' && (
                  <button
                    type="button"
                    onClick={() => {
                      setBrand('All');
                      updateQueryParam('brand', 'All');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-zinc-500 cursor-pointer"
                  >
                    <span>Brand: {brand}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {category !== 'All' && (
                  <button
                    type="button"
                    onClick={() => {
                      setCategory('All');
                      updateQueryParam('category', 'All');
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-zinc-500 cursor-pointer"
                  >
                    <span>Category: {category}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {ccRange !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setCcRange('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-zinc-500 cursor-pointer"
                  >
                    <span>CC: {ccRange}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
                {priceRange !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setPriceRange('all')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-900 border border-zinc-700 text-zinc-200 hover:border-zinc-500 cursor-pointer"
                  >
                    <span>Budget: {priceRange}</span>
                    <X className="w-3 h-3" aria-hidden="true" />
                  </button>
                )}
              </div>
            )}

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="h-[420px] rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
                ))}
              </div>
            ) : error ? (
              <div className="p-8 rounded-lg bg-[#141417] border border-red-900/50 text-center text-red-300">
                {error}
              </div>
            ) : filteredBikes.length === 0 ? (
              <div className="p-12 rounded-lg bg-[#141417] border border-zinc-800 text-center space-y-4">
                <p className="font-display text-2xl font-bold text-white">
                  No motorcycles match your current filters
                </p>
                <p className="text-sm text-zinc-400 max-w-md mx-auto">
                  Try widening your engine CC or PKR price selection, or clear filters to view the entire CHAND MOTORS showroom lineup.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="px-5 py-2.5 rounded-md bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBikes.map((bike) => (
                  <BikeCard key={bike.id} bike={bike} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
