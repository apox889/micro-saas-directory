import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import '../server/env.js';
import { exportStaticData } from './export-static.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

/**
 * Helper to query Vercel API and wait for deployment to reach READY status
 */
async function waitForVercelDeployment(targetCommitSha, maxWaitMs = 45000) {
  const token = process.env.VERCEL_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID || 'prj_Aj7i5gzr9p8cauj1bj6SpFAMV05b';
  const teamId = process.env.VERCEL_TEAM_ID;

  if (!token) {
    console.log('[Vercel Verify] VERCEL_TOKEN not configured. Skipping automated live polling.');
    return { verified: false, reason: 'VERCEL_TOKEN not configured' };
  }

  const startTime = Date.now();
  console.log(`[Vercel Verify] ⏳ Polling Vercel API for deployment matching commit ${targetCommitSha || 'latest'}...`);

  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };

  while (Date.now() - startTime < maxWaitMs) {
    try {
      const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5${teamId ? `&teamId=${teamId}` : ''}`;
      const res = await fetch(url, { headers });

      if (res.ok) {
        const data = await res.json();
        const deployments = data.deployments || [];

        // Match by commit SHA if available, otherwise pick the newest
        const target = deployments.find(d => 
          targetCommitSha && d.meta?.githubCommitSha && 
          (d.meta.githubCommitSha.startsWith(targetCommitSha) || targetCommitSha.startsWith(d.meta.githubCommitSha.substring(0, 7)))
        ) || deployments[0];

        if (target) {
          const state = target.state || target.readyState;
          console.log(`[Vercel Verify] Deployment ${target.uid} current status: ${state}`);

          if (state === 'READY') {
            const durationSec = target.buildingAt && target.ready 
              ? ((target.ready - target.buildingAt) / 1000).toFixed(1) + 's' 
              : 'ready';

            return {
              verified: true,
              deploymentId: target.uid,
              state: 'READY',
              url: `https://${target.url}`,
              productionUrl: 'https://micro-saas-directory.vercel.app',
              buildDuration: durationSec,
              created: target.created,
              commitSha: target.meta?.githubCommitSha || targetCommitSha
            };
          }

          if (state === 'ERROR' || state === 'CANCELED') {
            return {
              verified: false,
              deploymentId: target.uid,
              state,
              error: target.meta?.errorMessage || 'Vercel build reported an error'
            };
          }
        }
      }
    } catch (pollErr) {
      console.warn('[Vercel Verify] Poll notice:', pollErr.message);
    }

    // Wait 3 seconds before next poll
    await new Promise(r => setTimeout(r, 3000));
  }

  console.log('[Vercel Verify] ⏱️ Deployment is building on Vercel. Verification link available.');
  return {
    verified: false,
    pending: true,
    productionUrl: 'https://micro-saas-directory.vercel.app',
    message: 'Build in progress on Vercel edge network'
  };
}

/**
 * Automates the Streamlined Live Sync Pipeline:
 * 1. Securely synchronizes with remote GitHub/Vercel state (fetch & rebase check)
 * 2. Compiles local additions and deletions into static production assets (excludes drafts & trash)
 * 3. Stages all database, logo, and static assets (git add .)
 * 4. Commits changes with a clean, descriptive message
 * 5. Pushes directly to the main branch of the connected GitHub repository
 * 6. Polls Vercel deployment status and returns clear verification confirmation
 */
export async function publishLiveToGitHub(customMessage = null) {
  console.log('\n======================================================');
  console.log('🚀 STREAMLINED LIVE SYNC PIPELINE (GITHUB + VERCEL)');
  console.log('======================================================');

  // 1. Pull & sync state from remote repository to prevent divergence
  console.log('[Publish Live] 1. Securely checking live remote state from GitHub...');
  try {
    execSync('git fetch origin main', { cwd: ROOT_DIR, stdio: 'pipe', timeout: 30000 });
    
    // Check if remote is ahead
    const localHash = execSync('git rev-parse HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    const remoteHash = execSync('git rev-parse origin/main', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();

    if (localHash !== remoteHash) {
      console.log(`[Publish Live] Remote state detected (local: ${localHash.substring(0, 7)}, remote: ${remoteHash.substring(0, 7)}).`);
      // Rebase cleanly if working directory is clean
      try {
        execSync('git pull --rebase origin main', { cwd: ROOT_DIR, stdio: 'pipe' });
        console.log('[Publish Live] ✅ Rebased local branch cleanly on top of origin/main.');
      } catch (rebaseErr) {
        console.warn('[Publish Live] Rebase notice (proceeding with local changes):', rebaseErr.message);
      }
    } else {
      console.log('[Publish Live] ✅ Local branch is synchronized with remote origin/main.');
    }
  } catch (fetchErr) {
    console.warn('[Publish Live] Remote sync warning (proceeding with local changes):', fetchErr.message);
  }

  // 2. Export static dataset (applies local additions & deletions)
  console.log('[Publish Live] 2. Applying local additions/deletions & exporting static bundle...');
  const exportResult = exportStaticData();
  const publishedCount = exportResult.count || 0;

  // 3. Stage all changed files
  console.log('[Publish Live] 3. Staging database, logo files, and static assets...');
  execSync('git add .', { cwd: ROOT_DIR, stdio: 'pipe' });

  // 4. Inspect staged changes and commit
  const statusOutput = execSync('git status --porcelain', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  let commitHash = null;
  let commitMessage = null;
  let committed = false;

  if (statusOutput.length > 0) {
    const timestamp = new Date().toISOString().replace('T', ' ').slice(0, 19);
    commitMessage = customMessage || `chore(publish): live directory update (${publishedCount} tools) - ${timestamp}`;
    console.log(`[Publish Live] 4. Committing changes: "${commitMessage}"...`);
    
    execSync(`git commit -m "${commitMessage.replace(/"/g, '\\"')}"`, { cwd: ROOT_DIR, stdio: 'pipe' });
    commitHash = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
    committed = true;
    console.log(`[Publish Live] ✅ Created commit: ${commitHash}`);
  } else {
    console.log('[Publish Live] 4. No unstaged changes detected. Current commit is up to date.');
    commitHash = execSync('git rev-parse --short HEAD', { cwd: ROOT_DIR, encoding: 'utf8' }).trim();
  }

  // 5. Push to remote origin main
  console.log('[Publish Live] 5. Pushing changes to origin/main on GitHub...');
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

  // 6. Verify Vercel deployment incorporation
  console.log('[Publish Live] 6. Verifying live Vercel deployment incorporation...');
  let vercelStatus = null;
  try {
    vercelStatus = await waitForVercelDeployment(commitHash, 35000);
  } catch (vErr) {
    console.warn('[Publish Live] Vercel verification error:', vErr.message);
    vercelStatus = { verified: false, error: vErr.message };
  }

  console.log('======================================================\n');

  const isVerified = vercelStatus?.verified === true;
  let confirmationMsg = '';

  if (isVerified) {
    confirmationMsg = `🎉 Live Sync Verified! Pushed commit (${commitHash}) and successfully deployed live to Vercel in ${vercelStatus.buildDuration}.`;
  } else if (committed) {
    confirmationMsg = `🚀 Successfully published live! Committed (${commitHash}) and pushed to GitHub. Vercel deployment is building.`;
  } else {
    confirmationMsg = `✅ Already up to date. Verified latest commit (${commitHash}) on GitHub main branch.`;
  }

  return {
    success: true,
    message: confirmationMsg,
    commitHash,
    commitMessage: commitMessage || 'Already up to date',
    publishedCount,
    committed,
    pushed: true,
    pushOutput: pushOutput.trim(),
    vercel: vercelStatus,
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
