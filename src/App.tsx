import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { CatalogProvider, useCatalog } from './context/CatalogContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.tsx';

const HomePage = lazy(() => import('./pages/HomePage.tsx').then((module) => ({ default: module.HomePage })));
const CatalogPage = lazy(() => import('./pages/CatalogPage.tsx').then((module) => ({ default: module.CatalogPage })));
const BikeDetailPage = lazy(() =>
  import('./pages/BikeDetailPage.tsx').then((module) => ({ default: module.BikeDetailPage })),
);
const ComparePage = lazy(() => import('./pages/ComparePage.tsx').then((module) => ({ default: module.ComparePage })));
const GuidesPage = lazy(() => import('./pages/GuidesPage.tsx').then((module) => ({ default: module.GuidesPage })));
const GuideDetailPage = lazy(() =>
  import('./pages/GuideDetailPage.tsx').then((module) => ({ default: module.GuideDetailPage })),
);
const ContactPage = lazy(() => import('./pages/ContactPage.tsx').then((module) => ({ default: module.ContactPage })));
const LoginPage = lazy(() => import('./pages/AuthPages.tsx').then((module) => ({ default: module.LoginPage })));
const RegisterPage = lazy(() => import('./pages/AuthPages.tsx').then((module) => ({ default: module.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import('./pages/AuthPages.tsx').then((module) => ({ default: module.ForgotPasswordPage })),
);
const ProfilePage = lazy(() => import('./pages/ProfilePage.tsx').then((module) => ({ default: module.ProfilePage })));
const AdminDashboardPage = lazy(() =>
  import('./pages/AdminDashboardPage.tsx').then((module) => ({ default: module.AdminDashboardPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage.tsx').then((module) => ({ default: module.NotFoundPage })),
);

class ErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; message: string }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('CHAND MOTORS UI Error:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0A0A0B] text-white flex flex-col items-center justify-center p-6 text-center space-y-4">
          <h1 className="font-display text-4xl font-bold">Something went wrong</h1>
          <p className="text-sm text-zinc-400 max-w-md">{this.state.message}</p>
          <button
            type="button"
            onClick={() => window.location.assign('/')}
            className="px-5 py-2.5 rounded-md bg-[#D91E2A] text-xs font-semibold text-white cursor-pointer"
          >
            Reload Showroom
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function AppShell() {
  const location = useLocation();
  const { motorcycles } = useCatalog();

  const bikeMatch = location.pathname.match(/^\/motorcycles\/([^/]+)$/);
  const activeBike = bikeMatch
    ? motorcycles.find((m) => m.slug === bikeMatch[1])
    : undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[#0A0A0B] text-zinc-100">
      <Navbar />
      <main className="flex-1">
        <Suspense
          fallback={
            <div role="status" className="min-h-[60vh] flex items-center justify-center text-sm text-zinc-400">
              Loading CHAND MOTORS...
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/catalog" element={<CatalogPage />} />
            <Route path="/motorcycles/:slug" element={<BikeDetailPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/guides/:slug" element={<GuideDetailPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminDashboardPage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
      <FloatingWhatsApp motorcycleName={activeBike?.name} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <CatalogProvider>
            <AppShell />
          </CatalogProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
