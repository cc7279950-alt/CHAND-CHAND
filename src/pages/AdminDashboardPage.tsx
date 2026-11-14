import { useCallback, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mail, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react';
import { SEO } from '../components/SEO.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { useCatalog } from '../context/CatalogContext.tsx';
import { BUNDLED_IMAGE_OPTIONS } from '../lib/imageMap.ts';
import { buildWhatsAppUrl, formatPkr } from '../lib/format.ts';
import type {
  BikeCategory,
  Inquiry,
  Motorcycle,
  SignInNotification,
  SiteContent,
  UserProfile,
} from '../types/motorcycle.ts';

type AdminTab = 'overview' | 'motorcycles' | 'taxonomy' | 'inquiries' | 'users' | 'alerts' | 'content';

const CATEGORIES: BikeCategory[] = [
  'Sports Bikes',
  'Racing Bikes',
  'Naked Bikes',
  'Cruiser Bikes',
  'Touring Bikes',
  'Commuter Bikes',
  'Electric Bikes',
  'Premium Bikes',
];

const EMPTY_BIKE_FORM = {
  id: 0,
  name: '',
  brand: 'Honda',
  category: 'Commuter Bikes' as BikeCategory,
  cc: 125,
  engineCapacityLabel: '125 cc',
  engineType: '4-Stroke Air-Cooled Single Cylinder',
  horsepower: 'Not officially rated by OEM',
  torque: 'Not officially rated by OEM',
  transmission: '4-Speed Constant Mesh',
  fuelTankCapacity: '9.5 Litres',
  mileage: '40–45 km/l',
  topSpeed: 'Not officially rated by OEM',
  brakingSystem: 'Front Disc / Rear Drum',
  frontSuspension: 'Telescopic Fork',
  rearSuspension: 'Dual Shock Absorber',
  dimensions: '1950 × 750 × 1050 mm',
  weight: '110 kg',
  colorsText: 'Black, Red',
  estimatedPricePkr: 250000,
  priceLabel: 'Estimated Ex-Showroom (PKR)',
  priceUpdatedAt: new Date().toISOString().slice(0, 10),
  featuresText: 'Electric & Kick Start\nAlloy Rims',
  description: '',
  imageUrl: BUNDLED_IMAGE_OPTIONS[2].value,
  availability: 'In Stock' as Motorcycle['availability'],
  isFeatured: false,
  isLatestArrival: true,
};

export function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { motorcycles, brands, categories, guides, siteContent, refreshCatalog } = useCatalog();

  const [tab, setTab] = useState<AdminTab>('overview');
  const [stats, setStats] = useState({ motorcycles: 0, brands: 0, categories: 0, users: 0, openInquiries: 0 });
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [signinAlerts, setSigninAlerts] = useState<SignInNotification[]>([]);
  const [mailerStatus, setMailerStatus] = useState({ configured: false, provider: 'Not configured', recipient: 'cc7279950@gmail.com' });
  const [testingEmail, setTestingEmail] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Bike create/edit state
  const [bikeFormOpen, setBikeFormOpen] = useState(false);
  const [bikeForm, setBikeForm] = useState(EMPTY_BIKE_FORM);

  // Brand & Category creation state
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandCountry, setNewBrandCountry] = useState('Japan');
  const [newBrandSummary, setNewBrandSummary] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  // Site Content state
  const [contentForm, setContentForm] = useState<SiteContent | null>(null);

  // Guide publisher state
  const [guideTitle, setGuideTitle] = useState('');
  const [guideCat, setGuideCat] = useState('Buying Guide');
  const [guideExcerpt, setGuideExcerpt] = useState('');
  const [guideBody, setGuideBody] = useState('');

  const loadAdminData = useCallback(async () => {
    try {
      const [ovRes, inqRes, usrRes, alertsRes] = await Promise.all([
        fetch('/api/admin/overview', { credentials: 'include' }),
        fetch('/api/admin/inquiries', { credentials: 'include' }),
        fetch('/api/admin/users', { credentials: 'include' }),
        fetch('/api/admin/signin-alerts', { credentials: 'include' }),
      ]);
      if (ovRes.ok) {
        const d = await ovRes.json();
        setStats(d.stats);
      }
      if (inqRes.ok) {
        const d = await inqRes.json();
        setInquiries(d.inquiries || []);
      }
      if (usrRes.ok) {
        const d = await usrRes.json();
        setUsersList(d.users || []);
      }
      if (alertsRes.ok) {
        const d = await alertsRes.json();
        setSigninAlerts(d.alerts || []);
        if (d.mailer) setMailerStatus(d.mailer);
      }
    } catch {
      // Handled via UI feedback
    }
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadAdminData();
    }
  }, [user, loadAdminData]);

  useEffect(() => {
    if (siteContent) {
      setContentForm(siteContent);
    }
  }, [siteContent]);

  if (authLoading) {
    return (
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-16">
        <div className="h-64 rounded-lg bg-[#141417] border border-zinc-800 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== 'admin') {
    return (
      <div className="max-w-[760px] mx-auto px-4 sm:px-6 py-24 text-center space-y-4">
        <SEO title="Access Denied | CHAND MOTORS" description="Administrator privileges required." noindex />
        <h1 className="font-display text-4xl font-bold text-white">Administrator Access Required</h1>
        <p className="text-sm text-zinc-400">
          Your account ({user.email}) does not hold showroom administrator permissions.
        </p>
      </div>
    );
  }

  function openNewBikeForm() {
    setBikeForm(EMPTY_BIKE_FORM);
    setBikeFormOpen(true);
    setFeedback(null);
    setErrorMsg(null);
  }

  function openEditBikeForm(m: Motorcycle) {
    setBikeForm({
      id: m.id,
      name: m.name,
      brand: m.brand,
      category: m.category,
      cc: m.cc,
      engineCapacityLabel: m.engineCapacityLabel,
      engineType: m.engineType,
      horsepower: m.horsepower,
      torque: m.torque,
      transmission: m.transmission,
      fuelTankCapacity: m.fuelTankCapacity,
      mileage: m.mileage,
      topSpeed: m.topSpeed,
      brakingSystem: m.brakingSystem,
      frontSuspension: m.frontSuspension,
      rearSuspension: m.rearSuspension,
      dimensions: m.dimensions,
      weight: m.weight,
      colorsText: m.colors.join(', '),
      estimatedPricePkr: m.estimatedPricePkr,
      priceLabel: m.priceLabel,
      priceUpdatedAt: m.priceUpdatedAt,
      featuresText: m.keyFeatures.join('\n'),
      description: m.description,
      imageUrl: m.imageUrl,
      availability: m.availability,
      isFeatured: m.isFeatured,
      isLatestArrival: m.isLatestArrival,
    });
    setBikeFormOpen(true);
    setFeedback(null);
    setErrorMsg(null);
  }

  async function handleSaveBike(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);

    const payload = {
      name: bikeForm.name,
      brand: bikeForm.brand,
      category: bikeForm.category,
      cc: Number(bikeForm.cc),
      engineCapacityLabel: bikeForm.engineCapacityLabel,
      engineType: bikeForm.engineType,
      horsepower: bikeForm.horsepower,
      torque: bikeForm.torque,
      transmission: bikeForm.transmission,
      fuelTankCapacity: bikeForm.fuelTankCapacity,
      mileage: bikeForm.mileage,
      topSpeed: bikeForm.topSpeed,
      brakingSystem: bikeForm.brakingSystem,
      frontSuspension: bikeForm.frontSuspension,
      rearSuspension: bikeForm.rearSuspension,
      dimensions: bikeForm.dimensions,
      weight: bikeForm.weight,
      colors: bikeForm.colorsText.split(',').map((c) => c.trim()).filter(Boolean),
      estimatedPricePkr: Number(bikeForm.estimatedPricePkr),
      priceLabel: bikeForm.priceLabel,
      priceUpdatedAt: bikeForm.priceUpdatedAt,
      keyFeatures: bikeForm.featuresText.split('\n').map((f) => f.trim()).filter(Boolean),
      description: bikeForm.description,
      imageUrl: bikeForm.imageUrl,
      availability: bikeForm.availability,
      isFeatured: bikeForm.isFeatured,
      isLatestArrival: bikeForm.isLatestArrival,
    };

    const url = bikeForm.id ? `/api/admin/motorcycles/${bikeForm.id}` : '/api/admin/motorcycles';
    const method = bikeForm.id ? 'PUT' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Could not save motorcycle.');
      return;
    }

    setBikeFormOpen(false);
    setFeedback(bikeForm.id ? `Updated ${data.motorcycle.name}.` : `Added ${data.motorcycle.name}.`);
    await Promise.all([refreshCatalog(), loadAdminData()]);
  }

  async function handleDeleteBike(id: number, name: string) {
    const res = await fetch(`/api/admin/motorcycles/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    if (res.ok) {
      setFeedback(`Deleted ${name}.`);
      await Promise.all([refreshCatalog(), loadAdminData()]);
    }
  }

  async function handleAddBrand(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const res = await fetch('/api/admin/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newBrandName, country: newBrandCountry, summary: newBrandSummary }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Unable to add brand.');
      return;
    }
    setNewBrandName('');
    setNewBrandSummary('');
    setFeedback(`Added brand ${data.brand.name}.`);
    await Promise.all([refreshCatalog(), loadAdminData()]);
  }

  async function handleDeleteBrand(id: number) {
    await fetch(`/api/admin/brands/${id}`, { method: 'DELETE', credentials: 'include' });
    await Promise.all([refreshCatalog(), loadAdminData()]);
  }

  async function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    const res = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name: newCatName, description: newCatDesc }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Unable to add category.');
      return;
    }
    setNewCatName('');
    setNewCatDesc('');
    setFeedback(`Added category ${data.category.name}.`);
    await Promise.all([refreshCatalog(), loadAdminData()]);
  }

  async function handleUpdateInquiryStatus(id: number, status: Inquiry['status']) {
    const res = await fetch(`/api/admin/inquiries/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      await loadAdminData();
    }
  }

  async function handleUpdateUserRole(id: number, role: 'customer' | 'admin') {
    setErrorMsg(null);
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      setErrorMsg(data.error || 'Could not update role.');
      return;
    }
    await loadAdminData();
  }

  async function handleSaveContent(e: React.FormEvent) {
    e.preventDefault();
    if (!contentForm) return;
    const res = await fetch('/api/admin/content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(contentForm),
    });
    if (res.ok) {
      setFeedback('Website content updated.');
      await refreshCatalog();
    }
  }

  async function handlePublishGuide(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch('/api/admin/guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: guideTitle,
        category: guideCat,
        excerpt: guideExcerpt,
        contentParagraphs: guideBody,
      }),
    });
    if (res.ok) {
      setGuideTitle('');
      setGuideExcerpt('');
      setGuideBody('');
      setFeedback('Guide article published.');
      await refreshCatalog();
    }
  }

  async function handleDeleteGuide(id: number) {
    await fetch(`/api/admin/guides/${id}`, { method: 'DELETE', credentials: 'include' });
    await refreshCatalog();
  }

  async function handleTestEmail() {
    setTestingEmail(true);
    setFeedback(null);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/admin/signin-alerts/test', {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback(data.detail);
      } else {
        setErrorMsg(data.detail || 'Email test failed.');
      }
    } catch {
      setErrorMsg('Unable to reach test email endpoint.');
    } finally {
      setTestingEmail(false);
    }
  }

  const tabs: { key: AdminTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'motorcycles', label: `Motorcycles (${motorcycles.length})` },
    { key: 'taxonomy', label: 'Brands & Categories' },
    { key: 'inquiries', label: `Inquiries (${inquiries.length})` },
    { key: 'users', label: `Users (${usersList.length})` },
    { key: 'alerts', label: `Sign-In Alerts (${signinAlerts.length})` },
    { key: 'content', label: 'Website Content & Guides' },
  ];

  return (
    <>
      <SEO
        title="Admin Dashboard | CHAND MOTORS"
        description="Manage motorcycles, pricing, brands, categories, customer inquiries, users, and showroom content."
        path="/admin"
        noindex
      />

      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="pb-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] uppercase text-[#D91E2A] mb-1">
              Showroom Administration
            </p>
            <h1 className="font-display text-4xl font-bold text-white tracking-tight">
              CHAND MOTORS Control Panel
            </h1>
          </div>

          <button
            type="button"
            onClick={() => {
              setTab('motorcycles');
              openNewBikeForm();
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-xs font-semibold text-white whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Add Motorcycle</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-[#141417] border border-zinc-800 rounded-lg">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                tab === t.key ? 'bg-[#D91E2A] text-white' : 'text-zinc-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {feedback && (
          <div className="p-3.5 rounded bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-200">
            {feedback}
          </div>
        )}
        {errorMsg && (
          <div className="p-3.5 rounded bg-red-950/60 border border-red-800 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {/* TAB 1: Overview */}
        {tab === 'overview' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Motorcycles', value: stats.motorcycles },
              { label: 'Brands', value: stats.brands },
              { label: 'Categories', value: stats.categories },
              { label: 'Registered Users', value: stats.users },
              { label: 'New Inquiries', value: stats.openInquiries },
            ].map((item) => (
              <div key={item.label} className="p-5 rounded-lg bg-[#141417] border border-zinc-800">
                <p className="text-xs text-zinc-400">{item.label}</p>
                <p className="font-display text-4xl font-bold text-white mt-2 tabular-nums">
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Motorcycles */}
        {tab === 'motorcycles' && (
          <div className="space-y-6">
            {bikeFormOpen && (
              <form
                onSubmit={handleSaveBike}
                className="p-6 rounded-lg bg-[#141417] border border-zinc-700 space-y-5"
              >
                <div className="flex items-center justify-between">
                  <h2 className="font-display text-2xl font-bold text-white">
                    {bikeForm.id ? `Edit ${bikeForm.name}` : 'Add New Motorcycle'}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setBikeFormOpen(false)}
                    className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Model Name *</label>
                    <input
                      type="text"
                      required
                      value={bikeForm.name}
                      onChange={(e) => setBikeForm({ ...bikeForm, name: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Brand *</label>
                    <input
                      type="text"
                      required
                      value={bikeForm.brand}
                      onChange={(e) => setBikeForm({ ...bikeForm, brand: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Category *</label>
                    <select
                      value={bikeForm.category}
                      onChange={(e) => setBikeForm({ ...bikeForm, category: e.target.value as BikeCategory })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Estimated Price (PKR) *</label>
                    <input
                      type="number"
                      required
                      value={bikeForm.estimatedPricePkr}
                      onChange={(e) => setBikeForm({ ...bikeForm, estimatedPricePkr: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">CC (0 for Electric)</label>
                    <input
                      type="number"
                      value={bikeForm.cc}
                      onChange={(e) => setBikeForm({ ...bikeForm, cc: Number(e.target.value) })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Capacity Display Label</label>
                    <input
                      type="text"
                      value={bikeForm.engineCapacityLabel}
                      onChange={(e) => setBikeForm({ ...bikeForm, engineCapacityLabel: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Engine Type</label>
                    <input
                      type="text"
                      value={bikeForm.engineType}
                      onChange={(e) => setBikeForm({ ...bikeForm, engineType: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Horsepower</label>
                    <input
                      type="text"
                      value={bikeForm.horsepower}
                      onChange={(e) => setBikeForm({ ...bikeForm, horsepower: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Torque</label>
                    <input
                      type="text"
                      value={bikeForm.torque}
                      onChange={(e) => setBikeForm({ ...bikeForm, torque: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Transmission</label>
                    <input
                      type="text"
                      value={bikeForm.transmission}
                      onChange={(e) => setBikeForm({ ...bikeForm, transmission: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Fuel Tank / Battery</label>
                    <input
                      type="text"
                      value={bikeForm.fuelTankCapacity}
                      onChange={(e) => setBikeForm({ ...bikeForm, fuelTankCapacity: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Braking System</label>
                    <input
                      type="text"
                      value={bikeForm.brakingSystem}
                      onChange={(e) => setBikeForm({ ...bikeForm, brakingSystem: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Image Asset</label>
                    <select
                      value={bikeForm.imageUrl}
                      onChange={(e) => setBikeForm({ ...bikeForm, imageUrl: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    >
                      {BUNDLED_IMAGE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Availability</label>
                    <select
                      value={bikeForm.availability}
                      onChange={(e) =>
                        setBikeForm({ ...bikeForm, availability: e.target.value as Motorcycle['availability'] })
                      }
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    >
                      <option value="In Stock">In Stock</option>
                      <option value="On Booking">On Booking</option>
                      <option value="Limited Import">Limited Import</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 mb-1">Colors (comma separated)</label>
                    <input
                      type="text"
                      value={bikeForm.colorsText}
                      onChange={(e) => setBikeForm({ ...bikeForm, colorsText: e.target.value })}
                      className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={bikeForm.description}
                    onChange={(e) => setBikeForm({ ...bikeForm, description: e.target.value })}
                    className="w-full p-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-6">
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bikeForm.isFeatured}
                      onChange={(e) => setBikeForm({ ...bikeForm, isFeatured: e.target.checked })}
                    />
                    <span>Featured on Home</span>
                  </label>
                  <label className="inline-flex items-center gap-2 text-xs text-zinc-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={bikeForm.isLatestArrival}
                      onChange={(e) => setBikeForm({ ...bikeForm, isLatestArrival: e.target.checked })}
                    />
                    <span>Latest Arrival</span>
                  </label>
                </div>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-md bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
                >
                  {bikeForm.id ? 'Update Motorcycle' : 'Save Motorcycle'}
                </button>
              </form>
            )}

            <div className="bg-[#141417] border border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[780px]">
                <thead className="border-b border-zinc-800 text-xs text-zinc-400 bg-[#101013]">
                  <tr>
                    <th className="py-3 px-4">Model</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">CC</th>
                    <th className="py-3 px-4">Est. Price (PKR)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {motorcycles.map((m) => (
                    <tr key={m.id} className="hover:bg-zinc-900/40">
                      <td className="py-3 px-4 font-semibold text-white">{m.name}</td>
                      <td className="py-3 px-4 text-zinc-300">{m.brand}</td>
                      <td className="py-3 px-4 text-zinc-400">{m.category}</td>
                      <td className="py-3 px-4 font-mono text-xs text-zinc-300 tabular-nums">
                        {m.engineCapacityLabel}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-white tabular-nums">
                        {formatPkr(m.estimatedPricePkr)}
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300">{m.availability}</td>
                      <td className="py-3 px-4 text-right space-x-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openEditBikeForm(m)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-zinc-200 hover:text-white cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBike(m.id, m.name)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-xs text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: Brands & Categories */}
        {tab === 'taxonomy' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Manage Brands</h2>
              <form onSubmit={handleAddBrand} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Brand Name"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    className="h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                  />
                  <input
                    type="text"
                    placeholder="Country"
                    value={newBrandCountry}
                    onChange={(e) => setNewBrandCountry(e.target.value)}
                    className="h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Short manufacturer summary"
                  value={newBrandSummary}
                  onChange={(e) => setNewBrandSummary(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
                >
                  Add Brand
                </button>
              </form>

              <div className="divide-y divide-zinc-800">
                {brands.map((b) => (
                  <div key={b.id} className="py-3 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-white">{b.name}</p>
                      <p className="text-xs text-zinc-400">{b.country}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBrand(b.id)}
                      className="text-xs text-red-400 hover:text-red-300 cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Manage Categories</h2>
              <form onSubmit={handleAddCategory} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Category Name"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Description"
                  value={newCatDesc}
                  onChange={(e) => setNewCatDesc(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
                >
                  Add Category
                </button>
              </form>

              <div className="divide-y divide-zinc-800">
                {categories.map((c) => (
                  <div key={c.id} className="py-3 flex items-center justify-between gap-2 text-sm">
                    <div>
                      <p className="font-semibold text-white">{c.name}</p>
                      <p className="text-xs text-zinc-400 line-clamp-1">{c.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Inquiries */}
        {tab === 'inquiries' && (
          <div className="bg-[#141417] border border-zinc-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[780px]">
              <thead className="border-b border-zinc-800 text-xs text-zinc-400 bg-[#101013]">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Phone &amp; City</th>
                  <th className="py-3 px-4">Motorcycle</th>
                  <th className="py-3 px-4">Message</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Follow Up</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {inquiries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 text-sm">
                      No customer inquiries submitted yet.
                    </td>
                  </tr>
                ) : (
                  inquiries.map((inq) => (
                    <tr key={inq.id}>
                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{inq.customerName}</p>
                        <p className="text-xs text-zinc-500">{inq.email || 'No email'}</p>
                      </td>
                      <td className="py-3 px-4 text-xs text-zinc-300 tabular-nums">
                        <p>{inq.phone}</p>
                        <p className="text-zinc-500">{inq.city}</p>
                      </td>
                      <td className="py-3 px-4 text-zinc-200">{inq.motorcycleName}</td>
                      <td className="py-3 px-4 text-xs text-zinc-400 max-w-xs">{inq.message}</td>
                      <td className="py-3 px-4">
                        <select
                          aria-label={`Status for inquiry ${inq.id}`}
                          value={inq.status}
                          onChange={(e) =>
                            handleUpdateInquiryStatus(inq.id, e.target.value as Inquiry['status'])
                          }
                          className="h-9 px-2 rounded bg-[#0A0A0B] border border-zinc-700 text-xs text-white"
                        >
                          <option value="New">New</option>
                          <option value="Contacted">Contacted</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <a
                          href={buildWhatsAppUrl(
                            inq.motorcycleName,
                            `Assalam-o-Alaikum ${inq.customerName}, thank you for contacting CHAND MOTORS regarding ${inq.motorcycleName}.`,
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-[#16A34A] text-xs font-semibold text-white"
                        >
                          <MessageCircle className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>WhatsApp</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 5: Registered Users */}
        {tab === 'users' && (
          <div className="bg-[#141417] border border-zinc-800 rounded-lg overflow-x-auto">
            <table className="w-full text-left text-sm min-w-[680px]">
              <thead className="border-b border-zinc-800 text-xs text-zinc-400 bg-[#101013]">
                <tr>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Email</th>
                  <th className="py-3 px-4">Phone / City</th>
                  <th className="py-3 px-4">Joined</th>
                  <th className="py-3 px-4">Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/70">
                {usersList.map((u) => (
                  <tr key={u.id}>
                    <td className="py-3 px-4 font-semibold text-white">{u.name}</td>
                    <td className="py-3 px-4 text-zinc-300">{u.email}</td>
                    <td className="py-3 px-4 text-xs text-zinc-400 tabular-nums">
                      {u.phone || '—'} · {u.city}
                    </td>
                    <td className="py-3 px-4 text-xs text-zinc-500 tabular-nums">
                      {u.createdAt.slice(0, 10)}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        aria-label={`Role for ${u.email}`}
                        value={u.role}
                        disabled={u.id === user.id}
                        onChange={(e) =>
                          handleUpdateUserRole(u.id, e.target.value as 'customer' | 'admin')
                        }
                        className="h-9 px-2 rounded bg-[#0A0A0B] border border-zinc-700 text-xs text-white disabled:opacity-60"
                      >
                        <option value="customer">customer</option>
                        <option value="admin">admin</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 6: Sign-In Email Alerts */}
        {tab === 'alerts' && (
          <div className="space-y-6">
            <div className="p-6 rounded-lg bg-[#141417] border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-display text-2xl font-bold text-white">
                  Owner Sign-In Email Notification Status
                </h2>
                <p className="text-sm text-zinc-400">
                  Recipient: <strong className="text-white">{mailerStatus.recipient}</strong> · Mailer:{' '}
                  <strong className={mailerStatus.configured ? 'text-emerald-400' : 'text-amber-400'}>
                    {mailerStatus.provider}
                  </strong>
                </p>
                {!mailerStatus.configured && (
                  <p className="text-xs text-zinc-400 pt-1 max-w-2xl leading-relaxed">
                    To deliver real emails to your Gmail inbox whenever anyone signs in or registers, add{' '}
                    <code className="font-mono text-zinc-200">GMAIL_USER</code> and{' '}
                    <code className="font-mono text-zinc-200">GMAIL_APP_PASSWORD</code> (16-character Google App Password) in AI Studio Secrets.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={testingEmail}
                onClick={handleTestEmail}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-[#D91E2A] hover:bg-[#b91822] disabled:opacity-60 text-xs font-semibold text-white whitespace-nowrap self-start md:self-auto cursor-pointer"
              >
                <Mail className="w-4 h-4" aria-hidden="true" />
                <span>{testingEmail ? 'Sending Test...' : 'Send Test Email'}</span>
              </button>
            </div>

            <div className="bg-[#141417] border border-zinc-800 rounded-lg overflow-x-auto">
              <table className="w-full text-left text-sm min-w-[780px]">
                <thead className="border-b border-zinc-800 text-xs text-zinc-400 bg-[#101013]">
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Event</th>
                    <th className="py-3 px-4">User</th>
                    <th className="py-3 px-4">IP Address</th>
                    <th className="py-3 px-4">Recipient</th>
                    <th className="py-3 px-4">Email Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/70">
                  {signinAlerts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-400 text-sm">
                        No sign-in or registration events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    signinAlerts.map((al) => (
                      <tr key={al.id}>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400 tabular-nums">
                          {al.createdAt.replace('T', ' ').slice(0, 19)}
                        </td>
                        <td className="py-3 px-4 text-xs font-semibold text-white">
                          {al.eventType === 'register' ? 'New Registration' : 'Sign In'}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-white">{al.userName}</p>
                          <p className="text-xs text-zinc-400">{al.userEmail}</p>
                        </td>
                        <td className="py-3 px-4 font-mono text-xs text-zinc-400 tabular-nums">
                          {al.ipAddress}
                        </td>
                        <td className="py-3 px-4 text-xs text-zinc-300">{al.recipientEmail}</td>
                        <td className="py-3 px-4 text-xs">
                          <p
                            className={
                              al.emailStatus === 'sent'
                                ? 'text-emerald-400 font-semibold'
                                : al.emailStatus === 'failed'
                                  ? 'text-red-400 font-semibold'
                                  : 'text-amber-400 font-semibold'
                            }
                          >
                            {al.emailStatus === 'sent'
                              ? 'Delivered'
                              : al.emailStatus === 'failed'
                                ? 'Delivery Failed'
                                : 'Pending SMTP Secret'}
                          </p>
                          <p className="text-[11px] text-zinc-500 max-w-xs truncate" title={al.statusDetail}>
                            {al.statusDetail}
                          </p>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 7: Website Content & Guides */}
        {tab === 'content' && contentForm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <form
              onSubmit={handleSaveContent}
              className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-4"
            >
              <h2 className="font-display text-2xl font-bold text-white">Showroom &amp; Hero Content</h2>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Hero Headline</label>
                <input
                  type="text"
                  value={contentForm.heroHeadline}
                  onChange={(e) => setContentForm({ ...contentForm, heroHeadline: e.target.value })}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Hero Subheadline</label>
                <textarea
                  rows={3}
                  value={contentForm.heroSubheadline}
                  onChange={(e) => setContentForm({ ...contentForm, heroSubheadline: e.target.value })}
                  className="w-full p-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">Showroom Address</label>
                  <input
                    type="text"
                    value={contentForm.showroomAddress}
                    onChange={(e) => setContentForm({ ...contentForm, showroomAddress: e.target.value })}
                    className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-zinc-400 mb-1">WhatsApp Number</label>
                  <input
                    type="text"
                    value={contentForm.whatsappNumber}
                    onChange={(e) => setContentForm({ ...contentForm, whatsappNumber: e.target.value })}
                    className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Price Disclaimer</label>
                <textarea
                  rows={2}
                  value={contentForm.priceDisclaimer}
                  onChange={(e) => setContentForm({ ...contentForm, priceDisclaimer: e.target.value })}
                  className="w-full p-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 rounded bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
              >
                Save Website Content
              </button>
            </form>

            <div className="p-6 rounded-lg bg-[#141417] border border-zinc-800 space-y-5">
              <h2 className="font-display text-2xl font-bold text-white">Publish Buying Guide</h2>
              <form onSubmit={handlePublishGuide} className="space-y-3">
                <input
                  type="text"
                  required
                  placeholder="Guide Title"
                  value={guideTitle}
                  onChange={(e) => setGuideTitle(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Category (e.g. Buying Guide)"
                  value={guideCat}
                  onChange={(e) => setGuideCat(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="Short Excerpt"
                  value={guideExcerpt}
                  onChange={(e) => setGuideExcerpt(e.target.value)}
                  className="w-full h-10 px-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <textarea
                  rows={4}
                  required
                  placeholder="Article body (separate paragraphs with blank lines)"
                  value={guideBody}
                  onChange={(e) => setGuideBody(e.target.value)}
                  className="w-full p-3 rounded bg-[#0A0A0B] border border-zinc-700 text-sm text-white"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded bg-white text-zinc-950 text-xs font-semibold cursor-pointer"
                >
                  Publish Guide
                </button>
              </form>

              <div className="pt-4 border-t border-zinc-800 divide-y divide-zinc-800">
                {guides.map((g) => (
                  <div key={g.id} className="py-3 flex items-center justify-between gap-2 text-xs">
                    <span className="text-zinc-200 font-medium truncate">{g.title}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteGuide(g.id)}
                      className="text-red-400 hover:text-red-300 shrink-0 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
