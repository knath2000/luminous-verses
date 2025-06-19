import React, { forwardRef } from 'react';

// ClassValue mirrors the accepted inputs of popular libraries like `clsx`
type ClassValue = string | number | boolean | null | undefined | readonly ClassValue[];

function cx(...classes: ClassValue[]): string {
  return classes.flat().filter(Boolean).join(' ');
}

interface VersePillProps {
  number: number;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

/**
 * Reusable button styled with glass-morphic verse-pill tokens.
 */
export const VersePill = forwardRef<HTMLButtonElement, VersePillProps>(
  ({ number, selected = false, disabled = false, onClick, className }, ref) => {
    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        aria-label={`Verse ${number}`}
        aria-current={selected || undefined}
        disabled={disabled}
        className={cx(
          'relative overflow-hidden rounded-2xl font-semibold text-lg h-16 w-full flex items-center justify-center transition-all duration-300 transform-gpu focus:outline-none focus:ring-2 focus:ring-gold/50 focus:ring-offset-2',
          'pill-surface inner-stroke',
          disabled && 'disabled pointer-events-none',
          selected && [
            'bg-gradient-to-br from-gold/40 via-gold/30 to-purple-500/40 text-gold shadow-2xl shadow-gold/40 border-2 border-gold/60 scale-110 rotate-1 animate-pulse',
          ],
          !selected && !disabled && [
            'text-white/90 shadow-lg shadow-black/20 hover:scale-105 hover:-rotate-1 hover:text-gold hover:border-gold/50 hover:shadow-xl hover:shadow-gold/30',
          ],
          className
        )}
      >
        {/* Shimmer sweep */}
        <div className="absolute inset-0 rounded-2xl animate-shimmer-sweep opacity-0 hover:opacity-100 transition-opacity duration-500" />

        {/* Number */}
        <span
          className={cx(
            'relative z-10 font-bold transition-all duration-300',
            selected ? 'text-shadow-gold drop-shadow-lg text-xl' : 'group-hover:scale-110 group-hover:drop-shadow-md'
          )}
        >
          {number}
        </span>

        {/* Sparkle burst on hover */}
        {!selected && !disabled && (
          <span className="absolute -top-1 -left-1 text-xs text-gold/70 opacity-0 group-hover:opacity-100 animate-sparkleBurst" aria-hidden="true">✨</span>
        )}
        {selected && (
          <>
            <div className="absolute inset-0 rounded-2xl bg-gold/5 animate-ping" />
            <div className="absolute -top-2 -right-2 text-gold">
              <span className="text-sm animate-bounce">✨</span>
            </div>
          </>
        )}
      </button>
    );
  }
);

VersePill.displayName = 'VersePill'; 