import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { fetchAndSaveLogo, getToolsDb, saveToolsDb, syncAllLogos, extractDomain } from './logoService.js';
import { 
  queryBrandfetchBrand, 
  downloadBrandfetchImage, 
  isBrandfetchConfigured, 
  getBrandfetchApiKey 
} from './brandfetchService.js';
import { analyzeToolWithAI, generateCuratedBatchOf10Drafts } from './aiToolAnalyzer.js';
import { ingestBatchOfTools } from './batchImporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(ROOT_DIR, 'public', 'logos');

/**
 * Connect/Express middleware for tool logo backend utility, Brandfetch API, & Admin AI Pipeline
 */
export function createLogoApiMiddleware() {
  return async (req, res, next) => {
    const rawUrl = req.url || '';
    const parsedUrl = new URL(rawUrl, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;

    // Only process /api/tools, /api/brandfetch, /api/brand-logo, and /api/admin routes
    const isMatchedRoute = 
      pathname.startsWith('/api/tools') || 
      pathname.startsWith('/api/brandfetch') || 
      pathname.startsWith('/api/brand-logo') ||
      pathname.startsWith('/api/admin');

    if (!isMatchedRoute) {
      return next();
    }

    // Enable JSON parsing if body not already parsed
    const getBody = () => {
      return new Promise((resolve) => {
        if (req.body) return resolve(req.body);
        let data = '';
        req.on('data', chunk => { data += chunk; });
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch {
            resolve({});
          }
        });
      });
    };

    const sendJson = (statusCode, data) => {
      res.statusCode = statusCode;
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
      res.end(JSON.stringify(data));
    };

    if (req.method === 'OPTIONS') {
      return sendJson(200, { ok: true });
    }

    try {
      /* =========================================================================
         ADMIN STAGING & AI BACKEND PIPELINE ROUTES
         ========================================================================= */

      // POST /api/admin/ai-generate-tool: AI agent analyzes tool, generates anti-bloat metadata, downloads logo, and stages as Draft
      if (req.method === 'POST' && pathname === '/api/admin/ai-generate-tool') {
        const body = await getBody();
        const { name, website } = body;

        if (!name && !website) {
          return sendJson(400, { error: 'Please provide either a tool name or a website URL.' });
        }

        console.log(`[Admin AI Pipeline] Analyzing tool: "${name || website}"...`);

        // 1. Run AI agent analyzer
        const aiMetadata = await analyzeToolWithAI({ name, website });

        // 2. Fetch and permanently download official logo
        let localLogoPath = null;
        try {
          const logoRes = await fetchAndSaveLogo({
            website: aiMetadata.website,
            slug: aiMetadata.slug,
            name: aiMetadata.name,
            domain: aiMetadata.domain
          });
          localLogoPath = logoRes.localLogoPath;
        } catch (logoErr) {
          console.warn('[Admin AI Pipeline] Logo fetch notice:', logoErr.message);
        }

        // 3. Assemble complete draft record
        const draftTool = {
          id: `draft-${Date.now()}`,
          ...aiMetadata,
          localLogoPath,
          status: 'draft',
          affiliateUrl: body.affiliateUrl || '', // Admin pastes personal affiliate link
          affiliateBadge: 'Partner Pick',
          affiliatePerk: 'Verified Anti-Bloat Recommendation',
          createdAt: new Date().toISOString()
        };

        // 4. Save to persistent database
        const existingTools = getToolsDb();
        saveToolsDb([draftTool, ...existingTools]);

        console.log(`[Admin AI Pipeline] Successfully generated & staged draft for: "${draftTool.name}"`);

        return sendJson(201, {
          success: true,
          message: `AI agent successfully analyzed ${draftTool.name} and staged it to drafts.`,
          draftTool
        });
      }

      // POST /api/admin/sync-batch-ai: Generates a curated batch of 10 distinct anti-bloat tools with downloaded local logos
      if (req.method === 'POST' && (pathname === '/api/admin/sync-batch-ai' || pathname === '/api/admin/generate-batch')) {
        console.log('[Admin API] Generating curated batch of 10 distinct anti-bloat micro-tools...');
        const generatedDrafts = await generateCuratedBatchOf10Drafts();
        return sendJson(200, {
          success: true,
          message: `Successfully generated and staged ${generatedDrafts.length} curated anti-bloat drafts with downloaded official logos.`,
          count: generatedDrafts.length,
          drafts: generatedDrafts
        });
      }

      // POST /api/admin/batch-import or /api/admin/ingest-batch: Feed a batch of tools directly into local admin draft queue
      if (req.method === 'POST' && (pathname === '/api/admin/batch-import' || pathname === '/api/admin/ingest-batch')) {
        const body = await getBody();
        const rawBatch = Array.isArray(body) ? body : (body?.tools || body?.batch || []);

        if (!Array.isArray(rawBatch) || rawBatch.length === 0) {
          return sendJson(400, {
            error: 'Batch input must contain an array of tool records (e.g. [{ name, description, category, tags, learningCurve, website }]).'
          });
        }

        console.log(`[Admin API] Ingesting batch of ${rawBatch.length} tools into local draft queue...`);
        const report = await ingestBatchOfTools(rawBatch);

        return sendJson(201, {
          success: report.success,
          message: `Successfully ingested and staged ${report.importedCount} tools into local draft queue with self-hosted logos.`,
          count: report.importedCount,
          importedCount: report.importedCount,
          failedCount: report.failedCount,
          drafts: report.drafts,
          failed: report.failed
        });
      }

      // GET /api/admin/sample-batch: Returns standard sample batch of 10 tools
      if (req.method === 'GET' && pathname === '/api/admin/sample-batch') {
        const samplePath = path.join(ROOT_DIR, 'scripts', 'sample-10-tools.json');
        if (fs.existsSync(samplePath)) {
          const content = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
          return sendJson(200, { success: true, count: content.length, sampleBatch: content });
        }
        return sendJson(404, { error: 'Sample batch file not found.' });
      }

      // POST /api/admin/manual-tool: Manually creates and stages a tool
      if (req.method === 'POST' && pathname === '/api/admin/manual-tool') {
        const body = await getBody();
        const { 
          name, 
          website, 
          description,
          category = 'Utilities', 
          whatItReplaces = 'Bloated software',
          replacesDetailed = '',
          targetAudience = 'Builders & minimalists',
          learningCurveLevel = 'Gentle',
          learningCurveTime = '5 mins',
          tutorialCount = 12,
          tags = [],
          affiliateUrl = '',
          publishImmediately = false
        } = body;

        if (!name || !website) {
          return sendJson(400, { error: 'Tool Name and Website URL are required.' });
        }

        const domain = extractDomain(website);
        const slug = name.toLowerCase().replace(/[^a-z0-9_-]/gi, '-');

        // Download official logo directly into local project storage (/public/logos/{slug}.png)
        let localLogoPath = `/logos/${slug}.png`;
        try {
          const logoRes = await fetchAndSaveLogo({ website, slug, name, domain });
          if (logoRes && logoRes.localLogoPath) {
            localLogoPath = logoRes.localLogoPath;
          }
        } catch (logoErr) {
          console.warn(`[Admin Manual Tool] Logo fetch notice for ${name}:`, logoErr.message);
        }

        const curveScoreMap = { 'Gentle': 1, 'Low': 2, 'Moderate': 3, 'Steep': 4 };
        const finalDescription = description || body.tagline || `Lightweight, modern ${category.toLowerCase()} micro-tool designed to eliminate bloat.`;
        const countNum = parseInt(tutorialCount, 10) || 12;

        const newTool = {
          id: `manual-${Date.now()}-${slug}`,
          name,
          slug,
          website,
          domain,
          brandColor: '#4f46e5',
          tagline: finalDescription,
          description: finalDescription,
          category,
          whatItReplaces,
          replacesDetailed: replacesDetailed || `Replaces enterprise bloat with focused micro-functionality.`,
          targetAudience,
          tags: Array.isArray(tags) && tags.length > 0 ? tags : ['Beginner-Friendly', 'Free Tier Available'],
          learningCurve: {
            level: learningCurveLevel,
            score: curveScoreMap[learningCurveLevel] || 1,
            timeToLearn: learningCurveTime,
            summary: 'Straightforward onboarding designed for instant velocity.'
          },
          tutorialCount: countNum,
          tutorialMeta: {
            videoGuides: Math.ceil(countNum * 0.4),
            stepByStepDocs: Math.ceil(countNum * 0.4),
            communityShortcuts: Math.max(1, countNum - Math.ceil(countNum * 0.4) * 2)
          },
          pricing: 'Free tier / Transparent pricing',
          status: publishImmediately ? 'published' : 'draft',
          localLogoPath,
          affiliateUrl: (affiliateUrl && affiliateUrl.trim().length > 0) ? affiliateUrl.trim() : `${website.replace(/\/+$/, '')}/?ref=curateless`,
          affiliateBadge: 'Partner Pick',
          affiliatePerk: 'Verified Anti-Bloat Recommendation',
          createdAt: new Date().toISOString(),
          lessonPlan: {
            title: `${name} Quickstart Guide`,
            subtitle: `Get started with ${name} in under ${learningCurveTime}.`,
            estimatedTime: learningCurveTime,
            difficulty: 'Beginner',
            overview: `A streamlined 5-step curriculum to master ${name}.`,
            prerequisites: ['Web browser or local app'],
            steps: [
              {
                stepNumber: 1,
                title: 'Account & Workspace Setup',
                timeEstimate: '2 mins',
                description: 'Download or log in with zero marketing questionnaires.',
                actionItems: ['Sign in', 'Set preferred defaults'],
                proTip: 'Keep initial setup minimal.'
              },
              {
                stepNumber: 2,
                title: 'Core Workflow Execution',
                timeEstimate: '3 mins',
                description: 'Perform your primary task without menu fatigue.',
                actionItems: ['Test primary action'],
                proTip: 'Focus strictly on your main daily goal.'
              }
            ]
          }
        };

        const currentDb = getToolsDb();
        saveToolsDb([newTool, ...currentDb]);

        return sendJson(201, {
          success: true,
          message: publishImmediately 
            ? `Tool "${name}" created and published to live directory!` 
            : `Tool "${name}" created and staged to Drafts Queue!`,
          tool: newTool
        });
      }

      // GET /api/admin/drafts: Returns all staged draft tools
      if (req.method === 'GET' && pathname === '/api/admin/drafts') {
        const tools = getToolsDb();
        const drafts = tools.filter(t => t.status === 'draft');
        return sendJson(200, {
          success: true,
          count: drafts.length,
          drafts
        });
      }

      // GET /api/admin/tools or /api/admin/all-tools: Returns all tools partitioned by status (drafts, published, trash)
      if (req.method === 'GET' && (pathname === '/api/admin/tools' || pathname === '/api/admin/all-tools')) {
        const tools = getToolsDb();
        const drafts = tools.filter(t => t.status === 'draft');
        const published = tools.filter(t => t.status === 'published');
        const trash = tools.filter(t => t.status === 'trash');
        const active = tools.filter(t => t.status !== 'trash');

        return sendJson(200, {
          success: true,
          total: active.length,
          allTotal: tools.length,
          draftsCount: drafts.length,
          publishedCount: published.length,
          trashCount: trash.length,
          drafts,
          published,
          trash,
          tools: active
        });
      }

      // POST /api/admin/tools/bulk: Bulk actions (trash, restore, permanent-delete, publish, draft)
      if (req.method === 'POST' && pathname === '/api/admin/tools/bulk') {
        const body = await getBody();
        const { action, ids } = body;

        if (!action || !Array.isArray(ids) || ids.length === 0) {
          return sendJson(400, { error: 'Valid action and non-empty ids array required.' });
        }

        let tools = getToolsDb();
        const affectedIds = new Set(ids);
        let affectedCount = 0;

        if (action === 'trash') {
          tools.forEach(t => {
            if (affectedIds.has(t.id) || affectedIds.has(t.slug)) {
              if (t.status !== 'trash') {
                t.previousStatus = t.status || 'draft';
                t.status = 'trash';
                t.deletedAt = new Date().toISOString();
                affectedCount++;
              }
            }
          });
        } else if (action === 'restore') {
          tools.forEach(t => {
            if (affectedIds.has(t.id) || affectedIds.has(t.slug)) {
              if (t.status === 'trash') {
                t.status = t.previousStatus === 'published' ? 'published' : 'draft';
                delete t.deletedAt;
                t.restoredAt = new Date().toISOString();
                affectedCount++;
              }
            }
          });
        } else if (action === 'permanent-delete') {
          const initialLen = tools.length;
          tools = tools.filter(t => !affectedIds.has(t.id) && !affectedIds.has(t.slug));
          affectedCount = initialLen - tools.length;
        } else if (action === 'publish') {
          tools.forEach(t => {
            if (affectedIds.has(t.id) || affectedIds.has(t.slug)) {
              t.status = 'published';
              t.publishedAt = t.publishedAt || new Date().toISOString();
              affectedCount++;
            }
          });
        } else if (action === 'draft') {
          tools.forEach(t => {
            if (affectedIds.has(t.id) || affectedIds.has(t.slug)) {
              t.status = 'draft';
              affectedCount++;
            }
          });
        } else {
          return sendJson(400, { error: `Unsupported bulk action "${action}".` });
        }

        saveToolsDb(tools);

        const drafts = tools.filter(t => t.status === 'draft');
        const published = tools.filter(t => t.status === 'published');
        const trash = tools.filter(t => t.status === 'trash');

        return sendJson(200, {
          success: true,
          message: `Successfully executed "${action}" on ${affectedCount} tool(s).`,
          action,
          affectedCount,
          draftsCount: drafts.length,
          publishedCount: published.length,
          trashCount: trash.length,
          drafts,
          published,
          trash
        });
      }

      // POST /api/admin/trash/empty or DELETE /api/admin/trash: Permanently purge all items in Trash
      if (
        (req.method === 'POST' && pathname === '/api/admin/trash/empty') ||
        (req.method === 'DELETE' && pathname === '/api/admin/trash')
      ) {
        let tools = getToolsDb();
        const trashCount = tools.filter(t => t.status === 'trash').length;
        const kept = tools.filter(t => t.status !== 'trash');
        saveToolsDb(kept);

        console.log(`[Admin API] 🗑️ Permanently emptied ${trashCount} items from Trash.`);

        return sendJson(200, {
          success: true,
          message: `Permanently purged ${trashCount} item(s) from Trash.`,
          purgedCount: trashCount
        });
      }

      // POST /api/admin/tools/:id/restore: Restore a tool from trash back to drafts or published
      if (req.method === 'POST' && pathname.match(/^\/api\/admin\/tools\/[^/]+\/restore$/)) {
        const id = pathname.split('/')[4];
        const tools = getToolsDb();
        const toolIndex = tools.findIndex(t => t.id === id || t.slug === id);

        if (toolIndex === -1) {
          return sendJson(404, { error: `Tool '${id}' not found.` });
        }

        const tool = tools[toolIndex];
        const restoredStatus = tool.previousStatus === 'published' ? 'published' : 'draft';
        tool.status = restoredStatus;
        delete tool.deletedAt;
        tool.restoredAt = new Date().toISOString();

        tools[toolIndex] = tool;
        saveToolsDb(tools);

        console.log(`[Admin API] ↩️ Restored tool "${tool.name}" to status: ${restoredStatus}`);

        return sendJson(200, {
          success: true,
          message: `Tool "${tool.name}" restored to ${restoredStatus === 'published' ? 'Live Tools' : 'Drafts Queue'}.`,
          tool
        });
      }

      // POST /api/admin/drafts/clear-all or DELETE /api/admin/drafts: Clear all drafts in one click
      if (
        (req.method === 'POST' && pathname === '/api/admin/drafts/clear-all') ||
        (req.method === 'DELETE' && pathname === '/api/admin/drafts')
      ) {
        const tools = getToolsDb();
        const draftsCount = tools.filter(t => t.status === 'draft').length;
        const kept = tools.filter(t => t.status !== 'draft');
        saveToolsDb(kept);

        console.log(`[Admin API] 🗑️ Cleared all ${draftsCount} draft tools.`);

        return sendJson(200, {
          success: true,
          message: `Cleared all ${draftsCount} draft items successfully.`,
          clearedCount: draftsCount
        });
      }

      // POST /api/admin/export-static: Export published tools for static frontend builds
      if (req.method === 'POST' && pathname === '/api/admin/export-static') {
        try {
          const { exportStaticData } = await import('../scripts/export-static.js');
          const result = exportStaticData();
          return sendJson(200, {
            success: true,
            message: `Successfully exported ${result.count} published tools for static deployment!`,
            count: result.count
          });
        } catch (exportErr) {
          return sendJson(500, { error: 'Static export failed: ' + exportErr.message });
        }
      }

      // POST /api/admin/publish-live or /api/admin/git-publish: Stages database/logos, commits, and pushes to GitHub main branch
      if (req.method === 'POST' && (pathname === '/api/admin/publish-live' || pathname === '/api/admin/git-publish')) {
        try {
          const body = await getBody();
          const { customMessage } = body;
          const { publishLiveToGitHub } = await import('../scripts/publish-live.js');
          const result = await publishLiveToGitHub(customMessage);

          return sendJson(200, {
            success: true,
            message: result.message,
            commitHash: result.commitHash,
            commitMessage: result.commitMessage,
            publishedCount: result.publishedCount,
            committed: result.committed,
            pushed: result.pushed,
            vercel: result.vercel,
            timestamp: result.timestamp
          });
        } catch (publishErr) {
          console.error('[Admin API] Publish live failed:', publishErr);
          return sendJson(500, { 
            error: 'Publish Live failed: ' + publishErr.message 
          });
        }
      }

      // PUT /api/admin/tools/:id or /api/admin/drafts/:id: Full edit of any tool record (draft or published)
      if (req.method === 'PUT' && (pathname.startsWith('/api/admin/tools/') || pathname.startsWith('/api/admin/drafts/'))) {
        const id = pathname.replace('/api/admin/tools/', '').replace('/api/admin/drafts/', '');
        const updates = await getBody();
        const tools = getToolsDb();
        const toolIndex = tools.findIndex(t => t.id === id || t.slug === id);

        if (toolIndex === -1) {
          return sendJson(404, { error: `Tool with ID '${id}' not found.` });
        }

        const existing = tools[toolIndex];
        const curveScoreMap = { 'Gentle': 1, 'Low': 2, 'Moderate': 3, 'Steep': 4 };

        // Process tags
        let processedTags = existing.tags;
        if (updates.tags !== undefined) {
          if (Array.isArray(updates.tags)) {
            processedTags = updates.tags.map(t => String(t).trim()).filter(Boolean);
          } else if (typeof updates.tags === 'string') {
            processedTags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
          }
        }

        // Process learning curve
        let updatedLearningCurve = { ...existing.learningCurve };
        if (updates.learningCurve && typeof updates.learningCurve === 'object') {
          updatedLearningCurve = { ...updatedLearningCurve, ...updates.learningCurve };
        }
        if (updates.learningCurveLevel) {
          updatedLearningCurve.level = updates.learningCurveLevel;
          updatedLearningCurve.score = curveScoreMap[updates.learningCurveLevel] || 1;
        }
        if (updates.learningCurveTime) {
          updatedLearningCurve.timeToLearn = updates.learningCurveTime;
        }
        if (updates.learningCurveSummary) {
          updatedLearningCurve.summary = updates.learningCurveSummary;
        }

        // Process tutorial count and meta
        let updatedTutorialCount = existing.tutorialCount;
        let updatedTutorialMeta = existing.tutorialMeta;
        if (updates.tutorialCount !== undefined) {
          const countNum = parseInt(updates.tutorialCount, 10);
          if (!isNaN(countNum)) {
            updatedTutorialCount = Math.max(0, countNum);
            updatedTutorialMeta = {
              videoGuides: Math.ceil(updatedTutorialCount * 0.4),
              stepByStepDocs: Math.ceil(updatedTutorialCount * 0.4),
              communityShortcuts: Math.max(1, updatedTutorialCount - Math.ceil(updatedTutorialCount * 0.4) * 2)
            };
          }
        }

        // Handle description & tagline
        const newDescription = updates.description !== undefined ? updates.description : existing.description;
        const newTagline = updates.tagline !== undefined ? updates.tagline : (newDescription || existing.tagline);

        const updatedTool = {
          ...existing,
          name: updates.name !== undefined ? updates.name.trim() : existing.name,
          category: updates.category !== undefined ? updates.category : existing.category,
          tagline: newTagline,
          description: newDescription,
          whatItReplaces: updates.whatItReplaces !== undefined ? updates.whatItReplaces : existing.whatItReplaces,
          replacesDetailed: updates.replacesDetailed !== undefined ? updates.replacesDetailed : existing.replacesDetailed,
          targetAudience: updates.targetAudience !== undefined ? updates.targetAudience : existing.targetAudience,
          tags: processedTags,
          learningCurve: updatedLearningCurve,
          tutorialCount: updatedTutorialCount,
          tutorialMeta: updatedTutorialMeta,
          affiliateUrl: updates.affiliateUrl !== undefined ? updates.affiliateUrl.trim() : existing.affiliateUrl,
          website: updates.website !== undefined ? updates.website.trim() : existing.website,
          updatedAt: new Date().toISOString()
        };

        tools[toolIndex] = updatedTool;
        saveToolsDb(tools);

        console.log(`[Admin API] ✅ Successfully updated tool "${updatedTool.name}" (Status: ${updatedTool.status})`);

        return sendJson(200, {
          success: true,
          message: `Tool "${updatedTool.name}" updated successfully.`,
          tool: updatedTool
        });
      }

      // POST /api/admin/drafts/:id/publish: Publish draft to live public directory
      if (req.method === 'POST' && pathname.match(/^\/api\/admin\/drafts\/[^/]+\/publish$/)) {
        const id = pathname.split('/')[4];
        const body = await getBody();
        const tools = getToolsDb();
        const toolIndex = tools.findIndex(t => t.id === id);

        if (toolIndex === -1) {
          return sendJson(404, { error: `Draft tool '${id}' not found.` });
        }

        // Apply any last-minute affiliate link passed in publish payload or ensure populated
        if (body.affiliateUrl && body.affiliateUrl.trim().length > 0) {
          tools[toolIndex].affiliateUrl = body.affiliateUrl.trim();
        } else if (!tools[toolIndex].affiliateUrl || tools[toolIndex].affiliateUrl.trim() === '') {
          const domain = tools[toolIndex].domain || extractDomain(tools[toolIndex].website) || 'example.com';
          const baseWeb = tools[toolIndex].website ? tools[toolIndex].website.replace(/\/+$/, '') : `https://${domain}`;
          tools[toolIndex].affiliateUrl = `${baseWeb}/?ref=curateless`;
        }

        // Move to published status
        tools[toolIndex].status = 'published';
        tools[toolIndex].publishedAt = new Date().toISOString();
        tools[toolIndex].dateAdded = new Date().toISOString().split('T')[0];

        saveToolsDb(tools);

        console.log(`[Admin AI Pipeline] 🚀 Tool Published to Live Directory: "${tools[toolIndex].name}"`);

        return sendJson(200, {
          success: true,
          message: `Tool "${tools[toolIndex].name}" published to live directory!`,
          publishedTool: tools[toolIndex]
        });
      }

      // DELETE /api/admin/tools/:id or /api/admin/drafts/:id: Soft-delete to Trash by default, or permanently purge if ?permanent=true
      if (req.method === 'DELETE' && (pathname.startsWith('/api/admin/tools/') || pathname.startsWith('/api/admin/drafts/'))) {
        const isPermanentPath = pathname.endsWith('/permanent');
        let cleanPath = isPermanentPath ? pathname.replace(/\/permanent$/, '') : pathname;
        const id = cleanPath.replace('/api/admin/tools/', '').replace('/api/admin/drafts/', '');
        const isPermanent = isPermanentPath || parsedUrl.searchParams.get('permanent') === 'true';

        let tools = getToolsDb();
        const toolIndex = tools.findIndex(t => t.id === id || t.slug === id);

        if (toolIndex === -1) {
          return sendJson(404, { error: `Tool with ID '${id}' not found.` });
        }

        const tool = tools[toolIndex];
        const removedName = tool.name;

        if (isPermanent) {
          tools = tools.filter((_, idx) => idx !== toolIndex);
          saveToolsDb(tools);
          console.log(`[Admin API] ❌ Permanently purged tool "${removedName}" (ID: ${id})`);
          return sendJson(200, {
            success: true,
            permanent: true,
            message: `Tool "${removedName}" permanently deleted from database.`,
            deletedId: id
          });
        }

        // Soft-delete: Move to Trash folder
        const prevStatus = tool.status === 'trash' ? (tool.previousStatus || 'draft') : tool.status;
        tools[toolIndex] = {
          ...tool,
          previousStatus: prevStatus,
          status: 'trash',
          deletedAt: new Date().toISOString()
        };
        saveToolsDb(tools);

        console.log(`[Admin API] 🗑️ Moved tool "${removedName}" (ID: ${id}) to Trash`);

        return sendJson(200, {
          success: true,
          trashed: true,
          message: `Tool "${removedName}" moved to Trash folder.`,
          tool: tools[toolIndex],
          deletedId: id
        });
      }

      /* =========================================================================
         SECURE BRAND LOGO ASSET ROUTE (/api/brand-logo & /api/brandfetch/asset)
         ========================================================================= */
      if (
        req.method === 'GET' && 
        (pathname === '/api/brand-logo' || pathname === '/api/brandfetch/asset')
      ) {
        const rawDomain = parsedUrl.searchParams.get('domain');
        const domain = extractDomain(rawDomain);

        if (!domain) {
          return sendJson(400, { error: 'Valid domain query parameter is required (e.g. ?domain=linear.app)' });
        }

        // Check local disk cache
        const possibleFilenames = [
          `${domain.replace(/[^a-z0-9_-]/gi, '-')}.png`,
          `${domain}.png`,
          `${domain.split('.')[0]}.png`
        ];

        const tools = getToolsDb();
        const matchedTool = tools.find(t => t.domain === domain || t.slug === domain.split('.')[0]);
        if (matchedTool?.localLogoPath) {
          const matchedName = path.basename(matchedTool.localLogoPath);
          possibleFilenames.unshift(matchedName);
        }

        for (const fname of possibleFilenames) {
          const localPath = path.join(LOGOS_DIR, fname);
          if (fs.existsSync(localPath)) {
            const stat = fs.statSync(localPath);
            if (stat.isFile() && stat.size > 100) {
              res.statusCode = 200;
              res.setHeader('Content-Type', 'image/png');
              res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
              return fs.createReadStream(localPath).pipe(res);
            }
          }
        }

        // Not cached locally yet: trigger secure server-side fetch & save
        try {
          console.log(`[Secure Logo Route] Downloading logo for domain: ${domain}...`);
          const meta = await fetchAndSaveLogo({
            website: domain,
            slug: domain.replace(/[^a-z0-9_-]/gi, '-'),
            name: domain,
            domain
          });

          if (fs.existsSync(meta.fullDiskPath)) {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
            return fs.createReadStream(meta.fullDiskPath).pipe(res);
          }
        } catch (fetchErr) {
          console.warn(`[Secure Logo Route] Failed to fetch logo for ${domain}:`, fetchErr.message);
        }

        return sendJson(404, { error: `Logo asset for domain '${domain}' could not be resolved.` });
      }

      /* =========================================================
         SECURE BRANDFETCH METADATA ROUTE (Zero Key Leakage)
         ========================================================= */

      // GET /api/brandfetch/status: Check server Brandfetch configuration
      if (req.method === 'GET' && pathname === '/api/brandfetch/status') {
        const configured = isBrandfetchConfigured();
        const key = getBrandfetchApiKey();
        const maskedKey = configured ? `${key.substring(0, 4)}••••${key.substring(key.length - 4)}` : null;

        return sendJson(200, {
          configured,
          provider: 'Brandfetch API',
          maskedKey,
          message: configured
            ? 'Brandfetch API is securely configured on the server.'
            : 'BRANDFETCH_API_KEY is not configured in server .env file.'
        });
      }

      // POST or GET /api/brandfetch/logo: Query Brandfetch brand metadata
      if ((req.method === 'POST' || req.method === 'GET') && pathname === '/api/brandfetch/logo') {
        let targetDomain = parsedUrl.searchParams.get('domain');

        if (!targetDomain && req.method === 'POST') {
          const body = await getBody();
          targetDomain = body.domain || body.website;
        }

        if (!targetDomain) {
          return sendJson(400, { error: 'A domain query parameter or body property is required.' });
        }

        const domain = extractDomain(targetDomain);
        const brandfetchResult = await queryBrandfetchBrand(domain);

        return sendJson(200, {
          success: brandfetchResult.success,
          domain,
          name: brandfetchResult.name,
          logoUrl: brandfetchResult.logoUrl,
          iconUrl: brandfetchResult.iconUrl,
          brandColor: brandfetchResult.brandColor,
          description: brandfetchResult.description,
          source: brandfetchResult.source,
          error: brandfetchResult.error,
          configured: brandfetchResult.configured,
          secureBackendLogoUrl: `/api/brand-logo?domain=${encodeURIComponent(domain)}`
        });
      }

      /* =========================================================
         TOOL STORAGE & LOGO DOWNLOAD UTILITY ROUTES
         ========================================================= */

      // POST /api/tools/fetch-logo: Download official logo & return local file path
      if (req.method === 'POST' && pathname === '/api/tools/fetch-logo') {
        const body = await getBody();
        const { website, slug, name } = body;

        if (!website) {
          return sendJson(400, { error: 'website URL is required' });
        }

        const domain = extractDomain(website);
        console.log(`[Backend API] Request to download logo for: ${domain}`);

        const result = await fetchAndSaveLogo({
          website,
          slug: slug || domain.replace(/[^a-z0-9_-]/gi, '-'),
          name: name || domain,
          domain
        });

        return sendJson(200, {
          success: true,
          message: `Official logo successfully downloaded and permanently stored.`,
          localLogoPath: result.localLogoPath,
          fullDiskPath: result.fullDiskPath,
          domain: result.domain,
          sizeBytes: result.sizeBytes,
          source: result.source,
          savedAt: result.savedAt
        });
      }

      // GET /api/tools: Get tools list from persistent JSON database (only strictly published tools for public)
      if (req.method === 'GET' && (pathname === '/api/tools' || pathname === '/api/tools/')) {
        const tools = getToolsDb();
        // Public directory only shows strictly published tools (never drafts or trash)
        const publishedTools = tools.filter(t => t.status === 'published').map(t => {
          if (!t.affiliateUrl || t.affiliateUrl.trim() === '') {
            const domain = t.domain || extractDomain(t.website) || 'example.com';
            const baseWeb = t.website ? t.website.replace(/\/+$/, '') : `https://${domain}`;
            return { ...t, affiliateUrl: `${baseWeb}/?ref=curateless` };
          }
          return t;
        });
        return sendJson(200, { success: true, count: publishedTools.length, tools: publishedTools });
      }

      // POST /api/tools: Create a new tool
      if (req.method === 'POST' && (pathname === '/api/tools' || pathname === '/api/tools/')) {
        const toolData = await getBody();
        if (!toolData.name || !toolData.website) {
          return sendJson(400, { error: 'Tool name and website are required' });
        }

        const domain = extractDomain(toolData.website);
        const slug = (toolData.slug || toolData.name.toLowerCase().replace(/\s+/g, '-')).replace(/[^a-z0-9_-]/gi, '');

        let logoMetadata = null;
        try {
          logoMetadata = await fetchAndSaveLogo({
            website: toolData.website,
            slug,
            name: toolData.name,
            domain
          });
        } catch (logoErr) {
          console.warn(`[Backend API] Warning: Logo fetch failed for ${domain}:`, logoErr.message);
        }

        const newTool = {
          id: `tool-${Date.now()}`,
          slug,
          name: toolData.name,
          website: toolData.website,
          domain,
          brandColor: toolData.brandColor || '#4f46e5',
          logoLetter: toolData.name.substring(0, 2).toUpperCase(),
          localLogoPath: logoMetadata ? logoMetadata.localLogoPath : null,
          status: 'published',
          tagline: toolData.tagline || `Minimalist ${toolData.category || 'productivity'} tool.`,
          category: toolData.category || 'Utilities',
          whatItReplaces: toolData.whatItReplaces || 'Bloated legacy software',
          replacesDetailed: toolData.replacesDetailed || `Replaces enterprise bloat with lightweight architecture.`,
          targetAudience: toolData.targetAudience || 'Digital minimalists & power users',
          learningCurve: toolData.learningCurve || { level: 'Gentle', score: 1, timeToLearn: '5 mins', summary: 'Quick start' },
          tutorialCount: toolData.tutorialCount || 5,
          tutorialMeta: { videoGuides: 2, stepByStepDocs: 3, communityShortcuts: 1 },
          tags: toolData.tags || ["Beginner-Friendly", "Free Tier Available", "Community Verified"],
          pricing: toolData.pricing || "Free tier available",
          affiliateUrl: toolData.affiliateUrl || toolData.website,
          affiliateBadge: "Community Pick",
          dateAdded: new Date().toISOString().split('T')[0]
        };

        const existingTools = getToolsDb();
        saveToolsDb([newTool, ...existingTools]);

        return sendJson(201, {
          success: true,
          message: 'Tool created and published.',
          tool: newTool
        });
      }

      // POST /api/tools/sync-all-logos: Force re-sync of all logos
      if (req.method === 'POST' && pathname === '/api/tools/sync-all-logos') {
        const stats = await syncAllLogos();
        return sendJson(200, {
          success: true,
          message: `Synced ${stats.successful}/${stats.total} logos into permanent local storage.`,
          stats
        });
      }

      return sendJson(404, { error: `Endpoint ${pathname} not found` });
    } catch (err) {
      console.error('[Backend API Error]', err);
      return sendJson(500, { error: err.message });
    }
  };
}
