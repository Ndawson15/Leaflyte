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
  onDragRef.current = onDrag;

  useEffect(() => {
    if (!dragging) return;

    const move = (e: PointerEvent) => {
      e.preventDefault();
      onDragRef.current(e.clientX);
    };
    const up = () => setDragging(false);

    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    document.body.classList.add('is-resizing');

    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.classList.remove('is-resizing');
    };
  }, [dragging]);

  return (
    <>
      <div
        role="separator"
        aria-orientation="vertical"
        title={title}
        className={`resize-handle ${dragging ? 'is-active' : ''}`}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.preventDefault();
          setDragging(true);
          onDrag(e.clientX);
        }}
      />
      {dragging && <div className="resize-overlay" />}
    </>
  );
}
