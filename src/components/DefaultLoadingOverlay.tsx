import { AnimatePresence, motion } from 'framer-motion';
import React from 'react';

export interface DefaultLoadingOverlayProps {
  loading: boolean
  text?: React.ReactNode
  className?: string // position/size overrides (e.g., "absolute inset-0 z-10")
  blur?: boolean // apply light backdrop blur
  spinnerClassName?: string // customize spinner size/color
  layout?: 'row' | 'col' // layout direction for spinner + text
  backdropClassName?: string // override default backdrop color
}

/**
 * Reusable loading overlay for covering a container while async tasks run.
 * The parent container should be position: relative for absolute overlay usage.
 */
export const DefaultLoadingOverlay: React.FC<DefaultLoadingOverlayProps> = ({
  loading,
  text,
  className = 'absolute inset-0 z-10',
  blur = true,
  spinnerClassName = 'w-5 h-5',
  layout = 'row',
  backdropClassName,
}) => {
  const backdrop = backdropClassName ?? 'bg-black/40';
  const dir = layout === 'col' ? 'flex-col' : 'flex-row';

  return (
    <AnimatePresence initial={false}>
      {loading && (
        <motion.div
          className={`${className} ${backdrop} ${blur ? 'backdrop-blur-[1px]' : ''} flex items-center justify-center`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className={`flex items-center gap-3 text-sm ${dir}`}>
            <span
              className={`inline-block rounded-full border-2 border-white/30 border-t-white animate-spin ${spinnerClassName}`}
            />
            {text ? (
              <span className="text-[var(--text-color)]/90">{text}</span>
            ) : null}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
