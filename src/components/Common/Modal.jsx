import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

/**
 * Reusable modal overlay using Framer Motion animations.
 * @param {boolean} isOpen - Active open flag
 * @param {Function} onClose - Close callback
 * @param {string} title - Header text
 * @param {React.ReactNode} children - Core modal body
 * @param {React.ReactNode} footer - Optional bottom actions row
 * @param {'sm'|'md'|'lg'} size - Max width sizing
 */
export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
}) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', stiffness: 350, damping: 25 }}
            className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl flex flex-col max-h-[85vh] z-10`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="font-semibold text-lg text-slate-900 dark:text-white font-display">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer focus:outline-none"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 px-5 py-4 overflow-y-auto text-slate-600 dark:text-slate-300">
              {children}
            </div>

            {/* Footer Actions */}
            {footer && (
              <div className="flex justify-end items-center gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 rounded-b-2xl">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
