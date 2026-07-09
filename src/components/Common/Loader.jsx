import React from 'react';

/**
 * Standard spinner loader component.
 * @param {'sm'|'md'|'lg'} size - Spinner circle size
 * @param {string} text - Optional description text
 */
export default function Loader({ size = 'md', text = '' }) {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4',
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 p-6 w-full h-full min-h-[150px]">
      <div
        className={`border-slate-200 dark:border-slate-800 border-t-brand-500 dark:border-t-brand-400 rounded-full animate-spin ${sizeClasses[size]}`}
      />
      {text && (
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse font-display">
          {text}
        </p>
      )}
    </div>
  );
}
