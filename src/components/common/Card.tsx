import React, { HTMLAttributes } from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'interactive' | 'flat' | 'dark';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  ...props
}) => {
  const variants = {
    default: 'bg-white border border-slate-200 shadow-sm text-slate-800 transition-all duration-300',
    glass: 'bg-white/90 backdrop-blur-md border border-slate-200/80 shadow-md text-slate-800 transition-all duration-300',
    interactive: 'bg-white border border-slate-200 hover:border-indigo-300 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl text-slate-800 cursor-pointer',
    flat: 'bg-slate-50 border border-slate-200 text-slate-800 transition-all duration-300',
    dark: 'bg-[#1E1B4B] border border-indigo-900 shadow-lg text-white transition-all duration-300',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-5 md:p-6 relative overflow-hidden',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};

