import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const domainArg = process.argv[2];

if (!domainArg) {
  console.log(`
Usage:
  node scripts/set-custom-domain.js <your-domain.com>

Example:
  node scripts/set-custom-domain.js curateless.tools
`);
  process.exit(1);
}

const cleanDomain = domainArg.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
const cnamePath = path.join(ROOT_DIR, 'public', 'CNAME');

fs.writeFileSync(cnamePath, cleanDomain + '\n', 'utf8');
console.log(`✅ [Custom Domain] Created ${cnamePath} with domain: ${cleanDomain}`);
console.log(`ℹ️ When you run "npm run build", this CNAME file will be copied directly into dist/CNAME.`);
