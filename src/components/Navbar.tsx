import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, User, ShieldCheck, LogOut, ChevronDown } from 'lucide-react';
import { BrandLogo } from './BrandLogo.tsx';
import { useAuth } from '../context/AuthContext.tsx';

export function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium transition-colors duration-150 whitespace-nowrap shrink-0 py-1 border-b-2 ${
      isActive
        ? 'text-white border-[#D91E2A]'
        : 'text-zinc-400 border-transparent hover:text-white hover:border-zinc-600'
    }`;

  async function handleLogout() {
    setMenuOpen(false);
    setMobileOpen(false);
    await logout();
    navigate('/');
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0A0A0B]/95 backdrop-blur-md border-b border-zinc-800/90">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line Brand Wordmark */}
        <Link to="/" aria-label="CHAND MOTORS Home" className="whitespace-nowrap shrink-0">
          <BrandLogo size="md" />
        </Link>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-7" aria-label="Primary Navigation">
          <NavLink to="/" end className={navLinkClass}>
            Home
          </NavLink>
          <NavLink to="/catalog" className={navLinkClass}>
            Motorcycles
          </NavLink>
          <NavLink to="/compare" className={navLinkClass}>
            Compare
          </NavLink>
          <NavLink to="/guides" className={navLinkClass}>
            Guides
          </NavLink>
          <NavLink to="/contact" className={navLinkClass}>
            Contact
          </NavLink>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          {user ? (
            <div className="relative hidden md:block" ref={menuRef}>
              <button
                type="button"
                onClick={() => setMenuOpen((o) => !o)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-zinc-900 border border-zinc-700 text-sm font-medium text-white hover:border-zinc-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <User className="w-4 h-4 text-[#D91E2A]" aria-hidden="true" />
                <span className="max-w-[120px] truncate">{user.name.split(' ')[0]}</span>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" aria-hidden="true" />
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 mt-2 w-52 rounded-md bg-[#141417] border border-zinc-800 shadow-2xl py-1.5 z-50"
                >
                  <div className="px-3.5 py-2 border-b border-zinc-800">
                    <p className="text-xs font-medium text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-zinc-400 truncate">{user.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-200 hover:bg-zinc-800/70 transition-colors"
                  >
                    <User className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                    <span>My Profile</span>
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      role="menuitem"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-white hover:bg-zinc-800/70 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4 text-[#D91E2A]" aria-hidden="true" />
                      <span>Admin Dashboard</span>
                    </Link>
                  )}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800/70 hover:text-white transition-colors text-left cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/login"
              className="hidden md:inline-flex items-center justify-center px-5 py-2 rounded-md bg-[#D91E2A] hover:bg-[#b91822] text-sm font-semibold text-white transition-colors whitespace-nowrap shrink-0"
            >
              Sign In
            </Link>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            className="md:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-zinc-800 bg-zinc-900 text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-800 bg-[#0A0A0B] px-4 py-4 space-y-1">
          {[
            { to: '/', label: 'Home' },
            { to: '/catalog', label: 'Motorcycles' },
            { to: '/compare', label: 'Compare' },
            { to: '/guides', label: 'Guides' },
            { to: '/contact', label: 'Contact' },
          ].map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setMobileOpen(false)}
              className="flex items-center min-h-[44px] px-3 rounded-md text-base font-medium text-zinc-200 hover:bg-zinc-900 hover:text-white"
            >
              {item.label}
            </Link>
          ))}

          <div className="pt-3 mt-3 border-t border-zinc-800 space-y-2">
            {user ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center min-h-[44px] px-3 rounded-md text-base font-medium text-zinc-100 bg-zinc-900"
                >
                  My Profile ({user.name.split(' ')[0]})
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center min-h-[44px] px-3 rounded-md text-base font-medium text-white bg-zinc-900 border border-[#D91E2A]/50"
                  >
                    Admin Dashboard
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center min-h-[44px] px-3 rounded-md text-base font-medium text-zinc-300 hover:bg-zinc-900 text-left cursor-pointer"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center min-h-[44px] px-4 rounded-md text-base font-semibold text-white bg-[#D91E2A]"
              >
                Sign In / Register
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
