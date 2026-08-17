'use client';

import { useEffect, useRef, useState } from 'react';

export default function ResizeHandle({
  onDrag,
  title
}: {
  onDrag: (clientX: number) => void;
  title?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const onDragRef = useRef(onDrag);
  const handleRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  onDragRef.current = onDrag;

  useEffect(() => {
    // Clear stale state left behind by a missed pointerup or hot reload.
    document.body.classList.remove('is-resizing');
  }, []);

  useEffect(() => {
    if (!dragging) return;

    const finish = () => {
      const pointerId = pointerIdRef.current;
      const handle = handleRef.current;
      if (pointerId !== null && handle?.hasPointerCapture(pointerId)) {
        try {
          handle.releasePointerCapture(pointerId);
        } catch {
          /* pointer capture may already be released */
        }
      }
      pointerIdRef.current = null;
      setDragging(false);
    };
    const move = (e: PointerEvent) => {
      if (pointerIdRef.current !== e.pointerId) return;
      e.preventDefault();
      onDragRef.current(e.clientX);
    };

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', finish);
    window.addEventListener('pointercancel', finish);
    window.addEventListener('blur', finish);
    document.addEventListener('visibilitychange', finish);
    document.body.classList.add('is-resizing');

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', finish);
      window.removeEventListener('pointercancel', finish);
      window.removeEventListener('blur', finish);
      document.removeEventListener('visibilitychange', finish);
      document.body.classList.remove('is-resizing');
    };
  }, [dragging]);

  return (
    <div
      ref={handleRef}
      role="separator"
      aria-orientation="vertical"
      title={title}
      className={`resize-handle ${dragging ? 'is-active' : ''}`}
      onPointerDown={(e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        pointerIdRef.current = e.pointerId;
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        onDrag(e.clientX);
      }}
      onLostPointerCapture={() => {
        pointerIdRef.current = null;
        setDragging(false);
      }}
    />
  );
}
