import React from 'react';

/**
 * Shared page furniture.
 *
 * The site previously set its own vertical rhythm per section — py-24, py-32,
 * py-12, py-20 — with container widths of 90rem, 7xl and none at all. That
 * inconsistency is most of what made pages read as oversized. Everything below
 * comes from one scale; use these instead of hand-written padding.
 */

/** Page gutter and maximum width. One value for the whole site. */
export const CONTAINER = 'mx-auto w-full max-w-[80rem] px-5 sm:px-6 lg:px-8';

/** Vertical rhythm. `md` is the default for a normal content section. */
const PAD = {
  sm: 'py-10 md:py-12',
  md: 'py-12 md:py-16',
  lg: 'py-16 md:py-20',
} as const;

export function Section({
  children,
  className = '',
  size = 'md',
  tone = 'white',
  id,
}: {
  children: React.ReactNode;
  className?: string;
  size?: keyof typeof PAD;
  tone?: 'white' | 'muted' | 'navy';
  id?: string;
}) {
  const tones = {
    white: 'bg-white',
    muted: 'bg-[#FAFAF8]',
    navy: 'bg-[var(--navy-800)]',
  };
  return (
    <section id={id} className={`${tones[tone]} ${PAD[size]} ${className}`}>
      <div className={CONTAINER}>{children}</div>
    </section>
  );
}

export function Eyebrow({
  children,
  tone = 'dark',
}: {
  children: React.ReactNode;
  tone?: 'dark' | 'light';
}) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.24em] ${
        tone === 'light' ? 'text-[var(--gold-400)]' : 'text-[var(--gold-600)]'
      }`}
    >
      <span className={`h-px w-6 ${tone === 'light' ? 'bg-[var(--gold-400)]/50' : 'bg-[var(--gold-600)]/40'}`} />
      {children}
    </span>
  );
}

/**
 * Section heading. `accent` is set in gold italic — one emphasis per heading,
 * always the trailing phrase, so the pattern is predictable rather than
 * decided per section.
 */
export function SectionHeading({
  eyebrow,
  title,
  accent,
  body,
  tone = 'dark',
  align = 'center',
  className = '',
}: {
  eyebrow?: string;
  title: React.ReactNode;
  accent?: string;
  body?: string;
  tone?: 'dark' | 'light';
  align?: 'center' | 'left';
  className?: string;
}) {
  return (
    <div className={`max-w-xl ${align === 'center' ? 'mx-auto text-center' : ''} ${className}`}>
      {eyebrow && <Eyebrow tone={tone}>{eyebrow}</Eyebrow>}
      <h2
        className={`font-display ${eyebrow ? 'mt-3.5' : ''} text-[1.75rem] leading-[1.15] tracking-[-0.015em] md:text-[2.125rem] ${
          tone === 'light' ? 'text-white' : 'text-[var(--navy-800)]'
        }`}
      >
        {title}
        {accent && <span className="italic text-[var(--gold-500)]"> {accent}</span>}
      </h2>
      {body && (
        <p className={`mt-3.5 text-sm leading-relaxed md:text-[15px] ${tone === 'light' ? 'text-white/60' : 'text-slate-500'}`}>
          {body}
        </p>
      )}
    </div>
  );
}

/** Compact banner for interior pages, replacing the tall per-page hero blocks. */
export function PageHeader({
  eyebrow,
  title,
  accent,
  body,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  accent?: string;
  body?: string;
}) {
  return (
    <div className="bg-[var(--navy-800)]">
      <div className={`${CONTAINER} py-12 md:py-16`}>
        <SectionHeading eyebrow={eyebrow} title={title} accent={accent} body={body} tone="light" align="left" />
      </div>
    </div>
  );
}
