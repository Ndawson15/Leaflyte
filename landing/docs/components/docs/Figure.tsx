type FigureProps = {
  src: string;
  alt: string;
  caption?: string;
};

export function Figure({ src, alt, caption }: FigureProps) {
  return (
    <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-surface">
      <img src={src} alt={alt} className="w-full" />
      {caption ? (
        <figcaption className="border-t border-border px-4 py-3 text-sm text-muted">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
