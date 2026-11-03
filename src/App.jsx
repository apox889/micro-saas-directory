import React, { useState, useEffect, useMemo } from 'react';
import { TOOLS_DATA, CATEGORIES, LEARNING_CURVE_CONFIG } from './data/toolsData';
import { PUBLISHED_TOOLS } from './data/publishedTools';
import Header from './components/Header';
import FilterBar from './components/FilterBar';
import ToolCard from './components/ToolCard';
import LessonPlanView from './components/LessonPlanView';
import AdminStagingDashboard from './components/AdminStagingDashboard';
import AffiliateModal from './components/AffiliateModal';
import AntiBloatManifesto from './components/AntiBloatManifesto';
import SubmitToolModal from './components/SubmitToolModal';
import { Zap, ShieldCheck, Flame, Layers, SearchX, CheckCircle, Sparkles } from 'lucide-react';

/**
 * Checks if the current browser URL path is exclusively /admin
 */
function checkIsAdminRoute() {
  if (typeof window === 'undefined') return false;
  const path = window.location.pathname.replace(/\/$/, '');
  const hash = window.location.hash;
  return path === '/admin' || hash === '#/admin' || hash === '#admin';
}

export default function App() {
  // Initialize with pre-compiled static published tools (for decoupled static hosting)
  const [tools, setTools] = useState(() => {
    if (Array.isArray(PUBLISHED_TOOLS) && PUBLISHED_TOOLS.length > 0) {
      return PUBLISHED_TOOLS;
    }
    return TOOLS_DATA;
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [activeTag, setActiveTag] = useState(null);
  
  // Navigation / Route state
  const [activeLessonTool, setActiveLessonTool] = useState(null);
  const [isAdminView, setIsAdminView] = useState(() => checkIsAdminRoute());
  const [draftCount, setDraftCount] = useState(0);
  
  // Modals state
  const [affiliateTool, setAffiliateTool] = useState(null);
  const [showManifesto, setShowManifesto] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem('curateless_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('curateless_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('curateless_theme', 'light');
    }
  }, [darkMode]);

  // Fetch initial published tools & draft count from backend API (if running) with static fallback
  const refreshBackendData = async () => {
    try {
      // 1. Fetch public tools from backend API
      const toolsRes = await fetch('/api/tools').catch(() => null);
      if (toolsRes && toolsRes.ok) {
        const toolsData = await toolsRes.json();
        if (toolsData.success && Array.isArray(toolsData.tools) && toolsData.tools.length > 0) {
          setTools(toolsData.tools);
        }
      } else {
        // Fallback for decoupled static hosting: fetch /data/tools.json
        const staticRes = await fetch('/data/tools.json').catch(() => null);
        if (staticRes && staticRes.ok) {
          const staticData = await staticRes.json();
          if (staticData.success && Array.isArray(staticData.tools) && staticData.tools.length > 0) {
            setTools(staticData.tools);
          }
        }
      }

      // 2. Fetch drafts count if backend is running
      const draftsRes = await fetch('/api/admin/drafts').catch(() => null);
      if (draftsRes && draftsRes.ok) {
        const draftsData = await draftsRes.json();
        if (draftsData.success) {
          setDraftCount(draftsData.count || 0);
        }
      }
    } catch (err) {
      // Quiet fallback for static decoupled hosting
      console.info('Static decoupled mode: using pre-built published dataset.');
    }
  };

  useEffect(() => {
    refreshBackendData();
  }, []);

  // Strict routing listener for /admin and #/lesson-plan/:slug
  useEffect(() => {
    const handleLocationChange = () => {
      // Check if user navigated to /admin
      const onAdmin = checkIsAdminRoute();
      setIsAdminView(onAdmin);

      if (onAdmin) {
        setActiveLessonTool(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      // Check if user navigated to lesson plan
      const hash = window.location.hash;
      if (hash.startsWith('#/lesson-plan/')) {
        const slug = hash.replace('#/lesson-plan/', '');
        const found = tools.find((t) => t.slug === slug || t.id === slug);
        if (found) {
          setActiveLessonTool(found);
          window.scrollTo({ top: 0, behavior: 'smooth' });
          return;
        }
      }

      setActiveLessonTool(null);
    };

    handleLocationChange();
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, [tools]);

  const handleSelectLessonPlan = (tool) => {
    setActiveLessonTool(tool);
    setIsAdminView(false);
    window.location.hash = `#/lesson-plan/${tool.slug}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToDirectory = () => {
    setActiveLessonTool(null);
    setIsAdminView(false);
    if (window.location.pathname.startsWith('/admin')) {
      window.history.pushState({}, '', '/');
    }
    window.location.hash = '';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToolPublished = (publishedTool) => {
    setTools((prev) => [publishedTool, ...prev.filter(t => t.id !== publishedTool.id)]);
    setDraftCount((prev) => Math.max(0, prev - 1));
    refreshBackendData();
  };

  const handleToolUpdated = (updatedTool) => {
    setTools((prev) => prev.map(t => t.id === updatedTool.id ? updatedTool : t));
    refreshBackendData();
  };

  const handleToolDeleted = (deletedId) => {
    setTools((prev) => prev.filter(t => t.id !== deletedId));
    setDraftCount((prev) => Math.max(0, prev - 1));
    refreshBackendData();
  };

  const handleTagClick = (tag) => {
    if (activeTag === tag) {
      setActiveTag(null);
    } else {
      setActiveTag(tag);
      window.scrollTo({ top: 280, behavior: 'smooth' });
    }
  };

  const handleAddSuggestedTool = (newToolSubmission) => {
    const newTool = {
      id: `custom-${Date.now()}`,
      slug: newToolSubmission.name.toLowerCase().replace(/\s+/g, '-'),
      name: newToolSubmission.name,
      website: newToolSubmission.website || "https://example.com",
      domain: newToolSubmission.website ? newToolSubmission.website.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '') : "example.com",
      localLogoPath: newToolSubmission.localLogoPath || null,
      brandColor: "#4f46e5",
      logoLetter: newToolSubmission.name.substring(0, 2).toUpperCase(),
      tagline: `Modern, streamlined ${newToolSubmission.category.toLowerCase()} micro-tool.`,
      category: newToolSubmission.category,
      whatItReplaces: newToolSubmission.whatItReplaces,
      replacesDetailed: `Replaces legacy overhead with clean, lightweight architecture.`,
      targetAudience: newToolSubmission.targetAudience,
      learningCurve: {
        level: newToolSubmission.learningCurve,
        score: LEARNING_CURVE_CONFIG[newToolSubmission.learningCurve]?.score || 2,
        timeToLearn: "10 mins",
        summary: "Community submitted anti-bloat tool."
      },
      tutorialCount: 5,
      tutorialMeta: { videoGuides: 2, stepByStepDocs: 3, communityShortcuts: 1 },
      tags: ["Community Pick", "Beginner-Friendly", "Free Tier Available"],
      pricing: "Free tier / Open",
      affiliateUrl: newToolSubmission.website || "https://example.com",
      affiliateBadge: "Community Pick",
      affiliatePerk: "Free community recommended tool",
      dateAdded: new Date().toISOString().split('T')[0],
      lessonPlan: {
        title: `${newToolSubmission.name} Quickstart Guide`,
        subtitle: "Step-by-step onboarding curriculum.",
        estimatedTime: "10 minutes",
        difficulty: "Beginner",
        overview: `A concise onboarding guide to master ${newToolSubmission.name} without bloat.`,
        prerequisites: ["An account or local download"],
        steps: [
          {
            stepNumber: 1,
            title: "Quickstart Setup",
            timeEstimate: "3 mins",
            description: "Download and set up minimal default settings.",
            actionItems: ["Complete installation", "Set up minimal preferences"],
            proTip: "Keep configurations default to avoid early setup fatigue."
          },
          {
            stepNumber: 2,
            title: "Core Workflow Execution",
            timeEstimate: "4 mins",
            description: "Execute your primary daily workflow in under 4 minutes.",
            actionItems: ["Test the key feature", "Observe speed differences"],
            proTip: "Focus only on the primary action you need to perform daily."
          }
        ]
      }
    };

    setTools([newTool, ...tools]);
  };

  // Filter & Sort calculation
  const filteredAndSortedTools = useMemo(() => {
    return tools
      .filter((tool) => {
        // Hide drafts from public directory
        if (tool.status === 'draft') return false;

        // Category filter
        if (selectedCategory !== "All" && tool.category !== selectedCategory) {
          return false;
        }

        // Tag filter
        if (activeTag && !tool.tags.includes(activeTag)) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = tool.name.toLowerCase().includes(q);
          const matchesReplaces = tool.whatItReplaces.toLowerCase().includes(q) || (tool.replacesDetailed && tool.replacesDetailed.toLowerCase().includes(q));
          const matchesAudience = tool.targetAudience.toLowerCase().includes(q);
          const matchesCategory = tool.category.toLowerCase().includes(q);
          const matchesTag = tool.tags.some((t) => t.toLowerCase().includes(q));
          return matchesName || matchesReplaces || matchesAudience || matchesCategory || matchesTag;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "newest") {
          return new Date(b.dateAdded || 0) - new Date(a.dateAdded || 0);
        }
        if (sortBy === "learning-gentle") {
          return (a.learningCurve.score || 1) - (b.learningCurve.score || 1);
        }
        if (sortBy === "tutorials-most") {
          return (b.tutorialCount || 0) - (a.tutorialCount || 0);
        }
        if (sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [tools, selectedCategory, activeTag, searchQuery, sortBy]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const activeTools = tools.filter(t => t.status !== 'draft');
    const counts = { All: activeTools.length };
    CATEGORIES.forEach((cat) => {
      if (cat !== "All") {
        counts[cat] = activeTools.filter((t) => t.category === cat).length;
      }
    });
    return counts;
  }, [tools]);

  return (
    <div className="min-h-screen flex flex-col transition-colors selection:bg-zinc-900 selection:text-white dark:selection:bg-white dark:selection:text-zinc-900">
      {/* Header - Keeps Admin link completely hidden from public homepage and normal navigation */}
      <Header
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenSuggest={() => setShowSubmitModal(true)}
        onTogglePhilosophy={() => setShowManifesto(true)}
        isAdminView={isAdminView}
        onExitAdmin={handleBackToDirectory}
        toolCount={tools.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {isAdminView ? (
          /* Admin Staging & AI Pipeline Dashboard — Exclusively rendered at /admin */
          <AdminStagingDashboard
            onBackToDirectory={handleBackToDirectory}
            onToolPublished={handleToolPublished}
            onToolUpdated={handleToolUpdated}
            onToolDeleted={handleToolDeleted}
          />
        ) : activeLessonTool ? (
          /* Dedicated Lesson Plan Page Route */
          <LessonPlanView
            tool={activeLessonTool}
            onBack={handleBackToDirectory}
          />
        ) : (
          /* Public Directory View */
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            {/* Hero Section */}
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-4 shadow-subtle">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>The Curated Anti-Bloat Directory</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight leading-tight sm:leading-tight mb-4">
                Fast, Distraction-Free Micro-Tools That Replace Heavy Software.
              </h1>

              <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Tired of sluggish 500-feature software suites with endless menus? Discover curated micro-tools with gentle learning curves, honest pricing, and step-by-step onboarding lessons.
              </p>

              {/* Anti-Bloat Stat Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8 max-w-2xl mx-auto text-left">
                <div className="p-3 rounded-xl bg-white dark:bg-[#141517] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                  <div className="text-xs text-zinc-400 font-medium">Curated Tools</div>
                  <div className="text-lg font-bold text-zinc-900 dark:text-zinc-100 font-mono mt-0.5">
                    {filteredAndSortedTools.length} Live
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#141517] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                  <div className="text-xs text-zinc-400 font-medium">Avg Load Speed</div>
                  <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                    &lt; 30ms
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#141517] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                  <div className="text-xs text-zinc-400 font-medium">Available Guides</div>
                  <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {filteredAndSortedTools.reduce((acc, t) => acc + (t.tutorialCount || 0), 0)}+ Guides
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-[#141517] border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
                  <div className="text-xs text-zinc-400 font-medium">Bloat Reduction</div>
                  <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                    ~85% Less RAM
                  </div>
                </div>
              </div>
            </div>

            {/* Filter & Sort Controls */}
            <FilterBar
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              sortBy={sortBy}
              onSortChange={setSortBy}
              activeTag={activeTag}
              onClearTag={() => setActiveTag(null)}
              categoryCounts={categoryCounts}
              totalResults={filteredAndSortedTools.length}
            />

            {/* Tool Grid Results */}
            {filteredAndSortedTools.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAndSortedTools.map((tool) => (
                  <ToolCard
                    key={tool.id}
                    tool={tool}
                    onSelectLessonPlan={handleSelectLessonPlan}
                    onTagClick={handleTagClick}
                    activeTag={activeTag}
                  />
                ))}
              </div>
            ) : (
              /* Empty Search Results */
              <div className="text-center py-16 bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-lg mx-auto">
                <SearchX className="w-10 h-10 text-zinc-400 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                  No matching anti-bloat tools found
                </h3>
                <p className="text-xs text-zinc-500 mb-5">
                  Try adjusting your search terms or clearing selected tag filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setActiveTag(null);
                  }}
                  className="px-4 py-2 rounded-lg text-xs font-medium bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                >
                  Reset All Filters
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Clean Public Footer — Completely hidden from normal navigation */}
      <footer className="mt-auto border-t border-zinc-200/80 dark:border-zinc-800/80 bg-white/50 dark:bg-[#0c0d0e]/50 py-8 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200">CurateLess</span>
            <span>— The anti-bloat software index.</span>
          </div>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setShowManifesto(true)}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Anti-Bloat Manifesto
            </button>
            <button
              type="button"
              onClick={() => setShowSubmitModal(true)}
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              Submit a Tool
            </button>
            <span className="text-[11px] opacity-75">
              Zero popups • Zero trackers
            </span>
          </div>
        </div>
      </footer>

      {/* Outbound Affiliate Referral Modal */}
      <AffiliateModal
        tool={affiliateTool}
        isOpen={!!affiliateTool}
        onClose={() => setAffiliateTool(null)}
      />

      {/* Manifesto Modal */}
      <AntiBloatManifesto
        isOpen={showManifesto}
        onClose={() => setShowManifesto(false)}
      />

      {/* Submit Tool Modal */}
      <SubmitToolModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onAddTool={handleAddSuggestedTool}
      />
    </div>
  );
}
