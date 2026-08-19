import { AlertTriangle, Info, Lightbulb } from 'lucide-react';

type CalloutVariant = 'note' | 'warning' | 'tip';

type CalloutProps = {
  variant?: CalloutVariant;
  title?: string;
  children: React.ReactNode;
};

const VARIANTS: Record<
  CalloutVariant,
  { icon: React.ReactNode; border: string; bg: string; label: string }
> = {
  note: {
    icon: <Info size={18} className="text-accent" />,
    border: 'border-accent',
    bg: 'bg-accent-soft',
    label: 'Note',
  },
  warning: {
    icon: <AlertTriangle size={18} className="text-amber-600" />,
    border: 'border-amber-400',
    bg: 'bg-amber-50',
    label: 'Warning',
  },
  tip: {
    icon: <Lightbulb size={18} className="text-accent" />,
    border: 'border-accent',
    bg: 'bg-accent-soft',
    label: 'Tip',
  },
};

export function Callout({ variant = 'note', title, children }: CalloutProps) {
  const config = VARIANTS[variant];

  return (
    <aside
      className={`my-5 rounded-r-lg border-l-4 ${config.border} ${config.bg} px-4 py-3.5`}
    >
      <div className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-forest">
        {config.icon}
        <span>{title ?? config.label}</span>
      </div>
      <div className="text-sm leading-6 text-text [&>p:last-child]:mb-0">{children}</div>
    </aside>
  );
}
