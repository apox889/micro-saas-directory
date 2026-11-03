import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './env.js';
import { createLogoApiMiddleware } from './apiMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PORT = process.env.PORT || 3001;

const apiMiddleware = createLogoApiMiddleware();

const server = http.createServer((req, res) => {
  // Pass to API middleware
  apiMiddleware(req, res, () => {
    // Serve static files from public/
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let filePath = path.join(ROOT_DIR, 'public', parsedUrl.pathname);

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.json': 'application/json'
      };
      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Not found' }));
    }
  });
});

server.listen(PORT, () => {
  console.log(`⚡ Tool Logo Backend Server running on http://localhost:${PORT}`);
  console.log(`📁 Logo Storage: ${path.join(ROOT_DIR, 'public', 'logos')}`);
  console.log(`📡 Endpoints:`);
  console.log(`   POST /api/tools/fetch-logo  { website, slug, name }`);
  console.log(`   POST /api/tools             { name, website, ... }`);
  console.log(`   GET  /api/tools`);
  console.log(`   POST /api/tools/sync-all-logos`);
});
