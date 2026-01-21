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

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
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
        },
        configureServer(server) {
          server.middlewares.use('/api/image', async (req, res) => {
            try {
              const requestUrl = new URL(req.url || '', 'http://localhost');
              const target = requestUrl.searchParams.get('url');
              if (!target) {
                res.statusCode = 400;
                res.end('Missing url');
                return;
              }

              const parsed = new URL(target);
              if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('cdninstagram.com')) {
                res.statusCode = 400;
                res.end('Blocked host');
                return;
              }

              const upstream = await fetch(parsed.toString(), { redirect: 'follow' });
              if (!upstream.ok) {
                res.statusCode = upstream.status;
                res.end(`Upstream error: ${upstream.status}`);
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
      },
      plugins: [react()],
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
