import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO.tsx';

export function NotFoundPage() {
  return (
    <>
      <SEO
        title="Page Not Found | CHAND MOTORS"
        description="The requested page could not be found on CHAND MOTORS."
        noindex
      />
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center space-y-5">
        <p className="font-mono text-sm tracking-widest text-[#D91E2A]">404</p>
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white tracking-tight">
          Page Not Found
        </h1>
        <p className="text-sm text-zinc-400 max-w-md">
          The page or motorcycle listing you requested is unavailable. Browse our showroom lineup or return to the homepage.
        </p>
        <div className="flex items-center gap-3 pt-2">
          <Link
            to="/"
            className="px-5 py-2.5 rounded-md bg-white text-zinc-950 text-xs font-semibold"
          >
            Back to Home
          </Link>
          <Link
            to="/catalog"
            className="px-5 py-2.5 rounded-md bg-[#D91E2A] text-white text-xs font-semibold"
          >
            Explore Motorcycles
          </Link>
        </div>
      </div>
    </>
  );
}
