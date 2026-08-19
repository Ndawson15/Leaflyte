import { PlayCircle } from 'lucide-react';

type VideoCtaProps = {
  href: string;
  label?: string;
};

export function VideoCta({ href, label = 'Watch Video' }: VideoCtaProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="mb-6 inline-flex items-center gap-2 rounded-lg border border-accent bg-accent-soft px-4 py-2.5 text-sm font-medium text-accent transition hover:bg-blue-100"
    >
      <PlayCircle size={18} />
      {label}
    </a>
  );
}
