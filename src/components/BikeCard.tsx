import { Link } from 'react-router-dom';
import { ArrowUpRight, GitCompare, MessageCircle, Check } from 'lucide-react';
import type { Motorcycle } from '../types/motorcycle.ts';
import { BikeImage } from './BikeImage.tsx';
import { buildWhatsAppUrl, formatPkr } from '../lib/format.ts';
import { useCatalog } from '../context/CatalogContext.tsx';

interface BikeCardProps {
  bike: Motorcycle;
}

export function BikeCard({ bike }: BikeCardProps) {
  const { compareSlugs, toggleCompare } = useCatalog();
  const isCompared = compareSlugs.includes(bike.slug);

  return (
    <article className="group flex flex-col bg-[#141417] border border-zinc-800/90 rounded-lg overflow-hidden transition-transform duration-150 hover:-translate-y-0.5 hover:border-zinc-700">
      <Link to={`/motorcycles/${bike.slug}`} className="relative block aspect-[4/3] bg-[#0E0E11] overflow-hidden">
        <BikeImage
          src={bike.imageUrl}
          alt={`Illustrative ${bike.category.toLowerCase()} artwork for ${bike.brand} ${bike.name}`}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          fallbackLabel={bike.name}
        />
      </Link>

      <p className="px-5 pt-2 text-[10px] text-zinc-500">
        Illustrative image; confirm model and trim with the manufacturer.
      </p>

      <div className="flex flex-col flex-1 p-5 pt-3">
        {/* Zero-pill unboxed metadata with subtle separators */}
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1.5 truncate">
          <span className="font-medium text-zinc-300">{bike.brand}</span>
          <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {bike.verifiedFields?.includes('cc') ? bike.engineCapacityLabel : 'CC not verified'}
            </span>
          <span aria-hidden="true">·</span>
          <span className="truncate">{bike.category}</span>
        </div>

        <h3 className="font-display text-2xl font-bold text-white tracking-tight leading-tight mb-3">
          <Link to={`/motorcycles/${bike.slug}`} className="hover:text-[#D91E2A] transition-colors">
            {bike.name}
          </Link>
        </h3>

        <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-800/80 text-xs mb-4">
          <div>
            <p className="text-zinc-500">Transmission</p>
            <p className="text-zinc-200 font-medium truncate">
              {bike.verifiedFields?.includes('transmission')
                ? bike.transmission.split('(')[0].trim()
                : 'Not verified'}
            </p>
          </div>
          <div>
            <p className="text-zinc-500">Availability</p>
            <p className="text-zinc-200 font-medium">
              {bike.availability === 'Availability Unconfirmed' ? 'Confirm Availability' : bike.availability}
            </p>
          </div>
        </div>

        <div className="mt-auto space-y-3">
          <div>
            <p className="text-xl font-semibold text-white tabular-nums">
              {formatPkr(bike.estimatedPricePkr)}
            </p>
            <p className="text-[11px] text-zinc-500 tabular-nums">
              {bike.priceLabel} · Updated {bike.priceUpdatedAt}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Link
              to={`/motorcycles/${bike.slug}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              <span>View Specs</span>
              <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>

            <button
              type="button"
              onClick={() => toggleCompare(bike.slug)}
              aria-pressed={isCompared}
              aria-label={isCompared ? `Remove ${bike.name} from compare` : `Add ${bike.name} to compare`}
              className={`inline-flex items-center justify-center gap-1 px-3 py-2.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                isCompared
                  ? 'bg-[#D91E2A]/15 border-[#D91E2A] text-white'
                  : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white'
              }`}
            >
              {isCompared ? (
                <Check className="w-3.5 h-3.5 text-[#D91E2A]" aria-hidden="true" />
              ) : (
                <GitCompare className="w-3.5 h-3.5" aria-hidden="true" />
              )}
              <span>{isCompared ? 'Added' : 'Compare'}</span>
            </button>

            <a
              href={buildWhatsAppUrl(bike.name)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Inquire about ${bike.name} on WhatsApp`}
              title="Inquire on WhatsApp"
              className="inline-flex items-center justify-center w-10 h-10 rounded-md bg-zinc-900 border border-zinc-700 text-emerald-400 hover:bg-emerald-950/50 hover:border-emerald-600 transition-colors shrink-0"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
