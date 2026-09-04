import React from 'react';
import { Link } from 'react-router-dom';
import { Facebook, Instagram, Linkedin, Mail, Phone, MapPin, Youtube } from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { AurevaLogo } from '../ui/AurevaLogo';
import { CONTAINER } from '../ui/section';

const QUICK_LINKS = [
  ['/shop', 'Shop All'],
  ['/corporate', 'Corporate Orders'],
  ['/about', 'Our Story'],
  ['/contact', 'Contact Us'],
];

const LEGAL_LINKS = [
  ['/privacy', 'Privacy Policy'],
  ['/terms', 'Terms & Conditions'],
  ['/refund', 'Refund Policy'],
  ['/shipping', 'Shipping Policy'],
  ['/cancellation', 'Cancellation Policy'],
];

function ColumnHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--gold-400)]">{children}</h4>
  );
}

export default function Footer() {
  const { settings } = useSettingsStore();

  const social = [
    { url: settings?.instagramUrl, Icon: Instagram, label: 'Instagram' },
    { url: settings?.linkedinUrl, Icon: Linkedin, label: 'LinkedIn' },
    { url: settings?.facebookUrl, Icon: Facebook, label: 'Facebook' },
    { url: settings?.youtubeUrl, Icon: Youtube, label: 'YouTube' },
    // A link to "#" is not a link. Only render the ones actually configured.
  ].filter(s => s.url && s.url.trim() !== '');

  return (
    <footer className="bg-[var(--navy-900)] text-white">
      <div className={`${CONTAINER} py-12 md:py-14`}>
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 md:grid-cols-4 md:gap-x-10">

          <div className="col-span-2 md:col-span-1">
            <AurevaLogo variant="light" />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/50">
              Premium gifts for lasting business impressions. Luxury corporate gifting that elevates your brand.
            </p>
            {social.length > 0 && (
              <div className="mt-5 flex gap-4">
                {social.map(({ url, Icon, label }) => (
                  <a
                    key={label}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={label}
                    className="text-white/40 transition-colors hover:text-[var(--gold-400)]"
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                  </a>
                ))}
              </div>
            )}
          </div>

          <div>
            <ColumnHeading>Explore</ColumnHeading>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {QUICK_LINKS.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-white/60 transition-colors hover:text-[var(--gold-400)]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnHeading>Legal</ColumnHeading>
            <ul className="mt-4 space-y-2.5 text-[13px]">
              {LEGAL_LINKS.map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-white/60 transition-colors hover:text-[var(--gold-400)]">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <ColumnHeading>Contact</ColumnHeading>
            <ul className="mt-4 space-y-3 text-[13px] text-white/60">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-500)]" strokeWidth={1.5} />
                <span>Ahmedabad, Gujarat 380058, India</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-[var(--gold-500)]" strokeWidth={1.5} />
                <a href={`tel:${(settings?.contactNumber || '+919825622421').replace(/\s/g, '')}`} className="transition-colors hover:text-[var(--gold-400)]">
                  {settings?.contactNumber || '+91 98256 22421'}
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--gold-500)]" strokeWidth={1.5} />
                <a href={`mailto:${settings?.supportEmail || 'aurevagifts@gmail.com'}`} className="break-all transition-colors hover:text-[var(--gold-400)]">
                  {settings?.supportEmail || 'aurevagifts@gmail.com'}
                </a>
              </li>
            </ul>
          </div>

        </div>

        <p className="mt-10 border-t border-white/10 pt-6 text-[12px] leading-relaxed text-white/35">
          Aureva specialises in bulk corporate gifting. Product availability, pricing and customisation are subject to
          stock confirmation and minimum order quantity requirements.
        </p>

        <div className="mt-6 flex flex-col gap-3 text-[11px] text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Aureva Corporate Gifting. All rights reserved.</p>
          <div className="flex gap-5">
            <span>GST Registered</span>
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
