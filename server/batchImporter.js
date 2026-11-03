import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { extractDomain, fetchAndSaveLogo, getToolsDb, saveToolsDb } from './logoService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const LOGOS_DIR = path.join(ROOT_DIR, 'public', 'logos');

const CURVE_SCORE_MAP = {
  'Gentle': 1,
  'Low': 2,
  'Moderate': 3,
  'Steep': 4
};

/**
 * Normalizes learning curve input into a standard object structure
 */
function normalizeLearningCurve(lc) {
  if (typeof lc === 'string') {
    const level = ['Gentle', 'Low', 'Moderate', 'Steep'].includes(lc) ? lc : 'Gentle';
    return {
      level,
      score: CURVE_SCORE_MAP[level] || 1,
      timeToLearn: level === 'Gentle' ? '5 mins' : level === 'Low' ? '10 mins' : level === 'Moderate' ? '20 mins' : '45 mins',
      summary: 'Streamlined onboarding designed for immediate velocity.'
    };
  }

  if (lc && typeof lc === 'object') {
    const level = lc.level || 'Gentle';
    return {
      level,
      score: lc.score || CURVE_SCORE_MAP[level] || 1,
      timeToLearn: lc.timeToLearn || '5 mins',
      summary: lc.summary || 'Streamlined onboarding designed for immediate velocity.'
    };
  }

  return {
    level: 'Gentle',
    score: 1,
    timeToLearn: '5 mins',
    summary: 'Straightforward onboarding designed for instant productivity.'
  };
}

/**
 * Normalizes tags into a clean array of strings
 */
function normalizeTags(tags) {
  if (Array.isArray(tags)) {
    const cleaned = tags.map(t => String(t).trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : ['Beginner-Friendly', 'Free Tier Available'];
  }
  if (typeof tags === 'string' && tags.trim().length > 0) {
    const cleaned = tags.split(',').map(t => t.trim()).filter(Boolean);
    return cleaned.length > 0 ? cleaned : ['Beginner-Friendly', 'Free Tier Available'];
  }
  return ['Beginner-Friendly', 'Free Tier Available'];
}

/**
 * Core Batch Ingestion Handler
 * 
 * Ingests an incoming batch of tool records (e.g. 10 tools) directly into the local
 * admin draft queue, automatically fetches official logos/favicons from the web,
 * downloads image files directly into /public/logos/{slug}.png, and saves the local
 * path in each tool's database record.
 * 
 * @param {Array|Object} batchInput - Array of tools or { tools: [...] }
 * @param {Object} options - { forceRefreshLogos: boolean, defaultStatus: 'draft' }
 * @returns {Promise<Object>} Ingestion report
 */
export async function ingestBatchOfTools(batchInput, options = {}) {
  const { defaultStatus = 'draft' } = options;
  const rawList = Array.isArray(batchInput) 
    ? batchInput 
    : (batchInput?.tools || batchInput?.batch || []);

  if (!Array.isArray(rawList) || rawList.length === 0) {
    throw new Error('Batch input must be a non-empty array of tool records or { tools: [...] }');
  }

  console.log(`[Batch Ingester] Starting ingestion for batch of ${rawList.length} tools...`);

  const stagedDrafts = [];
  const failedItems = [];

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    const index = i + 1;

    try {
      const name = raw.name || raw.toolName;
      const website = raw.website || raw.url || raw.websiteUrl;

      if (!name || !website) {
        throw new Error(`Record #${index} is missing required 'name' or 'website' fields.`);
      }

      const domain = extractDomain(website);
      if (!domain) {
        throw new Error(`Record #${index} (${name}) has invalid website URL: "${website}".`);
      }

      const slug = (raw.slug || name.toLowerCase().replace(/[^a-z0-9_-]/gi, '-')).replace(/-+/g, '-').replace(/^-|-$/g, '');
      const category = raw.category || 'Utilities';
      const description = raw.description || raw.tagline || `Minimalist ${category.toLowerCase()} micro-tool designed to eliminate bloat.`;
      const tagline = raw.tagline || description;
      const tags = normalizeTags(raw.tags);
      const learningCurve = normalizeLearningCurve(raw.learningCurve);
      const tutorialCount = raw.tutorialCount || (learningCurve.score * 5 + 5);

      // Automated Local Logo Downloader:
      // Fetches official logo from web and downloads directly into /public/logos/{slug}.png
      console.log(`[Batch Ingester] (${index}/${rawList.length}) Fetching self-hosted logo for ${name} (${domain})...`);
      let localLogoPath = `/logos/${slug}.png`;
      let logoSource = 'Local Download';

      try {
        const logoMeta = await fetchAndSaveLogo({
          website,
          slug,
          name,
          domain
        });
        if (logoMeta && logoMeta.localLogoPath) {
          localLogoPath = logoMeta.localLogoPath;
          logoSource = logoMeta.source || 'Direct Web Download';
        }
      } catch (logoErr) {
        console.warn(`[Batch Ingester] Notice: Logo download fallback for ${name}:`, logoErr.message);
      }

      // Secure Affiliate Link Setup:
      // Direct outgoing link mapping with no external popups or raw vendor bypass
      let affiliateUrl = raw.affiliateUrl ? String(raw.affiliateUrl).trim() : '';
      if (!affiliateUrl) {
        const cleanBase = website.replace(/\/+$/, '');
        affiliateUrl = `${cleanBase}/?ref=curateless`;
      }

      const draftRecord = {
        id: `draft-${Date.now()}-${slug}-${index}`,
        name,
        slug,
        website,
        domain,
        brandColor: raw.brandColor || '#4f46e5',
        logoLetter: name.substring(0, 2).toUpperCase(),
        tagline,
        description,
        category,
        whatItReplaces: raw.whatItReplaces || raw.replaces || 'Bloated legacy software',
        replacesDetailed: raw.replacesDetailed || `Replaces enterprise bloat with focused micro-functionality and sub-50ms velocity.`,
        targetAudience: raw.targetAudience || 'Modern digital minimalists and power users.',
        tags,
        learningCurve,
        tutorialCount,
        tutorialMeta: {
          videoGuides: Math.ceil(tutorialCount * 0.4),
          stepByStepDocs: Math.ceil(tutorialCount * 0.4),
          communityShortcuts: Math.max(1, tutorialCount - Math.ceil(tutorialCount * 0.4) * 2)
        },
        pricing: raw.pricing || 'Free tier available / Transparent pricing',
        status: defaultStatus,
        localLogoPath,
        logoSource,
        affiliateUrl,
        affiliateBadge: raw.affiliateBadge || 'Partner Pick',
        affiliatePerk: raw.affiliatePerk || 'Verified Anti-Bloat Recommendation',
        createdAt: new Date().toISOString(),
        ingestedVia: 'local-batch-importer',
        lessonPlan: raw.lessonPlan || {
          title: `${name} Zero-Bloat Quickstart`,
          subtitle: `Master ${name} in under ${learningCurve.timeToLearn}.`,
          estimatedTime: learningCurve.timeToLearn,
          difficulty: learningCurve.level === 'Gentle' ? 'Beginner' : 'Intermediate',
          overview: `A streamlined 5-step curriculum to replace bloated legacy tools and master ${name}.`,
          prerequisites: ['Web browser or local application install'],
          steps: [
            {
              stepNumber: 1,
              title: 'Workspace Setup & Clean Defaults',
              timeEstimate: '2 mins',
              description: 'Launch application and turn off unnecessary notification badges.',
              actionItems: ['Open application', 'Configure default minimalist preferences'],
              proTip: 'Start with default settings to avoid early configuration burnout.'
            },
            {
              stepNumber: 2,
              title: 'Primary Task Execution',
              timeEstimate: '3 mins',
              description: 'Perform your main daily task without navigating through heavy multi-layered menus.',
              actionItems: ['Execute core action', 'Observe sub-50ms responsiveness'],
              proTip: 'Learn the primary hotkey for creating new entries instantly.'
            }
          ]
        }
      };

      stagedDrafts.push(draftRecord);
    } catch (itemErr) {
      console.error(`[Batch Ingester] Error processing item #${index}:`, itemErr.message);
      failedItems.push({
        index,
        item: raw,
        error: itemErr.message
      });
    }
  }

  // Persist into persistent database:
  // If drafts with matching slugs already exist, update them; otherwise prepend new drafts
  const currentDb = getToolsDb();
  const nonConflictingTools = currentDb.filter(existing =>
    !stagedDrafts.some(staged => staged.slug === existing.slug && existing.status === 'draft')
  );

  const updatedDb = [...stagedDrafts, ...nonConflictingTools];
  saveToolsDb(updatedDb);

  console.log(`[Batch Ingester] ✅ Successfully staged ${stagedDrafts.length} drafts into local admin queue (${failedItems.length} failed).`);

  return {
    success: stagedDrafts.length > 0,
    totalReceived: rawList.length,
    importedCount: stagedDrafts.length,
    failedCount: failedItems.length,
    drafts: stagedDrafts,
    failed: failedItems
  };
}
