import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import sql from 'highlight.js/lib/languages/sql';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import json from 'highlight.js/lib/languages/json';
import bash from 'highlight.js/lib/languages/bash';
import yaml from 'highlight.js/lib/languages/yaml';
import markdown from 'highlight.js/lib/languages/markdown';
import rust from 'highlight.js/lib/languages/rust';
import go from 'highlight.js/lib/languages/go';
import java from 'highlight.js/lib/languages/java';
import php from 'highlight.js/lib/languages/php';
import csharp from 'highlight.js/lib/languages/csharp';
import ruby from 'highlight.js/lib/languages/ruby';
import plaintext from 'highlight.js/lib/languages/plaintext';
import { WIKI_LINK_RE } from '@/lib/wikiLinks';
import taskLists from 'markdown-it-task-lists';

type Md = InstanceType<typeof MarkdownIt>;

hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('js', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('ts', typescript);
hljs.registerLanguage('tsx', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('py', python);
hljs.registerLanguage('sql', sql);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('json', json);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('sh', bash);
hljs.registerLanguage('zsh', bash);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('yml', yaml);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('md', markdown);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('rs', rust);
hljs.registerLanguage('go', go);
hljs.registerLanguage('java', java);
hljs.registerLanguage('php', php);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cs', csharp);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('rb', ruby);
hljs.registerLanguage('plaintext', plaintext);
hljs.registerLanguage('text', plaintext);

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function highlightCode(str: string, lang: string): string {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(str, { language: lang, ignoreIllegals: true }).value;
    } catch {
      /* fall through */
    }
  }
  try {
    return hljs.highlightAuto(str).value;
  } catch {
    return escapeHtml(str);
  }
}

function wikiLinksPlugin(md: Md) {
  const textRule = md.renderer.rules.text;
  md.renderer.rules.text = (tokens, idx, options, env, self) => {
    const content = tokens[idx].content;
    if (!content.includes('[[')) {
      return textRule ? textRule(tokens, idx, options, env, self) : escapeHtml(content);
    }
    WIKI_LINK_RE.lastIndex = 0;
    let out = '';
    let last = 0;
    for (const match of content.matchAll(WIKI_LINK_RE)) {
      const index = match.index ?? 0;
      out += escapeHtml(content.slice(last, index));
      const wikiTarget = match[1].trim();
      const alias = match[0].includes('|')
        ? match[0].slice(match[0].indexOf('|') + 1, match[0].lastIndexOf(']')).trim()
        : wikiTarget;
      out += `<a href="#" class="wiki-link" data-wiki="${escapeHtml(wikiTarget)}">${escapeHtml(alias)}</a>`;
      last = index + match[0].length;
    }
    out += escapeHtml(content.slice(last));
    return out;
  };
}

function createMarkdown(): Md {
  const md = new MarkdownIt({
    html: false,
    linkify: true,
    typographer: true,
    highlight(str, lang) {
      const info = (lang || '').trim().toLowerCase();
      if (info === 'mermaid') {
        return `<pre class="mermaid">${escapeHtml(str.trim())}</pre>`;
      }
      const highlighted = highlightCode(str, info);
      const langClass = info ? ` language-${escapeHtml(info)}` : '';
      return `<pre class="hljs"><code class="hljs${langClass}">${highlighted}</code></pre>`;
    }
  });

  md.use(taskLists, { enabled: true, label: true, labelAfter: true });
  md.use(wikiLinksPlugin);

  const defaultImage =
    md.renderer.rules.image ||
    ((tokens, idx, options, env, self) => self.renderToken(tokens, idx, options));

  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const src = String(token.attrGet('src') ?? '');
    if (/^(https?:|data:|blob:|\/\/)/i.test(src)) {
      return defaultImage(tokens, idx, options, env, self);
    }
    const alt = String(token.content || token.attrGet('alt') || '');
    return `<img data-vault-src="${escapeHtml(src)}" alt="${escapeHtml(alt)}" class="vault-md-image" loading="lazy" />`;
  };

  const defaultFence = md.renderer.rules.fence;
  md.renderer.rules.fence = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const info = (token.info || '').trim().toLowerCase().split(/\s+/)[0] ?? '';
    if (info === 'mermaid') {
      return `<pre class="mermaid">${escapeHtml(token.content.trim())}</pre>\n`;
    }
    if (defaultFence) return defaultFence(tokens, idx, options, env, self);
    return self.renderToken(tokens, idx, options);
  };

  return md;
}

const md = createMarkdown();

/** GFM markdown preview — tables, task lists, highlighted fences, wiki links, mermaid. */
export function markdownToHtml(source: string): string {
  return md.render(source.replace(/\r\n/g, '\n'));
}
