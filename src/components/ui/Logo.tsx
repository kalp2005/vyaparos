'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  className?: string;
  glow?: boolean;
}

export function Logo({
  size = 'md',
  showWordmark = true,
  className = '',
  glow = false,
}: LogoProps) {
  const sizeMap = {
    xs: { width: 24, height: 20, text: 'text-sm' },
    sm: { width: 34, height: 28, text: 'text-base' },
    md: { width: 44, height: 36, text: 'text-lg' },
    lg: { width: 58, height: 48, text: 'text-2xl' },
    xl: { width: 78, height: 64, text: 'text-3xl' },
  };

  const { width, height, text: textSize } = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Official Geometric V Logo */}
      <div
        className={`relative flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-105 ${
          glow ? 'drop-shadow-[0_0_12px_rgba(46,152,223,0.4)]' : ''
        }`}
      >
        <img
          src="/logo.svg"
          alt="VyaparOS Logo"
          width={width}
          height={height}
          className="object-contain rounded-lg"
          style={{ width: `${width}px`, height: 'auto' }}
        />
      </div>

      {/* Wordmark */}
      {showWordmark && (
        <div className="flex flex-col leading-none">
          <span className={`font-black tracking-tight text-slate-900 dark:text-slate-100 ${textSize}`}>
            Vyapar<span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 via-vyapar-500 to-blue-600">OS</span>
          </span>
        </div>
      )}
    </div>
  );
}
