import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { build } from './build.mjs';

const contentTypes = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.xml': 'application/xml; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.woff2': 'font/woff2' };

export function createPreviewServer({ output, config }) {
  const root = path.resolve(output), base = config.basePath;
  return http.createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405, { Allow: 'GET, HEAD' }); response.end(); return; }
    try {
      const raw = (request.url || '/').split('?')[0];
      const pathname = decodeURIComponent(raw);
      if (pathname.includes('\0') || pathname.includes('\\') || pathname.split('/').includes('..')) { response.writeHead(400); response.end('Bad request'); return; }
      if (base && pathname === '/') { response.writeHead(302, { Location: `${base}/` }); response.end(); return; }
      if (base && pathname === base) { response.writeHead(301, { Location: `${base}/` }); response.end(); return; }
      if (base && !pathname.startsWith(`${base}/`)) return await notFound();
      const relative = base ? pathname.slice(base.length) : pathname;
      let target = path.resolve(root, `.${relative}`);
      if (path.relative(root, target).startsWith('..') || path.isAbsolute(path.relative(root, target))) { response.writeHead(400); response.end('Bad request'); return; }
      try {
        const stat = await fs.stat(target);
        if (stat.isDirectory()) {
          if (!pathname.endsWith('/')) { response.writeHead(301, { Location: `${pathname}/${(request.url || '').includes('?') ? `?${request.url.split('?').slice(1).join('?')}` : ''}` }); response.end(); return; }
          target = path.join(target, 'index.html');
        }
        const realTarget = await fs.realpath(target);
        if (path.relative(root, realTarget).startsWith('..') || path.isAbsolute(path.relative(root, realTarget))) { response.writeHead(400); response.end('Bad request'); return; }
        const buffer = await fs.readFile(realTarget);
        response.writeHead(200, { 'Content-Type': contentTypes[path.extname(target)] || 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
        response.end(request.method === 'HEAD' ? undefined : buffer);
      } catch (error) { if (['ENOENT', 'ENOTDIR', 'EISDIR'].includes(error.code)) await notFound(); else throw error; }
    } catch (error) { response.writeHead(error instanceof URIError ? 400 : 500); response.end(error instanceof URIError ? 'Bad request' : 'Preview error'); }
    async function notFound() {
      response.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : await fs.readFile(path.join(root, '404.html')));
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const result = await build();
    const port = Number(process.env.PORT || 4321);
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT 必须是 1 到 65535 之间的端口号。');
    const server = createPreviewServer(result);
    server.on('error', (error) => { console.error(`预览失败：${error.message}`); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => console.log(`本地预览：http://127.0.0.1:${port}${result.config.basePath}/\n修改内容后，停止并重新运行以重新生成。`));
  } catch (error) { console.error(`预览失败：${error.message}`); process.exitCode = 1; }
}
