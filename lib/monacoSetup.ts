import { isTauri } from '@/lib/vaultClient';

let configured = false;
let configuring: Promise<void> | null = null;

function monacoVsBase(): string {
  return new URL('/monaco/vs', window.location.href).toString().replace(/\/$/, '');
}

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorkerUrl: (workerId: string, label: string) => string;
    };
  }
}

/** Tauri cannot load Monaco from CDN — use bundled files in /monaco/vs. */
export function ensureMonacoLoader(): Promise<void> {
  if (typeof window === 'undefined' || !isTauri()) return Promise.resolve();
  if (configured) return Promise.resolve();
  if (configuring) return configuring;

  configuring = (async () => {
    const vs = monacoVsBase();
    const workerMain = `${vs}/base/worker/workerMain.js`;

    window.MonacoEnvironment = {
      getWorkerUrl() {
        const bootstrap = [
          `self.MonacoEnvironment = { baseUrl: ${JSON.stringify(vs)} };`,
          `importScripts(${JSON.stringify(workerMain)});`
        ].join('');
        return `data:text/javascript;charset=utf-8,${encodeURIComponent(bootstrap)}`;
      }
    };

    const { loader } = await import('@monaco-editor/react');
    loader.config({ paths: { vs } });
    configured = true;
  })();

  return configuring;
}

export function isMonacoLoaderReady(): boolean {
  return configured || typeof window === 'undefined' || !isTauri();
}
