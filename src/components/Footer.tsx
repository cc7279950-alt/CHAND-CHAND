import { Link } from 'react-router-dom';
import { Phone, MapPin, Clock, MessageCircle } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_DISPLAY } from '../lib/format.ts';

export function Footer() {
  const { siteContent, categories } = useCatalog();
  const whatsappDisplay = siteContent?.whatsappNumber || DEFAULT_WHATSAPP_DISPLAY;

  return (
    <footer className="bg-[#070708] border-t border-zinc-800/90 text-zinc-400">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand & Showroom Identity */}
          <div className="space-y-4">
            <Link to="/" aria-label="CHAND MOTORS Home" className="inline-block">
              <BrandLogo size="md" />
            </Link>
            <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
              CHAND MOTORS curates verified motorcycles across Pakistan—from daily 70cc and 125cc commuters to imported superbikes and graphene electric scooters.
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-2.5 text-zinc-300">
                <MapPin className="w-4 h-4 text-[#D91E2A] shrink-0 mt-0.5" aria-hidden="true" />
                <span>
                  {siteContent?.showroomAddress || 'Plot 14-C, Main Boulevard, Gulberg III'},{' '}
                  {siteContent?.showroomCity || 'Lahore, Pakistan'}
                </span>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-300">
                <Phone className="w-4 h-4 text-[#D91E2A] shrink-0" aria-hidden="true" />
                <a
                  href={buildWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors tabular-nums"
                >
                  {whatsappDisplay}
                </a>
              </div>
              <div className="flex items-center gap-2.5 text-zinc-400">
                <Clock className="w-4 h-4 text-zinc-500 shrink-0" aria-hidden="true" />
                <span>{siteContent?.showroomHours || 'Mon – Sat · 10:00 AM – 8:00 PM PKT'}</span>
              </div>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide mb-4">
              Motorcycle Categories
            </h3>
            <ul className="space-y-2.5 text-sm">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/catalog?category=${encodeURIComponent(cat.name)}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Platform Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wide mb-4">
              Showroom Tools
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/catalog" className="hover:text-white transition-colors">
                  All Motorcycles
                </Link>
              </li>
              <li>
                <Link to="/compare" className="hover:text-white transition-colors">
                  Compare Motorcycles
                </Link>
              </li>
              <li>
                <Link to="/guides" className="hover:text-white transition-colors">
                  Buying Guides &amp; FAQs
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Contact &amp; Booking
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition-colors">
                  Member Sign In
                </Link>
              </li>
              <li>
                <Link to="/register" className="hover:text-white transition-colors">
                  Create Account
                </Link>
              </li>
            </ul>
          </div>

          {/* Direct WhatsApp Concierge */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-white tracking-wide">
              Direct Dealer Inquiry
            </h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Need verified city registration costs, installment guidance, or CBU import booking quotes? Message our showroom desk directly.
            </p>
            <a
              href={buildWhatsAppUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-sm font-semibold text-white transition-colors whitespace-nowrap"
            >
              <MessageCircle className="w-4 h-4" aria-hidden="true" />
              <span>WhatsApp {whatsappDisplay}</span>
            </a>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-zinc-800/80 space-y-3">
          <p className="text-xs text-zinc-500 leading-relaxed">
            {siteContent?.priceDisclaimer ||
              'Estimated PKR prices are indicative ex-showroom or CBU import estimates as of November 2026 and exclude city registration, withholding tax, and freight unless noted. Confirm live availability and final invoice directly via WhatsApp.'}
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-500">
            <p>© {new Date().getFullYear()} CHAND MOTORS Pakistan. All rights reserved.</p>
            <p className="tabular-nums">WhatsApp &amp; Showroom Desk: {whatsappDisplay}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
