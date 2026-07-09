import React from 'react';

/**
 * Reusable Button component with multiple styles and sizes.
 * @param {React.ReactNode} children - Button text/content
 * @param {Function} onClick - Click handler
 * @param {'button'|'submit'|'reset'} type - HTML button type
 * @param {'primary'|'secondary'|'danger'|'glass'|'outline'|'ghost'} variant - Button theme
 * @param {'sm'|'md'|'lg'} size - Button size
 * @param {boolean} disabled - Disabled state
 * @param {React.ComponentType} icon - Optional Lucide icon component
 * @param {boolean} loading - Displays loading spinner inside button
 * @param {string} className - Additional CSS classes
 */
export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  icon: Icon,
  loading = false,
  className = '',
}) {
  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98] cursor-pointer';

  const variants = {
    primary:
      'bg-gradient-to-r from-brand-600 to-purple-600 hover:from-brand-500 hover:to-purple-500 text-white shadow-sm hover:shadow shadow-brand-500/20 border border-transparent',
    secondary:
      'bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-transparent',
    danger:
      'bg-rose-500 hover:bg-rose-600 text-white shadow-sm hover:shadow shadow-rose-500/20 border border-transparent',
    glass:
      'bg-white/10 hover:bg-white/20 text-slate-800 dark:text-white border border-white/10 backdrop-blur-sm',
    outline:
      'border border-slate-200 hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:hover:bg-slate-800/50 dark:text-slate-300',
    ghost:
      'hover:bg-slate-100 dark:hover:bg-slate-800/50 text-slate-600 dark:text-slate-400',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-slate-50 border-t-transparent rounded-full animate-spin shrink-0" />
      ) : (
        Icon && <Icon className="w-4 h-4 shrink-0" />
      )}
      {children}
    </button>
  );
}
