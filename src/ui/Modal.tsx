import { useEffect, useRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

type Props = {
  onClose: () => void;
  label: string;
  children: ReactNode;
  /** Rendered in the sticky header beside the close button. */
  header?: ReactNode;
  size?: 'md' | 'lg';
};

/**
 * Dialog shell shared by the project case studies and the certificate viewer.
 *
 * Handles the parts that are easy to leave out of a hand-rolled overlay and
 * annoying to hit as a user: Escape to close, a locked background so the page
 * behind does not scroll away, focus moved into the dialog and restored on
 * close, and a backdrop click that does not fire when a drag started inside.
 */
export default function Modal({ onClose, label, children, header, size = 'lg' }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const backdropMouseDown = useRef(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Lock the page behind the dialog, compensating for the scrollbar so the
  // layout does not jump sideways as it disappears.
  useEffect(() => {
    const { body, documentElement } = document;
    const gap = window.innerWidth - documentElement.clientWidth;
    const previous = { overflow: body.style.overflow, paddingRight: body.style.paddingRight };
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
    return () => {
      body.style.overflow = previous.overflow;
      body.style.paddingRight = previous.paddingRight;
    };
  }, []);

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    panel.current?.focus();
    return () => previouslyFocused?.focus?.();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] grid place-items-center p-4"
      style={{ background: 'var(--scrim)', backdropFilter: 'blur(8px)' }}
      // Track where the press started: releasing on the backdrop after a drag
      // that began inside the panel (selecting text) must not close the dialog.
      onMouseDown={(e) => {
        backdropMouseDown.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && backdropMouseDown.current) onClose();
      }}
    >
      <motion.div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 12 }}
        transition={{ duration: 0.2 }}
        className={`card flex max-h-[88vh] w-full flex-col overflow-hidden outline-none ${
          size === 'lg' ? 'max-w-3xl' : 'max-w-xl'
        }`}
      >
        {header ? (
          <div
            className="flex flex-none items-start justify-between gap-4 p-6 pb-4"
            style={{ borderBottom: '1px solid var(--line)' }}
          >
            <div className="min-w-0">{header}</div>
            <button
              type="button"
              onClick={onClose}
              className="icon-btn flex-none"
              aria-label="Close dialog"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : null}

        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}
