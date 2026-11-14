import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type {
  BrandItem,
  CategoryItem,
  CustomerReview,
  GuideArticle,
  Motorcycle,
  SiteContent,
} from '../types/motorcycle.ts';

interface CatalogContextValue {
  motorcycles: Motorcycle[];
  brands: BrandItem[];
  categories: CategoryItem[];
  guides: GuideArticle[];
  reviews: CustomerReview[];
  siteContent: SiteContent | null;
  loading: boolean;
  error: string | null;
  refreshCatalog: () => Promise<void>;
  compareSlugs: string[];
  toggleCompare: (slug: string) => void;
  removeCompare: (slug: string) => void;
  clearCompare: () => void;
}

const CatalogContext = createContext<CatalogContextValue | null>(null);

const COMPARE_STORAGE_KEY = 'chand_compare_slugs';

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [brands, setBrands] = useState<BrandItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [guides, setGuides] = useState<GuideArticle[]>([]);
  const [reviews, setReviews] = useState<CustomerReview[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [compareSlugs, setCompareSlugs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(COMPARE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 3);
      }
    } catch {
      // Ignore storage errors
    }
    return ['honda-cg-125-2026', 'yamaha-ybr-125g'];
  });

  useEffect(() => {
    try {
      localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(compareSlugs));
    } catch {
      // Ignore storage errors
    }
  }, [compareSlugs]);

  const refreshCatalog = useCallback(async () => {
    try {
      setError(null);
      const [bikesRes, brandsRes, catsRes, guidesRes, reviewsRes, contentRes] = await Promise.all([
        fetch('/api/motorcycles'),
        fetch('/api/brands'),
        fetch('/api/categories'),
        fetch('/api/guides'),
        fetch('/api/reviews'),
        fetch('/api/content'),
      ]);

      if (!bikesRes.ok) throw new Error('Unable to load motorcycle catalog.');

      const [bikesData, brandsData, catsData, guidesData, reviewsData, contentData] = await Promise.all([
        bikesRes.json(),
        brandsRes.json(),
        catsRes.json(),
        guidesRes.json(),
        reviewsRes.json(),
        contentRes.json(),
      ]);

      setMotorcycles(bikesData.motorcycles || []);
      setBrands(brandsData.brands || []);
      setCategories(catsData.categories || []);
      setGuides(guidesData.guides || []);
      setReviews(reviewsData.reviews || []);
      setSiteContent(contentData.content || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch showroom catalog.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCatalog();
  }, [refreshCatalog]);

  const toggleCompare = useCallback((slug: string) => {
    setCompareSlugs((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), slug];
      }
      return [...prev, slug];
    });
  }, []);

  const removeCompare = useCallback((slug: string) => {
    setCompareSlugs((prev) => prev.filter((s) => s !== slug));
  }, []);

  const clearCompare = useCallback(() => {
    setCompareSlugs([]);
  }, []);

  return (
    <CatalogContext.Provider
      value={{
        motorcycles,
        brands,
        categories,
        guides,
        reviews,
        siteContent,
        loading,
        error,
        refreshCatalog,
        compareSlugs,
        toggleCompare,
        removeCompare,
        clearCompare,
      }}
    >
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used inside CatalogProvider');
  return ctx;
}
