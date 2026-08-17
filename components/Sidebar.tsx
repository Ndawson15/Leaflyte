'use client';

import { useEffect, useRef, useState, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import {
  ChevronRight,
  FilePlus,
  FolderPlus,
  PanelLeft,
  Search,
  Settings,
  Trash2
} from 'lucide-react';
import type { TreeNode } from '@/lib/vault';
import { destinationForDrop, dropTargetFromEvent, isInvalidMove, joinPath, parentDir, rewritePath, basename, type DropTarget } from '@/lib/paths';
import { dispatchAiDropHover, dispatchAiTagFile } from '@/lib/ai/mentions';
import { APP_NAME } from '@/lib/appInfo';
import AppLogo from '@/components/AppLogo';
import FileTypeIcon from '@/components/FileTypeIcon';
import TitleDrag from '@/components/TitleDrag';
import WorkspaceSwitcher from '@/components/WorkspaceSwitcher';

const ICON = { size: 15, strokeWidth: 1.75, className: 'shrink-0' as const };

type Creating = { parent: string; kind: 'file' | 'folder' };

interface SidebarProps {
  tree: TreeNode[];
  activePath: string | null;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelect: (path: string, pin?: boolean) => void;
  onCreateFile: (fullPath: string) => Promise<boolean | void>;
  onCreateFolder: (fullPath: string) => Promise<boolean | void>;
  onDelete: (path: string, type: 'file' | 'folder') => void;
  onMove: (from: string, to: string) => void;
  onOpenSettings: () => void;
  onSearch: () => void;
  onRevealPath?: (path: string) => void;
  onCopyPath?: (path: string) => void;
  settingsActive?: boolean;
  pendingCreate?: { kind: 'file' | 'folder'; parent: string; nonce: number } | null;
  onSwitchWorkspace: (workspaceId: string) => void;
  onManageWorkspaces?: () => void;
  onNotice?: (message: string) => void;
}

export default function Sidebar({
  tree,
  activePath,
  collapsed,
  onToggleCollapsed,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onMove,
  onOpenSettings,
  onSearch,
  onRevealPath,
  onCopyPath,
  settingsActive,
  pendingCreate,
  onSwitchWorkspace,
  onManageWorkspaces,
  onNotice
}: SidebarProps) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [dragPath, setDragPath] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [creating, setCreating] = useState<Creating | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; name: string } | null>(null);
  const [confirmDel, setConfirmDel] = useState<{ path: string; kind: 'file' | 'folder' } | null>(
    null
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [menu, setMenu] = useState<{
    x: number;
    y: number;
    path: string;
    kind: 'file' | 'folder';
  } | null>(null);
  const dragPathRef = useRef<string | null>(null);
  const suppressClickRef = useRef(false);
  const treeRef = useRef(tree);
  treeRef.current = tree;
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;
  const pendingDrag = useRef<{
    path: string;
    kind: 'file' | 'folder';
    name: string;
    startX: number;
    startY: number;
    active: boolean;
    pointerId: number;
    target: HTMLElement;
  } | null>(null);

  const setVaultDragging = (active: boolean) => {
    document.body.classList.toggle('is-vault-dragging', active);
  };

  const clearTextSelection = () => {
    window.getSelection()?.removeAllRanges();
  };

  const setDragging = (path: string | null) => {
    dragPathRef.current = path;
    setDragPath(path);
  };

  const requestDelete = (path: string, kind: 'file' | 'folder') => {
    setMenu(null);
    setConfirmDel({ path, kind });
  };

  const toggleFolder = (path: string) => {
    setOpen((o) => ({ ...o, [path]: !(o[path] ?? true) }));
  };

  const startCreate = (parent: string, kind: 'file' | 'folder') => {
    if (parent) setOpen((o) => ({ ...o, [parent]: true }));
    setCreating({ parent, kind });
  };

  useEffect(() => {
    if (!pendingCreate) return;
    startCreate(pendingCreate.parent, pendingCreate.kind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCreate?.nonce]);

  const handleMove = (from: string, target: DropTarget) => {
    const sourceNode = findNode(treeRef.current, from);
    const dest = destinationForDrop(from, target);
    if (isInvalidMove(from, dest, sourceNode?.type === 'folder')) return;
    onMoveRef.current(from, dest);
    setOpen((o) => {
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(o)) next[rewritePath(k, from, dest)] = v;
      if (target !== 'root' && target.type === 'folder') next[target.path] = true;
      next[dest] = true;
      return next;
    });
  };

  const submitCreate = async (rawName: string): Promise<boolean> => {
    if (!creating) return false;
    const name = sanitizeRelName(rawName);
    if (!name) return false;
    const conflict = findSibling(treeRef.current, creating.parent, name);
    if (conflict) {
      const kindLabel = conflict.type === 'folder' ? 'folder' : 'note';
      setNotice(`There is already a ${kindLabel} with name: ${conflict.name}`);
      return false;
    }
    const fullPath = joinPath(creating.parent, name);
    const ok =
      creating.kind === 'file' ? await onCreateFile(fullPath) : await onCreateFolder(fullPath);
    if (ok === false) {
      setNotice(
        creating.kind === 'folder'
          ? `There is already a folder with name: ${name}`
          : `Could not create “${name}”.`
      );
      return false;
    }
    setCreating(null);
    return true;
  };

  const highlightFor = (from: string, target: DropTarget): string | null => {
    if (target === 'root') return 'root';
    const dest = destinationForDrop(from, target);
    if (isInvalidMove(from, dest, findNode(treeRef.current, from)?.type === 'folder')) return null;
    if (target.type === 'folder') return target.path;
    return parentDir(target.path) || 'root';
  };

  const beginPointerDrag = (
    e: PointerEvent,
    node: { path: string; type: 'file' | 'folder'; name: string }
  ) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement).closest('button')) return;
    pendingDrag.current = {
      path: node.path,
      kind: node.type,
      name: node.name,
      startX: e.clientX,
      startY: e.clientY,
      active: false,
      pointerId: e.pointerId,
      target: e.currentTarget as HTMLElement
    };
  };

  useEffect(() => {
    const onSelectStart = (e: Event) => {
      const target = e.target as Node | null;
      if (target && (target as Element).closest?.('.monaco-editor, .leaflyte-text-editor')) return;
      if (pendingDrag.current?.active || dragPathRef.current) e.preventDefault();
    };

    const activateDrag = (d: NonNullable<typeof pendingDrag.current>, e: globalThis.PointerEvent) => {
      if (d.active) return;
      d.active = true;
      setVaultDragging(true);
      clearTextSelection();
      try {
        d.target.setPointerCapture(d.pointerId);
      } catch {
        /* ignore */
      }
      e.preventDefault();
    };

    const endDrag = (d: NonNullable<typeof pendingDrag.current> | null) => {
      setVaultDragging(false);
      clearTextSelection();
      if (d) {
        try {
          if (d.target.hasPointerCapture(d.pointerId)) d.target.releasePointerCapture(d.pointerId);
        } catch {
          /* ignore */
        }
      }
    };

    const onMove = (e: globalThis.PointerEvent) => {
      const d = pendingDrag.current;
      if (!d) return;
      const dist = Math.hypot(e.clientX - d.startX, e.clientY - d.startY);
      if (!d.active && dist < 12) return;
      activateDrag(d, e);
      if (dragPathRef.current !== d.path) setDragging(d.path);
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const aiDrop = el?.closest('[data-ai-drop]');
      const mainCol = el?.closest('[data-main-column]');
      const bottomAiDrop =
        d.kind === 'file' &&
        mainCol &&
        !aiDrop &&
        (() => {
          const rect = mainCol.getBoundingClientRect();
          return e.clientY >= rect.bottom - 140;
        })();
      dispatchAiDropHover(!!aiDrop || !!bottomAiDrop);
      const target = dropTargetFromEvent({ target: el });
      setDropTarget(highlightFor(d.path, target));
      setGhost({ x: e.clientX, y: e.clientY, name: d.name });
      e.preventDefault();
    };
    const onUp = (e: globalThis.PointerEvent) => {
      const d = pendingDrag.current;
      pendingDrag.current = null;
      setGhost(null);
      if (!d?.active) {
        endDrag(d);
        dispatchAiDropHover(false);
        setDragging(null);
        setDropTarget(null);
        return;
      }
      suppressClickRef.current = true;
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const aiDrop = el?.closest('[data-ai-drop]');
      const mainCol = el?.closest('[data-main-column]');
      const bottomAiDrop =
        d.kind === 'file' &&
        mainCol &&
        !aiDrop &&
        (() => {
          const rect = mainCol.getBoundingClientRect();
          return e.clientY >= rect.bottom - 140;
        })();
      if ((aiDrop || bottomAiDrop) && d.kind === 'file') {
        dispatchAiTagFile(d.path);
        dispatchAiDropHover(false);
        endDrag(d);
        setDragging(null);
        setDropTarget(null);
        return;
      }
      handleMove(d.path, dropTargetFromEvent({ target: el }));
      dispatchAiDropHover(false);
      endDrag(d);
      setDragging(null);
      setDropTarget(null);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    const onBlur = () => {
      pendingDrag.current = null;
      setGhost(null);
      endDrag(null);
      dispatchAiDropHover(false);
      setDragging(null);
      setDropTarget(null);
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('selectstart', onSelectStart);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('selectstart', onSelectStart);
      setVaultDragging(false);
    };
    // handleMove/highlightFor read latest tree via treeRef
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const guardedClick = (fn: () => void) => {
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    fn();
  };

  const selectFile = (path: string, pin?: boolean) => {
    pendingDrag.current = null;
    if (suppressClickRef.current) {
      suppressClickRef.current = false;
      return;
    }
    onSelect(path, pin);
  };

  const openMenu = (e: MouseEvent, path: string, kind: 'file' | 'folder') => {
    e.preventDefault();
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, path, kind });
  };

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') close();
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu]);

  if (collapsed) {
    return (
      <div className="titlebar-rail h-full w-full flex flex-col items-center py-2 bg-surface font-sans">
        <TitleDrag className="h-8 w-full shrink-0" />
        <IconButton title="Show vault" onClick={onToggleCollapsed}>
          <PanelLeft {...ICON} />
        </IconButton>
        <IconButton title="Search" onClick={onSearch}>
          <Search {...ICON} />
        </IconButton>
        <div className="flex-1" />
        <WorkspaceSwitcher
          placement="rail"
          onSwitch={onSwitchWorkspace}
          onManage={onManageWorkspaces}
          onNotice={onNotice}
        />
        <IconButton title="Settings" onClick={onOpenSettings} active={settingsActive}>
          <Settings {...ICON} />
        </IconButton>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-surface font-sans text-[13px]">
      <div className="titlebar-left shrink-0 border-b border-border/60">
        <div className="titlebar-traffic-spacer shrink-0" aria-hidden />
        <div className="titlebar-brand flex shrink-0 items-center gap-1.5 px-1.5">
          <AppLogo size={18} alt="" />
          <span className="text-[12px] font-medium text-text">{APP_NAME}</span>
        </div>
        <TitleDrag className="min-w-0 flex-1 self-stretch" />
      </div>

      <div
        data-drop-root
        className={`flex items-center gap-0.5 h-8 px-1.5 shrink-0 ${
          dropTarget === 'root' ? 'drop-target' : ''
        }`}
      >
        <IconButton title="New note" onClick={() => startCreate('', 'file')}>
          <FilePlus {...ICON} />
        </IconButton>
        <IconButton title="New folder" onClick={() => startCreate('', 'folder')}>
          <FolderPlus {...ICON} />
        </IconButton>
        <IconButton title="Search" onClick={onSearch}>
          <Search {...ICON} />
        </IconButton>
        <div className="flex-1" />
        <IconButton title="Hide vault" onClick={onToggleCollapsed}>
          <PanelLeft {...ICON} />
        </IconButton>
      </div>

      <div className="flex-1 overflow-y-auto px-1 pb-1">
        <TreeList
          nodes={tree}
          parentPath=""
          depth={0}
          activePath={activePath}
          open={open}
          creating={creating}
          dragPath={dragPath}
          dropTarget={dropTarget}
          onToggle={(path) => guardedClick(() => toggleFolder(path))}
          onSelect={selectFile}
          onStartCreate={startCreate}
          onSubmitCreate={submitCreate}
          onCancelCreate={() => setCreating(null)}
          onDelete={requestDelete}
          onContextMenu={openMenu}
          onPointerDrag={beginPointerDrag}
        />
      </div>
      {ghost && (
        <div
          className="fixed z-[60] pointer-events-none px-2 py-0.5 rounded-md bg-surface2 border border-border text-[12px] text-text shadow-lg"
          style={{ left: ghost.x + 12, top: ghost.y + 8 }}
        >
          {ghost.name}
        </div>
      )}
      {notice && <Notice message={notice} onDismiss={() => setNotice(null)} />}
      {confirmDel && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40"
          onClick={() => setConfirmDel(null)}
        >
          <div
            className="w-[22rem] rounded-lg border border-border bg-surface p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm text-text">
              {confirmDel.kind === 'folder' ? (
                <>
                  Delete folder “{basename(confirmDel.path)}” and everything inside it? Notes,
                  folders, and files in it will be permanently removed.
                </>
              ) : (
                <>Delete note “{basename(confirmDel.path)}”? This cannot be undone.</>
              )}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                className="px-3 py-1.5 text-[12px] text-muted hover:text-text"
                onClick={() => setConfirmDel(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-3 py-1.5 text-[12px] text-red-400 hover:bg-surface2 rounded"
                onClick={() => {
                  onDelete(confirmDel.path, confirmDel.kind);
                  setConfirmDel(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      {menu && (
        <div
          className="fixed z-50 min-w-[160px] rounded-md border border-border bg-surface py-1 shadow-lg"
          style={{ left: menu.x, top: menu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {menu.kind === 'folder' && (
            <>
              <MenuItem
                onClick={() => {
                  startCreate(menu.path, 'file');
                  setMenu(null);
                }}
              >
                New note
              </MenuItem>
              <MenuItem
                onClick={() => {
                  startCreate(menu.path, 'folder');
                  setMenu(null);
                }}
              >
                New folder
              </MenuItem>
            </>
          )}
          {menu.kind === 'file' && onRevealPath && (
            <MenuItem
              onClick={() => {
                onRevealPath(menu.path);
                setMenu(null);
              }}
            >
              Reveal in Finder
            </MenuItem>
          )}
          {onCopyPath && (
            <MenuItem
              onClick={() => {
                onCopyPath(menu.path);
                setMenu(null);
              }}
            >
              Copy path
            </MenuItem>
          )}
          <MenuItem
            danger
            onClick={() => requestDelete(menu.path, menu.kind)}
          >
            Delete {menu.kind}
          </MenuItem>
        </div>
      )}

      <div className="border-t border-border px-1.5 py-1 flex items-center gap-1 min-h-[34px]">
        <WorkspaceSwitcher
          onSwitch={onSwitchWorkspace}
          onManage={onManageWorkspaces}
          onNotice={onNotice}
        />
        <IconButton title="Settings" onClick={onOpenSettings} active={settingsActive}>
          <Settings {...ICON} />
        </IconButton>
      </div>
    </div>
  );
}

function TreeList({
  nodes,
  parentPath,
  depth,
  activePath,
  open,
  creating,
  dragPath,
  dropTarget,
  onToggle,
  onSelect,
  onStartCreate,
  onSubmitCreate,
  onCancelCreate,
  onDelete,
  onContextMenu,
  onPointerDrag
}: {
  nodes: TreeNode[];
  parentPath: string;
  depth: number;
  activePath: string | null;
  open: Record<string, boolean>;
  creating: Creating | null;
  dragPath: string | null;
  dropTarget: string | null;
  onToggle: (path: string) => void;
  onSelect: (path: string, pin?: boolean) => void;
  onStartCreate: (parent: string, kind: 'file' | 'folder') => void;
  onSubmitCreate: (name: string) => Promise<boolean>;
  onCancelCreate: () => void;
  onDelete: (path: string, type: 'file' | 'folder') => void;
  onContextMenu: (e: MouseEvent, path: string, kind: 'file' | 'folder') => void;
  onPointerDrag: (
    e: PointerEvent,
    node: { path: string; type: 'file' | 'folder'; name: string }
  ) => void;
}) {
  const showCreate = creating?.parent === parentPath;

  return (
    <ul>
      {showCreate && creating && (
        <li>
          <InlineCreateRow depth={depth} kind={creating.kind} onSubmit={onSubmitCreate} onCancel={onCancelCreate} />
        </li>
      )}
      {nodes.map((node) => {
        const isOpen = creating?.parent === node.path || (open[node.path] ?? true);
        const isDrop = dropTarget === node.path;
        const isDragging = dragPath === node.path;
        const selected = activePath === node.path;

        const dragProps = {
          onPointerDown: (e: PointerEvent) => onPointerDrag(e, node)
        };

        return (
          <li
            key={node.path}
            data-drop-path={node.path}
            data-drop-kind={node.type}
          >
            {node.type === 'folder' ? (
              <div
                className={`tree-row ${isDrop ? 'drop-target' : ''} ${isDragging ? 'opacity-40' : ''}`}
                style={{ paddingLeft: 6 + depth * 14 }}
                onClick={() => onToggle(node.path)}
                onContextMenu={(e) => onContextMenu(e, node.path, 'folder')}
                {...dragProps}
              >
                <ChevronRight
                  size={12}
                  strokeWidth={2}
                  className={`shrink-0 text-muted transition-transform ${isOpen ? 'rotate-90' : ''}`}
                />
                <FileTypeIcon name={node.name} kind="folder" open={isOpen} />
                <span className="truncate min-w-0 flex-1 text-text">{node.name}</span>
                <span className="row-actions text-muted">
                  <RowAction title="New note" onClick={() => onStartCreate(node.path, 'file')}>
                    <FilePlus {...ICON} />
                  </RowAction>
                  <RowAction title="New folder" onClick={() => onStartCreate(node.path, 'folder')}>
                    <FolderPlus {...ICON} />
                  </RowAction>
                  <RowAction title="Delete folder" onClick={() => onDelete(node.path, 'folder')} danger>
                    <Trash2 {...ICON} />
                  </RowAction>
                </span>
              </div>
            ) : (
              <div
                className={`tree-row ${selected ? 'is-selected' : ''} ${isDrop ? 'drop-target' : ''} ${
                  isDragging ? 'opacity-40' : ''
                }`}
                style={{ paddingLeft: 6 + depth * 14 }}
                title="Double-click to keep this note in a tab"
                onClick={() => onSelect(node.path)}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  onSelect(node.path, true);
                }}
                onContextMenu={(e) => onContextMenu(e, node.path, 'file')}
                {...dragProps}
              >
                <span className="w-4 shrink-0" />
                <FileTypeIcon name={node.name} />
                <FileLabel name={node.name} />
                <span className="row-actions">
                  <RowAction title="Delete" onClick={() => onDelete(node.path, 'file')} danger>
                    <Trash2 {...ICON} />
                  </RowAction>
                </span>
              </div>
            )}
            {node.type === 'folder' && isOpen && (
              <div
                className={`tree-children ${
                  isDrop && dragPath !== node.path ? 'rounded-sm drop-target' : ''
                }`}
                style={{ ['--guide-x' as string]: `${12 + depth * 14}px` }}
              >
                <TreeList
                  nodes={node.children ?? []}
                  parentPath={node.path}
                  depth={depth + 1}
                  activePath={activePath}
                  open={open}
                  creating={creating}
                  dragPath={dragPath}
                  dropTarget={dropTarget}
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onStartCreate={onStartCreate}
                  onSubmitCreate={onSubmitCreate}
                  onCancelCreate={onCancelCreate}
                  onDelete={onDelete}
                  onContextMenu={onContextMenu}
                  onPointerDrag={onPointerDrag}
                />
                {(node.children?.length ?? 0) === 0 && creating?.parent !== node.path && (
                  <div
                    className="h-5 mx-1 rounded-sm"
                    style={{ marginLeft: 6 + (depth + 1) * 14 }}
                  />
                )}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function FileLabel({ name }: { name: string }) {
  const i = name.lastIndexOf('.');
  if (i <= 0) return <span className="truncate min-w-0 flex-1">{name}</span>;
  return (
    <span className="truncate min-w-0 flex-1">
      {name.slice(0, i)}
      <span className="text-muted">{name.slice(i)}</span>
    </span>
  );
}

function InlineCreateRow({
  depth,
  kind,
  onSubmit,
  onCancel
}: {
  depth: number;
  kind: 'file' | 'folder';
  onSubmit: (name: string) => Promise<boolean>;
  onCancel: () => void;
}) {
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const doneRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const commit = async () => {
    if (doneRef.current) return;
    const trimmed = name.trim();
    if (!trimmed) {
      doneRef.current = true;
      onCancel();
      return;
    }
    const ok = await onSubmit(trimmed);
    if (ok) {
      doneRef.current = true;
      return;
    }
    setError(true);
    inputRef.current?.focus();
  };

  return (
    <div className="tree-row" style={{ paddingLeft: 6 + depth * 14 }}>
      <span className="w-4 shrink-0" />
      <FileTypeIcon name={name} kind={kind} />
      <input
        ref={inputRef}
        value={name}
        placeholder={kind === 'file' ? 'filename.ext' : 'folder name'}
        onChange={(e) => {
          setName(e.target.value);
          setError(false);
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
          if (e.key === 'Enter') {
            e.preventDefault();
            commit();
          }
          if (e.key === 'Escape') {
            e.preventDefault();
            doneRef.current = true;
            onCancel();
          }
        }}
        onBlur={() => {
          window.setTimeout(() => {
            if (document.activeElement === inputRef.current) return;
            if (!name.trim()) onCancel();
            else commit();
          }, 0);
        }}
        className={`flex-1 min-w-0 bg-bg rounded-sm px-1 py-0.5 text-[13px] text-text outline-none border ${
          error ? 'border-red-400' : 'border-amber'
        }`}
      />
    </div>
  );
}

function sanitizeRelName(raw: string): string | null {
  const clean = raw.trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!clean) return null;
  const parts = clean.split('/');
  if (parts.some((p) => !p || p === '.' || p === '..')) return null;
  return parts.join('/');
}

function findSibling(nodes: TreeNode[], parent: string, name: string): TreeNode | null {
  const siblings = parent === '' ? nodes : findNode(nodes, parent)?.children ?? [];
  const lower = name.toLowerCase();
  return siblings.find((n) => n.name.toLowerCase() === lower) ?? null;
}

function findNode(nodes: TreeNode[], path: string): TreeNode | null {
  for (const n of nodes) {
    if (n.path === path) return n;
    if (n.children) {
      const found = findNode(n.children, path);
      if (found) return found;
    }
  }
  return null;
}

function Notice({ message, onDismiss }: { message: string; onDismiss: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40"
      onClick={onDismiss}
    >
      <div
        className="w-[22rem] rounded-lg border border-border bg-surface p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-sm text-text">{message}</p>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className="px-3 py-1.5 text-[12px] text-text hover:bg-surface2 rounded"
            onClick={onDismiss}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function MenuItem({
  onClick,
  danger,
  children
}: {
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-3 py-1.5 text-[12px] ${
        danger ? 'text-red-400 hover:bg-surface2' : 'text-text hover:bg-surface2'
      }`}
    >
      {children}
    </button>
  );
}

function IconButton({
  title,
  onClick,
  active,
  children
}: {
  title: string;
  onClick: () => void;
  active?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md ${
        active ? 'text-amber bg-surface2' : 'text-muted hover:text-text hover:bg-surface2'
      }`}
    >
      {children}
    </button>
  );
}

function RowAction({
  title,
  onClick,
  danger,
  children
}: {
  title: string;
  onClick: () => void;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-6 h-6 flex items-center justify-center rounded ${
        danger ? 'hover:text-red-400' : 'hover:text-text'
      }`}
    >
      {children}
    </button>
  );
}

