'use client';

import { File, Folder, FolderOpen } from 'lucide-react';
import { fileIconFor, type FileGlyph } from '@/lib/fileIcons';
import { useTheme } from '@/components/ThemeProvider';

const STROKE = {
  fill: 'none',
  stroke: '#fff',
  strokeWidth: 1.35,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const
};

export default function FileTypeIcon({
  name,
  kind = 'file',
  open = false,
  size = 16
}: {
  name: string;
  kind?: 'file' | 'folder';
  open?: boolean;
  size?: number;
}) {
  const { colorIcons } = useTheme();

  if (!colorIcons) {
    if (kind === 'folder') {
      const Icon = open ? FolderOpen : Folder;
      return <Icon size={size} strokeWidth={1.75} className="shrink-0 text-muted" />;
    }
    return <File size={size} strokeWidth={1.75} className="shrink-0 text-muted" />;
  }

  if (kind === 'folder') {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0" aria-hidden>
        {open ? (
          <>
            <path d="M1.5 13.2V5.2c0-.5.4-.9.9-.9h3.1l1.2 1.3h6.9c.5 0 .9.4.9.9v1" fill="#C9A227" />
            <path d="M1.7 13.2 3.4 7.4c.1-.4.5-.7.9-.7h9.5c.6 0 1 .5.9 1.1l-1.2 5.4H1.7z" fill="#E0B24A" />
          </>
        ) : (
          <>
            <path d="M1.8 4.6h4.1l1.15 1.35H14.2c.5 0 .9.4.9.9v6.55c0 .5-.4.9-.9.9H1.8c-.5 0-.9-.4-.9-.9V5.5c0-.5.4-.9.9-.9z" fill="#E0B24A" />
            <path d="M1.8 6.6H14.2" stroke="#C9A227" strokeWidth="1.1" />
          </>
        )}
      </svg>
    );
  }

  const spec = fileIconFor(name);
  if (spec.glyph === 'label' && spec.label) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0" aria-hidden>
        <rect width="16" height="16" rx="3" fill={spec.color} />
        <text
          x="8"
          y="11"
          textAnchor="middle"
          fill="#fff"
          fontSize={spec.label.length > 2 ? 5.2 : 6.2}
          fontWeight="700"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {spec.label}
        </text>
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0" aria-hidden>
      <rect width="16" height="16" rx="3" fill={spec.color} />
      <Glyph id={spec.glyph} />
    </svg>
  );
}

function Glyph({ id }: { id: FileGlyph }) {
  switch (id) {
    case 'markdown':
      return (
        <g {...STROKE}>
          <path d="M4 5.2h8M4 8h8M4 10.8h5.2" />
        </g>
      );
    case 'text':
      return (
        <g {...STROKE}>
          <path d="M4.2 5h7.6M4.2 8h7.6M4.2 11h4.8" />
        </g>
      );
    case 'database':
      return (
        <g {...STROKE}>
          <ellipse cx="8" cy="5.3" rx="4.1" ry="1.55" />
          <path d="M3.9 5.3v5.3c0 .9 1.8 1.55 4.1 1.55s4.1-.65 4.1-1.55V5.3" />
          <path d="M3.9 8c0 .9 1.8 1.55 4.1 1.55S12.1 8.9 12.1 8" />
        </g>
      );
    case 'markup':
      return (
        <g {...STROKE}>
          <path d="M6.2 4.6 3.4 8l2.8 3.4M9.8 4.6 12.6 8l-2.8 3.4" />
        </g>
      );
    case 'cfml':
      return (
        <g {...STROKE}>
          <path d="M6 4.6 3.4 8 6 11.4M10 4.6 12.6 8 10 11.4" />
          <rect x="7.1" y="7.1" width="1.8" height="1.8" rx="0.3" fill="#fff" stroke="none" />
        </g>
      );
    case 'script':
      return (
        <g {...STROKE}>
          <path d="M6.4 4.7c-1.7 0-2.1 1-2.1 2 0 .7-.25 1.15-.95 1.3.7.15.95.6.95 1.3 0 1 .4 2 2.1 2" />
          <path d="M9.6 4.7c1.7 0 2.1 1 2.1 2 0 .7.25 1.15.95 1.3-.7.15-.95.6-.95 1.3 0 1-.4 2-2.1 2" />
        </g>
      );
    case 'types':
      return (
        <g {...STROKE}>
          <path d="M4.4 5.2h7.2M8 5.2v5.8M5.6 11h4.8" />
        </g>
      );
    case 'python':
      return (
        <g fill="none" stroke="#fff" strokeWidth="1.35">
          <circle cx="6.15" cy="6.15" r="2.15" />
          <circle cx="9.85" cy="9.85" r="2.15" />
        </g>
      );
    case 'data':
      return (
        <g {...STROKE}>
          <path d="M5.3 4.6c-1.1 0-1.4.7-1.4 1.5v3.8c0 .8.3 1.5 1.4 1.5M10.7 4.6c1.1 0 1.4.7 1.4 1.5v3.8c0 .8-.3 1.5-1.4 1.5" />
        </g>
      );
    case 'style':
      return (
        <g {...STROKE}>
          <path d="M6.3 4.5 5.2 11.5M10.8 4.5 9.7 11.5M4 7.1h8M4 9.3h8" />
        </g>
      );
    case 'shell':
      return (
        <g {...STROKE}>
          <path d="M4.4 5.4 7.4 8 4.4 10.6M8.4 11.2h3.4" />
        </g>
      );
    case 'config':
      return (
        <g {...STROKE}>
          <circle cx="8" cy="8" r="2.1" />
          <path d="M8 3.8v1.4M8 10.8v1.4M3.8 8h1.4M10.8 8h1.4M4.7 4.7l1 .9M10.3 10.3l1 .9M11.3 4.7l-1 .9M5.7 10.3l-1 .9" />
        </g>
      );
    case 'image':
      return (
        <g fill="none" stroke="#fff" strokeWidth="1.35" strokeLinejoin="round">
          <rect x="3.4" y="4.2" width="9.2" height="7.6" rx="1.1" />
          <circle cx="6.3" cy="6.8" r="0.85" fill="#fff" stroke="none" />
          <path d="M3.8 11.2 6.6 8.4l2 1.8 1.7-2 2.1 3" />
        </g>
      );
    case 'php':
      return (
        <g {...STROKE}>
          <ellipse cx="8" cy="8" rx="5.1" ry="3.15" />
          <path d="M6.1 6.6v2.8M6.1 8h1.5M9.2 6.6v2.8" />
        </g>
      );
    default:
      return (
        <g {...STROKE}>
          <path d="M5 3.6h4.2L11.6 6v6.4H5z" />
          <path d="M9.2 3.6V6h2.4" />
        </g>
      );
  }
}
