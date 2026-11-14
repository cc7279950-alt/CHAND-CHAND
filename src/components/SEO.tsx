import { useEffect } from 'react';
import { resolveBikeImage } from '../lib/imageMap.ts';

interface SEOProps {
  title: string;
  description: string;
  path?: string;
  image?: string;
  type?: 'website' | 'product' | 'article';
  noindex?: boolean;
  structuredData?: Record<string, unknown> | Record<string, unknown>[];
}

function upsertMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function SEO({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  structuredData,
}: SEOProps) {
  useEffect(() => {
    const origin = window.location.origin;
    const currentPath = path ?? window.location.pathname;
    const canonicalUrl = `${origin}${currentPath}`;
    const fullImage = image ? new URL(resolveBikeImage(image), origin).href : `${origin}/`;

    document.title = title;

    upsertMeta('name', 'description', description);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');

    upsertMeta('property', 'og:type', type === 'product' ? 'product' : type === 'article' ? 'article' : 'website');
    upsertMeta('property', 'og:site_name', 'CHAND MOTORS');
    upsertMeta('property', 'og:title', title);
    upsertMeta('property', 'og:description', description);
    upsertMeta('property', 'og:url', canonicalUrl);
    if (image) {
      upsertMeta('property', 'og:image', fullImage);
    }

    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    if (image) {
      upsertMeta('name', 'twitter:image', fullImage);
    }

    let canonicalEl = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.setAttribute('href', canonicalUrl);

    const existingLd = document.getElementById('chand-json-ld');
    if (existingLd) {
      existingLd.remove();
    }

    const baseOrg = {
      '@context': 'https://schema.org',
      '@type': 'MotorcycleDealer',
      name: 'CHAND MOTORS',
      alternateName: 'CHAND',
      url: origin,
      telephone: '+92-321-7293026',
      areaServed: 'Pakistan',
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Plot 14-C, Main Boulevard, Gulberg III',
        addressLocality: 'Lahore',
        addressCountry: 'PK',
      },
    };

    const schemas = structuredData
      ? Array.isArray(structuredData)
        ? [baseOrg, ...structuredData]
        : [baseOrg, structuredData]
      : [baseOrg];

    const script = document.createElement('script');
    script.id = 'chand-json-ld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schemas);
    document.head.appendChild(script);
  }, [title, description, path, image, type, noindex, structuredData]);

  return null;
}
