import React from 'react';

interface AurevaLogoProps {
  className?: string;
  variant?: 'light' | 'dark' | 'gold';
  showIcon?: boolean;
}

export function AurevaLogo({ className = '', variant = 'dark', showIcon = true }: AurevaLogoProps) {
  const getTextColor = () => {
    switch (variant) {
      case 'light': return 'text-white';
      case 'gold': return 'text-[#d4af37]';
      case 'dark':
      default: return 'text-[#0a192f]'; // Dark Corporate Blue
    }
  };
  
  const getAccentColor = () => {
    switch (variant) {
      case 'light': return '#ffffff';
      case 'dark': return '#d4af37'; // Premium Gold
      case 'gold': return '#d4af37';
    }
  };

  const getSubTextColor = () => {
    switch (variant) {
      case 'light': return 'text-white/70';
      case 'dark': return 'text-[#d4af37]';
      case 'gold': return 'text-amber-600/90';
    }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {showIcon && (
        <svg 
          width="32" 
          height="32" 
          viewBox="0 0 32 32" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 drop-shadow-sm"
        >
          {/* Outer Diamond */}
          <path d="M16 2L6 16L16 30L26 16L16 2Z" stroke={getAccentColor()} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Inner Diamond */}
          <path d="M16 8L10 16L16 24L22 16L16 8Z" stroke={getAccentColor()} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Center Filled Diamond */}
          <path d="M16 13L13.5 16L16 19L18.5 16L16 13Z" fill={getAccentColor()} />
        </svg>
      )}
      <div className="flex flex-col justify-center translate-y-[2px]">
        <span className={`font-serif font-black text-[22px] tracking-[0.25em] uppercase leading-none ${getTextColor()} ml-1`}>
          AUREVA
        </span>
        <span className={`font-sans text-[0.45rem] tracking-[0.45em] uppercase font-bold leading-tight mt-1.5 ${getSubTextColor()} ml-1`}>
          Corporate Gifting
        </span>
      </div>
    </div>
  );
}
