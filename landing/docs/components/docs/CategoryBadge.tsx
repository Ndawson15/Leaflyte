const CATEGORY_STYLES: Record<string, string> = {
  Tutorial: 'text-accent',
  Reference: 'text-violet-600',
  Guide: 'text-accent',
};

type CategoryBadgeProps = {
  category: string;
  className?: string;
};

export function CategoryBadge({ category, className = '' }: CategoryBadgeProps) {
  const color = CATEGORY_STYLES[category] ?? 'text-accent';

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-medium uppercase tracking-wide ${color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full bg-current ${color}`} />
      {category}
    </span>
  );
}
