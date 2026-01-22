/*
 * @Author: gifted-professor 1044396185@qq.com
 * @Date: 2026-01-20 12:38:21
 * @LastEditors: gifted-professor 1044396185@qq.com
 * @LastEditTime: 2026-01-20 12:57:56
 * @FilePath: /Vetta/vite.config.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const readBody = async (req: any): Promise<Buffer | undefined> => {
  const method = (req?.method || 'GET').toUpperCase();
  if (method === 'GET' || method === 'HEAD') return undefined;
  return await new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
    req.on('end', () => resolve(chunks.length ? Buffer.concat(chunks) : Buffer.from('')));
    req.on('error', reject);
  });
};

const setResponseHeaders = (res: any, headers: Headers) => {
  headers.forEach((value, key) => {
    const k = key.toLowerCase();
    if (k === 'transfer-encoding') return;
    if (k === 'content-encoding') return;
    res.setHeader(key, value);
  });
};

const secureUpstreamProxyPlugin = (env: Record<string, string>) => {
  const geminiKey = env.VETTA_GEMINI_KEY || env.GEMINI_API_KEY || '';
  const apifyToken = env.APIFY_API_TOKEN || '';

  return {
    name: 'vetta-secure-upstream-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/gemini', async (req: any, res: any) => {
        if (!geminiKey) {
          res.statusCode = 500;
          res.end('Missing Gemini API key (server env)');
          return;
        }

        try {
          const incoming = new URL(req.url || '/', 'http://localhost');
          incoming.searchParams.delete('key');
          const upstream = new URL(`https://generativelanguage.googleapis.com${incoming.pathname}${incoming.search}`);
          upstream.searchParams.set('key', geminiKey);

          const body = await readBody(req);
          const upstreamRes = await fetch(upstream.toString(), {
            method: req.method,
            headers: {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'Accept': req.headers['accept'] || '*/*',
            },
            body: body as any,
          });

          res.statusCode = upstreamRes.status;
          setResponseHeaders(res, upstreamRes.headers);
          const buf = Buffer.from(await upstreamRes.arrayBuffer());
          res.end(buf);
        } catch (e: any) {
          res.statusCode = 502;
          res.end(e?.message || 'Gemini proxy error');
        }
      });

      server.middlewares.use('/api/apify', async (req: any, res: any) => {
        if (!apifyToken) {
          res.statusCode = 500;
          res.end('Missing Apify token (server env)');
          return;
        }

        try {
          const incoming = new URL(req.url || '/', 'http://localhost');
          incoming.searchParams.delete('token');
          const upstream = new URL(`https://api.apify.com/v2${incoming.pathname}${incoming.search}`);

          const body = await readBody(req);
          const upstreamRes = await fetch(upstream.toString(), {
            method: req.method,
            headers: {
              Authorization: `Bearer ${apifyToken}`,
              'Content-Type': req.headers['content-type'] || 'application/json',
              'Accept': req.headers['accept'] || '*/*',
            },
            body: body as any,
          });

          res.statusCode = upstreamRes.status;
          setResponseHeaders(res, upstreamRes.headers);
          const buf = Buffer.from(await upstreamRes.arrayBuffer());
          res.end(buf);
        } catch (e: any) {
          res.statusCode = 502;
          res.end(e?.message || 'Apify proxy error');
        }
      });
    },
  };
};

const imageProxyPlugin = () => {
  return {
    name: 'vetta-image-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/image', async (req: any, res: any) => {
        try {
          const requestUrl = new URL(req.url || '', 'http://localhost');
          const target = requestUrl.searchParams.get('url');
          if (!target) {
            res.statusCode = 400;
            res.end('Missing url');
            return;
          }

          const parsed = new URL(target);
          if (parsed.protocol !== 'https:' || !(parsed.hostname.endsWith('cdninstagram.com') || parsed.hostname.endsWith('fbcdn.net'))) {
            res.statusCode = 400;
            res.end('Blocked host');
            return;
          }

          const upstream = await fetch(parsed.toString(), { 
            redirect: 'follow',
            headers: {
              'User-Agent': 'Mozilla/5.0',
              'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
              'Referer': 'https://www.instagram.com/'
            }
          });
          if (!upstream.ok) {
            console.log(`Direct proxy failed (${upstream.status}). Trying fallback for: ${target}`);
            const fallbackUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(parsed.toString())}`;
            const fallback = await fetch(fallbackUrl, { redirect: 'follow' });
            if (!fallback.ok) {
              res.statusCode = upstream.status;
              res.end(`Upstream error: ${upstream.status}`);
              return;
            }
            const fallbackType = fallback.headers.get('content-type');
            if (fallbackType) res.setHeader('content-type', fallbackType);
            res.setHeader('cache-control', 'public, max-age=300');
            res.statusCode = 200;
            const fallbackBuffer = await fallback.arrayBuffer();
            res.end(Buffer.from(fallbackBuffer));
            return;
          }

          const contentType = upstream.headers.get('content-type');
          if (contentType) res.setHeader('content-type', contentType);
          res.setHeader('cache-control', 'public, max-age=300');
          res.statusCode = 200;

          const arrayBuffer = await upstream.arrayBuffer();
          res.end(Buffer.from(arrayBuffer));
        } catch (e) {
          res.statusCode = 500;
          res.end('Proxy error');
        }
      });
    },
  };
};

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    console.log('Loaded APIFY_API_TOKEN:', env.APIFY_API_TOKEN ? 'Present' : 'Missing');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), secureUpstreamProxyPlugin(env), imageProxyPlugin()],
      define: {
        'process.env.VETTA_HAS_GEMINI_KEY': JSON.stringify(Boolean(env.VETTA_GEMINI_KEY || env.GEMINI_API_KEY)),
        'process.env.VETTA_HAS_APIFY_TOKEN': JSON.stringify(Boolean(env.APIFY_API_TOKEN))
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
