import React, { useState, useEffect } from 'react';

interface BrandLogoProps {
  className?: string;
  onClick?: () => void;
  variant?: 'light' | 'dark' | 'auto';
  layout?: 'banner' | 'compact' | 'auto';
  size?: 'sm' | 'md' | 'lg';
  hideText?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ 
  className = '', 
  onClick,
  variant = 'auto',
  layout = 'auto',
  size = 'md',
  hideText = false
}) => {
  const [customLogo, setCustomLogo] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('pss_company_logo');
      // If corrupted or old generated SVG from previous attempt, clean it up
      if (stored && (stored.includes('navyDropShadow') || stored.includes('data:image/svg+xml'))) {
        localStorage.removeItem('pss_company_logo');
        return null;
      }
      return stored;
    } catch {
      return null;
    }
  });

  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    const handleLogoUpdate = () => {
      try {
        const stored = localStorage.getItem('pss_company_logo');
        if (stored && (stored.includes('navyDropShadow') || stored.includes('data:image/svg+xml'))) {
          localStorage.removeItem('pss_company_logo');
          setCustomLogo(null);
        } else {
          setCustomLogo(stored);
        }
        setImgFailed(false);
      } catch {
        // no-op
      }
    };

    window.addEventListener('company-logo-updated', handleLogoUpdate);
    return () => window.removeEventListener('company-logo-updated', handleLogoUpdate);
  }, []);

  const logoSrc = customLogo || '/image.png?v=4';
  const squareLogoSrc = customLogo || '/logo-square.png?v=4';

  const isDark = variant === 'dark';

  // Full banner view for the company webpage, marketing header, sidebar, and modals
  if ((layout === 'banner' || layout === 'auto') && !imgFailed && !hideText) {
    const bannerHeight = {
      sm: 'h-10 max-w-[210px]',
      md: 'h-12 sm:h-14 max-w-[280px] sm:max-w-[320px]',
      lg: 'h-16 sm:h-18 max-w-[360px] sm:max-w-[420px]'
    }[size];

    return (
      <div 
        className={`brand-banner inline-flex items-center select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
        onClick={onClick}
      >
        <img 
          src={logoSrc} 
          alt="You've Been Served - Process Servers Solution" 
          className={`${bannerHeight} w-auto object-contain drop-shadow-sm`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
        />
      </div>
    );
  }

  const markSizeClasses = {
    sm: 'w-7 h-7 min-w-[28px]',
    md: 'w-9 h-9 min-w-[36px]',
    lg: 'w-12 h-12 min-w-[48px]'
  }[size];

  return (
    <div 
      className={`brand inline-flex items-center gap-2.5 max-w-full select-none ${onClick ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`brand__mark ${markSizeClasses} rounded-xl overflow-hidden shadow-sm flex items-center justify-center shrink-0 border ${
        isDark ? 'border-slate-700 bg-slate-900/90 shadow-slate-900/50' : 'border-sky-700/20 bg-[#091426] shadow-sky-600/20'
      }`}>
        {!imgFailed ? (
          <img 
            src={squareLogoSrc} 
            alt="Process Servers Solution Logo" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3l7 3v5c0 5-3.2 8.4-7 10-3.8-1.6-7-5-7-10V6l7-3z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        )}
      </div>

      {!hideText && (
        <div className="brand__text flex flex-col min-w-0 leading-tight">
          <span className="text-[9px] font-black italic tracking-[0.06em] text-amber-400">
            YOU'VE BEEN
          </span>
          <b className={`text-[12px] font-extrabold uppercase tracking-[0.08em] ${
            isDark ? 'text-white' : 'text-slate-900'
          }`}>
            SERVED
          </b>
          <strong className="font-bold text-[9px] tracking-wider text-teal-400">
            PROCESS SERVERS SOLUTION
          </strong>
        </div>
      )}
    </div>
  );
};


