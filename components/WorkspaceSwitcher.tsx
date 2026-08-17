'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Layers, Plus } from 'lucide-react';
import { createWorkspaceFromPicker } from '@/lib/createWorkspaceFlow';
import { useWorkspaces } from '@/components/WorkspaceProvider';

export default function WorkspaceSwitcher({
  placement = 'footer',
  onSwitch,
  onManage,
  onNotice
}: {
  placement?: 'footer' | 'rail';
  onSwitch: (workspaceId: string) => void;
  onManage?: () => void;
  onNotice?: (message: string) => void;
}) {
  const { store, workspace, addWorkspace } = useWorkspaces();
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const currentName = workspace?.name ?? 'Workspace';

  useEffect(() => {
    if (!open) return;
    const close = (ev: MouseEvent) => {
      if (rootRef.current?.contains(ev.target as Node)) return;
      setOpen(false);
    };
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleCreate = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const ws = await createWorkspaceFromPicker(onNotice);
      if (!ws) return;
      addWorkspace(ws);
      setOpen(false);
      onSwitch(ws.id);
    } catch (err) {
      onNotice?.(err instanceof Error ? err.message : 'Could not create workspace');
    } finally {
      setCreating(false);
    }
  };

  const menu = open && (
    <div
      className={`absolute z-[80] min-w-[12rem] max-w-[16rem] rounded-md border border-border bg-surface py-1 shadow-xl ${
        placement === 'rail'
          ? 'left-full bottom-0 ml-1.5'
          : 'left-0 bottom-full mb-1'
      }`}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted">Workspaces</div>
      {store.workspaces.map((w) => {
        const active = w.id === workspace?.id;
        return (
          <button
            key={w.id}
            type="button"
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-surface2 ${
              active ? 'text-text' : 'text-muted hover:text-text'
            }`}
            onClick={() => {
              setOpen(false);
              if (!active) onSwitch(w.id);
            }}
          >
            <Check size={14} className={active ? 'opacity-100' : 'opacity-0'} />
            <span className="truncate">{w.name}</span>
          </button>
        );
      })}
      <div className="my-1 border-t border-border" />
      <button
        type="button"
        disabled={creating}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-muted hover:bg-surface2 hover:text-text disabled:opacity-50"
        onClick={() => void handleCreate()}
      >
        <Plus size={14} className="shrink-0" />
        {creating ? 'Creating…' : 'New workspace'}
      </button>
      {onManage && (
        <button
          type="button"
          className="w-full px-3 py-1.5 text-left text-[12px] text-muted hover:bg-surface2 hover:text-text"
          onClick={() => {
            setOpen(false);
            onManage();
          }}
        >
          Manage workspaces…
        </button>
      )}
    </div>
  );

  if (placement === 'rail') {
    return (
      <div ref={rootRef} className="relative shrink-0">
        <button
          type="button"
          title={`Switch workspace (${currentName})`}
          aria-label={`Switch workspace (${currentName})`}
          className="flex h-8 w-8 items-center justify-center rounded-md hover:bg-surface2"
          onClick={() => setOpen((v) => !v)}
        >
          <Layers size={15} strokeWidth={1.75} className="shrink-0 text-muted" />
        </button>
        {menu}
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative min-w-0 flex-1">
      <button
        type="button"
        title={`Switch workspace (${currentName})`}
        className="flex w-full min-w-0 items-center gap-1 rounded-md px-1 py-1 hover:bg-surface2/80"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="min-w-0 flex-1 truncate px-1 text-left text-[12px] text-muted">{currentName}</span>
        <ChevronDown size={14} strokeWidth={1.75} className="shrink-0 text-muted" />
      </button>
      {menu}
    </div>
  );
}
