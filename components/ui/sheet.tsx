'use client';

import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  width?: 'md' | 'lg' | 'xl' | '2xl';
}

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  width = 'lg',
}: SheetProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  const widths = {
    md: 'max-w-md',
    lg: 'max-w-xl',
    xl: 'max-w-2xl',
    '2xl': 'max-w-3xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-end sm:items-stretch sm:justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => onOpenChange(false)}
      />

      {/* Slide-over panel / Bottom Sheet */}
      <div className="relative z-50 w-full sm:w-auto sm:max-w-full flex">
        <div
          className={cn(
            'w-full sm:w-screen rounded-t-2xl sm:rounded-none border-t sm:border-t-0 sm:border-l border-zinc-200 bg-white shadow-2xl flex flex-col transition-all duration-200 ease-out animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:slide-in-from-right dark:border-zinc-800 dark:bg-zinc-900 max-h-[90vh] sm:max-h-full sm:h-full',
            widths[width]
          )}
        >
          {/* Mobile Drag Indicator */}
          <div className="flex justify-center sm:hidden pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5 sm:px-6 sm:py-4 dark:border-zinc-800 shrink-0">
            <div className="pr-3">
              <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
              {description && <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{description}</p>}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 rounded-full shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">{children}</div>

          {/* Footer */}
          {footer && (
            <div className="border-t border-zinc-200 bg-zinc-50/75 px-5 py-3.5 sm:px-6 sm:py-4 dark:border-zinc-800 dark:bg-zinc-950/60 shrink-0 pb-safe">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
