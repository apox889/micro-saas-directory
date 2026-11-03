import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAndSaveLogo, saveToolsDb, extractDomain } from './logoService.js';
import { TOOLS_DATA } from '../src/data/toolsData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  console.log('🚀 Starting Automated Logo Fetcher & Permanent Local Storage Utility...');
  console.log(`Found ${TOOLS_DATA.length} curated anti-bloat tools to process.\n`);

  const updatedTools = [];
  let successCount = 0;

  for (const tool of TOOLS_DATA) {
    const domain = tool.domain || extractDomain(tool.website || tool.affiliateUrl);
    console.log(`📥 [${tool.name}] Fetching official logo for domain: "${domain}"...`);

    try {
      const meta = await fetchAndSaveLogo({
        website: tool.website || tool.affiliateUrl,
        slug: tool.slug || tool.id,
        name: tool.name,
        domain
      });

      console.log(`✅ [${tool.name}] Saved locally to -> ${meta.localLogoPath} (${meta.sizeBytes} bytes, source: ${meta.source})\n`);
      
      updatedTools.push({
        ...tool,
        localLogoPath: meta.localLogoPath,
        logoDownloadedAt: meta.savedAt,
        logoSizeBytes: meta.sizeBytes,
        logoSource: meta.source
      });
      successCount++;
    } catch (err) {
      console.error(`❌ [${tool.name}] Failed to download logo: ${err.message}\n`);
      updatedTools.push({
        ...tool,
        localLogoPath: null
      });
    }
  }

  // Save to JSON Database
  saveToolsDb(updatedTools);
  console.log(`\n🎉 Completed! ${successCount}/${TOOLS_DATA.length} tool logos downloaded and stored in permanent local storage.`);
  console.log(`📁 Local storage directory: public/logos/`);
  console.log(`💾 Database file: server/data/tools.json`);
}

run().catch(console.error);
