import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck, LogOut, Save } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { BikeCard } from '../components/BikeCard.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';
import type { Inquiry } from '../types/motorcycle.ts';

export function ProfilePage() {
  const { user, loading, updateProfile, logout } = useAuth();
  const { motorcycles } = useCatalog();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [myInquiries, setMyInquiries] = useState<Inquiry[]>([]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone);
      setCity(user.city);

      fetch('/api/my/inquiries', { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { inquiries: [] }))
        .then((d) => setMyInquiries(d.inquiries || []))
        .catch(() => setMyInquiries([]));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16">
        <div className="h-64 rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const savedBikes = motorcycles.filter((m) => user.savedBikeIds.includes(m.id));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await updateProfile({ name, phone, city });
      setStatusMsg('Profile details saved.');
    } catch (err) {
      setStatusMsg(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SEO
        title="My Profile & Saved Garage | CHAND MOTORS"
        description="Manage your CHAND MOTORS profile, saved motorcycles, and dealer inquiries."
        path="/profile"
        noindex
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 lg:py-14 space-y-12">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-zinc-800">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1.5">
              Member Account
            </p>
            <h1 className="font-display text-4xl font-bold text-white tracking-tight">
              Welcome, {user.name}
            </h1>
            <p className="text-sm text-zinc-400 mt-1">
              {user.email} · {user.role === 'admin' ? 'Administrator' : 'Registered Rider'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-xs font-semibold text-white whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4" aria-hidden="true" />
                <span>Open Admin Dashboard</span>
              </Link>
            )}
            <button
              type="button"
              onClick={() => logout()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-zinc-900 border border-zinc-700 text-xs font-semibold text-zinc-200 hover:text-white cursor-pointer"
            >
              <LogOut className="w-4 h-4" aria-hidden="true" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-10">
          {/* Edit Profile */}
          <form
            onSubmit={handleSave}
            className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-4 h-fit"
          >
            <h2 className="font-display text-2xl font-bold text-white">Profile Information</h2>

            {statusMsg && (
              <div className="p-3 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-200">
                {statusMsg}
              </div>
            )}

            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prof-phone" className="block text-xs font-medium text-zinc-400 mb-1.5">
                Phone / WhatsApp Number
              </label>
              <input
                id="prof-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              />
            </div>

            <div>
              <label htmlFor="prof-city" className="block text-xs font-medium text-zinc-400 mb-1.5">
                City
              </label>
              <input
                id="prof-city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full h-10 px-3 rounded-md bg-[#0A0A0B] border border-zinc-700 text-sm text-white focus:border-[#D91E2A] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-semibold cursor-pointer"
            >
              <Save className="w-4 h-4" aria-hidden="true" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>

          {/* Inquiry History */}
          <div className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-4">
            <h2 className="font-display text-2xl font-bold text-white">Your Showroom Inquiries</h2>
            {myInquiries.length === 0 ? (
              <p className="text-sm text-zinc-400">
                You have not submitted any quote requests yet. Visit any motorcycle page to request an invoice or message us on WhatsApp.
              </p>
            ) : (
              <div className="divide-y divide-zinc-800">
                {myInquiries.map((inq) => (
                  <div key={inq.id} className="py-4 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-white text-sm">{inq.motorcycleName}</span>
                      <span className="text-xs font-mono text-zinc-300">Status: {inq.status}</span>
                    </div>
                    <p className="text-xs text-zinc-400">{inq.message}</p>
                    <p className="text-[11px] text-zinc-500 tabular-nums">
                      Submitted {inq.createdAt.slice(0, 10)} · {inq.city}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Saved Garage */}
        <section className="pt-8 border-t border-zinc-800">
          <h2 className="font-display text-3xl font-bold text-white mb-6">
            Saved Garage ({savedBikes.length})
          </h2>
          {savedBikes.length === 0 ? (
            <div className="p-8 rounded-lg bg-[#141417] border border-zinc-800 text-center space-y-3">
              <p className="text-sm text-zinc-400">Your saved garage is currently empty.</p>
              <Link
                to="/catalog"
                className="inline-flex px-4 py-2 rounded-md bg-[#D91E2A] text-xs font-semibold text-white"
              >
                Explore Motorcycles
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedBikes.map((bike) => (
                <BikeCard key={bike.id} bike={bike} />
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
