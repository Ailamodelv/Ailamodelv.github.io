import katex from './vendor/katex.cjs';

// Raw HTML is escaped, except for strictly validated empty navigation anchors.
function renderMath(source, displayMode = false) {
  try {
    return katex.renderToString(source, { displayMode, trust: false, strict: 'ignore', maxSize: 20, maxExpand: 1000 });
  } catch {
    return `<code class="math-error">${escapeHtml(source)}</code>`;
  }
}
export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

export function normalizeBasePath(value = '') {
  const path = String(value).trim().replace(/^\/+|\/+$/g, '');
  if (!path) return '';
  if (/[\\?#\s]/.test(path) || path.split('/').some((part) => part === '..' || part === '.' || !part)) {
    throw new Error('BASE_PATH 必须是站内路径，例如 /robot-notes。');
  }
  return `/${path}`;
}

export function withBasePath(path, basePath = '') {
  return `${normalizeBasePath(basePath)}/${String(path).replace(/^\/+/, '')}`;
}

export function safeLink(raw, basePath = '') {
  const value = String(raw).trim();
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value) || value.startsWith('//')) return null;
  if (/^https?:\/\//i.test(value)) {
    try { const url = new URL(value); return url.protocol === 'http:' || url.protocol === 'https:' ? value : null; } catch { return null; }
  }
  if (/^mailto:[^@\s]+@[^@\s]+$/i.test(value)) return value;
  if (/^[a-z][a-z\d+.-]*:/i.test(value)) return null;
  if (value.startsWith('/')) {
    const base = normalizeBasePath(basePath);
    return base && (value === base || value.startsWith(`${base}/`)) ? value : withBasePath(value, base);
  }
  return value;
}

export function safeImage(raw, basePath = '') {
  const value = String(raw).trim();
  if (!value || /[\u0000-\u0020\u007f\\]/.test(value)) return null;
  if (/^https:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && !url.username && !url.password ? value : null;
    } catch { return null; }
  }
  const base = normalizeBasePath(basePath);
  const assetPath = value.startsWith('assets/') ? `/${value}` : base && value.startsWith(`${base}/assets/`) ? value.slice(base.length) : value;
  if (!assetPath.startsWith('/assets/')) return null;
  try {
    const decoded = decodeURIComponent(assetPath.split(/[?#]/)[0]);
    if (/[\u0000-\u0020\u007f\\]/.test(decoded) || decoded.split('/').some((part) => part === '..' || part === '.')) return null;
  } catch { return null; }
  return withBasePath(assetPath, base);
}

export function renderInline(text, basePath = '', depth = 0) {
  if (depth > 3) return escapeHtml(text);
  const token = /`(?<code>[^`\n]+)`|(?<!\\)\$(?!\$)(?<math>[^\n$]+?)(?<!\\)\$(?!\$)|\*\*(?<bold>[^*\n]+)\*\*|\*(?<em>[^*\n]+)\*|!\[(?<imageAlt>[^\]\n]*)\]\((?<imageSrc>[^)\s]+)(?:\s+"(?<imageTitle>[^"]*)")?\)|\[(?<label>[^\]\n]+)\]\((?<href>[^)\s]+)(?:\s+"(?<title>[^"]*)")?\)|(?<lineBreak>\n)/g;
  let result = '', cursor = 0, match;
  while ((match = token.exec(text))) {
    result += escapeHtml(text.slice(cursor, match.index));
    const groups = match.groups;
    if (groups.code !== undefined) result += `<code>${escapeHtml(groups.code)}</code>`;
    else if (groups.math !== undefined) result += `<span class="math-inline">${renderMath(groups.math)}</span>`;
    else if (groups.bold !== undefined) result += `<strong>${renderInline(groups.bold, basePath, depth + 1)}</strong>`;
    else if (groups.em !== undefined) result += `<em>${renderInline(groups.em, basePath, depth + 1)}</em>`;
    else if (groups.lineBreak !== undefined) result += '<br>';
    else if (groups.imageAlt !== undefined) {
      const src = safeImage(groups.imageSrc, basePath);
      const title = groups.imageTitle ? ` title="${escapeHtml(groups.imageTitle)}"` : '';
      result += src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(groups.imageAlt)}" loading="lazy" decoding="async"${title}>` : escapeHtml(groups.imageAlt);
    }
    else {
      const href = safeLink(groups.href, basePath);
      const label = renderInline(groups.label, basePath, depth + 1);
      const title = groups.title ? ` title="${escapeHtml(groups.title)}"` : '';
      result += href ? `<a href="${escapeHtml(href)}"${title}>${label}</a>` : label;
    }
    cursor = token.lastIndex;
  }
  return result + escapeHtml(text.slice(cursor));
}

export function parseFrontmatter(source) {
  const text = String(source).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.startsWith('---\n')) return { attributes: {}, body: text };
  const end = text.indexOf('\n---', 4);
  if (end < 0 || (text[end + 4] && text[end + 4] !== '\n')) throw new Error('文章 frontmatter 缺少结束标记 ---。');
  const attributes = {};
  for (const line of text.slice(4, end).split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue;
    const match = line.match(/^([a-zA-Z][\w-]*):\s*(.*?)\s*$/);
    if (!match) throw new Error(`不支持的 frontmatter 格式：${line}`);
    let value = match[2];
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    attributes[match[1]] = /^(true|false)$/i.test(value) ? value.toLowerCase() === 'true' : value;
  }
  const tags = attributes.tags;
  attributes.tags = typeof tags === 'string' ? tags.replace(/^\[|\]$/g, '').split(/[,，]/).map((tag) => tag.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean) : [];
  return { attributes, body: text.slice(end + 4).replace(/^\n/, '') };
}

function headingText(value) {
  return value.replace(/`([^`]+)`/g, '$1').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/!?\[([^\]]*)\]\([^)]+\)/g, '$1');
}

function splitTableRow(line) {
  let text = line.trim();
  if (text.startsWith('|')) text = text.slice(1);
  if (text.endsWith('|') && !text.endsWith('\\|')) text = text.slice(0, -1);
  const cells = []; let current = '', code = false, math = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\\' && text[i + 1] === '|') { current += '|'; i++; continue; }
    if (text[i] === '`') code = !code;
    if (text[i] === '$' && text[i - 1] !== '\\' && !code) math = !math;
    if (text[i] === '|' && !code && !math) { cells.push(current.trim()); current = ''; }
    else current += text[i];
  }
  cells.push(current.trim());
  return cells;
}

export function renderMarkdown(source, { basePath = '' } = {}) {
  const lines = String(source).replace(/\r\n?/g, '\n').split('\n');
  const html = [], toc = [], ids = new Set();
  const blockStart = (line) => /^(?:\s*$|#{1,6}\s|```|\$\$|<a id="|---\s*$|\s*>\s?|\s*[-*+]\s+|\s*\d+[.)]\s+)/.test(line);
  const tableAt = (index) => {
    if (!lines[index]?.includes('|') || !lines[index + 1]?.includes('|')) return null;
    const headers = splitTableRow(lines[index]), delimiters = splitTableRow(lines[index + 1]);
    return headers.length === delimiters.length && delimiters.every((cell) => /^:?-{3,}:?$/.test(cell)) ? { headers, delimiters } : null;
  };
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    const anchor = line.match(/^<a id="([a-zA-Z][a-zA-Z0-9_-]*)"><\/a>\s*$/);
    if (anchor && !ids.has(anchor[1])) {
      ids.add(anchor[1]); html.push(`<span class="article-anchor" id="${anchor[1]}"></span>`); i++; continue;
    }
    if (/^---\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
    if (line.trim() === '$$') {
      const math = []; i++;
      while (i < lines.length && lines[i].trim() !== '$$') math.push(lines[i++]);
      if (i < lines.length) i++;
      html.push(`<div class="math-display">${renderMath(math.join('\n'), true)}</div>`); continue;
    }
    const figure = line.match(/^!\[([^\]\n]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/);
    if (figure) {
      const src = safeImage(figure[2], basePath);
      if (src) {
        html.push(`<figure class="article-figure"><a href="${escapeHtml(src)}" target="_blank" rel="noopener noreferrer" aria-label="查看原图：${escapeHtml(figure[1])}">${renderInline(line, basePath)}</a>${figure[3] ? `<figcaption>${escapeHtml(figure[3])}</figcaption>` : ''}</figure>`);
        i++; continue;
      }
    }
    const fence = line.match(/^```([\w+-]*)\s*$/);
    if (fence) {
      const code = []; i++;
      while (i < lines.length && !/^```\s*$/.test(lines[i])) code.push(lines[i++]);
      if (i < lines.length) i++;
      html.push(`<pre><code${fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : ''}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }
    const heading = line.match(/^(#{1,6})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      const text = headingText(heading[2]);
      const baseId = text.toLowerCase().normalize('NFKC').replace(/[^\p{L}\p{N}\s_-]/gu, '').trim().replace(/[\s_]+/g, '-') || 'section';
      let id = baseId, count = 1;
      while (ids.has(id)) id = `${baseId}-${++count}`;
      ids.add(id);
      const level = heading[1].length;
      toc.push({ id, text, level });
      html.push(`<h${level} id="${escapeHtml(id)}">${renderInline(heading[2], basePath)}</h${level}>`); i++; continue;
    }
    const table = tableAt(i);
    if (table) {
      const alignment = table.delimiters.map((cell) => cell.startsWith(':') && cell.endsWith(':') ? 'center' : cell.endsWith(':') ? 'right' : 'left');
      const headers = table.headers.map((cell, col) => `<th scope="col" class="table-align-${alignment[col]}">${renderInline(cell, basePath)}</th>`).join('');
      const rows = []; i += 2;
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        const cells = splitTableRow(lines[i]);
        if (cells.length !== table.headers.length) break;
        rows.push(`<tr>${cells.map((cell, col) => `<td class="table-align-${alignment[col]}">${renderInline(cell, basePath)}</td>`).join('')}</tr>`); i++;
      }
      html.push(`<div class="table-wrap" role="region" aria-label="文章表格" tabindex="0"><table><thead><tr>${headers}</tr></thead><tbody>${rows.join('')}</tbody></table></div>`); continue;
    }
    if (/^\s*>/.test(line)) {
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) quote.push(lines[i++].replace(/^\s*>\s?/, ''));
      html.push(`<blockquote>${renderMarkdown(quote.join('\n'), { basePath }).html}</blockquote>`); continue;
    }
    const list = line.match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
    if (list) {
      const ordered = Boolean(list[2]), items = [];
      while (i < lines.length) {
        const item = lines[i].match(/^\s*(?:([-*+])|(\d+)[.)])\s+(.+)$/);
        if (!item || Boolean(item[2]) !== ordered) break;
        items.push(`<li>${renderInline(item[3], basePath)}</li>`); i++;
      }
      const tag = ordered ? 'ol' : 'ul';
      html.push(`<${tag}${ordered && list[2] !== '1' ? ` start="${Number(list[2])}"` : ''}>${items.join('')}</${tag}>`); continue;
    }
    const paragraph = [line]; i++;
    while (i < lines.length && !blockStart(lines[i]) && !tableAt(i)) paragraph.push(lines[i++]);
    html.push(`<p>${renderInline(paragraph.map((part, index) => part.trim() + (index < paragraph.length - 1 ? / {2,}$/.test(part) ? '\n' : ' ' : '')).join(''), basePath)}</p>`);
  }
  const plainText = headingText(String(source)).replace(/```[^\n]*\n([\s\S]*?)```/g, '$1').replace(/^[#>\s*-]+/gm, '').replace(/\s+/g, ' ').trim();
  return { html: html.join('\n'), toc, plainText };
}
