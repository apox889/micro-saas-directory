import React, { useState, useEffect } from 'react';
import ToolBrandLogo from './ToolBrandLogo';
import LearningCurveMeter from './LearningCurveMeter';
import TutorialCounter from './TutorialCounter';
import TagBadge from './TagBadge';
import { 
  Sparkles, 
  ArrowLeft, 
  Send, 
  ExternalLink, 
  Link2, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  UploadCloud, 
  Download,
  Clock, 
  ShieldCheck, 
  Users, 
  Loader2, 
  Plus, 
  Edit3, 
  Layers, 
  Check, 
  Zap, 
  SlidersHorizontal,
  Bookmark,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { CATEGORIES } from '../data/toolsData';

export default function AdminStagingDashboard({ 
  onBackToDirectory, 
  onToolPublished,
  onToolUpdated,
  onToolDeleted
}) {
  const [drafts, setDrafts] = useState([]);
  const [publishedTools, setPublishedTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);

  // Active top tab: 'ai-batch' | 'manual'
  const [activeTab, setActiveTab] = useState('ai-batch'); // 'ai-batch' | 'manual'

  // Queue filter: 'drafts' | 'published' | 'all'
  const [queueFilter, setQueueFilter] = useState('drafts');

  // Inline Editing State for any tool record
  const [editingToolId, setEditingToolId] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // AI Single Ingestion state
  const [inputName, setInputName] = useState('');
  const [inputWebsite, setInputWebsite] = useState('');
  const [inputAffiliate, setInputAffiliate] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState('');

  // AI 10-Tool Batch Sync state
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);

  // Manual Form State
  const [manualName, setManualName] = useState('');
  const [manualDescription, setManualDescription] = useState('');
  const [manualWebsite, setManualWebsite] = useState('');
  const [manualCategory, setManualCategory] = useState('Utilities');
  const [manualReplaces, setManualReplaces] = useState('');
  const [manualReplacesDetailed, setManualReplacesDetailed] = useState('');
  const [manualAudience, setManualAudience] = useState('');
  const [manualCurveLevel, setManualCurveLevel] = useState('Gentle');
  const [manualCurveTime, setManualCurveTime] = useState('5 mins');
  const [manualTutorialCount, setManualTutorialCount] = useState('12');
  const [manualAffiliate, setManualAffiliate] = useState('');
  const [manualTagsInput, setManualTagsInput] = useState('Beginner-Friendly, Free Tier Available');
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);

  // Affiliate link inputs keyed by tool id
  const [affiliateLinks, setAffiliateLinks] = useState({});
  const [publishingId, setPublishingId] = useState(null);
  const [isExportingStatic, setIsExportingStatic] = useState(false);
  const [isPublishingLive, setIsPublishingLive] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Local Batch Import State (JSON / Feed)
  const [batchJsonInput, setBatchJsonInput] = useState('');
  const [isIngestingBatch, setIsIngestingBatch] = useState(false);
  const [batchParsedCount, setBatchParsedCount] = useState(null);
  const [batchParseError, setBatchParseError] = useState(null);
  const [batchImportReport, setBatchImportReport] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Export static production dataset
  const handleExportStatic = async () => {
    setIsExportingStatic(true);
    showToast('📦 Synchronizing and exporting static production dataset...');
    try {
      const res = await fetch('/api/admin/export-static', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Export failed');
      }
      showToast(`🎉 Exported ${data.count} published tools! Ready for static build & GitHub deploy.`);
    } catch (err) {
      showToast(`❌ Static export notice: ${err.message}`);
    } finally {
      setIsExportingStatic(false);
    }
  };

  // Publish Live: Synchronizes static data, stages database & logos, commits and pushes to GitHub main
  const handlePublishLive = async () => {
    setIsPublishingLive(true);
    showToast('🚀 Staging database & logo assets, creating commit, and pushing to GitHub...');
    try {
      const res = await fetch('/api/admin/publish-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to publish live to GitHub');
      }
      showToast(`🎉 ${data.message}`);
    } catch (err) {
      showToast(`❌ Publish Live failed: ${err.message}`);
    } finally {
      setIsPublishingLive(false);
    }
  };

  // Fetch all tools (drafts & published) from backend
  const loadTools = async () => {
    try {
      setLoadingTools(true);
      const res = await fetch('/api/admin/tools');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts || []);
        setPublishedTools(data.published || []);
        const linksMap = {};
        (data.tools || []).forEach(d => {
          linksMap[d.id] = d.affiliateUrl || '';
        });
        setAffiliateLinks(linksMap);
      }
    } catch (err) {
      console.warn('Error loading admin tools:', err);
    } finally {
      setLoadingTools(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, []);

  // Inline Editing Helpers
  const startEdit = (tool) => {
    setEditingToolId(tool.id);
    const existingTags = Array.isArray(tool.tags) ? tool.tags.join(', ') : (tool.tags || '');
    setEditFormData({
      name: tool.name || '',
      description: tool.description || tool.tagline || '',
      category: tool.category || 'Utilities',
      tags: existingTags,
      learningCurveLevel: tool.learningCurve?.level || 'Gentle',
      learningCurveTime: tool.learningCurve?.timeToLearn || '5 mins',
      learningCurveSummary: tool.learningCurve?.summary || '',
      tutorialCount: tool.tutorialCount || 10,
      affiliateUrl: affiliateLinks[tool.id] !== undefined ? affiliateLinks[tool.id] : (tool.affiliateUrl || ''),
      whatItReplaces: tool.whatItReplaces || '',
      replacesDetailed: tool.replacesDetailed || '',
      targetAudience: tool.targetAudience || ''
    });
  };

  const cancelEdit = () => {
    setEditingToolId(null);
    setEditFormData({});
  };

  const handleSaveInlineEdit = async (toolId) => {
    if (!editFormData.name?.trim()) {
      showToast('⚠️ Tool Name is required.');
      return;
    }

    setIsSavingEdit(true);
    try {
      const tagsArray = (editFormData.tags || '')
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        name: editFormData.name.trim(),
        description: editFormData.description.trim(),
        tagline: editFormData.description.trim(),
        category: editFormData.category,
        tags: tagsArray,
        learningCurveLevel: editFormData.learningCurveLevel,
        learningCurveTime: editFormData.learningCurveTime.trim() || '5 mins',
        learningCurveSummary: editFormData.learningCurveSummary,
        tutorialCount: parseInt(editFormData.tutorialCount, 10) || 10,
        affiliateUrl: editFormData.affiliateUrl.trim(),
        whatItReplaces: editFormData.whatItReplaces.trim(),
        replacesDetailed: editFormData.replacesDetailed.trim(),
        targetAudience: editFormData.targetAudience.trim()
      };

      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update tool.');
      }

      const updated = data.tool;
      showToast(`✨ "${updated.name}" updated successfully and reflected live!`);

      // Update state
      setDrafts(prev => prev.map(t => t.id === toolId ? updated : t));
      setPublishedTools(prev => prev.map(t => t.id === toolId ? updated : t));
      setAffiliateLinks(prev => ({ ...prev, [toolId]: updated.affiliateUrl }));
      setEditingToolId(null);

      // Instantly reflect on the public directory
      if (onToolUpdated) {
        onToolUpdated(updated);
      }
    } catch (err) {
      showToast(`❌ Update failed: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Delete / Remove individual tool or draft
  const handleDeleteTool = async (id, name, isDraft) => {
    if (!confirm(`Are you sure you want to delete ${isDraft ? 'draft' : 'live tool'} "${name}"?`)) return;

    try {
      const res = await fetch(`/api/admin/tools/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete tool');
      }

      showToast(`🗑️ ${isDraft ? 'Draft' : 'Tool'} "${name}" deleted.`);
      setDrafts(prev => prev.filter(t => t.id !== id));
      setPublishedTools(prev => prev.filter(t => t.id !== id));

      if (onToolDeleted) {
        onToolDeleted(id);
      }
    } catch (err) {
      showToast(`❌ Deletion failed: ${err.message}`);
    }
  };

  // Bulk clear all drafts
  const handleClearAllDrafts = async () => {
    if (drafts.length === 0) return;
    if (!confirm(`Are you sure you want to delete ALL ${drafts.length} draft items from staging? This cannot be undone.`)) return;

    try {
      const res = await fetch('/api/admin/drafts/clear-all', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to clear drafts');
      }

      showToast(`🗑️ Cleared ${data.clearedCount || drafts.length} drafts.`);
      const removedIds = drafts.map(d => d.id);
      setDrafts([]);
      if (onToolDeleted) {
        removedIds.forEach(id => onToolDeleted(id));
      }
    } catch (err) {
      showToast(`❌ Clear drafts failed: ${err.message}`);
    }
  };

  // 1. AI Batch Sync: Automatically generates a curated batch of 10 distinct anti-bloat tools with downloaded local logos
  const handleBatchSync10 = async () => {
    setIsBatchSyncing(true);
    showToast('⚡ AI Agent curating 10 distinct anti-bloat tools & downloading official logos...');

    try {
      const res = await fetch('/api/admin/sync-batch-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch generation failed');
      }

      showToast(`🎉 Generated & staged ${data.count} curated anti-bloat tools with downloaded official logos!`);
      await loadTools();
      setActiveTab('ai-batch');
    } catch (err) {
      showToast(`❌ Batch sync error: ${err.message}`);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // Local Batch Ingestion Handlers
  const handleBatchInputChange = (val) => {
    setBatchJsonInput(val);
    setBatchImportReport(null);
    if (!val.trim()) {
      setBatchParsedCount(null);
      setBatchParseError(null);
      return;
    }
    try {
      const parsed = JSON.parse(val);
      const list = Array.isArray(parsed) ? parsed : (parsed?.tools || parsed?.batch || []);
      if (Array.isArray(list)) {
        setBatchParsedCount(list.length);
        setBatchParseError(null);
      } else {
        setBatchParsedCount(null);
        setBatchParseError('Input must be a JSON array of tool records or { "tools": [...] }');
      }
    } catch (err) {
      setBatchParsedCount(null);
      setBatchParseError(err.message);
    }
  };

  const handleLoadSampleBatch = async () => {
    try {
      const res = await fetch('/api/admin/sample-batch');
      if (res.ok) {
        const data = await res.json();
        const jsonStr = JSON.stringify(data.sampleBatch, null, 2);
        setBatchJsonInput(jsonStr);
        setBatchParsedCount(data.sampleBatch.length);
        setBatchParseError(null);
        setBatchImportReport(null);
        showToast(`📋 Loaded sample batch of ${data.sampleBatch.length} micro-tools!`);
      } else {
        throw new Error('Failed to fetch sample batch');
      }
    } catch (err) {
      showToast(`❌ Error loading sample batch: ${err.message}`);
    }
  };

  const handleIngestBatchSubmit = async () => {
    if (!batchJsonInput.trim()) {
      showToast('⚠️ Please paste or load a JSON batch of tools first.');
      return;
    }

    let parsedList = [];
    try {
      const parsed = JSON.parse(batchJsonInput);
      parsedList = Array.isArray(parsed) ? parsed : (parsed?.tools || parsed?.batch || []);
      if (!Array.isArray(parsedList) || parsedList.length === 0) {
        throw new Error('JSON does not contain any tool items.');
      }
    } catch (parseErr) {
      showToast(`❌ Invalid JSON: ${parseErr.message}`);
      return;
    }

    setIsIngestingBatch(true);
    showToast(`⚡ Ingesting batch of ${parsedList.length} tools & downloading official logos...`);

    try {
      const res = await fetch('/api/admin/batch-import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsedList)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch import failed');
      }

      setBatchImportReport(data);
      showToast(`🎉 Ingested ${data.importedCount} tools into Draft Queue with downloaded logos!`);
      await loadTools();
      setQueueFilter('drafts');
    } catch (err) {
      showToast(`❌ Batch ingestion error: ${err.message}`);
    } finally {
      setIsIngestingBatch(false);
    }
  };

  // 2. AI Single Ingest
  const handleAiIngest = async (e) => {
    if (e) e.preventDefault();
    if (!inputName.trim() && !inputWebsite.trim()) return;

    setIsAiProcessing(true);
    setAiStatusMessage('🤖 AI agent researching software architecture & competitors...');

    try {
      setTimeout(() => {
        setAiStatusMessage('🏷️ Synthesizing anti-bloat tags, learning curve score & tutorial metrics...');
      }, 1000);

      setTimeout(() => {
        setAiStatusMessage('📥 Downloading official brand logo to server storage...');
      }, 2000);

      const res = await fetch('/api/admin/ai-generate-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: inputName.trim(),
          website: inputWebsite.trim(),
          affiliateUrl: inputAffiliate.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'AI generation failed');
      }

      showToast(`✨ Successfully AI-analyzed and staged "${data.draftTool.name}" as Draft!`);
      setInputName('');
      setInputWebsite('');
      setInputAffiliate('');
      await loadTools();
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsAiProcessing(false);
      setAiStatusMessage('');
    }
  };

  // 3. Manual Tool Entry Submission
  const handleManualSubmit = async (publishDirectly = false) => {
    if (!manualName.trim() || !manualWebsite.trim()) {
      showToast('⚠️ Please enter Tool Name and Website URL.');
      return;
    }

    setIsManualSubmitting(true);
    try {
      const tagsArray = manualTagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        name: manualName.trim(),
        website: manualWebsite.trim(),
        description: manualDescription.trim(),
        category: manualCategory,
        whatItReplaces: manualReplaces.trim() || 'Bloated legacy software',
        replacesDetailed: manualReplacesDetailed.trim(),
        targetAudience: manualAudience.trim() || 'Builders & digital craftsmen',
        learningCurveLevel: manualCurveLevel,
        learningCurveTime: manualCurveTime.trim() || '5 mins',
        tutorialCount: parseInt(manualTutorialCount, 10) || 12,
        tags: tagsArray,
        affiliateUrl: manualAffiliate.trim(),
        publishImmediately: publishDirectly
      };

      const res = await fetch('/api/admin/manual-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Manual creation failed');
      }

      showToast(publishDirectly ? `🚀 "${manualName}" published directly to live site!` : `✅ "${manualName}" staged as Draft!`);

      // Reset manual form
      setManualName('');
      setManualDescription('');
      setManualWebsite('');
      setManualReplaces('');
      setManualReplacesDetailed('');
      setManualAudience('');
      setManualTutorialCount('12');
      setManualAffiliate('');

      await loadTools();

      if (publishDirectly && onToolPublished) {
        onToolPublished(data.tool);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // Update affiliate link locally and on backend
  const handleAffiliateChange = (id, value) => {
    setAffiliateLinks(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveAffiliateLink = async (id) => {
    const link = affiliateLinks[id] || '';
    try {
      const res = await fetch(`/api/admin/drafts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateUrl: link })
      });
      if (res.ok) {
        showToast('🔗 Affiliate link updated for this draft.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Action: Publish to Live Site
  const handlePublish = async (draft) => {
    setPublishingId(draft.id);
    const customAffiliate = affiliateLinks[draft.id] || draft.affiliateUrl || '';

    try {
      const res = await fetch(`/api/admin/drafts/${draft.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateUrl: customAffiliate })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Publish failed');
      }

      showToast(`🚀 "${draft.name}" is now live on the public directory!`);
      setDrafts(prev => prev.filter(d => d.id !== draft.id));
      setPublishedTools(prev => [data.publishedTool, ...prev.filter(t => t.id !== draft.id)]);

      if (onToolPublished) {
        onToolPublished(data.publishedTool);
      }
    } catch (err) {
      showToast(`❌ Publish failed: ${err.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  // Discard draft
  const handleDiscard = async (id, name) => {
    if (!confirm(`Are you sure you want to discard draft "${name}"?`)) return;

    try {
      await fetch(`/api/admin/drafts/${id}`, { method: 'DELETE' });
      setDrafts(prev => prev.filter(d => d.id !== id));
      showToast(`🗑️ Draft "${name}" discarded.`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in border border-zinc-700 dark:border-zinc-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Breadcrumb & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBackToDirectory}
            className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Directory</span>
          </button>
          <span className="text-zinc-300 dark:text-zinc-700">•</span>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Admin Staging & AI Pipeline</span>
          </div>
        </div>

        {/* Action Controls: AI Batch Sync + Refresh */}
        <div className="flex items-center gap-2.5">
          {/* THE REQUESTED SYNC/REFRESH BUTTON: Generates curated batch of 10 distinct anti-bloat tools */}
          <button
            type="button"
            disabled={isBatchSyncing}
            onClick={handleBatchSync10}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm transition-all disabled:opacity-50"
            title="Generate a curated batch of 10 distinct anti-bloat micro-tools with downloaded local logos"
          >
            {isBatchSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI Curating 10 Tools...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>AI Batch Sync (Generate 10 Tools)</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={loadTools}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            title="Refresh tools list from server"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          {/* THE REQUESTED PUBLISH LIVE BUTTON: Push database & logos to GitHub main branch */}
          <button
            type="button"
            disabled={isPublishingLive}
            onClick={handlePublishLive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50"
            title="Automatically stage all new tool entries, database, and local logo files, commit, and push to GitHub main branch"
          >
            {isPublishingLive ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Publishing Live to GitHub...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Publish Live 🚀</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isExportingStatic}
            onClick={handleExportStatic}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shadow-sm disabled:opacity-50"
            title="Export published tools into static production assets for GitHub Pages / static hosting"
          >
            {isExportingStatic ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Static Bundle</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Tabs: AI Ingestion vs Manual Entry */}
      <div className="flex items-center gap-2 mb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('ai-batch')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'ai-batch'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Ingestion & Batch Sync</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('batch-import')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'batch-import'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Local Batch Ingestion (JSON Feed)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'manual'
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
              : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
          }`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          <span>Clean Manual Entry Form</span>
        </button>
      </div>

      {/* TAB 1: AI Tool Ingestion Hero Card */}
      {activeTab === 'ai-batch' && (
        <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm mb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
              <Sparkles className="w-4 h-4" />
              <span>Automated AI Curation Agent</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
              Ingest & Stage New Anti-Bloat Micro-Tools
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Input a software tool name or website URL. The AI agent synthesizes its category, anti-bloat rationale, tags, learning curve score, tutorial metrics, and downloads its official <strong>local logo asset</strong>.
            </p>

            {/* Input Form */}
            <form onSubmit={handleAiIngest} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tool Name (or Keyword)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Zed, Excalidraw, Ghost"
                    value={inputName}
                    onChange={(e) => setInputName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Website URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://zed.dev"
                    value={inputWebsite}
                    onChange={(e) => setInputWebsite(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Personal Affiliate / Referral Link <span className="font-normal text-zinc-400">(Optional — can also be pasted on draft cards below)</span>
                </label>
                <div className="relative">
                  <Link2 className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="url"
                    placeholder="https://tool.com/?ref=your-affiliate-id"
                    value={inputAffiliate}
                    onChange={(e) => setInputAffiliate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                  />
                </div>
              </div>

              {/* Action Submit */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {isAiProcessing ? (
                  <div className="flex items-center gap-2.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium animate-pulse">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{aiStatusMessage || 'Processing with AI agent...'}</span>
                  </div>
                ) : (
                  <div className="text-xs text-zinc-400">
                    Ready to stage single tool, or use the <strong>AI Batch Sync</strong> button above to stage 10 at once.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAiProcessing || (!inputName.trim() && !inputWebsite.trim())}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50"
                >
                  {isAiProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Analyzing Tool...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Analyze Single Tool</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Local Batch Ingestion (JSON Feed) */}
      {activeTab === 'batch-import' && (
        <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm mb-10">
          <div className="max-w-4xl">
            <div className="flex items-center justify-between gap-4 mb-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                <Layers className="w-4 h-4" />
                <span>Self-Hosted Logo Downloader & Batch Feed</span>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                Zero External API Dependency
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
              Feed Batch of 10 Tools into Local Draft Queue
            </h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
              Feed an incoming batch of tool records (<strong>Name, Description, Category, Tags, Learning Curve, Website URL</strong>).
              Our automated backend downloader immediately fetches each tool's official logo/favicon from the web, saves the binary directly into <code className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 font-mono text-xs">/public/logos/</code>, and stages all drafts into the queue with secure affiliate link routing.
            </p>

            {/* Action Bar Above Editor */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleLoadSampleBatch}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
                  title="Prefill the editor with a sample curated batch of 10 anti-bloat micro-tools"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Load Sample Batch of 10 Tools</span>
                </button>

                {batchJsonInput.trim() && (
                  <button
                    type="button"
                    onClick={() => {
                      setBatchJsonInput('');
                      setBatchParsedCount(null);
                      setBatchParseError(null);
                      setBatchImportReport(null);
                    }}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                  >
                    Clear Editor
                  </button>
                )}
              </div>

              {/* Status Badge */}
              <div>
                {batchParsedCount !== null ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>{batchParsedCount} Tool Records Validated</span>
                  </span>
                ) : batchParseError ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>JSON Parse Warning</span>
                  </span>
                ) : (
                  <span className="text-xs text-zinc-400 font-mono">
                    Paste JSON array or load sample above
                  </span>
                )}
              </div>
            </div>

            {/* Error notice if JSON is invalid */}
            {batchParseError && (
              <div className="mb-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 font-mono">
                {batchParseError}
              </div>
            )}

            {/* JSON Textarea Editor */}
            <div className="relative mb-4">
              <textarea
                rows={12}
                value={batchJsonInput}
                onChange={(e) => handleBatchInputChange(e.target.value)}
                placeholder={`[
  {
    "name": "Zed Editor",
    "website": "https://zed.dev",
    "category": "Utilities",
    "description": "Ultra-fast, Rust-powered code editor with GPU acceleration.",
    "tags": ["Beginner-Friendly", "Free Tier Available", "GPU-Accelerated"],
    "learningCurve": { "level": "Low", "score": 2, "timeToLearn": "8 mins", "summary": "Familiar VS Code keymaps." },
    "affiliateUrl": "https://zed.dev/?ref=curateless"
  }
]`}
                className="w-full p-4 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-950 text-emerald-400 dark:bg-[#0d0e10] focus:ring-2 focus:ring-indigo-500 focus:outline-none selection:bg-indigo-600 selection:text-white"
                spellCheck={false}
              />
            </div>

            {/* Submission Action */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="text-xs text-zinc-500">
                Logos will be downloaded directly to <code className="font-mono text-zinc-700 dark:text-zinc-300">/public/logos/</code> and served statically without Brandfetch.
              </div>

              <button
                type="button"
                disabled={isIngestingBatch || !batchParsedCount || batchParsedCount === 0}
                onClick={handleIngestBatchSubmit}
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all disabled:opacity-50"
              >
                {isIngestingBatch ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Downloading Logos & Ingesting {batchParsedCount} Tools...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Ingest Batch of {batchParsedCount || 10} Tools into Draft Queue</span>
                  </>
                )}
              </button>
            </div>

            {/* Ingestion Report if completed */}
            {batchImportReport && (
              <div className="mt-6 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 dark:text-emerald-200">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Batch Ingestion Completed Successfully!</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold">
                    {batchImportReport.importedCount} Ingested
                  </span>
                </div>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mb-3">
                  All {batchImportReport.importedCount} tools have been staged to your draft queue below with downloaded self-hosted logos.
                </p>
                <div className="flex flex-wrap gap-2">
                  {batchImportReport.drafts?.map(draft => (
                    <span key={draft.id} className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-white dark:bg-zinc-900 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      <ToolBrandLogo tool={draft} size="sm" />
                      <span>{draft.name}</span>
                      <span className="text-[10px] text-emerald-600 font-mono">✓ saved</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Clean Manual Entry Form Alongside Queue */}
      {activeTab === 'manual' && (
        <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm mb-10">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-2">
              <Edit3 className="w-4 h-4" />
              <span>Manual Tool Entry Form</span>
            </div>
            <h2 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
              Hand-Craft an Anti-Bloat Tool Entry
            </h2>
            <p className="text-xs text-zinc-500 mb-6">
              Manually add a new tool to your directory. Our backend automatically downloads its official logo into local storage and stages it into the draft queue (or publishes it immediately).
            </p>

            <div className="space-y-4">
              {/* Row 1: Tool Name, Website URL, Category */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tool Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Standard Notes"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Website URL *</label>
                  <input
                    type="url"
                    placeholder="https://standardnotes.com"
                    value={manualWebsite}
                    onChange={(e) => setManualWebsite(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Category *</label>
                  <select
                    value={manualCategory}
                    onChange={(e) => setManualCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500 font-semibold"
                  >
                    {CATEGORIES.filter(c => c !== "All").map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Tool Description *
                </label>
                <textarea
                  rows={2}
                  placeholder="Concise, anti-bloat description of what this tool does and why users love it..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Row 3: Tags, Learning Curve, Tutorial Count */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Tags (Comma-separated) *
                  </label>
                  <input
                    type="text"
                    placeholder="Beginner-Friendly, Free Tier Available, Open Source"
                    value={manualTagsInput}
                    onChange={(e) => setManualTagsInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Learning Curve *</label>
                  <select
                    value={manualCurveLevel}
                    onChange={(e) => setManualCurveLevel(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Gentle">Gentle (1/4)</option>
                    <option value="Low">Low (2/4)</option>
                    <option value="Moderate">Moderate (3/4)</option>
                    <option value="Steep">Steep (4/4)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Tutorial Count *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="12"
                    value={manualTutorialCount}
                    onChange={(e) => setManualTutorialCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {/* Row 4: Affiliate Link */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Personal Affiliate Link (Optional — will auto-append ?ref=curateless if blank)</span>
                  </span>
                </label>
                <input
                  type="url"
                  placeholder="https://standardnotes.com/?ref=yourname"
                  value={manualAffiliate}
                  onChange={(e) => setManualAffiliate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              {/* Row 5: Anti-bloat rationale & target audience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">What Heavy Tool Does It Replace?</label>
                  <input
                    type="text"
                    placeholder="e.g. Evernote & Proprietary Cloud Lock-in"
                    value={manualReplaces}
                    onChange={(e) => setManualReplaces(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Target Audience</label>
                  <input
                    type="text"
                    placeholder="e.g. Privacy advocates, journalists, researchers"
                    value={manualAudience}
                    onChange={(e) => setManualAudience(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">Detailed Anti-Bloat Rationale (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="Explain why this tool is lighter, faster, and distraction-free..."
                  value={manualReplacesDetailed}
                  onChange={(e) => setManualReplacesDetailed(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  disabled={isManualSubmitting}
                  onClick={() => handleManualSubmit(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  Stage as Draft
                </button>

                <button
                  type="button"
                  disabled={isManualSubmitting}
                  onClick={() => handleManualSubmit(true)}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-all"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Publish Directly to Live Site</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tool Records & Staging Queue Section */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
            <span>Tool Directory & Staging Management</span>
            <span className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 font-mono font-semibold">
              {queueFilter === 'drafts' ? `${drafts.length} Drafts` : queueFilter === 'published' ? `${publishedTools.length} Live Tools` : `${drafts.length + publishedTools.length} Records`}
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Full management capabilities: edit all fields inline, paste affiliate links, publish drafts, or remove unwanted items.
          </p>
        </div>

        {/* View Filter Switcher & Clear Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Pills */}
          <div className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
            <button
              type="button"
              onClick={() => setQueueFilter('drafts')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                queueFilter === 'drafts'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Drafts Queue ({drafts.length})
            </button>

            <button
              type="button"
              onClick={() => setQueueFilter('published')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                queueFilter === 'published'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              Live Tools ({publishedTools.length})
            </button>

            <button
              type="button"
              onClick={() => setQueueFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                queueFilter === 'all'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
            >
              All Records ({drafts.length + publishedTools.length})
            </button>
          </div>

          {/* Clear All Drafts Button */}
          {drafts.length > 0 && queueFilter !== 'published' && (
            <button
              type="button"
              onClick={handleClearAllDrafts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 transition-colors"
              title="Clear all unwanted draft items from staging"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All Drafts</span>
            </button>
          )}
        </div>
      </div>

      {/* Tools Cards Grid */}
      {loadingTools ? (
        <div className="py-20 text-center">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading tool records...</p>
        </div>
      ) : (queueFilter === 'drafts' ? drafts : queueFilter === 'published' ? publishedTools : [...drafts, ...publishedTools]).length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {(queueFilter === 'drafts' ? drafts : queueFilter === 'published' ? publishedTools : [...drafts, ...publishedTools]).map((tool) => {
            const isEditing = editingToolId === tool.id;
            const isDraft = tool.status === 'draft';
            const currentAffiliate = affiliateLinks[tool.id] !== undefined 
              ? affiliateLinks[tool.id] 
              : (tool.affiliateUrl || '');
            const isPublishing = publishingId === tool.id;

            // 1. INLINE EDIT FORM MODE
            if (isEditing) {
              return (
                <div
                  key={tool.id}
                  className="rounded-2xl border-2 border-indigo-500 bg-white dark:bg-[#141517] p-6 shadow-xl transition-all"
                >
                  {/* Inline Form Header */}
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-indigo-100 dark:border-indigo-900/60">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        <Edit3 className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          Editing: {tool.name}
                        </h4>
                        <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                          Modify fields below. Changes update the database and reflect live instantly.
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      title="Cancel editing"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Form Fields */}
                  <div className="space-y-3.5">
                    {/* Row 1: Tool Name & Category */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Tool Name *
                        </label>
                        <input
                          type="text"
                          value={editFormData.name || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Category
                        </label>
                        <select
                          value={editFormData.category || 'Utilities'}
                          onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 font-semibold"
                        >
                          {CATEGORIES.filter(c => c !== 'All').map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Description / Tagline
                      </label>
                      <textarea
                        rows={2}
                        value={editFormData.description || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                      />
                    </div>

                    {/* What It Replaces & Detailed Rationale */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          What It Replaces
                        </label>
                        <input
                          type="text"
                          value={editFormData.whatItReplaces || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, whatItReplaces: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Target Audience
                        </label>
                        <input
                          type="text"
                          value={editFormData.targetAudience || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, targetAudience: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                        Tags (Comma-separated)
                      </label>
                      <input
                        type="text"
                        placeholder="Beginner-Friendly, Free Tier Available, Alternative to..."
                        value={editFormData.tags || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {/* Learning Curve Level, Time & Tutorial Count */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Learning Curve
                        </label>
                        <select
                          value={editFormData.learningCurveLevel || 'Gentle'}
                          onChange={(e) => setEditFormData({ ...editFormData, learningCurveLevel: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Gentle">Gentle (1/4)</option>
                          <option value="Low">Low (2/4)</option>
                          <option value="Moderate">Moderate (3/4)</option>
                          <option value="Steep">Steep (4/4)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Est. Time to Learn
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 5 mins"
                          value={editFormData.learningCurveTime || ''}
                          onChange={(e) => setEditFormData({ ...editFormData, learningCurveTime: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">
                          Tutorial Count
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={editFormData.tutorialCount || 0}
                          onChange={(e) => setEditFormData({ ...editFormData, tutorialCount: e.target.value })}
                          className="w-full px-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 font-mono"
                        />
                      </div>
                    </div>

                    {/* Affiliate Link Field */}
                    <div>
                      <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                          <span>Custom Affiliate / Referral Link</span>
                        </span>
                        <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                          Direct button target
                        </span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://tool.com/?ref=yourname"
                        value={editFormData.affiliateUrl || ''}
                        onChange={(e) => setEditFormData({ ...editFormData, affiliateUrl: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-indigo-500 font-mono shadow-sm"
                      />
                    </div>

                    {/* Inline Action Buttons */}
                    <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-4 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                      >
                        Cancel
                      </button>

                      <button
                        type="button"
                        disabled={isSavingEdit}
                        onClick={() => handleSaveInlineEdit(tool.id)}
                        className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow transition-all disabled:opacity-50"
                      >
                        {isSavingEdit ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Save Changes</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            // 2. NORMAL CARD VIEW MODE
            return (
              <div
                key={tool.id}
                className={`rounded-2xl border-2 ${
                  isDraft 
                    ? 'border-amber-300/80 dark:border-amber-700/60' 
                    : 'border-zinc-200/90 dark:border-zinc-800/90 hover:border-zinc-300'
                } bg-white dark:bg-[#141517] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden transition-all`}
              >
                {/* Status Badges */}
                <div className="absolute top-0 right-0 flex items-center gap-1.5 p-2">
                  {(tool.localLogoPath || tool.slug) && (
                    <span 
                      className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 text-[10px] font-semibold rounded border border-emerald-200 dark:border-emerald-800 font-mono"
                      title="Downloaded Official Local Logo Asset"
                    >
                      Local Logo ✓
                    </span>
                  )}
                  {isDraft ? (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-zinc-900 font-bold text-[10px] uppercase tracking-wider rounded font-mono shadow-sm">
                      DRAFT
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-bold text-[10px] uppercase tracking-wider rounded font-mono shadow-sm">
                      LIVE
                    </span>
                  )}
                </div>

                <div>
                  {/* Card Header: Brand Logo, Name, Category, Tutorial count */}
                  <div className="flex items-start justify-between gap-3 mb-4 pr-32">
                    <div className="flex items-center gap-3">
                      <ToolBrandLogo tool={tool} size="md" />
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
                            {tool.name}
                          </h4>
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                            {tool.category}
                          </span>
                        </div>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 font-mono block">
                          {tool.domain || tool.website}
                        </span>
                      </div>
                    </div>

                    <TutorialCounter
                      count={tool.tutorialCount || 12}
                      meta={tool.tutorialMeta}
                      toolName={tool.name}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 block mb-0.5">
                      Description:
                    </span>
                    <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-normal">
                      {tool.description || tool.tagline}
                    </p>
                  </div>

                  {/* Metadata: What It Replaces */}
                  <div className="p-3 mb-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                    <span className="font-semibold text-rose-600 dark:text-rose-400">Replaces: </span>
                    <strong className="text-zinc-800 dark:text-zinc-200">{tool.whatItReplaces}</strong>
                    {tool.replacesDetailed && (
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                        {tool.replacesDetailed}
                      </p>
                    )}
                  </div>

                  {/* Target Audience */}
                  {tool.targetAudience && (
                    <div className="flex items-start gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 mb-3.5">
                      <Users className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
                      <span><strong>Audience: </strong>{tool.targetAudience}</span>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {tool.tags && tool.tags.map((tag) => (
                      <TagBadge key={tag} tag={tag} clickable={false} />
                    ))}
                  </div>

                  {/* Learning Curve Rating Progress Meter */}
                  <div className="flex items-center justify-between p-2.5 mb-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 text-xs">
                    <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
                      Learning Curve Rating:
                    </span>
                    <LearningCurveMeter learningCurve={tool.learningCurve} />
                  </div>

                  {/* DEDICATED AFFILIATE LINK INPUT FIELD */}
                  <div className="p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 mb-5">
                    <label className="block text-xs font-bold text-indigo-950 dark:text-indigo-200 mb-1.5 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                        <span>Affiliate / Referral Link</span>
                      </span>
                      <span className="text-[10px] font-normal text-indigo-600 dark:text-indigo-400">
                        Target for button clicks
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        placeholder={`https://${tool.domain || 'tool.com'}/?ref=yourname`}
                        value={currentAffiliate}
                        onChange={(e) => handleAffiliateChange(tool.id, e.target.value)}
                        className="flex-1 px-3 py-2 text-xs rounded-lg border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveAffiliateLink(tool.id)}
                        className="px-3 py-2 rounded-lg text-xs font-semibold bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-800 dark:text-indigo-200 transition-colors flex-shrink-0"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card Actions: Edit, Delete/Remove, and Publish */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    {/* EDIT BUTTON: Opens inline form */}
                    <button
                      type="button"
                      onClick={() => startEdit(tool)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/40 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm"
                      title="Edit Tool Name, Description, Category, Tags, Learning Curve, Tutorial Count & Affiliate Link"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    {/* DELETE / REMOVE BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleDeleteTool(tool.id, tool.name, isDraft)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 transition-colors"
                      title={`Delete ${isDraft ? 'draft' : 'live tool'}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isDraft ? 'Delete Draft' : 'Delete'}</span>
                    </button>
                  </div>

                  {/* If Draft: Publish to Live Site Button */}
                  {isDraft && (
                    <button
                      type="button"
                      disabled={isPublishing}
                      onClick={() => handlePublish(tool)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                    >
                      {isPublishing ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Publishing to Live Site...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4" />
                          <span>Publish to Live Site 🚀</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* If Published: Live Directory Confirmation Badge */}
                  {!isDraft && (
                    <div className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold py-1">
                      <CheckCircle className="w-4 h-4" />
                      <span>Live on Directory</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty Queue */
        <div className="text-center py-16 bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
            <CheckCircle className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
            {queueFilter === 'drafts' ? 'No Drafts Currently Staged' : queueFilter === 'published' ? 'No Live Tools Found' : 'No Tools In Database'}
          </h4>
          <p className="text-xs text-zinc-500 mb-5 leading-relaxed">
            {queueFilter === 'drafts' 
              ? 'Click the "AI Batch Sync" button above to generate 10 new drafts, or add one using the Manual Entry tab.'
              : 'Publish drafts or ingest tools to populate your live anti-bloat directory.'}
          </p>
          {queueFilter === 'drafts' && (
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={isBatchSyncing}
                onClick={handleBatchSync10}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Generate 10 AI Drafts Now</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
