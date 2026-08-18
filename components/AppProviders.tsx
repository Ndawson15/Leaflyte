'use client';

import { AiProvider } from '@/components/AiProvider';
import { EditorSettingsProvider } from '@/components/EditorSettingsProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <EditorSettingsProvider>
        <AiProvider>{children}</AiProvider>
      </EditorSettingsProvider>
    </WorkspaceProvider>
  );
}
