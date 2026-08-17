'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  DEFAULT_SHORTCUTS,
  type ActionId,
  type Chord,
  chordFromEvent,
  isModifierCode,
  loadShortcuts,
  matchesChord,
  saveShortcuts
} from '@/lib/shortcuts';

interface KeymapContextValue {
  bindings: Record<ActionId, Chord>;
  recording: ActionId | null;
  setRecording: (id: ActionId | null) => void;
  setBinding: (id: ActionId, chord: Chord) => void;
  resetBinding: (id: ActionId) => void;
  resetAll: () => void;
  register: (id: ActionId, handler: () => void) => () => void;
}

const KeymapContext = createContext<KeymapContextValue | null>(null);

export function KeymapProvider({ children }: { children: React.ReactNode }) {
  const [bindings, setBindings] = useState<Record<ActionId, Chord>>(DEFAULT_SHORTCUTS);
  const [recording, setRecording] = useState<ActionId | null>(null);
  const handlers = useRef(new Map<ActionId, () => void>());
  const bindingsRef = useRef(bindings);
  const recordingRef = useRef(recording);
  bindingsRef.current = bindings;
  recordingRef.current = recording;

  useEffect(() => {
    setBindings(loadShortcuts());
  }, []);

  const setBinding = useCallback((id: ActionId, chord: Chord) => {
    setBindings((prev) => {
      const next = { ...prev, [id]: chord };
      saveShortcuts(next);
      return next;
    });
  }, []);

  const resetBinding = useCallback((id: ActionId) => {
    setBinding(id, DEFAULT_SHORTCUTS[id]);
  }, [setBinding]);

  const resetAll = useCallback(() => {
    setBindings({ ...DEFAULT_SHORTCUTS });
    saveShortcuts(DEFAULT_SHORTCUTS);
  }, []);

  const register = useCallback((id: ActionId, handler: () => void) => {
    handlers.current.set(id, handler);
    return () => {
      if (handlers.current.get(id) === handler) handlers.current.delete(id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (recordingRef.current) {
        if (e.key === 'Escape') {
          e.preventDefault();
          setRecording(null);
          return;
        }
        if (isModifierCode(e.code)) return;
        e.preventDefault();
        setBinding(recordingRef.current, chordFromEvent(e));
        setRecording(null);
        return;
      }

      if (e.repeat) return;
      for (const [id, chord] of Object.entries(bindingsRef.current) as [ActionId, Chord][]) {
        if (!matchesChord(e, chord)) continue;
        const handler = handlers.current.get(id);
        if (!handler) continue;
        e.preventDefault();
        handler();
        return;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [setBinding]);

  const value = useMemo(
    () => ({
      bindings,
      recording,
      setRecording,
      setBinding,
      resetBinding,
      resetAll,
      register
    }),
    [bindings, recording, setBinding, resetBinding, resetAll, register]
  );

  return <KeymapContext.Provider value={value}>{children}</KeymapContext.Provider>;
}

export function useKeymap() {
  const ctx = useContext(KeymapContext);
  if (!ctx) throw new Error('useKeymap must be used within KeymapProvider');
  return ctx;
}

export function useShortcut(id: ActionId, handler: () => void) {
  const { register } = useKeymap();
  useEffect(() => register(id, handler), [id, handler, register]);
}
