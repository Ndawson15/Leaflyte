'use client';

import { AiProvider } from '@/components/AiProvider';
import { WorkspaceProvider } from '@/components/WorkspaceProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <WorkspaceProvider>
      <AiProvider>{children}</AiProvider>
    </WorkspaceProvider>
  );
}
