import { useEffect } from 'react';
import { BUSINESS } from '../lib/business';

/**
 * Per-page title, description and canonical URL.
 *
 * The whole site shipped one title — "AUREVA CORPORATE GIFTING" — so every
 * page, including all 566 product pages, looked identical in a search result
 * and in a shared link. A single-page app never changes the document head on
 * its own, so each page has to say what it is.
 */
export function useSeo(opts: {
  title: string;
  description?: string;
  /** Path only, e.g. "/shop". Defaults to the current location. */
  path?: string;
  image?: string;
  /** Structured data for this page, e.g. a Product. */
  jsonLd?: Record<string, unknown>;
}) {
  const { title, description, path, image, jsonLd } = opts;

  useEffect(() => {
    const previous = document.title;
    document.title = title.includes('Aureva') ? title : `${title} | Aureva Corporate Gifting`;

    const url = `${BUSINESS.site}${path ?? window.location.pathname}`;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', document.title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:url', url);
    setMeta('name', 'twitter:title', document.title);
    setMeta('name', 'twitter:description', description);
    if (image) {
      setMeta('property', 'og:image', image);
      setMeta('name', 'twitter:image', image);
    }
    setCanonical(url);

    // Page-specific structured data, removed on the way out so a product's
    // markup does not stay behind on the next page.
    let script: HTMLScriptElement | null = null;
    if (jsonLd) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.page = 'true';
      script.textContent = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }

    return () => {
      document.title = previous;
      script?.remove();
    };
  }, [title, description, path, image, JSON.stringify(jsonLd ?? null)]);
}

function setMeta(key: 'name' | 'property', value: string, content?: string) {
  if (!content) return;
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${key}="${value}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(key, value);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'canonical';
    document.head.appendChild(link);
  }
  link.href = url;
}
