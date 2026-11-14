import { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.tsx';
import { CatalogProvider, useCatalog } from './context/CatalogContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Footer } from './components/Footer.tsx';
import { FloatingWhatsApp } from './components/FloatingWhatsApp.tsx';
import { HomePage } from './pages/HomePage.tsx';
import { CatalogPage } from './pages/CatalogPage.tsx';
import { BikeDetailPage } from './pages/BikeDetailPage.tsx';
import { ComparePage } from './pages/ComparePage.tsx';
import { GuidesPage } from './pages/GuidesPage.tsx';
import { GuideDetailPage } from './pages/GuideDetailPage.tsx';
import { ContactPage } from './pages/ContactPage.tsx';
import { ForgotPasswordPage, LoginPage, RegisterPage } from './pages/AuthPages.tsx';
import { ProfilePage } from './pages/ProfilePage.tsx';
import { AdminDashboardPage } from './pages/AdminDashboardPage.tsx';
import { NotFoundPage } from './pages/NotFoundPage.tsx';

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
