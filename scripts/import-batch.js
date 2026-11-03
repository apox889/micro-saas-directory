import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import '../server/env.js';
import { ingestBatchOfTools } from '../server/batchImporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

async function runCliBatchImport() {
  const args = process.argv.slice(2);
  const inputFilePath = args[0] 
    ? path.resolve(process.cwd(), args[0]) 
    : path.join(__dirname, 'sample-10-tools.json');

  console.log(`\n======================================================`);
  console.log(`🚀 LOCAL BATCH INGESTION & SELF-HOSTED LOGO PIPELINE`);
  console.log(`======================================================`);
  console.log(`📂 Source File: ${inputFilePath}`);

  if (!fs.existsSync(inputFilePath)) {
    console.error(`❌ Error: Batch file not found at: ${inputFilePath}`);
    process.exit(1);
  }

  let rawBatch = [];
  try {
    const content = fs.readFileSync(inputFilePath, 'utf8');
    rawBatch = JSON.parse(content);
  } catch (parseErr) {
    console.error(`❌ Error parsing JSON file: ${parseErr.message}`);
    process.exit(1);
  }

  const list = Array.isArray(rawBatch) ? rawBatch : (rawBatch.tools || rawBatch.batch || []);
  console.log(`📦 Loaded ${list.length} tool records to ingest.\n`);

  try {
    const result = await ingestBatchOfTools(list);

    console.log(`\n======================================================`);
    console.log(`✅ BATCH INGESTION COMPLETE`);
    console.log(`======================================================`);
    console.log(`📊 Total Processed: ${result.totalReceived}`);
    console.log(`🎉 Successfully Staged to Drafts: ${result.importedCount}`);
    console.log(`⚠️  Failed: ${result.failedCount}`);
    console.log(`------------------------------------------------------`);
    console.log(`Tool Name            Category       Logo Path               Affiliate URL`);
    console.log(`------------------------------------------------------`);

    result.drafts.forEach(draft => {
      const nameCol = (draft.name || '').padEnd(20).slice(0, 20);
      const catCol = (draft.category || '').padEnd(14).slice(0, 14);
      const logoCol = (draft.localLogoPath || '').padEnd(23).slice(0, 23);
      const affCol = (draft.affiliateUrl || '').slice(0, 35);
      console.log(`${nameCol} ${catCol} ${logoCol} ${affCol}`);
    });

    console.log(`======================================================\n`);
  } catch (err) {
    console.error(`❌ Batch Ingestion failed:`, err);
    process.exit(1);
  }
}

runCliBatchImport();
