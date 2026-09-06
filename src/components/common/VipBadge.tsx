'use client';

import React from 'react';
import { Crown } from 'lucide-react';

interface VipBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function VipBadge({ size = 'sm', text = 'VIP', className = '' }: VipBadgeProps) {
  const sizeClasses = {
    sm: 'text-[11px] px-2.5 py-0.5 gap-1 font-bold',
    md: 'text-xs px-3 py-1 gap-1.5 font-extrabold',
    lg: 'text-sm px-4 py-1.5 gap-2 font-black',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full bg-brand-gold text-[#141914] border border-brand-gold/60 shadow-xs ${sizeClasses[size]} ${className}`}
    >
      <Crown className={`${iconSizes[size]} fill-current text-[#141914]`} />
      <span>{text}</span>
    </span>
  );
}
