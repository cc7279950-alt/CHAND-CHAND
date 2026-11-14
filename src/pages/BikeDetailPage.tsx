import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Bookmark,
  Check,
  ChevronRight,
  GitCompare,
  MessageCircle,
  Send,
} from 'lucide-react';
import type { Motorcycle } from '../types/motorcycle.ts';
import { SEO } from '../components/SEO.tsx';
import { BikeImage } from '../components/BikeImage.tsx';
import { BikeCard } from '../components/BikeCard.tsx';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_DISPLAY, formatPkr } from '../lib/format.ts';
import { useCatalog } from '../context/CatalogContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';

const VERIFIED_FIELD_LABELS: Record<string, string> = {
  cc: 'engine capacity',
  engineCapacityLabel: 'engine capacity label',
  engineType: 'engine type',
  horsepower: 'horsepower',
  torque: 'torque',
  transmission: 'transmission',
  fuelTankCapacity: 'fuel tank',
  mileage: 'mileage',
  topSpeed: 'top speed',
  brakingSystem: 'braking system',
  frontSuspension: 'front suspension',
  rearSuspension: 'rear suspension',
  dimensions: 'dimensions',
  weight: 'weight',
  colors: 'colors',
  estimatedPricePkr: 'price',
  keyFeatures: 'key features',
  description: 'description',
};

export function BikeDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { compareSlugs, toggleCompare, siteContent } = useCatalog();
  const { user, toggleSaveBike } = useAuth();

  const [bike, setBike] = useState<Motorcycle | null>(null);
  const [related, setRelated] = useState<Motorcycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeImage, setActiveImage] = useState<string>('');

  // Callback / Inquiry form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inquirySuccess, setInquirySuccess] = useState<string | null>(null);
  const [inquiryError, setInquiryError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((prev) => prev || user.name);
      setPhone((prev) => prev || user.phone);
      setEmail((prev) => prev || user.email);
      setCity((prev) => prev || user.city || '');
    }
  }, [user]);

  useEffect(() => {
    let cancelled = false;
    async function loadBike() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/motorcycles/${slug}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Motorcycle not found.');
        if (!cancelled) {
          setBike(data.motorcycle);
          setRelated(data.related || []);
          setActiveImage(data.motorcycle.imageUrl);
          setMessage(
            `Please share on-road pricing and booking availability for the ${data.motorcycle.name}.`,
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load motorcycle details.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadBike();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  async function handleInquirySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bike) return;
    setInquiryError(null);
    setInquirySuccess(null);

    if (customerName.trim().length < 2) {
      setInquiryError('Please enter your full name.');
      return;
    }
    if (phone.trim().length < 7) {
      setInquiryError('Please enter a valid contact phone or WhatsApp number.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerName,
          phone,
          email,
          motorcycleId: bike.id,
          motorcycleName: bike.name,
          city,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit inquiry.');
      setInquirySuccess(
        `Inquiry #${data.inquiry.id} received for ${bike.name}. Message us on WhatsApp ${DEFAULT_WHATSAPP_DISPLAY} for a prompt response.`,
      );
    } catch (err) {
      setInquiryError(err instanceof Error ? err.message : 'Submission failed.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16">
        <div className="h-[520px] rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (error || !bike) {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
        <SEO
          title="Motorcycle Not Found | CHAND MOTORS"
          description="The requested motorcycle specification page could not be found."
          noindex
        />
        <h1 className="font-display text-4xl font-bold text-white">Motorcycle Not Found</h1>
        <p className="text-sm text-zinc-400">{error || 'This model may have been removed or renamed.'}</p>
        <Link
          to="/catalog"
          className="inline-flex px-5 py-2.5 rounded-md bg-[#D91E2A] text-sm font-semibold text-white"
        >
          Return to Catalog
        </Link>
      </div>
    );
  }

  const gallery = bike.galleryUrls.length > 0 ? bike.galleryUrls : [bike.imageUrl];
  const isCompared = compareSlugs.includes(bike.slug);
  const isSaved = user?.savedBikeIds.includes(bike.id) ?? false;
  const verifiedFields = new Set(bike.verifiedFields ?? []);
  const verificationLabel = 'Not verified from a listed primary source';
  const bikeDescription = verifiedFields.has('description')
    ? bike.description
    : `${bike.name} is listed in the CHAND MOTORS catalog. Specifications and market availability should be confirmed with the manufacturer or an authorized local dealer before purchase.`;

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const productSchema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: bike.name,
      brand: { '@type': 'Brand', name: bike.brand },
      category: bike.category,
      description: bikeDescription,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
        { '@type': 'ListItem', position: 2, name: 'Motorcycles', item: `${origin}/catalog` },
        {
          '@type': 'ListItem',
          position: 3,
          name: bike.brand,
          item: `${origin}/catalog?brand=${encodeURIComponent(bike.brand)}`,
        },
        { '@type': 'ListItem', position: 4, name: bike.name, item: `${origin}/motorcycles/${bike.slug}` },
      ],
    },
  ];

  const specRows = [
    { field: 'cc', label: 'Engine Capacity', value: bike.engineCapacityLabel },
    { field: 'engineType', label: 'Engine Type', value: bike.engineType },
    { field: 'horsepower', label: 'Horsepower', value: bike.horsepower },
    { field: 'torque', label: 'Torque', value: bike.torque },
    { field: 'transmission', label: 'Transmission', value: bike.transmission },
    { field: 'fuelTankCapacity', label: 'Fuel Tank / Battery', value: bike.fuelTankCapacity },
    { field: 'mileage', label: 'Mileage / Range', value: bike.mileage },
    { field: 'topSpeed', label: 'Top Speed', value: bike.topSpeed },
    { field: 'brakingSystem', label: 'Braking System', value: bike.brakingSystem },
    { field: 'frontSuspension', label: 'Front Suspension', value: bike.frontSuspension },
    { field: 'rearSuspension', label: 'Rear Suspension', value: bike.rearSuspension },
    { field: 'dimensions', label: 'Dimensions (L × W × H)', value: bike.dimensions },
    { field: 'weight', label: 'Weight', value: bike.weight },
  ];

  return (
    <>
      <SEO
        title={`${bike.name} Price in Pakistan, Specs & Review | CHAND MOTORS`}
        description={`${bike.name} price information: ${bike.priceLabel.toLowerCase()} ${formatPkr(bike.estimatedPricePkr)}. Review source notes and request current Pakistani-market availability from CHAND MOTORS.`}
        path={`/motorcycles/${bike.slug}`}
        image={bike.imageUrl}
        type="product"
        structuredData={productSchema}
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-8 lg:py-12">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 mb-8">
          <Link to="/" className="hover:text-white">
            Home
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
          <Link to="/catalog" className="hover:text-white">
            Motorcycles
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
          <Link to={`/catalog?brand=${encodeURIComponent(bike.brand)}`} className="hover:text-white">
            {bike.brand}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
          <span className="text-zinc-200 font-medium">{bike.name}</span>
        </nav>

        {/* Top Purchase & Gallery Split */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="aspect-[4/3] rounded-lg overflow-hidden bg-[#141417] border border-zinc-800">
              <BikeImage
                src={activeImage || bike.imageUrl}
                alt={`Illustrative motorcycle artwork for ${bike.brand} ${bike.name}`}
                className="w-full h-full object-cover"
                priority
                fallbackLabel={bike.name}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Illustrative image; appearance may differ from the exact model year and trim.
            </p>

            {gallery.length > 1 && (
              <div className="grid grid-cols-4 gap-3">
                {gallery.map((imgUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveImage(imgUrl)}
                    className={`aspect-[4/3] rounded-md overflow-hidden border transition-colors cursor-pointer ${
                      activeImage === imgUrl ? 'border-[#D91E2A]' : 'border-zinc-800 hover:border-zinc-600'
                    }`}
                  >
                    <BikeImage
                      src={imgUrl}
                      alt={`${bike.name} view ${idx + 1}`}
                      className="w-full h-full object-cover"
                      fallbackLabel={bike.name}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contiguous Purchase & Concierge Module */}
          <div className="bg-[#141417] border border-zinc-800 rounded-lg p-6 sm:p-7 space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-zinc-400 mb-2">
                <span className="text-[#D91E2A] font-semibold">{bike.brand}</span>
                <span aria-hidden="true">·</span>
                <span>{bike.category}</span>
                <span aria-hidden="true">·</span>
                <span className="text-zinc-200">
                  {bike.availability === 'Availability Unconfirmed' ? 'Availability unconfirmed' : bike.availability}
                </span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight leading-none">
                {bike.name}
              </h1>
            </div>

            <div className="py-4 border-y border-zinc-800">
              <p className="text-3xl font-bold text-white tabular-nums">
                {formatPkr(bike.estimatedPricePkr)}
              </p>
              <p className="text-xs text-zinc-400 mt-1 tabular-nums">
                {bike.priceLabel} · Last updated {bike.priceUpdatedAt}
              </p>
              <p className="text-[11px] text-zinc-500 mt-2 leading-relaxed">
                {bike.priceLabel === 'Official Starting Price (PKR)'
                  ? 'Manufacturer-published starting price; dealer charges, registration, freight, and taxes may change the on-road total.'
                  : siteContent?.priceDisclaimer ||
                    'Indicative PKR estimate. City registration, freight, and filer/non-filer tax apply separately.'}
              </p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed">{bikeDescription}</p>
            <p className="text-xs text-zinc-500">
              Catalog information may vary by market and model year. Confirm specifications with the manufacturer before purchase.
            </p>

            {/* Available Colors */}
            {verifiedFields.has('colors') && <div>
              <p className="text-xs font-medium text-zinc-400 mb-2">Available Color Finishes</p>
              <p className="text-sm text-white font-medium">{bike.colors.join(' · ')}</p>
            </div>}

            {/* Key Features */}
            {verifiedFields.has('keyFeatures') && bike.keyFeatures.length > 0 && (
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
                  Key Highlights
                </h2>
                <ul className="space-y-2 text-sm text-zinc-200">
                  {bike.keyFeatures.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#D91E2A] shrink-0 mt-0.5" aria-hidden="true" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Primary Actions */}
            <div className="space-y-3 pt-2">
              <a
                href={buildWhatsAppUrl(bike.name)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 px-5 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Inquire on WhatsApp ({DEFAULT_WHATSAPP_DISPLAY})</span>
              </a>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => toggleCompare(bike.slug)}
                  aria-pressed={isCompared}
                  className={`h-11 px-4 rounded-md border text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                    isCompared
                      ? 'bg-[#D91E2A]/15 border-[#D91E2A] text-white'
                      : 'bg-[#0A0A0B] border-zinc-700 text-zinc-200 hover:border-zinc-500'
                  }`}
                >
                  <GitCompare className="w-4 h-4 text-[#D91E2A]" aria-hidden="true" />
                  <span>{isCompared ? 'In Compare List' : 'Add to Compare'}</span>
                </button>

                {user ? (
                  <button
                    type="button"
                    onClick={() => toggleSaveBike(bike.id)}
                    aria-pressed={isSaved}
                    className={`h-11 px-4 rounded-md border text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                      isSaved
                        ? 'bg-white text-zinc-950 border-white'
                        : 'bg-[#0A0A0B] border-zinc-700 text-zinc-200 hover:border-zinc-500'
                    }`}
                  >
                    <Bookmark className="w-4 h-4" aria-hidden="true" />
                    <span>{isSaved ? 'Saved in Garage' : 'Save Motorcycle'}</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="h-11 px-4 rounded-md border border-zinc-700 bg-[#0A0A0B] text-zinc-200 hover:border-zinc-500 text-xs font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                  >
                    <Bookmark className="w-4 h-4" aria-hidden="true" />
                    <span>Sign In to Save</span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Technical Specifications & Callback Form */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-10 mt-14 pt-12 border-t border-zinc-800">
          {/* Technical Specifications Table */}
          <div>
            <h2 className="font-display text-3xl font-bold text-white tracking-tight mb-6">
              Technical Specifications
            </h2>
            <div className="bg-[#141417] border border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-zinc-800/80">
                  {specRows.map((row) => (
                    <tr key={row.label} className="hover:bg-zinc-900/40">
                      <th scope="row" className="py-3.5 px-5 font-medium text-zinc-400 w-2/5">
                        {row.label}
                      </th>
                      <td className="py-3.5 px-5 text-zinc-100 font-mono text-xs sm:text-sm tabular-nums">
                        {verifiedFields.has(row.field) ? row.value : verificationLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Direct Showroom Callback Form */}
          <div>
            <h2 className="font-display text-3xl font-bold text-white tracking-tight mb-6">
            Request a Price Quote
            </h2>
            <form
              onSubmit={handleInquirySubmit}
              className="bg-[#141417] border border-zinc-800 rounded-lg p-6 space-y-4"
            >
              <p className="text-xs text-zinc-400 leading-relaxed">
                Submit your contact details for <strong className="text-white">{bike.name}</strong> to request current availability and city-specific pricing.
              </p>

              {inquiryError && (
                <div className="p-3 rounded bg-red-950/60 border border-red-800 text-xs text-red-200">
                  {inquiryError}
                </div>
              )}
              {inquirySuccess && (
                <div className="p-3 rounded bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200">
                  {inquirySuccess}
                </div>
              )}

              <div>
                <label htmlFor="inq-name" className="block text-xs font-medium text-zinc-400 mb-1">
                  Full Name *
                </label>
                <input
                  id="inq-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="inq-phone" className="block text-xs font-medium text-zinc-400 mb-1">
                    Phone / WhatsApp *
                  </label>
                  <input
                    id="inq-phone"
                    type="tel"
                    required
                    placeholder="03XX-XXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="inq-city" className="block text-xs font-medium text-zinc-400 mb-1">
                    City
                  </label>
                  <input
                    id="inq-city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="inq-email" className="block text-xs font-medium text-zinc-400 mb-1">
                  Email (Optional)
                </label>
                <input
                  id="inq-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>

              <div>
                <label htmlFor="inq-message" className="block text-xs font-medium text-zinc-400 mb-1">
                  Message *
                </label>
                <textarea
                  id="inq-message"
                  rows={3}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full p-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full h-11 px-4 rounded-md bg-[#D91E2A] hover:bg-[#b91822] disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Send className="w-4 h-4" aria-hidden="true" />
                <span>{submitting ? 'Submitting...' : 'Submit Inquiry'}</span>
              </button>
            </form>
          </div>
        </div>

        <section className="mt-12 p-6 rounded-lg bg-[#141417] border border-zinc-800">
          <h2 className="font-display text-2xl font-bold text-white">Source References &amp; Data Notes</h2>
          {(bike.sourceUrls ?? []).length > 0 ? (
            <>
              <p className="text-sm text-zinc-400 mt-2">
                Manufacturer reference{(bike.sourceUrls ?? []).length > 1 ? 's' : ''} checked on{' '}
                {bike.sourceCheckedAt || 'date not recorded'}. These pages may not verify every specification shown or
                confirm Pakistani-market pricing and availability.
              </p>
              <p className="text-xs text-zinc-500 mt-2">
                Field-level source coverage: {(bike.verifiedFields ?? []).length > 0
                  ? (bike.verifiedFields ?? [])
                      .map((field) => VERIFIED_FIELD_LABELS[field] ?? field)
                      .filter(Boolean)
                      .join(', ')
                  : 'no individual fields verified'}.
              </p>
              <ul className="mt-4 space-y-2">
                {(bike.sourceUrls ?? []).map((url) => (
                  <li key={url}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-300 underline underline-offset-2 hover:text-red-200 break-all"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-zinc-400 mt-2">
              No primary manufacturer source has been recorded for this model. Specifications and the dated market
              estimate are not independently verified; confirm them with the manufacturer or an authorized local dealer
              before purchase.
            </p>
          )}
        </section>

        {/* Related Motorcycles */}
        {related.length > 0 && (
          <section className="mt-16 pt-12 border-t border-zinc-800">
            <h2 className="font-display text-3xl font-bold text-white tracking-tight mb-8">
              Similar &amp; Related Motorcycles
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {related.map((item) => (
                <BikeCard key={item.id} bike={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
