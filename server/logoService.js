import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import './env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root directories
const ROOT_DIR = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(ROOT_DIR, 'public', 'logos');
const DATA_DIR = path.join(ROOT_DIR, 'server', 'data');
const DB_FILE = path.join(DATA_DIR, 'tools.json');

// Ensure directories exist
if (!fs.existsSync(LOGOS_DIR)) {
  fs.mkdirSync(LOGOS_DIR, { recursive: true });
}
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Extracts clean domain name from a URL or raw string
 * e.g. "https://linear.app/?ref=123" -> "linear.app"
 */
export function extractDomain(urlOrDomain) {
  if (!urlOrDomain) return '';
  try {
    const raw = String(urlOrDomain).trim();
    const url = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return String(urlOrDomain)
      .replace(/^https?:\/\//, '')
      .split('/')[0]
      .split('?')[0]
      .replace(/^www\./, '')
      .toLowerCase();
  }
}

/**
 * Downloads binary image buffer from URL with timeout
 */
async function downloadBuffer(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    clearTimeout(id);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 100) {
      throw new Error(`Downloaded buffer too small (${buffer.length} bytes)`);
    }

    return { buffer, contentType };
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Core utility: Fetches official logo/favicon for a tool from public services
 * and stores it permanently in server storage (public/logos/{slug}.png).
 */
export async function fetchAndSaveLogo({ website, slug, name, domain: forcedDomain }) {
  const domain = forcedDomain || extractDomain(website);
  if (!domain) {
    throw new Error('Valid website domain is required to fetch official logo.');
  }

  const safeSlug = (slug || domain.replace(/[^a-z0-9_-]/gi, '-')).toLowerCase();
  const filename = `${safeSlug}.png`;
  const targetFilePath = path.join(LOGOS_DIR, filename);

  const sources = [
    { name: 'a.favicon.im', url: `https://a.favicon.im/${domain}?larger=true` },
    { name: 'Google S2', url: `https://www.google.com/s2/favicons?domain=${domain}&sz=128` },
    { name: 'Clearbit', url: `https://logo.clearbit.com/${domain}` },
    { name: 'Direct Favicon', url: `https://${domain}/favicon.ico` }
  ];

  let downloadedBuffer = null;
  let successfulSource = null;
  const errors = [];

  // Fetch from direct web sources
  for (const src of sources) {
    try {
      console.log(`[LogoService] Attempting to fetch logo for ${domain} from ${src.name}...`);
      const { buffer } = await downloadBuffer(src.url);
      downloadedBuffer = buffer;
      successfulSource = src.name;
      console.log(`[LogoService] Successfully fetched ${buffer.length} bytes from ${src.name} for ${domain}`);
      break;
    } catch (err) {
      errors.push(`${src.name}: ${err.message}`);
    }
  }

  if (!downloadedBuffer) {
    throw new Error(`Failed to download logo for ${domain}. Attempts: ${errors.join('; ')}`);
  }

  // Write file to permanent server storage
  fs.writeFileSync(targetFilePath, downloadedBuffer);

  const localLogoPath = `/logos/${filename}`;
  const metadata = {
    success: true,
    domain,
    slug: safeSlug,
    filename,
    localLogoPath,
    fullDiskPath: targetFilePath,
    sizeBytes: downloadedBuffer.length,
    source: successfulSource,
    savedAt: new Date().toISOString()
  };

  // Update or persist to database
  updateToolLogoInDb(safeSlug, metadata);

  return metadata;
}

/**
 * Loads tools from the JSON database, initializing from toolsData.js if empty
 */
export function getToolsDb() {
  if (fs.existsSync(DB_FILE)) {
    try {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(content);
    } catch (e) {
      console.error('[LogoService] Error reading database:', e);
    }
  }
  return [];
}

/**
 * Saves all tools to the persistent database file
 */
export function saveToolsDb(tools) {
  fs.writeFileSync(DB_FILE, JSON.stringify(tools, null, 2), 'utf-8');
}

/**
 * Updates a specific tool's logo record in the database
 */
export function updateToolLogoInDb(slug, logoMetadata) {
  const tools = getToolsDb();
  let updated = false;

  for (let i = 0; i < tools.length; i++) {
    if (tools[i].slug === slug || tools[i].id === slug) {
      tools[i].localLogoPath = logoMetadata.localLogoPath;
      tools[i].logoDownloadedAt = logoMetadata.savedAt;
      tools[i].logoSizeBytes = logoMetadata.sizeBytes;
      tools[i].logoSource = logoMetadata.source;
      updated = true;
      break;
    }
  }

  if (updated) {
    saveToolsDb(tools);
  }
}

/**
 * Batch sync utility: Iterates over all tools, downloads their official logos,
 * and updates their records in the database.
 */
export async function syncAllLogos(toolsList) {
  const currentTools = toolsList || getToolsDb();
  const results = [];

  for (const tool of currentTools) {
    try {
      const meta = await fetchAndSaveLogo({
        website: tool.website || tool.affiliateUrl,
        slug: tool.slug || tool.id,
        name: tool.name,
        domain: tool.domain
      });
      tool.localLogoPath = meta.localLogoPath;
      tool.logoDownloadedAt = meta.savedAt;
      results.push({ name: tool.name, status: 'success', path: meta.localLogoPath, size: meta.sizeBytes });
    } catch (err) {
      console.error(`[LogoService] Sync failed for ${tool.name}:`, err.message);
      results.push({ name: tool.name, status: 'error', error: err.message });
    }
  }

  saveToolsDb(currentTools);

  return {
    total: currentTools.length,
    successful: results.filter(r => r.status === 'success').length,
    failed: results.filter(r => r.status === 'error').length,
    results
  };
}
