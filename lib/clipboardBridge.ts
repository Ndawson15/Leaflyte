import { isTauri } from '@/lib/vaultClient';

let installed = false;
let installPromise: Promise<void> | null = null;

function isBenignClipboardAbort(reason: unknown): boolean {
  if (!reason) return false;
  const name =
    reason instanceof Error
      ? reason.name
      : typeof reason === 'object' && reason && 'name' in reason
        ? String((reason as { name: unknown }).name)
        : '';
  const message =
    reason instanceof Error
      ? reason.message
      : typeof reason === 'string'
        ? reason
        : typeof reason === 'object' && reason && 'message' in reason
          ? String((reason as { message: unknown }).message)
          : '';
  return (
    name === 'AbortError' ||
    name === 'Canceled' ||
    /aborted|canceled|cancelled/i.test(message)
  );
}

function installErrorFilters() {
  window.addEventListener('unhandledrejection', (event) => {
    if (isBenignClipboardAbort(event.reason)) {
      event.preventDefault();
    }
  });

  const originalConsoleError = console.error.bind(console);
  console.error = (...args: unknown[]) => {
    if (args.some(isBenignClipboardAbort)) return;
    const joined = args.map((arg) => (typeof arg === 'string' ? arg : '')).join(' ');
    if (/AbortError|operation was aborted/i.test(joined)) return;
    originalConsoleError(...args);
  };
}

async function textFromClipboardItems(items: ClipboardItems): Promise<string | null> {
  for (const item of items) {
    if (item.types.includes('text/plain')) {
      const blob = await item.getType('text/plain');
      return blob.text();
    }
  }
  return null;
}

async function installClipboardBridgeImpl(): Promise<void> {
  if (typeof window === 'undefined' || !isTauri() || installed) return;

  const { writeText, readText } = await import('@tauri-apps/plugin-clipboard-manager');

  const nativeWrite = async (text: string) => {
    await writeText(text);
  };

  const nativeRead = async () => readText();

  const bridge: Clipboard = {
    read: async () => {
      const text = await nativeRead();
      return [new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }) })];
    },
    readText: async () => {
      try {
        return await nativeRead();
      } catch (err) {
        if (isBenignClipboardAbort(err)) return '';
        throw err;
      }
    },
    write: async (items) => {
      const text = await textFromClipboardItems(items);
      if (text != null) await nativeWrite(text);
    },
    writeText: async (text: string) => {
      try {
        await nativeWrite(text);
      } catch (err) {
        if (!isBenignClipboardAbort(err)) throw err;
      }
    },
    addEventListener: navigator.clipboard?.addEventListener?.bind(navigator.clipboard) ?? (() => {}),
    removeEventListener:
      navigator.clipboard?.removeEventListener?.bind(navigator.clipboard) ?? (() => {}),
    dispatchEvent: navigator.clipboard?.dispatchEvent?.bind(navigator.clipboard) ?? (() => false)
  } as Clipboard;

  try {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      enumerable: true,
      get: () => bridge
    });
  } catch {
    // Some webviews reject redefine — fall through to execCommand patch only.
  }

  const originalExec = document.execCommand.bind(document);
  document.execCommand = (commandId: string, showUI?: boolean, value?: string) => {
    const cmd = commandId.toLowerCase();
    if (cmd === 'copy' || cmd === 'cut') {
      const selection = window.getSelection()?.toString() ?? '';
      if (selection) {
        void nativeWrite(selection).catch(() => {
          /* ignore */
        });
      }
      if (cmd === 'cut' && selection) {
        try {
          originalExec('delete');
        } catch {
          /* ignore */
        }
      }
      return true;
    }
    return originalExec(commandId, showUI, value);
  };

  installErrorFilters();
  installed = true;
}

/**
 * WKWebView often blocks Monaco's Clipboard API writes with NotAllowedError.
 * Route clipboard through Tauri's native pasteboard instead.
 */
export function installClipboardBridge(): Promise<void> {
  if (typeof window === 'undefined' || !isTauri()) return Promise.resolve();
  if (installed) return Promise.resolve();
  if (!installPromise) {
    installPromise = installClipboardBridgeImpl().catch((err) => {
      installPromise = null;
      throw err;
    });
  }
  return installPromise;
}
