'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanelRight } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Editor from '@/components/Editor';
import ImageViewer from '@/components/ImageViewer';
import BacklinksPanel from '@/components/BacklinksPanel';
import QuickSwitcher from '@/components/QuickSwitcher';
import CommandPalette, { type CommandItem } from '@/components/CommandPalette';
import ConfirmDialog from '@/components/ConfirmDialog';
import TabBar from '@/components/TabBar';
import ResizeHandle from '@/components/ResizeHandle';
import Settings from '@/components/Settings';
import AiChat from '@/components/AiChat';
import { AiEditReviewBar } from '@/components/AiEditProposal';
import AppLogo from '@/components/AppLogo';
import TitleDrag from '@/components/TitleDrag';
import { APP_NAME } from '@/lib/appInfo';
import { useTheme } from '@/components/ThemeProvider';
import { useShortcut, useKeymap } from '@/components/KeymapProvider';
import { useVaultWatcher } from '@/hooks/useVaultWatcher';
import type { TreeNode } from '@/lib/vault';
import * as vault from '@/lib/vaultClient';
import { rewriteLinksAfterMove } from '@/lib/linkRewrite';
import { isEditableInMonaco, isImagePath, supportsReadView } from '@/lib/fileKind';
import { rewritePath, parentDir } from '@/lib/paths';
import { readLocal, writeLocal } from '@/lib/storage';
import { formatChord } from '@/lib/shortcuts';
import WorkspaceSetup from '@/components/WorkspaceSetup';
import { useWorkspaces } from '@/components/WorkspaceProvider';
import type { WorkspaceSession } from '@/lib/workspaces';
import { EMPTY_SESSION } from '@/lib/workspaces';
import {
  DEFAULT_LEFT_WIDTH,
  DEFAULT_RIGHT_WIDTH,
  LEFT_WIDTH_KEY,
  MIN_SIDEBAR_WIDTH,
  MARKDOWN_VIEW_STORAGE_KEY,
  RAIL_WIDTH,
  RIGHT_SIDEBAR_STORAGE_KEY,
  RIGHT_WIDTH_KEY,
  SIDEBAR_STORAGE_KEY,
  SNAP_COLLAPSE_WIDTH,
  VAULT_PATH_STORAGE_KEY,
  isMarkdownViewMode,
  type MarkdownViewMode
} from '@/lib/themes';
import type { AiEditPreviewSession, AiEditStatus } from '@/lib/ai/preview';

function flatten(nodes: TreeNode[]): string[] {
  const out: string[] = [];
  for (const n of nodes) {
    if (n.type === 'file') out.push(n.path);
    if (n.children) out.push(...flatten(n.children));
  }
  return out;
}

export default function Home() {
  const { theme } = useTheme();
  const { bindings } = useKeymap();
  const { workspace, ready, needsSetup, completeSetup, store, saveSession, setActiveWorkspace } = useWorkspaces();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [tabs, setTabs] = useState<string[]>([]);
  const [previewPath, setPreviewPath] = useState<string | null>(null);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [contents, setContents] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [backlinksData, setBacklinksData] = useState<any>(null);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [aiEditStates, setAiEditStates] = useState<Record<string, AiEditStatus>>({});
  const [aiEditPreview, setAiEditPreview] = useState<AiEditPreviewSession | null>(null);
  const [editorEpoch, setEditorEpoch] = useState(0);
  const [markdownViewMode, setMarkdownViewMode] = useState<MarkdownViewMode>('edit');
  const [panel, setPanel] = useState<'editor' | 'settings'>('editor');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [leftWidth, setLeftWidth] = useState(DEFAULT_LEFT_WIDTH);
  const [rightWidth, setRightWidth] = useState(DEFAULT_RIGHT_WIDTH);
  const [pendingCreate, setPendingCreate] = useState<{
    kind: 'file' | 'folder';
    parent: string;
    nonce: number;
  } | null>(null);
  const [closeConfirm, setCloseConfirm] = useState<string | null>(null);
  const [pendingWorkspaceSwitch, setPendingWorkspaceSwitch] = useState<string | null>(null);
  const [externalConflict, setExternalConflict] = useState<{ path: string; disk: string } | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);

  const allFiles = useMemo(() => flatten(tree), [tree]);
  const dirtyRef = useRef(dirty);
  const contentsRef = useRef(contents);
  const leftWidthRef = useRef(leftWidth);
  const rightWidthRef = useRef(rightWidth);
  const previewPathRef = useRef<string | null>(null);
  const aiEditPreviewRef = useRef<AiEditPreviewSession | null>(null);
  const openSeqRef = useRef(0);
  const vaultInitRef = useRef(false);
  dirtyRef.current = dirty;
  contentsRef.current = contents;
  leftWidthRef.current = leftWidth;
  rightWidthRef.current = rightWidth;
  previewPathRef.current = previewPath;
  aiEditPreviewRef.current = aiEditPreview;

  const setAiEditState = useCallback((key: string, status: AiEditStatus) => {
    setAiEditStates((states) => ({ ...states, [key]: status }));
  }, []);

  const captureSession = useCallback((): WorkspaceSession => {
    return { tabs, activePath, previewPath };
  }, [tabs, activePath, previewPath]);

  const restoreSession = useCallback((session: WorkspaceSession = EMPTY_SESSION) => {
    setTabs(session.tabs);
    setActivePath(session.activePath);
    setPreviewPath(session.previewPath);
    previewPathRef.current = session.previewPath;
    setContents({});
    setDirty(new Set());
    setBacklinksData(null);
    setOpenError(null);
    setPanel('editor');
  }, []);

  const loadTree = useCallback(async () => {
    setTree(await vault.loadTree());
  }, []);

  const openFileRef = useRef<(path: string, pin?: boolean) => Promise<void>>(async () => {});

  const applyWorkspace = useCallback(
    async (workspaceId: string) => {
      const target = store.workspaces.find((w) => w.id === workspaceId);
      if (!target) return;

      if (workspace?.id && workspace.id !== workspaceId) {
        saveSession(workspace.id, captureSession());
      }

      if (vault.isTauri()) {
        try {
          await vault.setVaultPath(target.vaultPath);
        } catch (err) {
          setNotice(err instanceof Error ? err.message : 'Could not open that vault folder');
          return;
        }
      }

      setActiveWorkspace(workspaceId);
      writeLocal(VAULT_PATH_STORAGE_KEY, target.vaultPath);
      restoreSession(target.session);
      await loadTree();

      if (target.session.activePath) {
        await openFileRef.current(target.session.activePath, target.session.tabs.includes(target.session.activePath));
      }
    },
    [store.workspaces, workspace?.id, saveSession, captureSession, setActiveWorkspace, restoreSession, loadTree]
  );

  const requestSwitchWorkspace = useCallback(
    (workspaceId: string) => {
      if (workspaceId === workspace?.id) return;
      if (dirty.size > 0) {
        setPendingWorkspaceSwitch(workspaceId);
        return;
      }
      void applyWorkspace(workspaceId);
    },
    [workspace?.id, dirty.size, applyWorkspace]
  );

  useEffect(() => {
    if (!needsSetup) return;
    vaultInitRef.current = false;
    setPanel('editor');
  }, [needsSetup]);

  useEffect(() => {
    if (!ready || !workspace || vaultInitRef.current) return;
    vaultInitRef.current = true;
    void (async () => {
      if (vault.isTauri()) {
        try {
          const current = await vault.getVaultPath();
          if (current !== workspace.vaultPath) {
            await vault.setVaultPath(workspace.vaultPath);
          }
        } catch {
          /* use default vault */
        }
      }
      restoreSession(workspace.session);
      await loadTree();
      if (workspace.session.activePath) {
        await openFileRef.current(
          workspace.session.activePath,
          workspace.session.tabs.includes(workspace.session.activePath)
        );
      }
    })();
  }, [ready, workspace, restoreSession, loadTree]);

  useEffect(() => {
    if (!workspace?.id || !ready) return;
    const timer = window.setTimeout(() => {
      saveSession(workspace.id, captureSession());
    }, 400);
    return () => window.clearTimeout(timer);
  }, [workspace?.id, ready, captureSession, saveSession, tabs, activePath, previewPath]);

  useEffect(() => {
    if (readLocal(SIDEBAR_STORAGE_KEY) === '1') setSidebarCollapsed(true);
    if (readLocal(RIGHT_SIDEBAR_STORAGE_KEY) === '1') setRightCollapsed(true);
    const storedMarkdownView = readLocal(MARKDOWN_VIEW_STORAGE_KEY);
    if (isMarkdownViewMode(storedMarkdownView)) setMarkdownViewMode(storedMarkdownView);
    const left = Number(readLocal(LEFT_WIDTH_KEY));
    const right = Number(readLocal(RIGHT_WIDTH_KEY));
    if (Number.isFinite(left) && left >= MIN_SIDEBAR_WIDTH) setLeftWidth(left);
    if (Number.isFinite(right) && right >= MIN_SIDEBAR_WIDTH) setRightWidth(right);
  }, []);

  const liveChangeTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const syncExternalFiles = useCallback(async () => {
    if (dirtyRef.current.size > 0) return;
    await loadTree();
    let files: string[] = [];
    try {
      files = await vault.listFiles();
    } catch {
      return;
    }

    for (const path of Object.keys(contentsRef.current)) {
      if (!files.includes(path)) continue;
      try {
        const disk = await vault.readFile(path);
        const cached = contentsRef.current[path];
        if (disk === cached) continue;
        if (dirtyRef.current.has(path)) {
          setExternalConflict({ path, disk });
        } else {
          setContents((c) => ({ ...c, [path]: disk }));
        }
      } catch {
        /* unreadable */
      }
    }
  }, [loadTree]);

  useVaultWatcher(syncExternalFiles);

  useEffect(() => {
    document.documentElement.dataset.sidebar = sidebarCollapsed ? 'collapsed' : 'open';
  }, [sidebarCollapsed]);

  useEffect(() => {
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (dirtyRef.current.size > 0) e.preventDefault();
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((c) => {
      const next = !c;
      if (!next && leftWidthRef.current < MIN_SIDEBAR_WIDTH) {
        setLeftWidth(DEFAULT_LEFT_WIDTH);
        writeLocal(LEFT_WIDTH_KEY, String(DEFAULT_LEFT_WIDTH));
      }
      writeLocal(SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const toggleRightSidebar = useCallback(() => {
    setRightCollapsed((c) => {
      const next = !c;
      if (!next && rightWidthRef.current < MIN_SIDEBAR_WIDTH) {
        setRightWidth(DEFAULT_RIGHT_WIDTH);
        writeLocal(RIGHT_WIDTH_KEY, String(DEFAULT_RIGHT_WIDTH));
      }
      writeLocal(RIGHT_SIDEBAR_STORAGE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  const persistLeftWidth = useCallback((width: number) => {
    if (width < SNAP_COLLAPSE_WIDTH) {
      setSidebarCollapsed(true);
      writeLocal(SIDEBAR_STORAGE_KEY, '1');
      return;
    }
    setLeftWidth(width);
    writeLocal(LEFT_WIDTH_KEY, String(width));
  }, []);

  const persistRightWidth = useCallback((width: number) => {
    if (width < SNAP_COLLAPSE_WIDTH) {
      setRightCollapsed(true);
      writeLocal(RIGHT_SIDEBAR_STORAGE_KEY, '1');
      return;
    }
    setRightWidth(width);
    writeLocal(RIGHT_WIDTH_KEY, String(width));
  }, []);

  const loadBacklinks = useCallback(async (path: string) => {
    setBacklinksData(await vault.loadBacklinks(path));
  }, []);

  useEffect(() => {
    if (!activePath || panel !== 'editor') return;
    loadBacklinks(activePath);
  }, [activePath, panel, loadBacklinks]);

  const openFile = useCallback(async (path: string, pin = false) => {
    const seq = ++openSeqRef.current;
    setActivePath(path);
    setPanel('editor');
    setSwitcherOpen(false);
    setPaletteOpen(false);
    setOpenError(null);

    setTabs((t) => {
      const already = t.includes(path);
      if (pin || already) {
        previewPathRef.current = null;
        setPreviewPath(null);
        return already ? t : [...t, path];
      }
      previewPathRef.current = path;
      setPreviewPath(path);
      return t;
    });

    if (isImagePath(path)) {
      setContents((c) => (c[path] !== undefined ? c : { ...c, [path]: '' }));
      return;
    }

    if (contentsRef.current[path] !== undefined) return;

    try {
      const content = await vault.readFile(path);
      if (seq !== openSeqRef.current) return;
      setContents((c) => ({ ...c, [path]: content }));
    } catch (err) {
      if (seq !== openSeqRef.current) return;
      const message = err instanceof Error ? err.message : 'Could not open that file';
      setOpenError(message);
      setNotice(message);
    }
  }, []);

  openFileRef.current = openFile;

  const saveFile = useCallback(
    async (path: string, next: string) => {
      await vault.writeFile(path, next);
      setContents((c) => ({ ...c, [path]: next }));
      setDirty((d) => {
        const n = new Set(d);
        n.delete(path);
        return n;
      });
      if (path === activePath) await loadBacklinks(path);
    },
    [activePath, loadBacklinks]
  );

  const revertAiEditPreview = useCallback(async () => {
    const preview = aiEditPreviewRef.current;
    if (!preview) return;
    await saveFile(preview.path, preview.originalContent);
    setEditorEpoch((epoch) => epoch + 1);
    setAiEditState(preview.editKey, 'declined');
    setAiEditPreview(null);
  }, [saveFile, setAiEditState]);

  const startAiEditPreview = useCallback(
    async (editKey: string, path: string, proposedContent: string) => {
      if (aiEditPreviewRef.current) {
        await revertAiEditPreview();
      }

      let originalContent = contentsRef.current[path];
      if (originalContent === undefined) {
        originalContent = await vault.readFile(path);
      }

      await saveFile(path, proposedContent);
      setEditorEpoch((epoch) => epoch + 1);
      setAiEditPreview({ editKey, path, originalContent });
      setAiEditState(editKey, 'previewing');
      setPanel('editor');
      if (supportsReadView(path)) setMarkdownViewMode('read');
      await openFileRef.current(path, true);
    },
    [revertAiEditPreview, saveFile, setAiEditState]
  );

  const approveAiEditPreview = useCallback(async () => {
    const preview = aiEditPreviewRef.current;
    if (!preview) return;
    const current = contentsRef.current[preview.path];
    if (current !== undefined && current !== preview.originalContent) {
      await saveFile(preview.path, current);
    }
    setAiEditState(preview.editKey, 'applied');
    setAiEditPreview(null);
  }, [saveFile, setAiEditState]);

  const declineAiEditPreview = useCallback(async () => {
    await revertAiEditPreview();
  }, [revertAiEditPreview]);

  const onLiveChange = useCallback((path: string, next: string) => {
    contentsRef.current = { ...contentsRef.current, [path]: next };
    setDirty((d) => new Set(d).add(path));
    if (previewPathRef.current === path) {
      previewPathRef.current = null;
      setPreviewPath(null);
      setTabs((t) => (t.includes(path) ? t : [...t, path]));
    }

    const timers = liveChangeTimers.current;
    const pending = timers.get(path);
    if (pending) clearTimeout(pending);
    timers.set(
      path,
      setTimeout(() => {
        setContents((c) => ({ ...c, [path]: next }));
        timers.delete(path);
      }, 300)
    );
  }, []);

  const closeTab = useCallback((path: string) => {
    setTabs((t) => {
      if (!t.includes(path)) {
        if (previewPathRef.current === path) {
          previewPathRef.current = null;
          setPreviewPath(null);
        }
        setActivePath((cur) => (cur === path ? t[t.length - 1] ?? null : cur));
        return t;
      }
      if (previewPathRef.current === path) {
        previewPathRef.current = null;
        setPreviewPath(null);
      }
      const i = t.indexOf(path);
      const next = t.filter((p) => p !== path);
      setActivePath((cur) => (cur === path ? next[Math.min(i, next.length - 1)] ?? null : cur));
      return next;
    });
    setDirty((d) => {
      const n = new Set(d);
      n.delete(path);
      return n;
    });
    setPanel('editor');
  }, []);

  const requestCloseTab = useCallback(
    (path: string) => {
      if (dirty.has(path)) {
        setCloseConfirm(path);
        return;
      }
      closeTab(path);
    },
    [closeTab, dirty]
  );

  const openWorkspaceSettings = useCallback(() => {
    setPanel('settings');
    writeLocal('leaflyte.settingsTab', 'workspaces');
  }, []);

  const revealActive = useCallback(async () => {
    if (!activePath) return;
    try {
      await vault.revealPath(activePath);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : 'Could not reveal file');
    }
  }, [activePath]);

  const copyActivePath = useCallback(async () => {
    if (!activePath) return;
    try {
      const abs = await vault.absPath(activePath);
      await navigator.clipboard.writeText(abs);
      setNotice('Copied path to clipboard');
    } catch {
      await navigator.clipboard.writeText(activePath);
      setNotice('Copied vault path to clipboard');
    }
  }, [activePath]);

  useShortcut('quickSwitcher', useCallback(() => setSwitcherOpen(true), []));
  useShortcut('commandPalette', useCallback(() => setPaletteOpen(true), []));
  useShortcut('toggleAiChat', useCallback(() => setAiChatOpen((o) => !o), []));
  useShortcut('toggleVault', useCallback(() => toggleSidebar(), [toggleSidebar]));
  useShortcut('toggleLinks', useCallback(() => toggleRightSidebar(), [toggleRightSidebar]));
  const setMarkdownView = useCallback((mode: MarkdownViewMode) => {
    setMarkdownViewMode(mode);
    writeLocal(MARKDOWN_VIEW_STORAGE_KEY, mode);
  }, []);

  const toggleFileView = useCallback(() => {
    if (!activePath || !isEditableInMonaco(activePath)) return;
    if (!supportsReadView(activePath)) return;
    setMarkdownView(markdownViewMode === 'read' ? 'edit' : 'read');
  }, [activePath, markdownViewMode, setMarkdownView]);

  useShortcut('togglePreview', toggleFileView);
  useShortcut('settings', useCallback(() => setPanel((p) => (p === 'settings' ? 'editor' : 'settings')), []));
  useShortcut(
    'closeTab',
    useCallback(() => {
      if (panel === 'settings') {
        setPanel('editor');
        return;
      }
      if (activePath) requestCloseTab(activePath);
    }, [activePath, panel, requestCloseTab])
  );
  useShortcut(
    'nextTab',
    useCallback(() => {
      if (tabs.length === 0) return;
      const i = activePath ? tabs.indexOf(activePath) : -1;
      openFile(tabs[(i + 1) % tabs.length]);
    }, [activePath, openFile, tabs])
  );
  useShortcut(
    'prevTab',
    useCallback(() => {
      if (tabs.length === 0) return;
      const i = activePath ? tabs.indexOf(activePath) : 0;
      openFile(tabs[(i - 1 + tabs.length) % tabs.length]);
    }, [activePath, openFile, tabs])
  );
  useShortcut(
    'newFile',
    useCallback(() => {
      if (sidebarCollapsed) toggleSidebar();
      setPendingCreate({ kind: 'file', parent: activePath ? parentDir(activePath) : '', nonce: Date.now() });
    }, [activePath, sidebarCollapsed, toggleSidebar])
  );
  useShortcut(
    'newFolder',
    useCallback(() => {
      if (sidebarCollapsed) toggleSidebar();
      setPendingCreate({ kind: 'folder', parent: activePath ? parentDir(activePath) : '', nonce: Date.now() });
    }, [activePath, sidebarCollapsed, toggleSidebar])
  );
  useShortcut('revealInFinder', revealActive);
  useShortcut('copyPath', copyActivePath);

  const createFile = async (fullPath: string) => {
    try {
      await vault.writeFile(fullPath, '');
    } catch {
      return false;
    }
    await loadTree();
    openFile(fullPath, true);
    return true;
  };

  const createFolder = async (fullPath: string) => {
    try {
      await vault.writeFile(`${fullPath}/.gitkeep`, '');
    } catch {
      return false;
    }
    await loadTree();
    return true;
  };

  const deleteNode = async (path: string, type: 'file' | 'folder') => {
    try {
      await vault.deletePath(path);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not delete that item');
      return;
    }
    const affected = (p: string) => p === path || p.startsWith(path + '/');
    setTabs((t) => {
      const next = t.filter((p) => !affected(p));
      setActivePath((cur) => (cur && affected(cur) ? next[next.length - 1] ?? null : cur));
      return next;
    });
    setContents((c) => {
      const n = { ...c };
      for (const k of Object.keys(n)) if (affected(k)) delete n[k];
      return n;
    });
    setDirty((d) => new Set([...d].filter((p) => !affected(p))));
    if (previewPath && affected(previewPath)) {
      previewPathRef.current = null;
      setPreviewPath(null);
    }
    if (activePath && affected(activePath)) setBacklinksData(null);
    await loadTree();
  };

  const moveNode = async (from: string, to: string) => {
    const filesBefore = await vault.listFiles();
    try {
      await rewriteLinksAfterMove(from, to, filesBefore, vault.readFile, vault.writeFile);
      await vault.movePath(from, to);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Could not move that item');
      return;
    }
    const remap = (p: string) => rewritePath(p, from, to);
    setTabs((t) => t.map(remap));
    setActivePath((cur) => (cur ? remap(cur) : cur));
    setPreviewPath((cur) => (cur ? remap(cur) : cur));
    setContents((c) => {
      const n: Record<string, string> = {};
      for (const [k, v] of Object.entries(c)) n[remap(k)] = v;
      return n;
    });
    setDirty((d) => new Set([...d].map(remap)));
    await loadTree();
  };

  const commands: CommandItem[] = useMemo(
    () => [
      { id: 'jump', label: 'Jump to note', group: 'Navigation', shortcut: formatChord(bindings.quickSwitcher), run: () => setSwitcherOpen(true) },
      { id: 'ai', label: 'Toggle AI chat', group: 'Navigation', shortcut: formatChord(bindings.toggleAiChat), run: () => setAiChatOpen((o) => !o) },
      { id: 'settings', label: 'Open settings', group: 'Navigation', shortcut: formatChord(bindings.settings), run: () => setPanel('settings') },
      { id: 'new-file', label: 'New file', group: 'Files', shortcut: formatChord(bindings.newFile), run: () => setPendingCreate({ kind: 'file', parent: activePath ? parentDir(activePath) : '', nonce: Date.now() }) },
      { id: 'new-folder', label: 'New folder', group: 'Files', shortcut: formatChord(bindings.newFolder), run: () => setPendingCreate({ kind: 'folder', parent: activePath ? parentDir(activePath) : '', nonce: Date.now() }) },
      { id: 'save', label: 'Save file', group: 'Files', shortcut: formatChord(bindings.save), run: () => {
        if (!activePath) return;
        const next = contentsRef.current[activePath];
        if (next !== undefined) void saveFile(activePath, next);
      } },
      { id: 'reveal', label: 'Reveal in Finder', group: 'Files', shortcut: formatChord(bindings.revealInFinder), run: revealActive },
      { id: 'copy', label: 'Copy file path', group: 'Files', shortcut: formatChord(bindings.copyPath), run: copyActivePath },
      { id: 'vault', label: 'Toggle vault sidebar', group: 'View', shortcut: formatChord(bindings.toggleVault), run: toggleSidebar },
      { id: 'links', label: 'Toggle links sidebar', group: 'View', shortcut: formatChord(bindings.toggleLinks), run: toggleRightSidebar },
      { id: 'preview', label: 'Toggle read/edit mode', group: 'View', shortcut: formatChord(bindings.togglePreview), run: toggleFileView },
      { id: 'workspaces', label: 'Manage workspaces', group: 'Vault', run: openWorkspaceSettings },
      ...store.workspaces
        .filter((w) => w.id !== workspace?.id)
        .map((w) => ({
          id: `workspace-${w.id}`,
          label: `Switch to ${w.name}`,
          group: 'Vault' as const,
          run: () => requestSwitchWorkspace(w.id)
        }))
    ],
    [activePath, bindings, contents, copyActivePath, openWorkspaceSettings, revealActive, requestSwitchWorkspace, saveFile, store.workspaces, toggleFileView, toggleRightSidebar, toggleSidebar, workspace?.id]
  );

  const renderFileView = () => {
    if (!activePath) return null;
    if (isImagePath(activePath)) {
      return (
        <div className="h-full min-h-0">
          <ImageViewer path={activePath} />
        </div>
      );
    }
    if (!isEditableInMonaco(activePath)) {
      return (
        <div className="h-full flex flex-col items-center justify-center text-muted text-sm gap-3">
          <p>This file type opens best in an external app.</p>
          <button
            type="button"
            onClick={revealActive}
            className="px-3 py-1.5 rounded border border-border text-text hover:bg-surface2 text-xs"
          >
            Reveal in Finder
          </button>
        </div>
      );
    }
    if (contents[activePath] === undefined) {
      if (openError) {
        return (
          <div className="h-full flex flex-col items-center justify-center text-muted text-sm gap-3 px-6 text-center">
            <p className="text-red-400">{openError}</p>
            <button
              type="button"
              onClick={() => openFile(activePath, true)}
              className="px-3 py-1.5 rounded border border-border text-text hover:bg-surface2 text-xs"
            >
              Retry
            </button>
          </div>
        );
      }
      return null;
    }
    return (
      <div className="h-full min-h-0">
        <Editor
          key={`${activePath}-${editorEpoch}`}
          path={activePath}
          content={contents[activePath]}
          allFiles={allFiles}
          fileContents={contents}
          fileViewMode={markdownViewMode}
          onFileViewModeChange={setMarkdownView}
          onSave={saveFile}
          onLiveChange={onLiveChange}
          onNavigate={openFile}
        />
      </div>
    );
  };

  if (!ready) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-bg text-muted text-sm">
        Loading…
      </div>
    );
  }

  if (needsSetup) {
    return <WorkspaceSetup onComplete={completeSetup} />;
  }

  return (
    <main className="h-full w-full flex overflow-hidden bg-bg text-text">
      <div
        className="shrink-0 h-full min-h-0 border-r border-border overflow-hidden"
        style={{ width: sidebarCollapsed ? RAIL_WIDTH : leftWidth }}
      >
        <Sidebar
          tree={tree}
          activePath={activePath}
          collapsed={sidebarCollapsed}
          onToggleCollapsed={toggleSidebar}
          onSelect={openFile}
          onCreateFile={createFile}
          onCreateFolder={createFolder}
          onDelete={deleteNode}
          onMove={moveNode}
          onOpenSettings={() => setPanel('settings')}
          onSearch={() => setSwitcherOpen(true)}
          onRevealPath={(p) => vault.revealPath(p).catch((e) => setNotice(e.message))}
          onCopyPath={async (p) => {
            try {
              await navigator.clipboard.writeText(await vault.absPath(p));
            } catch {
              await navigator.clipboard.writeText(p);
            }
            setNotice('Copied path to clipboard');
          }}
          settingsActive={panel === 'settings'}
          pendingCreate={pendingCreate}
          onSwitchWorkspace={requestSwitchWorkspace}
          onManageWorkspaces={openWorkspaceSettings}
          onNotice={setNotice}
        />
      </div>
      {!sidebarCollapsed && <ResizeHandle title="Resize vault" onDrag={(x) => persistLeftWidth(x)} />}

      <div className="flex-1 min-w-0 min-h-0 flex flex-col relative overflow-hidden" data-main-column>
        {tabs.length === 0 && !previewPath && (
          <TitleDrag className="absolute inset-x-0 top-0 h-9 z-10" />
        )}
        <TabBar
          tabs={tabs}
          previewPath={previewPath}
          activePath={panel === 'settings' ? null : activePath}
          dirty={dirty}
          onSelect={(path) => {
            setPanel('editor');
            const isPreview = previewPath === path && !tabs.includes(path);
            openFile(path, !isPreview);
          }}
          onPinPreview={(path) => openFile(path, true)}
          onClose={requestCloseTab}
        />

        {aiEditPreview && panel !== 'settings' && (
          <AiEditReviewBar
            path={aiEditPreview.path}
            isActiveFile={activePath === aiEditPreview.path}
            onGoTo={() => openFile(aiEditPreview.path, true)}
            onApprove={approveAiEditPreview}
            onDecline={declineAiEditPreview}
          />
        )}

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {panel === 'settings' ? (
            <Settings onSwitchWorkspace={requestSwitchWorkspace} onNotice={setNotice} />
          ) : activePath ? (
            <div className="flex-1 min-h-0 overflow-hidden">
              {renderFileView() ?? (
                <div className="h-full flex items-center justify-center text-muted text-sm">Opening…</div>
              )}
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center text-muted text-sm overflow-hidden">
              <div className="text-center space-y-3">
                <AppLogo size={48} className="mx-auto opacity-90" alt={APP_NAME} />
                <p>No note open.</p>
                <p className="text-xs">
                  <kbd className="px-1.5 py-0.5 bg-surface2 rounded">⌘K</kbd> search ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface2 rounded">⌘P</kbd> commands ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface2 rounded">⌘J</kbd> AI ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface2 rounded">⌘B</kbd> vault ·{' '}
                  <kbd className="px-1.5 py-0.5 bg-surface2 rounded">⌘,</kbd> settings
                </p>
              </div>
            </div>
          )}
        </div>

        <AiChat
          open={aiChatOpen}
          onClose={() => setAiChatOpen(false)}
          files={allFiles}
          activePath={activePath}
          contents={contents}
          onOpenSettings={() => setPanel('settings')}
          onPreviewFileEdit={startAiEditPreview}
          onOpenFile={(path) => openFile(path, true)}
          editStates={aiEditStates}
          onEditState={setAiEditState}
        />
      </div>

      {!rightCollapsed && (
        <ResizeHandle title="Resize links" onDrag={(x) => persistRightWidth(window.innerWidth - x)} />
      )}
      <div
        className="shrink-0 h-full min-h-0 border-l border-border overflow-hidden"
        style={{ width: rightCollapsed ? RAIL_WIDTH : rightWidth }}
      >
        {rightCollapsed ? (
          <div className="h-full w-full flex flex-col items-center py-2 bg-surface">
            <TitleDrag className="h-8 w-full shrink-0" />
            <button
              onClick={toggleRightSidebar}
              title="Show links (⌘⇧B)"
              className="w-7 h-7 flex items-center justify-center rounded-md text-muted hover:text-text hover:bg-surface2"
            >
              <PanelRight size={15} strokeWidth={1.75} />
            </button>
          </div>
        ) : (
          <BacklinksPanel data={backlinksData} onNavigate={openFile} onHide={toggleRightSidebar} />
        )}
      </div>

      {switcherOpen && <QuickSwitcher allFiles={allFiles} onSelect={openFile} onClose={() => setSwitcherOpen(false)} />}
      {paletteOpen && <CommandPalette commands={commands} onClose={() => setPaletteOpen(false)} />}

      {closeConfirm && (
        <ConfirmDialog
          title="Unsaved changes"
          message={`"${closeConfirm.split('/').pop()}" has unsaved changes. Close anyway?`}
          confirmLabel="Close without saving"
          danger
          onCancel={() => setCloseConfirm(null)}
          onConfirm={() => {
            closeTab(closeConfirm);
            setCloseConfirm(null);
          }}
        />
      )}

      {pendingWorkspaceSwitch && (
        <ConfirmDialog
          title="Unsaved changes"
          message="You have unsaved tabs. Switch workspace anyway? Unsaved changes will be lost."
          confirmLabel="Switch workspace"
          danger
          onCancel={() => setPendingWorkspaceSwitch(null)}
          onConfirm={() => {
            const id = pendingWorkspaceSwitch;
            setPendingWorkspaceSwitch(null);
            void applyWorkspace(id);
          }}
        />
      )}

      {externalConflict && (
        <ConfirmDialog
          title="File changed on disk"
          message={`"${externalConflict.path.split('/').pop()}" was modified outside Leaflyte.`}
          confirmLabel="Reload from disk"
          cancelLabel="Keep my version"
          onCancel={() => setExternalConflict(null)}
          onConfirm={() => {
            setContents((c) => ({ ...c, [externalConflict.path]: externalConflict.disk }));
            setExternalConflict(null);
          }}
        />
      )}

      {notice && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[90] px-4 py-2 rounded-lg border border-border bg-surface text-xs text-text shadow-lg">
          {notice}
          <button type="button" className="ml-3 text-muted hover:text-text" onClick={() => setNotice(null)}>
            Dismiss
          </button>
        </div>
      )}
    </main>
  );
}
