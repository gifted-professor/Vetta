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
    console.log('Loaded APIFY_API_TOKEN:', env.APIFY_API_TOKEN ? 'Present (Starts with ' + env.APIFY_API_TOKEN.substring(0, 5) + ')' : 'Missing');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/apify': {
            target: 'https://api.apify.com/v2',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/apify/, ''),
            timeout: 120000, // Increase timeout to 120s for long-running Apify tasks
            proxyTimeout: 120000
          },
          '/api/gemini': {
            target: 'https://generativelanguage.googleapis.com',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/gemini/, '')
          }
        }
      },
      plugins: [react(), imageProxyPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.VETTA_GEMINI_KEY || env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.VETTA_GEMINI_KEY || env.GEMINI_API_KEY),
        'process.env.APIFY_API_TOKEN': JSON.stringify(env.APIFY_API_TOKEN || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
