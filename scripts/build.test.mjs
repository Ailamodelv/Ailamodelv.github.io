import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { build, normalizeConfig, makeRss, makeSitemap, projectRoot } from './build.mjs';
import { escapeHtml, normalizeBasePath, parseFrontmatter, renderMarkdown, safeLink, safeImage } from './markdown.mjs';
import { createPreviewServer } from './serve.mjs';
import { renderPage as actualRenderer } from '../src/templates.mjs';

test('Markdown escapes raw HTML and rejects executable links', () => {
  const { html } = renderMarkdown('<img src=x onerror=alert(1)>\n\n[unsafe](javascript:alert) [data](data:text/html,hi) [safe](https://example.com/"x)\n\n`<script>` **bold**\n\n```js\n</code><script>alert(1)</script>\n```');
  assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
  assert.ok(!html.includes('<script>'));
  assert.ok(!html.includes('href="javascript:'));
  assert.ok(!html.includes('href="data:'));
  assert.ok(html.includes('href="https://example.com/&quot;x"'));
  assert.ok(html.includes('<strong>bold</strong>'));
  assert.equal(safeLink('java\nscript:alert'), null);
  assert.equal(safeLink('//example.com'), null);
  assert.equal(safeLink('file:///etc/passwd'), null);
});

test('Markdown produces stable heading IDs, lists, quotes, and site links', () => {
  const source = '## 坐标与 **变换**\n\n## 坐标与 **变换**\n\n- 一个\n- 两个\n\n3. 三\n4. 四\n\n> 引用\n\n[归档](/posts/)';
  const first = renderMarkdown(source, { basePath: '/notes' });
  assert.deepEqual(first.toc, renderMarkdown(source).toc);
  assert.deepEqual(first.toc.map((item) => item.id), ['坐标与-变换', '坐标与-变换-2']);
  assert.ok(first.html.includes('<ul><li>一个</li><li>两个</li></ul>'));
  assert.ok(first.html.includes('<ol start="3">'));
  assert.ok(first.html.includes('<blockquote><p>引用</p></blockquote>'));
  assert.ok(first.html.includes('href="/notes/posts/"'));
  assert.deepEqual(renderMarkdown('## A\n\n## A-2\n\n## A').toc.map((item) => item.id), ['a', 'a-2', 'a-3']);
});

test('frontmatter parses explicit booleans and comma separated tags', () => {
  const result = parseFrontmatter('\uFEFF---\r\ntitle: "学习记录"\r\ntags: 控制, 仿真，数学\r\ndraft: true\r\nsample: false\r\n---\r\n\r\n## 正文');
  assert.deepEqual(result.attributes.tags, ['控制', '仿真', '数学']);
  assert.equal(result.attributes.draft, true);
  assert.equal(result.attributes.sample, false);
  assert.equal(result.attributes.title, '学习记录');
  assert.ok(result.body.includes('## 正文'));
  assert.throws(() => parseFrontmatter('---\ntitle: 缺失结束标记'), /结束标记/);
});

test('Markdown images allow local assets and HTTPS with escaped attributes', () => {
  const { html } = renderMarkdown('![关节 "位置" <图>](/assets/experiment.png "实验截图")\n\n![图](https://example.com/robot.png)\n\n![危险](javascript:alert) ![内联](data:image/svg+xml,bad) ![明文](http://example.com/x.png)', { basePath: '/notes' });
  assert.ok(html.includes('src="/notes/assets/experiment.png"'));
  assert.ok(html.includes('alt="关节 &quot;位置&quot; &lt;图&gt;"'));
  assert.ok(html.includes('title="实验截图"'));
  assert.ok(html.includes('src="https://example.com/robot.png"'));
  assert.equal((html.match(/<img /g) || []).length, 2);
  assert.equal(safeImage('/assets/../secret.png', '/notes'), null);
  assert.equal(safeImage('/assets/%2e%2e/secret.png', '/notes'), null);
  assert.equal(safeImage('//example.com/x.png'), null);
  assert.equal(safeImage('/posts/x.png'), null);
  assert.equal(safeImage('assets/x.png', '/notes'), '/notes/assets/x.png');
  assert.equal(safeImage('/notes/assets/x.png', '/notes'), '/notes/assets/x.png');
});

test('Markdown pipe tables preserve inline code, escaped pipes, alignment and HTML safety', () => {
  const { html } = renderMarkdown('参数说明\n| 参数 | 取值 |\n| :--- | ---: |\n| **Kp** | `<script>` |\n| A\\|B | `x|y` |\n\n结束');
  assert.ok(html.includes('<p>参数说明</p>'));
  assert.ok(html.includes('<th scope="col" class="table-align-left">参数</th>'));
  assert.ok(html.includes('<th scope="col" class="table-align-right">取值</th>'));
  assert.ok(html.includes('<strong>Kp</strong>'));
  assert.ok(html.includes('<code>&lt;script&gt;</code>'));
  assert.ok(html.includes('>A|B</td>'));
  assert.ok(html.includes('<code>x|y</code>'));
  assert.ok(html.includes('<p>结束</p>'));
  assert.ok(!renderMarkdown('| A | B |\n| unsafe | --- |').html.includes('<table>'));
});

test('configuration uses Pages origin and normalizes root and project paths', () => {
  assert.equal(normalizeBasePath('/'), '');
  assert.equal(normalizeBasePath('notes/'), '/notes');
  assert.throws(() => normalizeBasePath('../escape'));
  const config = normalizeConfig({ url: '', basePath: '/old' }, { BASE_PATH: '/robot-notes/', SITE_URL: 'https://learner.github.io/robot-notes/' });
  assert.equal(config.basePath, '/robot-notes');
  assert.equal(config.url, 'https://learner.github.io');
});

async function fixture(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'embodied-notes-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.mkdir(path.join(root, 'content', 'posts'), { recursive: true });
  await fs.mkdir(path.join(root, 'assets'));
  await fs.writeFile(path.join(root, 'site.config.json'), JSON.stringify({ title: 'A & B', description: '学习 <记录>', url: 'https://learner.github.io', basePath: '' }));
  await fs.writeFile(path.join(root, 'content', 'roadmap.json'), JSON.stringify({ phases: [] }));
  await fs.writeFile(path.join(root, 'assets', 'style.css'), 'body{}');
  await fs.writeFile(path.join(root, 'content', 'posts', 'published.md'), '---\ntitle: 公开笔记\ndate: 2026-10-16\ntags: 坐标, 仿真\nsummary: A & B < C\nsample: true\n---\n\n## 起步\n\n[归档](/posts/)');
  await fs.writeFile(path.join(root, 'content', 'posts', 'draft.md'), '---\ntitle: 草稿\ndate: 2026-10-16\ndraft: true\n---\n\n尚未公开');
  return root;
}

const fixtureRenderer = ({ page, config, posts, post }) => `<!doctype html><html><head><link rel="stylesheet" href="${config.basePath}/assets/style.css"></head><body><h1>${page}</h1><a href="${config.basePath}/posts/">全部笔记</a>${post?.html || posts.map((item) => `<a href="${item.url}">${escapeHtml(item.title)}</a>`).join('')}</body></html>`;

for (const basePath of ['', '/robot-notes']) {
  test(`build generates all pages, RSS, and sitemap with basePath ${basePath || '/'}`, async (t) => {
    const root = await fixture(t);
    const result = await build({ root, env: { BASE_PATH: basePath }, renderer: fixtureRenderer });
    assert.equal(result.posts.length, 1);
    assert.equal(result.posts[0].sample, true);
    assert.deepEqual(result.posts[0].tags, ['坐标', '仿真']);
    for (const file of ['index.html', 'posts/index.html', 'roadmap/index.html', 'about/index.html', 'posts/published/index.html', '404.html', 'assets/style.css', '.nojekyll', 'robots.txt']) await fs.access(path.join(result.output, file));
    await assert.rejects(fs.access(path.join(result.output, 'posts/draft/index.html')));
    const home = await fs.readFile(path.join(result.output, 'index.html'), 'utf8');
    assert.ok(home.includes(`href="${basePath}/assets/style.css"`));
    assert.ok(home.includes(`href="${basePath}/posts/published/"`));
    const post = await fs.readFile(path.join(result.output, 'posts/published/index.html'), 'utf8');
    assert.ok(post.includes(`href="${basePath}/posts/"`));
    const rss = await fs.readFile(path.join(result.output, 'rss.xml'), 'utf8');
    const sitemap = await fs.readFile(path.join(result.output, 'sitemap.xml'), 'utf8');
    assert.ok(rss.includes(`https://learner.github.io${basePath}/posts/published/`));
    assert.ok(rss.includes('A &amp; B &lt; C'));
    assert.ok(sitemap.includes(`https://learner.github.io${basePath}/roadmap/`));
    assert.ok(!rss.includes('draft'));
    assert.ok(!sitemap.includes('draft'));
  });
}

test('preview serves custom 404, respects basePath, and rejects path traversal', async (t) => {
  const root = await fixture(t);
  const result = await build({ root, env: { BASE_PATH: '/notes' }, renderer: fixtureRenderer });
  const server = createPreviewServer(result);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const address = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${address}/notes/`)).status, 200);
  assert.equal((await fetch(`${address}/notes/assets/style.css`)).headers.get('content-type'), 'text/css; charset=utf-8');
  const missing = await fetch(`${address}/notes/missing/`);
  assert.equal(missing.status, 404);
  assert.ok((await missing.text()).includes('<h1>404</h1>'));
  assert.equal((await fetch(`${address}/other/`)).status, 404);
  assert.equal((await fetch(`${address}/notes/%2e%2e%2fsite.config.json`)).status, 400);
  assert.equal((await fetch(`${address}/notes/%ZZ`)).status, 400);
  assert.equal((await fetch(`${address}/notes/`, { method: 'POST' })).status, 405);
});

test('RSS and sitemap escape XML special characters', () => {
  const config = { title: 'A & B', description: '<notes>', url: 'https://example.com', basePath: '', language: 'zh-CN' };
  assert.ok(makeRss(config, []).includes('<title>A &amp; B</title>'));
  assert.ok(makeRss(config, []).includes('&lt;notes&gt;'));
  assert.ok(makeSitemap(config, []).includes('https://example.com/'));
});

test('real templates resolve assets, article URLs, RSS, canonical links, and table of contents at root and project paths', async (t) => {
  const root = await fixture(t);
  await fs.cp(path.join(projectRoot, 'assets'), path.join(root, 'assets'), { recursive: true });
  await fs.appendFile(path.join(root, 'content', 'posts', 'published.md'), '\n\n![机器人示意图](/assets/robot.svg)\n\n| 参数 | 取值 |\n| --- | --- |\n| Kp | 20 |');
  for (const basePath of ['', '/robot-notes']) {
    const result = await build({ root, env: { BASE_PATH: basePath, SITE_URL: 'https://learner.github.io' }, renderer: actualRenderer });
    const pageFiles = ['index.html', 'posts/index.html', 'roadmap/index.html', 'about/index.html', 'posts/published/index.html', '404.html'];
    for (const file of pageFiles) {
      const html = await fs.readFile(path.join(result.output, file), 'utf8');
      assert.ok(html.includes(`href="${basePath}/assets/favicon.svg"`), `${file}: favicon path`);
      assert.ok(html.includes(`href="${basePath}/rss.xml"`), `${file}: RSS path`);
      const route = file === 'index.html' ? '/' : file === '404.html' ? '/404.html' : `/${file.replace(/index\.html$/, '')}`;
      assert.ok(html.includes(`rel="canonical" href="https://learner.github.io${basePath}${route}"`), `${file}: canonical URL`);
      for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
        const url = match[1].replaceAll('&amp;', '&');
        if (/^https?:\/\//.test(url) || url.startsWith('mailto:')) continue;
        const [pathname, anchor] = url.split('#');
        if (!pathname) {
          assert.ok(html.includes(`id="${anchor}"`), `${file}: missing anchor ${anchor}`);
          continue;
        }
        assert.ok(pathname.startsWith(`${basePath}/`), `${file}: incorrect prefix ${url}`);
        const internalPath = pathname.slice(basePath.length + 1);
        const target = path.join(result.output, internalPath.endsWith('/') || !internalPath ? `${internalPath}index.html` : internalPath);
        await assert.doesNotReject(fs.access(target), `${file}: missing ${url}`);
      }
    }
    const article = await fs.readFile(path.join(result.output, 'posts/published/index.html'), 'utf8');
    assert.ok(article.includes('href="#起步"'));
    assert.ok(article.includes('id="起步"'));
    assert.ok(article.includes(`src="${basePath}/assets/robot.svg" alt="机器人示意图"`));
    assert.ok(article.includes('<table>'));
  }
});
