import './env.js';
import { extractDomain, fetchAndSaveLogo, getToolsDb, saveToolsDb } from './logoService.js';

/**
 * Knowledge base of 10 distinct, popular anti-bloat micro-tools and productivity apps.
 * Used by the AI batch generation engine to stage comprehensive drafts with downloaded local logos.
 */
export const CURATED_10_ANTI_BLOAT_TOOLS = [
  {
    name: 'Zed Editor',
    website: 'https://zed.dev',
    domain: 'zed.dev',
    category: 'Utilities',
    brandColor: '#00D1A0',
    tagline: 'High-performance, multiplayer code editor written in Rust.',
    description: 'Ultra-fast, Rust-powered code editor engineered with GPU acceleration for instantaneous startup and sub-millisecond typing latency.',
    replaces: 'VS Code & Heavy Electron Editors',
    replacesDetailed: 'Replaces VS Code’s 1GB+ Electron memory footprint with a high-performance Rust engine rendering at 120fps on the GPU with instantaneous file search.',
    targetAudience: 'Software engineers, systems programmers, and minimalists who refuse to wait for editor lag.',
    learningCurve: { level: 'Low', score: 2, timeToLearn: '8 mins', summary: 'Familiar VS Code keymaps with instant responsiveness and built-in language servers.' },
    tutorialCount: 16,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to VS Code', 'Open Source', 'GPU-Accelerated']
  },
  {
    name: 'Excalidraw',
    website: 'https://excalidraw.com',
    domain: 'excalidraw.com',
    category: 'Design',
    brandColor: '#6965DB',
    tagline: 'Virtual collaborative whiteboard for sketching hand-drawn diagrams.',
    description: 'Infinite virtual whiteboard featuring a delightfully minimal hand-drawn aesthetic, real-time collaboration, and zero required logins.',
    replaces: 'Miro & Cluttered Enterprise Whiteboards',
    replacesDetailed: 'Eliminates paywalled collaborative canvas limits, heavy UI toolbars, and mandatory signups with an end-to-end encrypted virtual hand-drawn whiteboard.',
    targetAudience: 'Product architects, engineering teams, and visual thinkers who need rapid sketching without corporate overhead.',
    learningCurve: { level: 'Gentle', score: 1, timeToLearn: '3 mins', summary: 'Pick a tool and draw. Zero onboarding hoops or permissions setup required.' },
    tutorialCount: 19,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Miro', 'Open Source', 'End-to-End Encrypted']
  },
  {
    name: 'Ghost',
    website: 'https://ghost.org',
    domain: 'ghost.org',
    category: 'Writing',
    brandColor: '#15171A',
    tagline: 'Modern, open-source platform for independent journalists and publishers.',
    description: 'Professional, distraction-free publishing platform powered by Node.js with native membership, newsletters, and zero bloated plugins.',
    replaces: 'WordPress & Bloated CMS Plugins',
    replacesDetailed: 'Replaces endless plugin security vulnerabilities, bloated database queries, and slow page caching with a modern Node.js publishing platform tailored for creators.',
    targetAudience: 'Independent journalists, newsletter writers, publication teams, and niche bloggers.',
    learningCurve: { level: 'Low', score: 2, timeToLearn: '12 mins', summary: 'Clean split-free Markdown and rich cards. Built-in members and email delivery without 20 plugins.' },
    tutorialCount: 26,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to WordPress', 'Open Source', 'Built-in Newsletters']
  },
  {
    name: 'Cal.com',
    website: 'https://cal.com',
    domain: 'cal.com',
    category: 'Organization',
    brandColor: '#292929',
    tagline: 'Customizable, privacy-respecting scheduling infrastructure for everyone.',
    description: 'Open-source, privacy-first scheduling infrastructure replacing corporate calendar paywalls with full customization and self-hosting.',
    replaces: 'Calendly & Paywalled Booking Platforms',
    replacesDetailed: 'Replaces Calendly’s restrictive single-calendar free limitations and enterprise pricing with a self-hostable, developer-friendly scheduling infrastructure.',
    targetAudience: 'Consultants, remote teams, founders, and developers wanting full control over calendar bookings.',
    learningCurve: { level: 'Gentle', score: 1, timeToLearn: '5 mins', summary: 'Connect your Google or Outlook calendar and share your link in under 3 minutes.' },
    tutorialCount: 18,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Calendly', 'Open Source', 'Self-Hostable']
  },
  {
    name: 'Hoppscotch',
    website: 'https://hoppscotch.com',
    domain: 'hoppscotch.com',
    category: 'Utilities',
    brandColor: '#2563EB',
    tagline: 'Open-source, web-first API testing and development client.',
    description: 'Sub-second, web-native API development ecosystem that fires REST and GraphQL requests instantly with zero forced desktop installation.',
    replaces: 'Postman & Heavy Desktop API Clients',
    replacesDetailed: 'Replaces Postman’s forced cloud login, 500MB desktop client, and workspace paywalls with a lightning-fast, web-first API testing suite.',
    targetAudience: 'Backend developers, QA engineers, and API builders looking for immediate request dispatching.',
    learningCurve: { level: 'Gentle', score: 1, timeToLearn: '4 mins', summary: 'Familiar HTTP methods and REST/GraphQL payload fields with instantaneous execution.' },
    tutorialCount: 15,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Postman', 'Open Source', 'Zero-Install']
  },
  {
    name: 'Baserow',
    website: 'https://baserow.io',
    domain: 'baserow.io',
    category: 'Organization',
    brandColor: '#5B45FF',
    tagline: 'Open-source no-code relational database and flexible Airtable alternative.',
    description: 'Open-source no-code database and Airtable alternative delivering limitless relational rows with modern views and self-hosting freedom.',
    replaces: 'Airtable & Proprietary No-Code Databases',
    replacesDetailed: 'Replaces Airtable’s severe row limits, locked-in cloud pricing, and closed database ecosystem with a scalable open-source no-code relational database.',
    targetAudience: 'Operations leads, no-code developers, product managers, and agencies needing database flexibility.',
    learningCurve: { level: 'Low', score: 2, timeToLearn: '15 mins', summary: 'Grid, gallery, and kanban views that feel identical to Airtable with self-hosting freedom.' },
    tutorialCount: 22,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Airtable', 'Open Source', 'Self-Hostable']
  },
  {
    name: 'Plausible Analytics',
    website: 'https://plausible.io',
    domain: 'plausible.io',
    category: 'Utilities',
    brandColor: '#6366F1',
    tagline: 'Simple, lightweight, privacy-focused open source Google Analytics alternative.',
    description: 'Privacy-focused, sub-1KB web analytics dashboard providing high-value visitor insights without intrusive tracking cookies or complex menus.',
    replaces: 'Google Analytics 4 & Heavy Tracking Bloat',
    replacesDetailed: 'Replaces GA4’s convoluted 50-page menu maze, intrusive cookie banners, and 45KB tracker scripts with a sub-1KB, privacy-first analytics dashboard.',
    targetAudience: 'Indie founders, content creators, and privacy-conscious web developers.',
    learningCurve: { level: 'Gentle', score: 1, timeToLearn: '3 mins', summary: 'Single-page analytics dashboard. Zero training or cookie banner configuration needed.' },
    tutorialCount: 14,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Google Analytics', 'Open Source', 'Cookie-Free']
  },
  {
    name: 'Kitemaker',
    website: 'https://kitemaker.co',
    domain: 'kitemaker.co',
    category: 'Organization',
    brandColor: '#F43F5E',
    tagline: 'Fast, keyboard-driven product collaboration and issue tracking.',
    description: 'Ultra-responsive issue tracker built around conversations and keyboard shortcuts, stripping away Jira\'s administrative overhead.',
    replaces: 'Jira & Bureaucratic Issue Trackers',
    replacesDetailed: 'Replaces Jira’s slow drag-and-drop ticket boards and endless custom fields with hotkey-driven, discussion-centric product discovery for agile engineering squads.',
    targetAudience: 'Engineering squads and high-velocity product teams who prioritize building over ticket bureaucracy.',
    learningCurve: { level: 'Low', score: 2, timeToLearn: '8 mins', summary: 'Keyboard-driven work items with seamless GitHub and Slack integrations.' },
    tutorialCount: 12,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Jira', 'Keyboard-First']
  },
  {
    name: 'Snipd',
    website: 'https://snipd.com',
    domain: 'snipd.com',
    category: 'Video',
    brandColor: '#06B6D4',
    tagline: 'AI podcast player that captures, transcribes, and organizes audio knowledge.',
    description: 'AI-powered podcast player that highlights spoken ideas, transcribes audio instantly, and exports key takeaways to your second brain.',
    replaces: 'Bloated Podcast Players & Heavy Audio Editors',
    replacesDetailed: 'Replaces sluggish podcast players with one-tap AI audio bookmarking, automated transcripts, key takeaways, and smart silence removal.',
    targetAudience: 'Podcast listeners, researchers, and lifelong learners wanting to retain audio insights.',
    learningCurve: { level: 'Gentle', score: 1, timeToLearn: '4 mins', summary: 'Tap headphone button to snip insights. AI automatically transcribes and syncs to Notion/Obsidian.' },
    tutorialCount: 10,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Smart Transcripts', 'AI-Powered']
  },
  {
    name: 'Standard Notes',
    website: 'https://standardnotes.com',
    domain: 'standardnotes.com',
    category: 'Writing',
    brandColor: '#3B82F6',
    tagline: 'End-to-end encrypted note-taking app designed for digital longevity.',
    description: 'End-to-end encrypted, zero-knowledge note-taking app ensuring 100-year digital permanence with lightweight plain text and Markdown.',
    replaces: 'Evernote, Google Docs & Proprietary Note Lock-in',
    replacesDetailed: 'Replaces heavy cloud note bloat and surveillance capitalist data mining with end-to-end encrypted, zero-knowledge plain text and Markdown notes.',
    targetAudience: 'Journalists, researchers, novelists, and privacy advocates needing eternal note longevity.',
    learningCurve: { level: 'Low', score: 2, timeToLearn: '6 mins', summary: 'Clean interface with local encryption and instant multi-device synchronization.' },
    tutorialCount: 18,
    tags: ['Beginner-Friendly', 'Free Tier Available', 'Alternative to Evernote', 'Open Source', 'End-to-End Encrypted']
  }
];

/**
 * AI Tool Analyzer Engine
 * Takes input name or website, uses heuristics and external AI to synthesize
 * complete anti-bloat directory metadata.
 */
export async function analyzeToolWithAI({ name: rawName, website: rawWebsite }) {
  let domain = extractDomain(rawWebsite || rawName);
  let cleanName = rawName ? rawName.trim() : '';

  // If website provided without name, deduce clean name from domain
  if (!cleanName && domain) {
    const basePart = domain.split('.')[0];
    cleanName = basePart.charAt(0).toUpperCase() + basePart.slice(1);
  }

  if (!domain && cleanName) {
    domain = `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;
  }

  const lookupKey = (cleanName || domain).toLowerCase().replace(/[^a-z0-9]/g, '');
  const matchedProfile = CURATED_10_ANTI_BLOAT_TOOLS.find(t => 
    lookupKey.includes(t.domain.split('.')[0]) || lookupKey.includes(t.name.toLowerCase().replace(/[^a-z0-9]/g, ''))
  );

  // Try calling Gemini API if GEMINI_API_KEY is configured
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey && geminiKey.length > 10) {
    try {
      console.log(`[AI Analyzer] Querying Gemini API for ${cleanName || domain}...`);
      const prompt = `Analyze this software tool for an "Anti-Bloat Micro-Tools Directory":
Name: ${cleanName}
Domain: ${domain}
Return JSON strictly with:
{
  "name": "${cleanName}",
  "category": "Organization" | "Video" | "Utilities" | "Writing" | "Design",
  "tagline": "Concise 1-sentence tagline",
  "whatItReplaces": "What bloated legacy tool it replaces (e.g. Jira, Slack, Notion)",
  "replacesDetailed": "Why it is anti-bloat and faster than bloated giants",
  "targetAudience": "Target audience",
  "tags": ["Beginner-Friendly", "Free Tier Available", "Alternative to [Competitor]", "Open Source"],
  "learningCurveLevel": "Gentle" | "Low" | "Moderate" | "Steep",
  "learningCurveTime": "e.g. 5 mins",
  "learningCurveSummary": "Reasoning for curve",
  "tutorialCount": 14,
  "brandColor": "#hexColor"
}`;
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`;
      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (resp.ok) {
        const geminiData = await resp.json();
        const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          const parsed = JSON.parse(text);
          console.log(`[AI Analyzer] Gemini generated metadata for ${cleanName}`);
          return formatAIResult(parsed, domain, cleanName);
        }
      }
    } catch (err) {
      console.warn('[AI Analyzer] Gemini API fallback to internal engine:', err.message);
    }
  }

  // Use internal intelligent heuristic engine
  const slug = (cleanName || domain).toLowerCase().replace(/[^a-z0-9_-]/gi, '-');

  let category = 'Utilities';
  let replaces = 'Bloated Legacy Software';
  let replacesDetailed = `Replaces heavy enterprise suites with a lightweight, distraction-free architecture.`;
  let targetAudience = 'Developers, creators, and professionals who demand instant response times.';
  let learningCurve = {
    level: 'Gentle',
    score: 1,
    timeToLearn: '5 mins',
    summary: 'Intuitive interface designed for immediate productivity with zero setup friction.'
  };
  let tutorialCount = Math.floor(Math.random() * 12) + 10;
  let brandColor = '#4f46e5';
  let tags = ['Beginner-Friendly', 'Free Tier Available', 'Sub-50ms Sync'];

  if (matchedProfile) {
    cleanName = matchedProfile.name;
    category = matchedProfile.category;
    replaces = matchedProfile.replaces;
    replacesDetailed = matchedProfile.replacesDetailed;
    targetAudience = matchedProfile.targetAudience;
    learningCurve = matchedProfile.learningCurve;
    tutorialCount = matchedProfile.tutorialCount;
    brandColor = matchedProfile.brandColor;
    tags = matchedProfile.tags;
  } else {
    // Intelligent domain category heuristics
    const low = (cleanName + ' ' + domain).toLowerCase();
    if (low.includes('edit') || low.includes('write') || low.includes('blog') || low.includes('text') || low.includes('mark') || low.includes('type')) {
      category = 'Writing';
      replaces = 'Microsoft Word & Bloated Rich Text Editors';
      tags.push('Alternative to MS Word');
    } else if (low.includes('video') || low.includes('screen') || low.includes('record') || low.includes('cut') || low.includes('clip') || low.includes('cam') || low.includes('podcast')) {
      category = 'Video';
      replaces = 'Loom & Heavy Cloud Screen Recorders';
      tags.push('Alternative to Loom');
      learningCurve.timeToLearn = '6 mins';
    } else if (low.includes('draw') || low.includes('design') || low.includes('figma') || low.includes('canvas') || low.includes('art') || low.includes('ui')) {
      category = 'Design';
      replaces = 'Figma & Proprietary Cloud Design Suites';
      tags.push('Alternative to Figma');
      learningCurve = { level: 'Low', score: 2, timeToLearn: '10 mins', summary: 'Clean vector canvas with minimal toolbar clutter.' };
    } else if (low.includes('task') || low.includes('plan') || low.includes('note') || low.includes('cal') || low.includes('time') || low.includes('base') || low.includes('schedule')) {
      category = 'Organization';
      replaces = 'Notion & Cluttered Project Portals';
      tags.push('Alternative to Notion');
    }
  }

  const result = {
    name: cleanName || domain,
    slug,
    website: rawWebsite || `https://${domain}`,
    domain,
    brandColor,
    tagline: matchedProfile?.tagline || `Lightweight, high-speed ${category.toLowerCase()} micro-tool.`,
    description: matchedProfile?.description || matchedProfile?.tagline || `Lightweight, high-speed ${category.toLowerCase()} micro-tool engineered to eliminate software bloat.`,
    category,
    whatItReplaces: replaces,
    replacesDetailed,
    targetAudience,
    tags,
    learningCurve,
    tutorialCount,
    tutorialMeta: {
      videoGuides: Math.ceil(tutorialCount * 0.4),
      stepByStepDocs: Math.ceil(tutorialCount * 0.4),
      communityShortcuts: Math.max(1, tutorialCount - Math.ceil(tutorialCount * 0.4) * 2)
    },
    pricing: 'Free tier available / Transparent pricing',
    affiliateUrl: matchedProfile?.affiliateUrl || `${(rawWebsite || `https://${domain}`).replace(/\/+$/, '')}/?ref=curateless`,
    status: 'draft',
    aiGeneratedAt: new Date().toISOString(),
    lessonPlan: {
      title: `${cleanName} Zero-Bloat Quickstart`,
      subtitle: `Get started with ${cleanName} in under ${learningCurve.timeToLearn}.`,
      estimatedTime: learningCurve.timeToLearn,
      difficulty: learningCurve.level === 'Gentle' ? 'Beginner' : 'Intermediate',
      overview: `A streamlined 5-step curriculum to replace bloated tools and master ${cleanName} without cognitive fatigue.`,
      prerequisites: ['Web browser or local application install'],
      steps: [
        {
          stepNumber: 1,
          title: 'Initialization & Clean Defaults',
          timeEstimate: '2 mins',
          description: 'Launch the application and disable non-essential notification badges.',
          actionItems: ['Open application', 'Turn off unnecessary alerts and marketing popups'],
          proTip: 'Start with default minimalist settings to avoid early configuration burnout.'
        },
        {
          stepNumber: 2,
          title: 'Core Workflow Execution',
          timeEstimate: '3 mins',
          description: 'Perform your primary daily task without navigating through heavy multi-layered menus.',
          actionItems: ['Execute standard action', 'Notice the immediate sub-50ms responsiveness'],
          proTip: 'Learn the primary hotkey for creating new entries instantly.'
        },
        {
          stepNumber: 3,
          title: 'Keyboard Hotkeys & Flow State',
          timeEstimate: '2 mins',
          description: 'Map essential shortcuts to keep your hands on the keyboard.',
          actionItems: ['Review the cheat sheet', 'Test navigation commands'],
          proTip: 'Press ? anywhere to inspect available keyboard combinations.'
        },
        {
          stepNumber: 4,
          title: 'Local Data Export & Sovereignty',
          timeEstimate: '2 mins',
          description: 'Ensure your data is readily exportable in open formats with zero vendor lock-in.',
          actionItems: ['Locate export options', 'Confirm standard formats (JSON/Markdown/CSV)'],
          proTip: 'Keep regular offline backups of your workspace.'
        },
        {
          stepNumber: 5,
          title: 'Team Handoff or Daily Automation',
          timeEstimate: '2 mins',
          description: 'Share lightweight outputs with colleagues without forcing them to register accounts.',
          actionItems: ['Generate clean share link', 'Verify distraction-free viewer mode'],
          proTip: 'Colleagues can view your outputs without signing up for enterprise seats.'
        }
      ]
    }
  };

  return result;
}

function formatAIResult(parsed, domain, cleanName) {
  const curveScoreMap = { 'Gentle': 1, 'Low': 2, 'Moderate': 3, 'Steep': 4 };
  const level = parsed.learningCurveLevel || 'Gentle';
  const score = curveScoreMap[level] || 1;
  const count = parsed.tutorialCount || 15;

  return {
    name: parsed.name || cleanName || domain,
    slug: (parsed.name || domain).toLowerCase().replace(/[^a-z0-9_-]/gi, '-'),
    website: `https://${domain}`,
    domain,
    brandColor: parsed.brandColor || '#4f46e5',
    tagline: parsed.tagline || `Minimalist ${parsed.category || 'productivity'} micro-tool.`,
    description: parsed.description || parsed.tagline || `Minimalist ${parsed.category || 'productivity'} micro-tool designed to eliminate bloat.`,
    category: parsed.category || 'Utilities',
    whatItReplaces: parsed.whatItReplaces || 'Bloated enterprise software',
    replacesDetailed: parsed.replacesDetailed || 'Streamlined alternative with sub-50ms responsiveness.',
    targetAudience: parsed.targetAudience || 'Modern digital minimalists and power users.',
    tags: parsed.tags || ['Beginner-Friendly', 'Free Tier Available'],
    learningCurve: {
      level,
      score,
      timeToLearn: parsed.learningCurveTime || '8 mins',
      summary: parsed.learningCurveSummary || 'Short learning curve with immediate productivity payoff.'
    },
    tutorialCount: count,
    tutorialMeta: {
      videoGuides: Math.ceil(count * 0.4),
      stepByStepDocs: Math.ceil(count * 0.4),
      communityShortcuts: Math.max(1, count - Math.ceil(count * 0.4) * 2)
    },
    pricing: 'Free tier available / Open pricing',
    status: 'draft',
    aiGeneratedAt: new Date().toISOString()
  };
}

/**
 * Automatically generates a curated batch of 10 distinct, popular anti-bloat micro-tools
 * as draft cards, downloading official logos to local storage (/public/logos/{slug}.png),
 * generating learning curve, tutorial count, and saving them to the persistent database.
 */
export async function generateCuratedBatchOf10Drafts() {
  console.log('[AI Batch Sync] Generating curated batch of 10 anti-bloat micro-tools...');
  const existingTools = getToolsDb();
  const generatedDrafts = [];

  for (const toolSeed of CURATED_10_ANTI_BLOAT_TOOLS) {
    console.log(`[AI Batch Sync] Processing: ${toolSeed.name} (${toolSeed.domain})...`);

    // 1. Analyze & generate full AI metadata
    const aiData = await analyzeToolWithAI({ name: toolSeed.name, website: toolSeed.website });

    // 2. Fetch and download official logo directly into local project storage (/public/logos/{slug}.png)
    let localLogoPath = `/logos/${aiData.slug}.png`;
    try {
      const logoRes = await fetchAndSaveLogo({
        website: toolSeed.website,
        slug: aiData.slug,
        name: toolSeed.name,
        domain: toolSeed.domain
      });
      if (logoRes && logoRes.localLogoPath) {
        localLogoPath = logoRes.localLogoPath;
      }
    } catch (logoErr) {
      console.warn(`[AI Batch Sync] Logo save notice for ${toolSeed.name}:`, logoErr.message);
    }

    // 3. Assemble draft tool object with local file path
    const draftTool = {
      id: `draft-${Date.now()}-${aiData.slug}`,
      ...aiData,
      localLogoPath,
      brandColor: toolSeed.brandColor || aiData.brandColor || '#4f46e5',
      status: 'draft',
      affiliateUrl: toolSeed.affiliateUrl || (toolSeed.website ? `${toolSeed.website.replace(/\/+$/, '')}/?ref=curateless` : `https://${aiData.domain}/?ref=curateless`),
      affiliateBadge: 'Partner Pick',
      affiliatePerk: 'Verified Anti-Bloat Recommendation',
      createdAt: new Date().toISOString()
    };

    generatedDrafts.push(draftTool);
  }

  // 5. Deduplicate: replace any existing drafts with the same slug or prepend
  const currentDb = getToolsDb();
  const nonConflictingTools = currentDb.filter(t => 
    !generatedDrafts.some(g => g.slug === t.slug && t.status === 'draft')
  );

  saveToolsDb([...generatedDrafts, ...nonConflictingTools]);
  console.log(`[AI Batch Sync] Successfully generated and staged all ${generatedDrafts.length} drafts!`);

  return generatedDrafts;
}
