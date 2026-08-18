'use client';

import { createPortal } from 'react-dom';
import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react';

export type FloatingPlacement = 'bottom-start' | 'bottom-end' | 'right-start' | 'left-start';

function computeCoords(
  anchor: DOMRect,
  panel: DOMRect | undefined,
  placement: FloatingPlacement,
  offset: number
) {
  const pw = panel?.width ?? 0;
  const ph = panel?.height ?? 0;
  let top = 0;
  let left = 0;

  switch (placement) {
    case 'bottom-start':
      top = anchor.bottom + offset;
      left = anchor.left;
      break;
    case 'bottom-end':
      top = anchor.bottom + offset;
      left = anchor.right - pw;
      break;
    case 'right-start':
      top = anchor.top;
      left = anchor.right + offset;
      break;
    case 'left-start':
      top = anchor.top;
      left = anchor.left - pw - offset;
      break;
  }

  const margin = 8;
  if (pw > 0) {
    left = Math.max(margin, Math.min(left, window.innerWidth - pw - margin));
  }
  if (ph > 0) {
    top = Math.max(margin, Math.min(top, window.innerHeight - ph - margin));
  }

  return { top, left };
}

export default function FloatingPopover({
  anchorRef,
  open,
  onClose,
  placement = 'bottom-start',
  offset = 6,
  className = '',
  children
}: {
  anchorRef: RefObject<HTMLElement | null>;
  open: boolean;
  onClose?: () => void;
  placement?: FloatingPlacement;
  offset?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: -9999, left: -9999 });

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const anchor = anchorRef.current;
      if (!anchor) return;
      const anchorRect = anchor.getBoundingClientRect();
      const panelRect = panelRef.current?.getBoundingClientRect();
      setCoords(computeCoords(anchorRect, panelRect, placement, offset));
    };

    update();
    const frame = requestAnimationFrame(update);
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
  }, [open, placement, offset, anchorRef, children]);

  useEffect(() => {
    if (!open || !onClose) return;

    const close = (event: MouseEvent) => {
      const target = event.target as Node;
      if (anchorRef.current?.contains(target)) return;
      if (panelRef.current?.contains(target)) return;
      onClose();
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose, anchorRef]);

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={panelRef}
      className={`fixed z-[200] pointer-events-auto ${className}`}
      style={{ top: coords.top, left: coords.left }}
      onMouseDown={(event) => event.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
}
