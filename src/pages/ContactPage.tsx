import { useEffect, useState } from 'react';
import { Clock, MapPin, MessageCircle, Phone, Send } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { buildWhatsAppUrl, DEFAULT_WHATSAPP_DISPLAY } from '../lib/format.ts';

export function ContactPage() {
  const { motorcycles, siteContent } = useCatalog();
  const { user } = useAuth();

  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('Lahore');
  const [motorcycleName, setMotorcycleName] = useState('General Showroom Inquiry');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setCustomerName((p) => p || user.name);
      setPhone((p) => p || user.phone);
      setEmail((p) => p || user.email);
      setCity((p) => p || user.city || 'Lahore');
    }
  }, [user]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const selectedBike = motorcycles.find((m) => m.name === motorcycleName);
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          customerName,
          phone,
          email,
          city,
          motorcycleId: selectedBike?.id ?? null,
          motorcycleName,
          message,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Unable to submit inquiry.');
      setSuccess(
        `Inquiry #${data.inquiry.id} logged successfully. For immediate assistance, message us on WhatsApp at ${DEFAULT_WHATSAPP_DISPLAY}.`,
      );
      setMessage('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission error.');
    } finally {
      setSubmitting(false);
    }
  }

  const whatsappDisplay = siteContent?.whatsappNumber || DEFAULT_WHATSAPP_DISPLAY;

  return (
    <>
      <SEO
        title="Contact CHAND MOTORS Lahore | WhatsApp 03217293026"
        description="Contact CHAND MOTORS in Lahore, Pakistan for motorcycle prices, CBU bookings, inspections, and WhatsApp inquiries on 03217293026."
        path="/contact"
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14">
        <div className="pb-8 border-b border-zinc-800">
          <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
            Showroom &amp; Dealer Desk
          </p>
          <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
            Contact CHAND MOTORS
          </h1>
          <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
            Visit our Gulberg III showroom in Lahore, submit a booking request, or start a live WhatsApp conversation.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 mt-10">
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Showroom Details</h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#D91E2A] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-white">Flagship Showroom</p>
                    <p className="text-zinc-400">
                      {siteContent?.showroomAddress || 'Plot 14-C, Main Boulevard, Gulberg III'},{' '}
                      {siteContent?.showroomCity || 'Lahore, Pakistan'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#D91E2A] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-white">Direct WhatsApp &amp; Phone</p>
                    <p className="text-zinc-300 tabular-nums">{whatsappDisplay}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#D91E2A] shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-semibold text-white">Operating Hours</p>
                    <p className="text-zinc-400">
                      {siteContent?.showroomHours || 'Mon – Sat · 10:00 AM – 8:00 PM PKT'}
                    </p>
                  </div>
                </div>
              </div>

              <a
                href={buildWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-12 px-5 rounded-md bg-[#16A34A] hover:bg-[#15803D] text-white text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" aria-hidden="true" />
                <span>Chat on WhatsApp ({whatsappDisplay})</span>
              </a>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-8 rounded-lg bg-[#141417] border border-zinc-800 space-y-5"
          >
            <h2 className="font-display text-2xl font-bold text-white">Send an Inquiry</h2>

            {error && (
              <div className="p-3.5 rounded bg-red-950/60 border border-red-800 text-xs text-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3.5 rounded bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200">
                {success}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Full Name *
                </label>
                <input
                  id="contact-name"
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-phone" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Phone / WhatsApp *
                </label>
                <input
                  id="contact-phone"
                  type="tel"
                  required
                  placeholder="03XX-XXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-email" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  Email (Optional)
                </label>
                <input
                  id="contact-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="contact-city" className="block text-xs font-medium text-zinc-400 mb-1.5">
                  City
                </label>
                <input
                  id="contact-city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-model" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Motorcycle of Interest
              </label>
              <select
                id="contact-model"
                value={motorcycleName}
                onChange={(e) => setMotorcycleName(e.target.value)}
                className="w-full h-11 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              >
                <option value="General Showroom Inquiry">General Showroom Inquiry</option>
                {motorcycles.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} ({m.brand})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact-msg" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Message *
              </label>
              <textarea
                id="contact-msg"
                rows={4}
                required
                placeholder="Tell us your preferred color, city for registration, or questions..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full h-12 px-5 rounded-md bg-[#D91E2A] hover:bg-[#b91822] disabled:opacity-60 text-sm font-semibold text-white inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" aria-hidden="true" />
              <span>{submitting ? 'Sending...' : 'Send Inquiry'}</span>
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
