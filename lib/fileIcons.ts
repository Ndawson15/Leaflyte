export type FileGlyph =
  | 'file'
  | 'text'
  | 'markdown'
  | 'database'
  | 'markup'
  | 'cfml'
  | 'script'
  | 'types'
  | 'python'
  | 'data'
  | 'style'
  | 'shell'
  | 'config'
  | 'image'
  | 'php'
  | 'label';

export type FileIconSpec = {
  glyph: FileGlyph;
  color: string;
  label?: string;
};

const BY_NAME: Record<string, FileIconSpec> = {
  dockerfile: { glyph: 'config', color: '#4A8EAB' },
  makefile: { glyph: 'config', color: '#7A8A6B' },
  'docker-compose.yml': { glyph: 'config', color: '#4A8EAB' },
  'docker-compose.yaml': { glyph: 'config', color: '#4A8EAB' },
  'compose.yml': { glyph: 'config', color: '#4A8EAB' },
  'compose.yaml': { glyph: 'config', color: '#4A8EAB' },
  'package.json': { glyph: 'data', color: '#8A8F7A' },
  'tsconfig.json': { glyph: 'types', color: '#3B7EB8' },
  'readme.md': { glyph: 'markdown', color: '#5B8FCF' },
  license: { glyph: 'text', color: '#7A7E86' },
  '.gitignore': { glyph: 'config', color: '#7A6B5A' },
  '.gitattributes': { glyph: 'config', color: '#7A6B5A' },
  '.env': { glyph: 'shell', color: '#8A9A4A' },
  '.env.local': { glyph: 'shell', color: '#8A9A4A' },
  '.env.example': { glyph: 'shell', color: '#8A9A4A' }
};

const BY_EXT: Record<string, FileIconSpec> = {
  md: { glyph: 'markdown', color: '#5B8FCF' },
  mdx: { glyph: 'markdown', color: '#5B8FCF' },
  txt: { glyph: 'text', color: '#7A7E86' },
  sql: { glyph: 'database', color: '#3D9A88' },
  html: { glyph: 'markup', color: '#D9783A' },
  htm: { glyph: 'markup', color: '#D9783A' },
  xml: { glyph: 'markup', color: '#D9783A' },
  cfm: { glyph: 'cfml', color: '#B56FD4' },
  cfc: { glyph: 'cfml', color: '#9B5FC0' },
  cfml: { glyph: 'cfml', color: '#B56FD4' },
  cfs: { glyph: 'cfml', color: '#B56FD4' },
  cfr: { glyph: 'cfml', color: '#9B5FC0' },
  js: { glyph: 'script', color: '#C9A227' },
  mjs: { glyph: 'script', color: '#C9A227' },
  cjs: { glyph: 'script', color: '#C9A227' },
  jsx: { glyph: 'script', color: '#C4A84A' },
  ts: { glyph: 'types', color: '#3B7EB8' },
  tsx: { glyph: 'types', color: '#3B7EB8' },
  py: { glyph: 'python', color: '#5A9A48' },
  json: { glyph: 'data', color: '#8A8F99' },
  jsonc: { glyph: 'data', color: '#8A8F99' },
  csv: { glyph: 'data', color: '#4A9A6E' },
  toml: { glyph: 'config', color: '#8A7A6B' },
  ini: { glyph: 'config', color: '#8A7A6B' },
  css: { glyph: 'style', color: '#4A8EC4' },
  scss: { glyph: 'style', color: '#C46A8A' },
  less: { glyph: 'style', color: '#4A6AB4' },
  sh: { glyph: 'shell', color: '#8A9A4A' },
  bash: { glyph: 'shell', color: '#8A9A4A' },
  zsh: { glyph: 'shell', color: '#8A9A4A' },
  yaml: { glyph: 'config', color: '#C07A7A' },
  yml: { glyph: 'config', color: '#C07A7A' },
  php: { glyph: 'php', color: '#6A6AB8' },
  svg: { glyph: 'image', color: '#D4A04A' },
  png: { glyph: 'image', color: '#5A9A8A' },
  jpg: { glyph: 'image', color: '#5A9A8A' },
  jpeg: { glyph: 'image', color: '#5A9A8A' },
  gif: { glyph: 'image', color: '#5A9A8A' },
  webp: { glyph: 'image', color: '#5A9A8A' },
  ico: { glyph: 'image', color: '#5A9A8A' },
  rs: { glyph: 'script', color: '#C47A4A' },
  go: { glyph: 'script', color: '#4A9AB0' },
  rb: { glyph: 'script', color: '#C04A5A' },
  vue: { glyph: 'markup', color: '#4AAA7A' },
  svelte: { glyph: 'markup', color: '#C45A3A' },
  java: { glyph: 'script', color: '#C45A4A' },
  c: { glyph: 'script', color: '#5A7AC4' },
  h: { glyph: 'script', color: '#5A7AC4' },
  cpp: { glyph: 'script', color: '#4A6AB4' },
  cs: { glyph: 'script', color: '#6A4AC4' },
  graphql: { glyph: 'data', color: '#C45A8A' },
  prisma: { glyph: 'database', color: '#4A8A7A' },
  env: { glyph: 'shell', color: '#8A9A4A' }
};

const FALLBACK_COLORS = ['#6B7C8A', '#7A6B8A', '#6B8A7A', '#8A7A6B', '#6B7A8A', '#8A6B7A'];

function basename(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() ?? path;
}

function hashColor(s: string): string {
  let n = 0;
  for (const ch of s) n = (n * 31 + ch.charCodeAt(0)) >>> 0;
  return FALLBACK_COLORS[n % FALLBACK_COLORS.length];
}

export function fileIconFor(path: string): FileIconSpec {
  const name = basename(path).toLowerCase();
  if (BY_NAME[name]) return BY_NAME[name];

  const dot = name.lastIndexOf('.');
  const ext = dot > 0 ? name.slice(dot + 1) : '';
  if (ext && BY_EXT[ext]) return BY_EXT[ext];
  if (ext) {
    return {
      glyph: 'label',
      color: hashColor(ext),
      label: ext.slice(0, 3).toUpperCase()
    };
  }
  return { glyph: 'file', color: '#6B6E76' };
}
