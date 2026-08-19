type DocMetaProps = {
  readingTime: number;
  lastUpdated?: string;
};

export function DocMeta({ readingTime, lastUpdated }: DocMetaProps) {
  return (
    <div className="shrink-0 text-right text-sm text-muted">
      <p>{readingTime} min read</p>
      {lastUpdated ? <p className="mt-0.5">{lastUpdated}</p> : null}
    </div>
  );
}
