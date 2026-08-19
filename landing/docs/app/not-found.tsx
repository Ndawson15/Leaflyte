export default function NotFound() {
  return (
    <div className="mx-auto max-w-content py-16 text-center">
      <p className="text-sm font-medium uppercase tracking-wide text-muted">404</p>
      <h1 className="docs-h1 mt-2">Page not found</h1>
      <p className="docs-p text-muted">
        This documentation page does not exist yet. Check the sidebar or head back to{' '}
        <a className="docs-a" href="/">
          Quick Start
        </a>
        .
      </p>
    </div>
  );
}
