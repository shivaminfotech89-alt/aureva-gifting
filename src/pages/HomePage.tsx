import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Truck, ShieldCheck, Gift, ChevronRight, MessageCircle, Users, BookOpen, ArrowRight } from 'lucide-react';
import { collection, onSnapshot, query, orderBy, limit, where, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ProductCard, ProductData } from '../components/shop/ProductCard';
import { useSettingsStore } from '../store/settingsStore';
import { CONTAINER, Eyebrow, SectionHeading } from '../components/ui/section';

export interface BannerData {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  enabled: boolean;
  order: number;
}

/**
 * Shown immediately on first paint, then replaced by whatever Firestore
 * returns. Seeding these as initial state means a slow or unreachable
 * database degrades to real content instead of an empty page.
 */
const FALLBACK_BANNERS: BannerData[] = [
  { id: 'f1', title: 'The art of corporate gifting', subtitle: 'Bespoke luxury gifting for the relationships that carry your business.', ctaText: 'Explore Collections', ctaLink: '/shop', imageUrl: 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80', enabled: true, order: 0 },
  { id: 'f2', title: 'Curated festival hampers', subtitle: 'Premium hampers for the season, packaged and branded for your enterprise.', ctaText: 'Shop Festive', ctaLink: '/shop', imageUrl: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?auto=format&fit=crop&q=80', enabled: true, order: 1 },
];

const FALLBACK_PRODUCTS: ProductData[] = [
  { id: 'sample-1', name: 'Executive Leather Briefcase', description: 'Premium full-grain leather briefcase perfect for executives.', basePrice: 12500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'], stock: 50, enabled: true },
  { id: 'sample-2', name: 'Luxury Pen Set', description: 'Gold-plated fountain pen with custom engraving options.', basePrice: 4500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1585336261022-680e294ce8b9?auto=format&fit=crop&q=80&w=600'], stock: 100, enabled: true },
  { id: 'sample-4', name: 'Premium Coffee Blend & Mug', description: 'Artisan roasted coffee beans with an insulated ceramic mug.', basePrice: 2800, gstPercent: 18, images: ['https://images.unsplash.com/photo-1512568400610-62da28bc8a13?auto=format&fit=crop&q=80&w=600'], stock: 150, enabled: true },
  { id: 'sample-5', name: 'Smart Desk Organizer', description: 'Minimalist wooden organizer with built-in wireless charging.', basePrice: 6500, gstPercent: 18, images: ['https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=600'], stock: 75, enabled: true },
];

const FALLBACK_CATEGORIES = [
  { name: 'Executive Drinkware', url: 'https://images.unsplash.com/photo-1517260739337-6799d239ce83?auto=format&fit=crop&q=80' },
  { name: 'Office Essentials', url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80' },
  { name: 'Tech Gadgets', url: 'https://images.unsplash.com/photo-1584432810601-6c7f27d2362b?auto=format&fit=crop&q=80' },
  { name: 'Eco-friendly', url: 'https://images.unsplash.com/photo-1536766768582-1dd38f32acab?auto=format&fit=crop&q=80' },
];

const FALLBACK_COLLECTIONS = [
  { title: 'Diwali Hampers', sub: 'Dry fruits & essentials', img: 'https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80&w=800' },
  { title: 'New Year Kits', sub: 'Planners, pens & tech', img: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&q=80&w=800' },
  { title: 'Welcome Kits', sub: 'Onboarding essentials', img: 'https://images.unsplash.com/photo-1555421689-491a97ff2040?auto=format&fit=crop&q=80&w=800' },
];

const FALLBACK_BRANDING_IMAGE = 'https://images.unsplash.com/photo-1587834575747-df9039afac29?auto=format&fit=crop&q=80&w=1200';

export default function HomePage() {
  const [banners, setBanners] = useState<BannerData[]>(FALLBACK_BANNERS);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [featuredProducts, setFeaturedProducts] = useState<ProductData[]>(FALLBACK_PRODUCTS);
  const [categories, setCategories] = useState<any[]>(FALLBACK_CATEGORIES);
  const [collectionsData, setCollectionsData] = useState<any[]>(FALLBACK_COLLECTIONS);
  const [brandingSection, setBrandingSection] = useState<any>({ imageUrl: FALLBACK_BRANDING_IMAGE });

  const { settings } = useSettingsStore();
  const whatsappNumber = String(settings?.adminWhatsApp || '919825622421').replace(/[^0-9]/g, '');

  useEffect(() => {
    const qBanners = query(collection(db, 'banners'), orderBy('order', 'asc'));
    const unsubBanners = onSnapshot(qBanners, (snapshot) => {
      const b = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as BannerData)).filter(x => x.enabled !== false);
      if (b.length > 0) {
        setBanners(b);
      } else {
        setBanners(FALLBACK_BANNERS);
      }
    }, (err) => console.error('homepage banners error: ', err));

    const qProducts = query(collection(db, 'products'), where('enabled', '==', true), limit(4));
    const unsubProducts = onSnapshot(qProducts, (snapshot) => {
      const p = snapshot.docs.map(d => ({ id: d.id, ...d.data() } as ProductData)).filter(x => x.enabled);
      if (p.length > 0) {
        setFeaturedProducts(p);
      } else {
        setFeaturedProducts(FALLBACK_PRODUCTS);
      }
    }, (err) => console.error('homepage products error: ', err));

    const unsubCats = onSnapshot(query(collection(db, 'homepageCategories'), orderBy('order', 'asc')), (snapshot) => {
      const c = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (c.length > 0) { setCategories(c); } else {
        setCategories(FALLBACK_CATEGORIES);
      }
    }, (err) => console.error('homepage cats error: ', err));

    const unsubCols = onSnapshot(query(collection(db, 'homepageCollections'), orderBy('order', 'asc')), (snapshot) => {
      const c = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      if (c.length > 0) { setCollectionsData(c); } else {
        setCollectionsData(FALLBACK_COLLECTIONS);
      }
    }, (err) => console.error('homepage cols error: ', err));

    const unsubBranding = onSnapshot(doc(db, 'settings', 'brandingImage'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().imageUrl) {
        setBrandingSection(docSnap.data());
      } else {
        setBrandingSection({ imageUrl: FALLBACK_BRANDING_IMAGE });
      }
    }, (err) => console.error('homepage branding error: ', err));

    return () => { unsubBanners(); unsubProducts(); unsubCats(); unsubCols(); unsubBranding(); };
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => setCurrentSlide(prev => (prev + 1) % banners.length), 7000);
    return () => clearInterval(interval);
  }, [banners.length]);

  const active = banners[currentSlide];

  /** Sets the last word of a headline in gold italic, rather than every third word. */
  const renderTitle = (title: string) => {
    const words = title.trim().split(/\s+/);
    if (words.length < 2) return <span>{title}</span>;
    const lead = words.slice(0, -1).join(' ');
    const tail = words[words.length - 1];
    return (
      <>
        {lead}{' '}
        <span className="italic text-[var(--gold-500)]">{tail}</span>
      </>
    );
  };

  const openCatalog = () => window.dispatchEvent(new Event('openCatalogModal'));

  return (
    <div className="w-full bg-white">

      {/* Hero */}
      <section className="relative flex min-h-[28rem] items-center overflow-hidden bg-[var(--navy-900)] lg:min-h-[34rem]">
        <AnimatePresence mode="wait">
          {active && (
            <motion.div
              key={active.id}
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <img
                src={active.imageUrl}
                alt=""
                aria-hidden="true"
                /* Largest element on the page: never lazy-loaded. */
                loading="eager"
                fetchPriority="high"
                decoding="async"
                className="h-full w-full object-cover"
                onError={(e) => {
                  const t = e.target as HTMLImageElement;
                  const fb = 'https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&q=80';
                  if (t.src !== fb) t.src = fb;
                }}
              />
              {/* One considered scrim. The previous mix-blend-overlay left the
                  photograph muddy and unreadable behind three stacked gradients. */}
              <div className="absolute inset-0 bg-gradient-to-r from-[var(--navy-900)] via-[var(--navy-900)]/85 to-[var(--navy-900)]/25" />
              <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-900)] via-transparent to-[var(--navy-900)]/40" />
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`relative z-10 ${CONTAINER} py-16 lg:py-20`}>
          {active && (
            <div className="max-w-2xl">
              <motion.div
                key={`eyebrow-${currentSlide}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                <Eyebrow tone="light">Aureva Enterprise</Eyebrow>
              </motion.div>

              <motion.h1
                key={`title-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.1 }}
                className="font-display mt-6 text-[2rem] leading-[1.1] tracking-[-0.02em] text-white sm:text-[2.75rem] lg:text-[3.25rem]"
              >
                {renderTitle(active.title)}
              </motion.h1>

              <motion.p
                key={`sub-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="mt-4 max-w-lg text-[15px] font-light leading-relaxed text-white/65"
              >
                {active.subtitle}
              </motion.p>

              <motion.div
                key={`cta-${currentSlide}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="mt-7 flex flex-col gap-3 sm:flex-row"
              >
                <Link to={active.ctaLink}>
                  <Button
                    size="lg"
                    className="h-11 w-full rounded-lg bg-[var(--gold-500)] px-7 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--navy-900)] transition-colors hover:bg-[var(--gold-400)] sm:w-auto"
                  >
                    {active.ctaText}
                  </Button>
                </Link>
                <Link to="/corporate">
                  <span className="inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/25 px-7 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-white/60 hover:bg-white/5 sm:w-auto">
                    Request a Quotation
                  </span>
                </Link>
              </motion.div>
            </div>
          )}
        </div>

        {banners.length > 1 && (
          <div className="absolute bottom-8 left-6 z-20 flex gap-3 md:left-10">
            {banners.map((b, idx) => (
              <button
                key={b.id}
                onClick={() => setCurrentSlide(idx)}
                aria-label={`Show slide ${idx + 1}: ${b.title}`}
                aria-current={idx === currentSlide}
                className={`h-[3px] rounded-full transition-all duration-500 ${
                  idx === currentSlide ? 'w-12 bg-[var(--gold-500)]' : 'w-6 bg-white/30 hover:bg-white/60'
                }`}
              />
            ))}
          </div>
        )}
      </section>

      {/* Assurances */}
      <section className="border-b border-slate-200 bg-[var(--navy-800)]">
        <div className={`grid grid-cols-2 gap-y-5 py-5 lg:grid-cols-4 ${CONTAINER}`}>
          {[
            { icon: ShieldCheck, text: 'Premium quality guaranteed' },
            { icon: Truck, text: 'Secure pan-India delivery' },
            { icon: Gift, text: 'Bespoke custom branding' },
            { icon: Users, text: 'Dedicated account manager' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <Icon className="h-[18px] w-[18px] shrink-0 text-[var(--gold-500)]" strokeWidth={1.5} />
              <span className="text-[13px] font-medium leading-tight text-white/70">{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      <section className="bg-white py-12 md:py-16">
        <div className={CONTAINER}>
          <SectionHeading
            eyebrow="Our Catalog"
            title="Shop by"
            accent="category"
            body="Four families of gifting, each one ready to carry your brand."
          />
          <div className="mt-9 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {categories.map((cat, idx) => (
              <Link
                to={`/shop?category=${encodeURIComponent(cat.name)}`}
                key={cat.id || idx}
                className="group relative block h-52 overflow-hidden rounded-xl lg:h-60"
              >
                <img
                  src={cat.url}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                  onError={(e) => {
                    const t = e.target as HTMLImageElement;
                    const fb = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80';
                    if (t.src !== fb) t.src = fb;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-900)] via-[var(--navy-900)]/25 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <h3 className="font-display text-xl text-white">{cat.name}</h3>
                  {cat.description && (
                    <p className="mt-1.5 line-clamp-2 text-[13px] leading-snug text-white/60">{cat.description}</p>
                  )}
                  <span className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold-400)]">
                    Explore
                    <ChevronRight className="h-3 w-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="bg-[var(--navy-800)] py-12 md:py-16">
        <div className={CONTAINER}>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <SectionHeading
              eyebrow="Seasonal"
              title="Festival"
              accent="collections"
              body="Curations for milestones and festivals, beautifully packaged and ready for your logo."
              tone="light"
              align="left"
            />
            <Link to="/shop" className="shrink-0">
              <span className="inline-flex items-center gap-2 border-b border-[var(--gold-500)]/40 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--gold-400)] transition-colors hover:border-[var(--gold-500)]">
                View all collections
                <ArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>

          <div className="mt-9 grid grid-cols-1 gap-6 md:grid-cols-3">
            {collectionsData.map((c, idx) => (
              <Link to={`/shop?q=${encodeURIComponent(c.title)}`} key={c.id || idx} className="group block">
                <div className="relative h-72 overflow-hidden rounded-xl bg-[var(--navy-700)] lg:h-80">
                  <img
                    src={c.img}
                    alt={c.title}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
                    onError={(e) => {
                      const t = e.target as HTMLImageElement;
                      const fb = 'https://images.unsplash.com/photo-1511269366734-cd2500028fb3?auto=format&fit=crop&q=80&w=800';
                      if (t.src !== fb) t.src = fb;
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[var(--navy-900)] via-[var(--navy-900)]/30 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <Eyebrow tone="light">{c.sub}</Eyebrow>
                    <h3 className="font-display mt-3 text-3xl text-white">{c.title}</h3>
                    {c.description && <p className="mt-2 text-sm leading-relaxed text-white/60">{c.description}</p>}
                    <div className="mt-5 h-px w-10 bg-[var(--gold-500)] transition-all duration-500 group-hover:w-20" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured products */}
      <section className="bg-[#FAFAF8] py-12 md:py-16">
        <div className={CONTAINER}>
          <SectionHeading
            eyebrow="Handpicked"
            title="Featured"
            accent="products"
            body="Our most requested corporate gifts, chosen for the impression they leave."
          />
          <div className="mt-9 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
            {featuredProducts.map((product, idx) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ delay: idx * 0.08, duration: 0.5 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Personalisation */}
      <section className="bg-[var(--navy-800)]">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="relative order-2 min-h-[16rem] lg:order-1 lg:min-h-full">
            <img
              src={brandingSection?.imageUrl || FALLBACK_BRANDING_IMAGE}
              alt="Custom branding applied to Aureva gifts"
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              onError={(e) => {
                const t = e.target as HTMLImageElement;
                const fb = FALLBACK_BRANDING_IMAGE;
                if (t.src !== fb) t.src = fb;
              }}
            />
            <div className="absolute inset-0 bg-[var(--navy-900)]/25" />
          </div>

          <div className="order-1 px-5 py-12 sm:px-8 lg:order-2 lg:px-14 lg:py-16">
            <Eyebrow tone="light">{brandingSection?.subTitle || 'Personalisation'}</Eyebrow>
            {/* Plain text: the previous version pushed admin-authored HTML through
                dangerouslySetInnerHTML, which both defeated the styling and made
                the homepage an injection point. */}
            <h2 className="font-display mt-5 text-[1.75rem] leading-[1.15] tracking-[-0.015em] text-white md:text-[2.125rem]">
              {brandingSection?.headingText || (
                <>Make it truly <span className="italic text-[var(--gold-500)]">yours.</span></>
              )}
            </h2>
            <p className="mt-6 max-w-lg text-[15px] font-light leading-relaxed text-white/60 md:text-base">
              {brandingSection?.body || 'Upload your corporate logo at checkout and see exactly how your gifts will look. Laser engraving, UV printing and embossing on every premium item.'}
            </p>

            <ol className="mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-white/10 sm:grid-cols-2">
              {[
                ['Select product', 'Choose from thousands of premium items.'],
                ['Upload logo', 'Preview your brand identity instantly.'],
                ['Approve mockup', 'A digital proof before anything is produced.'],
                ['Dispatched', 'Fast, secure, multi-location shipping.'],
              ].map(([title, body], i) => (
                <li key={title} className="bg-[var(--navy-800)] p-6">
                  <span className="font-display text-lg text-[var(--gold-500)]">{String(i + 1).padStart(2, '0')}</span>
                  <h4 className="mt-2 text-sm font-semibold text-white">{title}</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/50">{body}</p>
                </li>
              ))}
            </ol>

            <Link to="/corporate" className="mt-8 inline-block">
              <span className="inline-flex h-11 items-center gap-2 rounded-lg border border-[var(--gold-500)]/50 px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--gold-400)] transition-colors hover:bg-[var(--gold-500)] hover:text-[var(--navy-900)]">
                Learn more
                <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Enterprise + catalog */}
      <section className="bg-white py-12 md:py-16">
        <div className={`grid grid-cols-1 gap-5 lg:grid-cols-2 ${CONTAINER}`}>

          <div className="rounded-xl border border-slate-200 bg-[#FAFAF8] p-7 md:p-10">
            <Eyebrow>Enterprise</Eyebrow>
            <h2 className="font-display mt-5 text-[1.625rem] leading-[1.15] tracking-[-0.015em] text-[var(--navy-800)] md:text-[2rem]">
              Enterprise scale.<br />
              <span className="italic text-[var(--gold-500)]">Boutique care.</span>
            </h2>
            <p className="mt-6 max-w-md text-[15px] leading-relaxed text-slate-500">
              Planning a large event or company-wide gifting? Speak to our enterprise team for custom quotations and dedicated support.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/corporate">
                <span className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[var(--navy-800)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--navy-900)] sm:w-auto">
                  Request a quotation
                </span>
              </Link>
              <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer">
                <span className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-300 px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--navy-800)] transition-colors hover:border-[var(--navy-800)] sm:w-auto">
                  <MessageCircle className="h-4 w-4" strokeWidth={1.5} />
                  WhatsApp
                </span>
              </a>
            </div>
          </div>

          {/* Replaces the old newsletter box, whose submit handler only ever
              showed "Subscribed successfully!" and stored nothing. This routes
              into the catalog flow, which does capture the lead. */}
          <div className="relative overflow-hidden rounded-xl bg-[var(--navy-800)] p-7 md:p-10">
            <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-[var(--gold-500)]/10 blur-3xl" />
            <div className="relative">
              <Eyebrow tone="light">Catalog</Eyebrow>
              <h2 className="font-display mt-5 text-[1.625rem] leading-[1.15] tracking-[-0.015em] text-white md:text-[2rem]">
                The full range,<br />
                <span className="italic text-[var(--gold-500)]">in one PDF.</span>
              </h2>
              <p className="mt-6 max-w-md text-[15px] leading-relaxed text-white/60">
                Download our corporate gifting catalog with current products and indicative pricing. Takes about a minute.
              </p>
              <button
                onClick={openCatalog}
                className="mt-9 inline-flex h-11 items-center gap-2.5 rounded-lg bg-[var(--gold-500)] px-8 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-[var(--navy-900)] transition-colors hover:bg-[var(--gold-400)]"
              >
                <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                Download catalog
              </button>
              <p className="mt-5 text-xs text-white/35">We will only use your details to send the catalog.</p>
            </div>
          </div>

        </div>
      </section>
    </div>
  );
}
