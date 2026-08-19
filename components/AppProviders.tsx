'use client';

import { useEffect } from 'react';
import { AiProvider } from '@/components/AiProvider';
import { EditorSettingsProvider } from '@/components/EditorSettingsProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';
import { installClipboardBridge } from '@/lib/clipboardBridge';

export function AppProviders({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void installClipboardBridge();
  }, []);

  return (
    <WorkspaceProvider>
      <EditorSettingsProvider>
        <AiProvider>{children}</AiProvider>
      </EditorSettingsProvider>
    </WorkspaceProvider>
  );
}
