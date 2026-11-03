import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { exportStaticData } from './export-static.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Automates the Publish Live workflow:
 * 1. Synchronizes local database tools into static production assets (src/data/publishedTools.js)
 * 2. Stages all new tool entries, local database, and logo assets (git add .)
 * 3. Commits changes with a clean, descriptive message
 * 4. Pushes directly to the main branch of the connected GitHub repository
 */
export async function publishLiveToGitHub(customMessage = null) {
  console.log('\n======================================================');
  console.log('🚀 PUBLISH LIVE PIPELINE: GITHUB MAIN BRANCH');
  console.log('======================================================');

  // 1. Export static dataset
  const exportResult = exportStaticData();
  const publishedCount = exportResult.count || 0;

  // 2. Stage all changed files
  console.log('[Publish Live] Staging database, logo files, and static assets...');
  execSync('git add .', { cwd: ROOT_DIR, stdio: 'pipe' });

  // 3. Inspect staged changes
  const statusOutput = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  let commitHash = null;
  let commitMessage = null;
  let committed = false;

  if (statusOutput.length > 0) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    commitMessage = customMessage || `chore(publish): live directory update (${publishedCount} tools) - ${timestamp}`;
    console.log(`[Publish Live] Committing changes: "${commitMessage}"...`);
    
    // Safely execute git commit
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: ROOT_DIR, stdio: 'pipe' });
    commitHash = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    committed = true;
    console.log(`[Publish Live] ✅ Created commit: ${commitHash}`);
  } else {
    console.log('[Publish Live] No unstaged changes detected. Checking branch status...');
    commitHash = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  }

  // 4. Push to remote origin main
  console.log('[Publish Live] Pushing changes to origin/main on GitHub...');
  let pushOutput = '';
  try {
    pushOutput = execSync('git push origin main', { 
      cwd: ROOT_DIR, 
      encoding: 'utf8',
      timeout: 45000 
    });
  } catch (pushErr) {
    console.error('[Publish Live] Push error:', pushErr.stderr || pushErr.message);
    throw new Error(`Failed to push to GitHub: ${pushErr.stderr || pushErr.message}`);
  }

  console.log('[Publish Live] 🚀 Successfully pushed to GitHub main branch!');
  console.log('======================================================\n');

  return {
    success: true,
    message: committed 
      ? `Successfully published live! Committed (${commitHash}) and pushed to GitHub main branch.`
      : `Already up to date. Verified latest commit (${commitHash}) on GitHub main branch.`,
    commitHash,
    commitMessage: commitMessage || 'Already up to date',
    publishedCount,
    committed,
    pushed: true,
    pushOutput: pushOutput.trim(),
    timestamp: new Date().toISOString()
  };
}

// Support direct CLI invocation: node scripts/publish-live.js [optional message]
const isCli = process.argv[1] && (
  path.resolve(process.argv[1]) === path.resolve(__filename) ||
  path.resolve(process.argv[1]) === path.resolve(ROOT_DIR, 'scripts', 'publish-live.js')
);

if (isCli) {
  const customMsg = process.argv[2] || null;
  publishLiveToGitHub(customMsg)
    .then((result) => {
      console.log('✅ Result:', result.message);
      process.exit(0);
    })
    .catch((err) => {
      console.error('❌ Error:', err.message);
      process.exit(1);
    });
}
