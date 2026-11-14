import { Link } from 'react-router-dom';
import { MessageCircle, Plus, Trash2 } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { BikeImage } from '../components/BikeImage.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';
import { buildWhatsAppUrl, formatPkr } from '../lib/format.ts';

export function ComparePage() {
  const { motorcycles, compareSlugs, toggleCompare, removeCompare, clearCompare } = useCatalog();

  const selectedBikes = compareSlugs
    .map((slug) => motorcycles.find((m) => m.slug === slug))
    .filter((m): m is NonNullable<typeof m> => Boolean(m));

  const specRows = [
    { label: 'PKR Price / Estimate', render: (m: (typeof selectedBikes)[0]) => formatPkr(m.estimatedPricePkr) },
    { label: 'Price Status', render: (m: (typeof selectedBikes)[0]) => `${m.priceLabel} (${m.priceUpdatedAt})` },
    { label: 'Brand', render: (m: (typeof selectedBikes)[0]) => m.brand },
    { label: 'Category', render: (m: (typeof selectedBikes)[0]) => m.category },
    { label: 'Availability', render: (m: (typeof selectedBikes)[0]) => m.availability },
    {
      label: 'Engine Capacity',
      render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('cc') ? m.engineCapacityLabel : 'Not verified',
    },
    { label: 'Engine Type', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('engineType') ? m.engineType : 'Not verified' },
    { label: 'Horsepower', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('horsepower') ? m.horsepower : 'Not verified' },
    { label: 'Torque', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('torque') ? m.torque : 'Not verified' },
    { label: 'Transmission', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('transmission') ? m.transmission : 'Not verified' },
    { label: 'Fuel / Battery', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('fuelTankCapacity') ? m.fuelTankCapacity : 'Not verified' },
    { label: 'Mileage / Range', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('mileage') ? m.mileage : 'Not verified' },
    { label: 'Top Speed', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('topSpeed') ? m.topSpeed : 'Not verified' },
    { label: 'Braking System', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('brakingSystem') ? m.brakingSystem : 'Not verified' },
    { label: 'Front Suspension', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('frontSuspension') ? m.frontSuspension : 'Not verified' },
    { label: 'Rear Suspension', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('rearSuspension') ? m.rearSuspension : 'Not verified' },
    { label: 'Dimensions', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('dimensions') ? m.dimensions : 'Not verified' },
    { label: 'Weight', render: (m: (typeof selectedBikes)[0]) => m.verifiedFields?.includes('weight') ? m.weight : 'Not verified' },
  ];

  function handleAddSelect(slug: string) {
    if (!slug || compareSlugs.includes(slug)) return;
    toggleCompare(slug);
  }

  return (
    <>
      <SEO
        title="Compare Motorcycles Side by Side | CHAND MOTORS Pakistan"
        description="Compare up to three Pakistani-market motorcycle listings; technical values are shown only when supported by a recorded primary source."
        path="/compare"
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-8 border-b border-zinc-800">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
              Technical Comparison Matrix
            </p>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Compare Motorcycles
            </h1>
            <p className="text-sm text-zinc-400 mt-2">
              Evaluate up to 3 models side by side before requesting a showroom quote.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {selectedBikes.length < 3 && (
              <div className="flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#D91E2A]" aria-hidden="true" />
                <select
                  aria-label="Add motorcycle to comparison"
                  value=""
                  onChange={(e) => handleAddSelect(e.target.value)}
                  className="h-10 px-3 rounded-md bg-[#141417] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                >
                  <option value="">Add motorcycle to compare...</option>
                  {motorcycles
                    .filter((m) => !compareSlugs.includes(m.slug))
                    .map((m) => (
                      <option key={m.slug} value={m.slug}>
                        {m.name} ({m.brand})
                      </option>
                    ))}
                </select>
              </div>
            )}

            {selectedBikes.length > 0 && (
              <button
                type="button"
                onClick={clearCompare}
                className="h-10 px-4 rounded-md bg-zinc-900 border border-zinc-700 text-xs font-medium text-zinc-300 hover:text-white cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {selectedBikes.length === 0 ? (
          <div className="mt-10 p-12 rounded-lg bg-[#141417] border border-zinc-800 text-center space-y-4">
            <h2 className="font-display text-2xl font-bold text-white">No Motorcycles Selected</h2>
            <p className="text-sm text-zinc-400 max-w-md mx-auto">
              Choose motorcycles from the dropdown above or click Compare on any listing in the catalog.
            </p>
            <Link
              to="/catalog"
              className="inline-flex px-5 py-2.5 rounded-md bg-[#D91E2A] text-xs font-semibold text-white"
            >
              Browse Motorcycles
            </Link>
          </div>
        ) : (
          <div className="mt-8 bg-[#141417] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[720px]">
                <thead>
                  <tr className="border-b border-zinc-800 bg-[#101013]">
                    <th className="p-5 align-top w-52 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Model Overview
                    </th>
                    {selectedBikes.map((bike) => (
                      <th key={bike.slug} className="p-5 align-top min-w-[240px]">
                        <div className="space-y-3">
                          <div className="aspect-[16/10] rounded-md overflow-hidden bg-black border border-zinc-800">
                            <BikeImage
                              src={bike.imageUrl}
                              alt={bike.name}
                              className="w-full h-full object-cover"
                              fallbackLabel={bike.name}
                            />
                          </div>
                          <div>
                            <Link
                              to={`/motorcycles/${bike.slug}`}
                              className="font-display text-2xl font-bold text-white hover:text-[#D91E2A] transition-colors block"
                            >
                              {bike.name}
                            </Link>
                            <div className="flex items-center gap-2 mt-2">
                              <a
                                href={buildWhatsAppUrl(bike.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#16A34A] hover:bg-[#15803D] text-xs font-semibold text-white"
                              >
                                <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>WhatsApp</span>
                              </a>
                              <button
                                type="button"
                                onClick={() => removeCompare(bike.slug)}
                                aria-label={`Remove ${bike.name} from compare`}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 hover:text-white cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                                <span>Remove</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/80">
                  {specRows.map((row) => (
                    <tr key={row.label} className="hover:bg-zinc-900/30">
                      <th scope="row" className="py-3.5 px-5 text-xs font-medium text-zinc-400">
                        {row.label}
                      </th>
                      {selectedBikes.map((bike) => (
                        <td
                          key={bike.slug}
                          className="py-3.5 px-5 text-zinc-200 font-mono text-xs sm:text-sm tabular-nums"
                        >
                          {row.render(bike)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
