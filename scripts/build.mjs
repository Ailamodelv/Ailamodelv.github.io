import fs from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { escapeHtml, normalizeBasePath, parseFrontmatter, renderMarkdown, withBasePath } from './markdown.mjs';

export const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export function normalizeConfig(raw, env = process.env) {
  const basePath = normalizeBasePath(env.BASE_PATH ?? raw.basePath ?? '');
  const inputUrl = env.SITE_URL ?? raw.url ?? '';
  let url = '';
  if (inputUrl) {
    const parsed = new URL(inputUrl);
    if (!['https:', 'http:'].includes(parsed.protocol)) throw new Error('SITE_URL 仅支持 http 或 https。');
    if (parsed.username || parsed.password) throw new Error('SITE_URL 不应包含身份信息。');
    url = parsed.origin;
  }
  const categories = raw.categories ?? [];
  if (!Array.isArray(categories) || categories.some(item => !item || !/^[a-z0-9][a-z0-9-]*$/.test(item.slug) || typeof item.title !== 'string' || !item.title.trim())) throw new Error('栏目需要有效的英文 slug 和中文 title。');
  if (new Set(categories.map(item => item.slug)).size !== categories.length || new Set(categories.map(item => item.title)).size !== categories.length) throw new Error('栏目 slug 和 title 不能重复。');
  return { ...raw, categories, basePath, url, repoUrl: raw.repoUrl ?? '', language: raw.language ?? 'zh-CN' };
}

export async function readPosts(root, config) {
  const postsDir = path.join(root, 'content', 'posts');
  const files = (await fs.readdir(postsDir)).filter((name) => name.endsWith('.md')).sort();
  const posts = [];
  for (const file of files) {
    const { attributes, body } = parseFrontmatter(await fs.readFile(path.join(postsDir, file), 'utf8'));
    if (attributes.draft === true) continue;
    const slug = file.slice(0, -3);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) throw new Error(`文章文件名应使用小写英文字母、数字和连字符：${file}`);
    if (!attributes.title || !/^\d{4}-\d{2}-\d{2}$/.test(attributes.date ?? '') || Number.isNaN(Date.parse(attributes.date)) || new Date(attributes.date).toISOString().slice(0, 10) !== attributes.date) {
      throw new Error(`${file} 需要 title 和有效的 YYYY-MM-DD 日期。`);
    }
    const rendered = renderMarkdown(body, config);
    if (config.categories?.length && !config.categories.some(item => item.title === attributes.category)) throw new Error(`${file} 的 category 必须使用 site.config.json 中的栏目名称。`);
    posts.push({
      slug, title: attributes.title, date: attributes.date, category: attributes.category || '学习笔记',
      tags: attributes.tags, summary: attributes.summary || `${rendered.plainText.slice(0, 100)}…`,
      readingTime: Math.max(1, Number(attributes.readingTime) || Math.ceil(rendered.plainText.length / 400)),
      featured: attributes.featured === true, sample: attributes.sample === true,
      ...rendered, url: withBasePath(`/posts/${slug}/`, config.basePath),
    });
  }
  return posts.sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}

function absoluteUrl(config, route) {
  return `${config.url || 'http://localhost:4321'}${withBasePath(route, config.basePath)}`;
}

export function makeRss(config, posts) {
  const items = posts.map((post) => `<item><title>${escapeHtml(post.title)}</title><link>${escapeHtml(absoluteUrl(config, `/posts/${post.slug}/`))}</link><guid isPermaLink="true">${escapeHtml(absoluteUrl(config, `/posts/${post.slug}/`))}</guid><pubDate>${new Date(`${post.date}T00:00:00Z`).toUTCString()}</pubDate><description>${escapeHtml(post.summary)}</description>${post.tags.map((tag) => `<category>${escapeHtml(tag)}</category>`).join('')}</item>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>${escapeHtml(config.title)}</title><link>${escapeHtml(absoluteUrl(config, '/'))}</link><description>${escapeHtml(config.description)}</description><language>${escapeHtml(config.language || 'zh-CN')}</language><atom:link href="${escapeHtml(absoluteUrl(config, '/rss.xml'))}" rel="self" type="application/rss+xml"/>\n${items}\n</channel></rss>\n`;
}

export function makeSitemap(config, posts) {
  const pages = ['/', '/posts/', '/roadmap/', '/about/'].map((route) => `<url><loc>${escapeHtml(absoluteUrl(config, route))}</loc></url>`);
  pages.push(...(config.categories || []).map(category => `<url><loc>${escapeHtml(absoluteUrl(config, `/categories/${category.slug}/`))}</loc></url>`));
  pages.push(...posts.map((post) => `<url><loc>${escapeHtml(absoluteUrl(config, `/posts/${post.slug}/`))}</loc><lastmod>${post.date}</lastmod></url>`));
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.join('\n')}\n</urlset>\n`;
}

async function copyAssets(source, destination) {
  for (const entry of await fs.readdir(source, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error(`assets 中不允许符号链接：${entry.name}`);
    const from = path.join(source, entry.name), to = path.join(destination, entry.name);
    if (entry.isDirectory()) { await fs.mkdir(to, { recursive: true }); await copyAssets(from, to); }
    else if (entry.isFile()) await fs.copyFile(from, to);
  }
}

async function resetOutput(root) {
  const realRoot = await fs.realpath(root);
  const output = path.resolve(realRoot, 'dist');
  if (path.relative(realRoot, output) !== 'dist' || path.dirname(output) !== realRoot) throw new Error('输出目录必须是当前项目内的 dist。');
  try {
    const stat = await fs.lstat(output);
    if (stat.isSymbolicLink() || !stat.isDirectory()) throw new Error('dist 必须是项目内的普通目录。');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await fs.rm(output, { force: true, recursive: true });
  await fs.mkdir(output, { recursive: true });
  return output;
}

export async function build({ root = projectRoot, env = process.env, renderer } = {}) {
  root = await fs.realpath(root);
  const config = normalizeConfig(JSON.parse(await fs.readFile(path.join(root, 'site.config.json'), 'utf8')), env);
  const clientAssets = await Promise.all(['style.css', 'main.js', 'favicon.svg'].map(async name => {
    try { return await fs.readFile(path.join(root, 'assets', name)); }
    catch (error) { if (error.code === 'ENOENT') return Buffer.alloc(0); throw error; }
  }));
  config.assetVersion = createHash('sha256').update(Buffer.concat(clientAssets)).digest('hex').slice(0, 12);
  const posts = await readPosts(root, config);
  const roadmap = JSON.parse(await fs.readFile(path.join(root, 'content', 'roadmap.json'), 'utf8'));
  const renderPage = renderer ?? (await import(pathToFileURL(path.join(root, 'src', 'templates.mjs')).href)).renderPage;
  if (typeof renderPage !== 'function') throw new Error('src/templates.mjs 必须导出 renderPage(context)。');
  const output = await resetOutput(root);
  const write = async (file, value) => { const target = path.join(output, file); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, value, 'utf8'); };
  const context = { config, posts, roadmap };
  for (const [page, file] of [['home', 'index.html'], ['posts', 'posts/index.html'], ['roadmap', 'roadmap/index.html'], ['about', 'about/index.html'], ['404', '404.html']]) {
    await write(file, renderPage({ ...context, page }));
  }
  for (const post of posts) await write(`posts/${post.slug}/index.html`, renderPage({ ...context, page: 'post', post, body: post.html, toc: post.toc }));
  for (const category of config.categories) await write(`categories/${category.slug}/index.html`, renderPage({ ...context, page: 'category', category }));
  await fs.mkdir(path.join(output, 'assets'), { recursive: true });
  await copyAssets(path.join(root, 'assets'), path.join(output, 'assets'));
  await write('rss.xml', makeRss(config, posts));
  await write('sitemap.xml', makeSitemap(config, posts));
  await write('robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absoluteUrl(config, '/sitemap.xml')}\n`);
  await write('.nojekyll', '');
  return { output, config, posts, roadmap };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { const result = await build(); console.log(`已生成 ${result.posts.length} 篇文章 → ${result.output}`); }
  catch (error) { console.error(`构建失败：${error.message}`); process.exitCode = 1; }
}
