'use client';

import { useEffect, useState } from 'react';
import { APP_NAME } from '@/lib/appInfo';
import { useAppVersion } from '@/hooks/useAppVersion';
import AppLogo from '@/components/AppLogo';
import { THEMES } from '@/lib/themes';
import { SHORTCUT_ACTIONS, conflictFor, formatChord, type ActionId } from '@/lib/shortcuts';
import { readLocal, writeLocal } from '@/lib/storage';
import { useTheme } from './ThemeProvider';
import ThemeColorEditor from '@/components/ThemeColorEditor';
import { useKeymap } from './KeymapProvider';
import { useAi } from './AiProvider';
import { AI_PROVIDERS, type AiProvider } from '@/lib/ai/config';
import AiModelSelect from '@/components/AiModelSelect';
import WorkspacePanel from '@/components/WorkspacePanel';
import { useWorkspaces } from '@/components/WorkspaceProvider';
import { UpdateSettingsRow } from '@/components/UpdateNotifier';
import { useEditorSettings } from '@/components/EditorSettingsProvider';

const SETTINGS_TAB_KEY = 'leaflyte.settingsTab';

const TABS = [
  { id: 'general', label: 'General' },
  { id: 'workspaces', label: 'Workspaces' },
  { id: 'theme', label: 'Theme' },
  { id: 'ai', label: 'AI' },
  { id: 'shortcuts', label: 'Shortcuts' }
] as const;

type SettingsTab = (typeof TABS)[number]['id'];

function isSettingsTab(value: string | null): value is SettingsTab {
  return TABS.some((t) => t.id === value);
}

function resolveSettingsTab(stored: string | null): SettingsTab {
  if (stored === 'colors') return 'theme';
  return isSettingsTab(stored) ? stored : 'general';
}

export default function Settings({
  onSwitchWorkspace,
  onNotice
}: {
  onSwitchWorkspace: (workspaceId: string) => void | Promise<void>;
  onNotice?: (message: string) => void;
}) {
  const { workspace } = useWorkspaces();
  const [tab, setTab] = useState<SettingsTab>('general');

  useEffect(() => {
    setTab(resolveSettingsTab(readLocal(SETTINGS_TAB_KEY)));
  }, []);

  const selectTab = (next: SettingsTab) => {
    setTab(next);
    writeLocal(SETTINGS_TAB_KEY, next);
  };

  return (
    <div className="h-full overflow-hidden bg-bg flex flex-col">
      <header className="shrink-0 px-8 pt-8 pb-4 border-b border-border">
        <h1 className="text-lg text-text">Settings</h1>
        <p className="text-xs text-muted mt-1">Preferences for this machine.</p>
      </header>

      <div className="flex-1 min-h-0 flex">
        <nav className="shrink-0 w-44 border-r border-border px-3 py-4 space-y-0.5 overflow-y-auto">
          {TABS.map((item) => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => selectTab(item.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  active
                    ? 'bg-surface2 text-text font-medium'
                    : 'text-muted hover:text-text hover:bg-surface2/60'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-2xl px-8 py-8">
            {tab === 'general' && (
              <GeneralPanel
                workspaceName={workspace?.name ?? null}
                vaultPath={workspace?.vaultPath ?? null}
                onNotice={onNotice}
              />
            )}
            {tab === 'workspaces' && (
              <WorkspacesSettingsPanel onSwitch={onSwitchWorkspace} onNotice={onNotice} />
            )}
            {tab === 'theme' && <ThemePanel />}
            {tab === 'ai' && <AiPanel />}
            {tab === 'shortcuts' && <ShortcutsPanel />}
          </div>
        </div>
      </div>
    </div>
  );
}

function GeneralPanel({
  workspaceName,
  vaultPath,
  onNotice
}: {
  workspaceName: string | null;
  vaultPath: string | null;
  onNotice?: (message: string) => void;
}) {
  const { markdownToolbar, setMarkdownToolbar } = useEditorSettings();
  const appVersion = useAppVersion();

  return (
    <div className="space-y-8">
      <SettingsSection title="About" description="Leaflyte on this device.">
        <div className="space-y-3">
          <div className="border border-border rounded-lg bg-surface">
            <div className="flex items-center gap-3 px-4 py-3">
              <AppLogo size={28} alt="" />
              <div className="min-w-0">
                <div className="text-sm text-text font-medium">{APP_NAME}</div>
                <div className="text-[11px] text-muted">v{appVersion}</div>
              </div>
            </div>
          </div>
          <UpdateSettingsRow onNotice={onNotice} />
        </div>
      </SettingsSection>

      <SettingsSection
        title="Editor"
        description="Formatting tools while you write markdown notes."
      >
        <div className="border border-border rounded-lg bg-surface">
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-text">Formatting toolbar</div>
              <p className="text-[11px] text-muted mt-0.5">
                Notion-style toolbar for headings, lists, links, and more. A bubble menu also
                appears when you highlight text.
              </p>
            </div>
            <Toggle
              checked={markdownToolbar}
              onChange={setMarkdownToolbar}
              label="Formatting toolbar"
            />
          </div>
        </div>
      </SettingsSection>

      <SettingsSection title="Current workspace" description="Switch or manage workspaces on the Workspaces tab.">
        <div className="border border-border rounded-lg bg-surface px-4 py-3 space-y-1">
          <div className="text-sm text-text">{workspaceName ?? 'Loading…'}</div>
          <p className="text-[11px] text-muted break-all">{vaultPath ?? '—'}</p>
        </div>
      </SettingsSection>

      <p className="text-xs text-muted pt-2 border-t border-border">Built with vibes by Noah Dawson</p>
    </div>
  );
}

function WorkspacesSettingsPanel({
  onSwitch,
  onNotice
}: {
  onSwitch: (workspaceId: string) => void | Promise<void>;
  onNotice?: (message: string) => void;
}) {
  return (
    <div className="space-y-6">
      <SettingsSection title="Workspaces" description="Separate vault folders, each with their own open tabs.">
        <WorkspacePanel onSwitch={onSwitch} onNotice={onNotice} />
      </SettingsSection>
    </div>
  );
}

function ThemePanel() {
  const { themeId, setThemeId, theme, colorIcons, setColorIcons } = useTheme();

  return (
    <div className="space-y-8">
      <SettingsSection title="Color palette" description="Choose a base theme, then customize individual colors below.">
        <div className="grid grid-cols-2 gap-3">
          {THEMES.map((themeOption) => {
            const selected = themeOption.id === themeId;
            return (
              <button
                key={themeOption.id}
                type="button"
                onClick={() => setThemeId(themeOption.id)}
                className={`text-left rounded-lg border p-3 transition-colors ${
                  selected ? 'border-amber bg-surface' : 'border-border bg-surface hover:border-muted'
                }`}
              >
                <div className="flex gap-1 mb-3">
                  {themeOption.swatches.map((c) => (
                    <span
                      key={c}
                      className="h-6 flex-1 rounded-sm border border-border"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm text-text">{themeOption.name}</span>
                  {selected && <span className="text-[10px] uppercase tracking-wider text-amber">Active</span>}
                </div>
                <p className="text-[11px] text-muted mt-1">{themeOption.description}</p>
              </button>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Custom colors"
        description={`Fine-tune the ${theme.name} palette with hex values or a color picker. Changes apply immediately.`}
      >
        <ThemeColorEditor />
      </SettingsSection>

      <SettingsSection title="File icons" description="How files appear in the vault tree.">
        <div className="border border-border rounded-lg bg-surface">
          <div className="flex items-center gap-4 px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm text-text">Color file icons</div>
              <p className="text-[11px] text-muted mt-0.5">
                VS Code-style icons by file type. Off uses simple file and folder icons.
              </p>
            </div>
            <Toggle checked={colorIcons} onChange={setColorIcons} label="Color file icons" />
          </div>
        </div>
      </SettingsSection>
    </div>
  );
}

function AiPanel() {
  const { config: aiConfig, setConfig: setAiConfig } = useAi();

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Vault AI"
        description="Bring your own API key. Stored in this browser only (localStorage) — not in git, not on our servers. Sent only to the provider you choose when you use AI chat."
      >
        <div className="border border-border rounded-lg bg-surface divide-y divide-border">
          <div className="px-4 py-3 space-y-2">
            <label className="text-sm text-text">Provider</label>
            <select
              value={aiConfig.provider}
              onChange={(e) => setAiConfig({ ...aiConfig, provider: e.target.value as AiProvider })}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted"
            >
              {AI_PROVIDERS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.description}
                </option>
              ))}
            </select>
          </div>
          {aiConfig.provider !== 'off' && (
            <>
              <div className="px-4 py-3 space-y-2">
                <label className="text-sm text-text">API key</label>
                <input
                  type="password"
                  value={aiConfig.apiKey}
                  onChange={(e) => setAiConfig({ ...aiConfig, apiKey: e.target.value })}
                  placeholder={aiConfig.provider === 'anthropic' ? 'sk-ant-…' : 'sk-…'}
                  autoComplete="off"
                  className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text outline-none focus:border-muted font-mono"
                />
              </div>
              <div className="px-4 py-3 space-y-2">
                <label className="text-sm text-text">Model</label>
                <AiModelSelect
                  provider={aiConfig.provider}
                  apiKey={aiConfig.apiKey}
                  value={aiConfig.provider === 'anthropic' ? aiConfig.anthropicModel : aiConfig.openaiModel}
                  onChange={(modelId) =>
                    setAiConfig(
                      aiConfig.provider === 'anthropic'
                        ? { ...aiConfig, anthropicModel: modelId }
                        : { ...aiConfig, openaiModel: modelId }
                    )
                  }
                />
              </div>
              <div className="px-4 py-3 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-text">Allow file edits</p>
                  <p className="text-[11px] text-muted mt-0.5">
                    AI can propose vault changes. Click Preview to open edits in the editor, then approve or revert.
                  </p>
                </div>
                <Toggle
                  checked={aiConfig.allowEdits}
                  onChange={(allowEdits) => setAiConfig({ ...aiConfig, allowEdits })}
                  label="Allow file edits"
                />
              </div>
            </>
          )}
        </div>
      </SettingsSection>
    </div>
  );
}

function ShortcutsPanel() {
  const { bindings, recording, setRecording, resetBinding, resetAll } = useKeymap();
  const groups = ['Navigation', 'View', 'Files', 'AI'] as const;

  return (
    <div className="space-y-6">
      <SettingsSection
        title="Keyboard shortcuts"
        description="Click a shortcut, then press the new keys. Esc cancels."
        action={
          <button type="button" onClick={resetAll} className="text-[11px] text-muted hover:text-amber">
            Reset all
          </button>
        }
      >
        <div className="space-y-3">
          {groups.map((group) => (
            <div key={group} className="border border-border rounded-lg bg-surface overflow-hidden">
              <div className="px-4 py-2 text-[10px] uppercase tracking-wider text-muted border-b border-border">
                {group}
              </div>
              <div className="divide-y divide-border">
                {SHORTCUT_ACTIONS.filter((a) => a.group === group).map((action) => {
                  const chord = bindings[action.id];
                  const listening = recording === action.id;
                  const conflict = conflictFor(bindings, action.id, chord);
                  return (
                    <div key={action.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span className="flex-1 text-sm text-text">{action.label}</span>
                      {conflict && !listening && (
                        <span className="text-[10px] text-amber">Also: {labelFor(conflict)}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => setRecording(listening ? null : action.id)}
                        className={`min-w-[7rem] px-2 py-1 rounded text-xs border ${
                          listening
                            ? 'border-amber text-amber bg-bg'
                            : 'border-border text-text bg-bg hover:border-muted'
                        }`}
                      >
                        {listening ? 'Press keys…' : formatChord(chord)}
                      </button>
                      <button
                        type="button"
                        onClick={() => resetBinding(action.id)}
                        className="text-[10px] text-muted hover:text-text"
                      >
                        Reset
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3">
        <div>
          <h2 className="text-sm text-text font-medium">{title}</h2>
          {description && <p className="text-xs text-muted mt-1">{description}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  label
}: {
  checked: boolean;
  onChange: (on: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative w-8 h-[18px] rounded-full shrink-0 transition-colors ${
        checked ? 'bg-amber' : 'bg-border'
      }`}
    >
      <span
        className={`absolute top-[2px] left-[2px] h-[14px] w-[14px] rounded-full bg-text transition-transform ${
          checked ? 'translate-x-[14px]' : ''
        }`}
      />
    </button>
  );
}

function labelFor(id: ActionId) {
  return SHORTCUT_ACTIONS.find((a) => a.id === id)?.label ?? id;
}
