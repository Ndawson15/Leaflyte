import * as vscode from 'vscode';
import * as path from 'path';

type LinkedVault = {
  vaultPath: string;
  captureUrl: string;
};

let linkedVault: LinkedVault | null = null;
let statusBar: vscode.StatusBarItem | undefined;

function getConfig() {
  const config = vscode.workspace.getConfiguration('leaflyte');
  const captureUrl = (config.get<string>('captureUrl') || 'http://127.0.0.1:1420/api/capture').trim();
  const captureFolder = (config.get<string>('captureFolder') || 'captures').trim();
  const vaultUrl = captureUrl.replace(/\/api\/capture\/?$/, '/api/vault');
  return { captureUrl, captureFolder, vaultUrl };
}

function shortVaultLabel(vaultPath: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || '';
  if (home && vaultPath.startsWith(home)) {
    return '~' + vaultPath.slice(home.length);
  }
  const parts = vaultPath.split(/[/\\]/).filter(Boolean);
  if (parts.length <= 2) return vaultPath;
  return '…/' + parts.slice(-2).join('/');
}

function updateStatusBar(vault: LinkedVault | null) {
  if (!statusBar) return;
  if (!vault) {
    statusBar.text = '$(notebook) Leaflyte: not connected';
    statusBar.tooltip = 'Leaflyte is not running or no vault is open. Click to retry.';
    statusBar.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
    statusBar.show();
    return;
  }
  statusBar.text = `$(notebook) Leaflyte: ${shortVaultLabel(vault.vaultPath)}`;
  statusBar.tooltip = `Captures go to this vault:\n${vault.vaultPath}\n\nClick to refresh connection.`;
  statusBar.backgroundColor = undefined;
  statusBar.show();
}

async function refreshLinkedVault(silent = false): Promise<LinkedVault | null> {
  const { vaultUrl, captureUrl } = getConfig();
  try {
    const res = await fetch(vaultUrl, { method: 'GET' });
    const data = (await res.json().catch(() => ({}))) as { path?: string; error?: string };
    if (!res.ok || !data.path) {
      throw new Error(data.error || res.statusText || 'Could not read active vault');
    }
    linkedVault = { vaultPath: data.path, captureUrl };
    updateStatusBar(linkedVault);
    if (!silent) {
      vscode.window.showInformationMessage(`Leaflyte connected to ${shortVaultLabel(data.path)}`);
    }
    return linkedVault;
  } catch (e) {
    linkedVault = null;
    updateStatusBar(null);
    if (!silent) {
      vscode.window.showErrorMessage(
        `Leaflyte connection failed: ${e instanceof Error ? e.message : String(e)}`
      );
    }
    return null;
  }
}

async function ensureLinkedVault(): Promise<LinkedVault> {
  const vault = await refreshLinkedVault(true);
  if (!vault) {
    throw new Error(
      'Leaflyte is not connected. Start Leaflyte, open a vault, then run “Leaflyte: Connect to Vault”.'
    );
  }
  return vault;
}

async function postCapture(body: {
  content: string;
  languageId?: string;
  title?: string;
  folder?: string;
  extension?: string;
}): Promise<{ path: string; vaultPath: string }> {
  const vault = await ensureLinkedVault();
  const { captureUrl, captureFolder } = getConfig();

  const res = await fetch(captureUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, folder: body.folder ?? captureFolder })
  });
  const data = (await res.json().catch(() => ({}))) as {
    path?: string;
    vaultPath?: string;
    error?: string;
  };
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Capture failed');
  }
  if (!data.path) throw new Error('Capture response missing path');

  if (data.vaultPath && data.vaultPath !== vault.vaultPath) {
    linkedVault = { vaultPath: data.vaultPath, captureUrl };
    updateStatusBar(linkedVault);
  }

  return { path: data.path, vaultPath: data.vaultPath || vault.vaultPath };
}

function languageIdOf(editor: vscode.TextEditor): string {
  return editor.document.languageId;
}

function extensionHint(editor: vscode.TextEditor): string | undefined {
  const name = path.basename(editor.document.fileName || '');
  const idx = name.lastIndexOf('.');
  if (idx > 0) return name.slice(idx + 1);
  return undefined;
}

async function captureSelection() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Leaflyte: no active editor');
    return;
  }
  const selection = editor.selection;
  const content = selection.isEmpty
    ? editor.document.getText()
    : editor.document.getText(selection);
  if (!content.trim()) {
    vscode.window.showWarningMessage('Leaflyte: nothing to capture');
    return;
  }

  const title = path.basename(
    editor.document.fileName || 'capture',
    path.extname(editor.document.fileName || '')
  );
  try {
    const { path: notePath, vaultPath } = await postCapture({
      content,
      languageId: languageIdOf(editor),
      extension: extensionHint(editor),
      title: `${title}-snippet`
    });
    vscode.window.showInformationMessage(
      `Leaflyte: captured → ${notePath} in ${shortVaultLabel(vaultPath)}`
    );
  } catch (e) {
    vscode.window.showErrorMessage(
      `Leaflyte capture failed: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

async function captureFile() {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage('Leaflyte: no active editor');
    return;
  }
  const content = editor.document.getText();
  if (!content.trim()) {
    vscode.window.showWarningMessage('Leaflyte: file is empty');
    return;
  }
  const title = path.basename(
    editor.document.fileName || 'capture',
    path.extname(editor.document.fileName || '')
  );
  try {
    const { path: notePath, vaultPath } = await postCapture({
      content,
      languageId: languageIdOf(editor),
      extension: extensionHint(editor),
      title
    });
    vscode.window.showInformationMessage(
      `Leaflyte: captured → ${notePath} in ${shortVaultLabel(vaultPath)}`
    );
  } catch (e) {
    vscode.window.showErrorMessage(
      `Leaflyte capture failed: ${e instanceof Error ? e.message : String(e)}`
    );
  }
}

export function activate(context: vscode.ExtensionContext) {
  statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  statusBar.command = 'leaflyte.refreshVault';

  context.subscriptions.push(
    statusBar,
    vscode.commands.registerCommand('leaflyte.captureSelection', () => void captureSelection()),
    vscode.commands.registerCommand('leaflyte.captureFile', () => void captureFile()),
    vscode.commands.registerCommand('leaflyte.refreshVault', () => void refreshLinkedVault(false)),
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (event.affectsConfiguration('leaflyte.captureUrl')) {
        linkedVault = null;
        void refreshLinkedVault(true);
      }
    })
  );

  void refreshLinkedVault(true);
}

export function deactivate() {
  statusBar?.dispose();
  statusBar = undefined;
  linkedVault = null;
}
