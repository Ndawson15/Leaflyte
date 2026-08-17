'use client';

import { X } from 'lucide-react';
import { basename } from '@/lib/paths';
import FileTypeIcon from '@/components/FileTypeIcon';
import TitleDrag from '@/components/TitleDrag';

export default function TabBar({
  tabs,
  previewPath,
  activePath,
  dirty,
  onSelect,
  onClose,
  onPinPreview
}: {
  tabs: string[];
  previewPath?: string | null;
  activePath: string | null;
  dirty: Set<string>;
  onSelect: (path: string) => void;
  onClose: (path: string) => void;
  onPinPreview?: (path: string) => void;
}) {
  const previewTab =
    previewPath && !tabs.includes(previewPath) ? previewPath : null;
  const visibleTabs = previewTab ? [...tabs, previewTab] : tabs;

  if (visibleTabs.length === 0) return null;

  return (
    <div className="titlebar-main flex items-stretch h-9 border-b border-border bg-surface overflow-hidden shrink-0">
      <div className="flex items-stretch overflow-x-auto min-w-0">
        {visibleTabs.map((path) => {
          const active = path === activePath;
          const unsaved = dirty.has(path);
          const preview = path === previewTab;
          return (
            <div
              key={path}
              className={`group flex items-center gap-2 px-3 h-9 min-w-[7rem] max-w-[16rem] border-r border-border text-xs cursor-pointer ${
                active ? 'bg-bg text-text' : 'text-muted hover:bg-surface2 hover:text-text'
              } ${preview ? 'italic' : ''}`}
              onClick={() => onSelect(path)}
              onDoubleClick={() => {
                if (preview) onPinPreview?.(path);
              }}
              onMouseDown={(e) => {
                if (e.button === 1) {
                  e.preventDefault();
                  onClose(path);
                }
              }}
              title={preview ? `${path} — double-click to keep open` : path}
            >
              <FileTypeIcon name={path} size={14} />
              <span className="truncate flex-1">{basename(path)}</span>
              {unsaved && <span className="text-amber leading-none">•</span>}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(path);
                }}
                className="w-4 h-4 flex items-center justify-center rounded text-muted opacity-0 group-hover:opacity-100 hover:bg-border hover:text-text"
                title="Close"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </div>
          );
        })}
      </div>
      <TitleDrag className="flex-1 min-w-[24px]" />
    </div>
  );
}
