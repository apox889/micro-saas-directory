import React, { useState, useEffect, useMemo } from 'react';
import ToolBrandLogo from './ToolBrandLogo';
import LearningCurveMeter from './LearningCurveMeter';
import TutorialCounter from './TutorialCounter';
import TagBadge from './TagBadge';
import { 
  Sparkles, 
  ArrowLeft, 
  ExternalLink, 
  Link2, 
  CheckCircle, 
  Trash2, 
  RefreshCw, 
  UploadCloud, 
  Download,
  Users, 
  Loader2, 
  Plus, 
  Edit3, 
  Layers, 
  Check, 
  Zap, 
  SlidersHorizontal,
  X, 
  Save, 
  AlertCircle,
  RotateCcw,
  Table as TableIcon,
  LayoutGrid,
  Search,
  Filter,
  CheckSquare,
  Square,
  AlertTriangle,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Undo2,
  XCircle,
  CheckCheck,
  Eye
} from 'lucide-react';
import { CATEGORIES } from '../data/toolsData';

export default function AdminStagingDashboard({ 
  onBackToDirectory, 
  onToolPublished,
  onToolUpdated,
  onToolDeleted
}) {
  // Data State
  const [drafts, setDrafts] = useState([]);
  const [publishedTools, setPublishedTools] = useState([]);
  const [trashTools, setTrashTools] = useState([]);
  const [loadingTools, setLoadingTools] = useState(true);

  // Folder tab: 'all' | 'drafts' | 'published' | 'trash'
  const [activeFolder, setActiveFolder] = useState('all');

  // Display mode: 'table' (Excel spreadsheet style) | 'cards'
  const [viewMode, setViewMode] = useState('table');

  // Multi-select row IDs for bulk operations
  const [selectedIds, setSelectedIds] = useState([]);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortField, setSortField] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc'); // 'asc' | 'desc'

  // Affiliate link inputs (cell inline editing)
  const [affiliateInputs, setAffiliateInputs] = useState({});
  const [savingAffiliateId, setSavingAffiliateId] = useState(null);

  // Modal / Drawer states
  const [editingTool, setEditingTool] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);

  // Actions & Operations State
  const [isBulkOperating, setIsBulkOperating] = useState(false);
  const [isBatchSyncing, setIsBatchSyncing] = useState(false);
  const [isExportingStatic, setIsExportingStatic] = useState(false);

  // Live Sync & Vercel Verification State
  const [isPublishingLive, setIsPublishingLive] = useState(false);
  const [publishLiveModal, setPublishLiveModal] = useState(null); // null | { status: 'syncing' | 'verified' | 'error', data }

  // Manual Add Form State
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

  // Batch JSON Import State
  const [batchJsonInput, setBatchJsonInput] = useState('');
  const [isIngestingBatch, setIsIngestingBatch] = useState(false);
  const [batchParsedCount, setBatchParsedCount] = useState(null);
  const [batchParseError, setBatchParseError] = useState(null);

  // Toast
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch all tools partitioned by status from backend
  const loadTools = async () => {
    try {
      setLoadingTools(true);
      const res = await fetch('/api/admin/tools');
      const data = await res.json();
      if (data.success) {
        setDrafts(data.drafts || []);
        setPublishedTools(data.published || []);
        setTrashTools(data.trash || []);

        // Sync affiliate inputs map
        const linksMap = {};
        const allList = [...(data.drafts || []), ...(data.published || []), ...(data.trash || [])];
        allList.forEach(tool => {
          linksMap[tool.id] = tool.affiliateUrl || '';
        });
        setAffiliateInputs(linksMap);
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

  // Clear selections when switching active folder
  useEffect(() => {
    setSelectedIds([]);
  }, [activeFolder]);

  // Determine current active tool list based on folder
  const currentFolderTools = useMemo(() => {
    if (activeFolder === 'drafts') return drafts;
    if (activeFolder === 'published') return publishedTools;
    if (activeFolder === 'trash') return trashTools;
    // 'all' represents all active non-trashed tools (drafts + published)
    return [...drafts, ...publishedTools];
  }, [activeFolder, drafts, publishedTools, trashTools]);

  // Filtered & Sorted Tools for Table / Cards
  const displayedTools = useMemo(() => {
    let result = [...currentFolderTools];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(tool => {
        const nameMatch = tool.name?.toLowerCase().includes(q);
        const descMatch = (tool.description || tool.tagline || '').toLowerCase().includes(q);
        const catMatch = tool.category?.toLowerCase().includes(q);
        const webMatch = (tool.domain || tool.website || '').toLowerCase().includes(q);
        const replacesMatch = (tool.whatItReplaces || '').toLowerCase().includes(q);
        const tagsMatch = Array.isArray(tool.tags) && tool.tags.some(t => t.toLowerCase().includes(q));
        return nameMatch || descMatch || catMatch || webMatch || replacesMatch || tagsMatch;
      });
    }

    // Category filter
    if (selectedCategory && selectedCategory !== 'All') {
      result = result.filter(tool => tool.category === selectedCategory);
    }

    // Sorting
    result.sort((a, b) => {
      let valA = '';
      let valB = '';

      if (sortField === 'name') {
        valA = (a.name || '').toLowerCase();
        valB = (b.name || '').toLowerCase();
      } else if (sortField === 'category') {
        valA = (a.category || '').toLowerCase();
        valB = (b.category || '').toLowerCase();
      } else if (sortField === 'status') {
        valA = a.status || '';
        valB = b.status || '';
      } else if (sortField === 'tutorialCount') {
        valA = a.tutorialCount || 0;
        valB = b.tutorialCount || 0;
      } else if (sortField === 'createdAt') {
        valA = a.createdAt || '';
        valB = b.createdAt || '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [currentFolderTools, searchQuery, selectedCategory, sortField, sortDirection]);

  // Multi-selection handlers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allDisplayedIds = displayedTools.map(t => t.id);
      setSelectedIds(allDisplayedIds);
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelectRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // -------------------------------------------------------------
  // TRASH & BULK OPERATIONS (NO PAGE RELOAD)
  // -------------------------------------------------------------

  // Soft Delete a single tool to Trash
  const handleMoveToTrash = async (tool) => {
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to move tool to Trash.');
      }

      showToast(`🗑️ Moved "${tool.name}" to Trash.`);

      // Update state in place
      setDrafts(prev => prev.filter(t => t.id !== tool.id));
      setPublishedTools(prev => prev.filter(t => t.id !== tool.id));
      setTrashTools(prev => [data.tool || { ...tool, status: 'trash' }, ...prev.filter(t => t.id !== tool.id)]);
      setSelectedIds(prev => prev.filter(id => id !== tool.id));

      if (onToolDeleted) {
        onToolDeleted(tool.id);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  // Restore a tool from Trash back to Draft or Live
  const handleRestoreFromTrash = async (tool) => {
    try {
      const res = await fetch(`/api/admin/tools/${tool.id}/restore`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to restore tool.');
      }

      const restored = data.tool;
      showToast(`↩️ Restored "${tool.name}" to ${restored.status === 'published' ? 'Live' : 'Drafts'}.`);

      // Update state in place
      setTrashTools(prev => prev.filter(t => t.id !== tool.id));
      if (restored.status === 'published') {
        setPublishedTools(prev => [restored, ...prev]);
        if (onToolPublished) onToolPublished(restored);
      } else {
        setDrafts(prev => [restored, ...prev]);
      }
      setSelectedIds(prev => prev.filter(id => id !== tool.id));
    } catch (err) {
      showToast(`❌ Restore failed: ${err.message}`);
    }
  };

  // Permanent Delete a single tool
  const handlePermanentDelete = async (tool) => {
    if (!confirm(`Permanently purge "${tool.name}"? This action cannot be undone.`)) return;

    try {
      const res = await fetch(`/api/admin/tools/${tool.id}/permanent`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to purge tool.');
      }

      showToast(`❌ "${tool.name}" permanently deleted.`);
      setTrashTools(prev => prev.filter(t => t.id !== tool.id));
      setDrafts(prev => prev.filter(t => t.id !== tool.id));
      setPublishedTools(prev => prev.filter(t => t.id !== tool.id));
      setSelectedIds(prev => prev.filter(id => id !== tool.id));

      if (onToolDeleted) onToolDeleted(tool.id);
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  // Empty Trash Completely
  const handleEmptyTrash = async () => {
    if (trashTools.length === 0) return;
    if (!confirm(`Are you sure you want to permanently delete all ${trashTools.length} tools in Trash? This cannot be undone.`)) return;

    try {
      const res = await fetch('/api/admin/trash/empty', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to empty Trash.');
      }

      showToast(`🗑️ Permanently purged ${trashTools.length} items from Trash.`);
      setTrashTools([]);
      setSelectedIds([]);
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  // Bulk Operations Handler (Trash, Restore, Permanent Delete, Publish, Draft)
  const handleBulkAction = async (action) => {
    if (selectedIds.length === 0) return;

    if (action === 'permanent-delete') {
      if (!confirm(`Permanently purge ${selectedIds.length} selected items? This cannot be undone.`)) return;
    }

    setIsBulkOperating(true);
    try {
      const res = await fetch('/api/admin/tools/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ids: selectedIds })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Bulk operation failed.');
      }

      showToast(`✨ ${data.message}`);

      // Sync state with returned partitions
      if (data.drafts) setDrafts(data.drafts);
      if (data.published) setPublishedTools(data.published);
      if (data.trash) setTrashTools(data.trash);

      setSelectedIds([]);

      // Inform parent directory if needed
      if (action === 'trash' || action === 'permanent-delete') {
        if (onToolDeleted) selectedIds.forEach(id => onToolDeleted(id));
      } else if (action === 'publish') {
        if (onToolPublished && data.published) {
          data.published.forEach(t => onToolPublished(t));
        }
      }
    } catch (err) {
      showToast(`❌ Bulk action error: ${err.message}`);
    } finally {
      setIsBulkOperating(false);
    }
  };

  // -------------------------------------------------------------
  // QUICK PUBLISH / DRAFT TOGGLE
  // -------------------------------------------------------------
  const handleQuickPublish = async (tool) => {
    try {
      const customAffiliate = affiliateInputs[tool.id] || tool.affiliateUrl || '';
      const res = await fetch(`/api/admin/drafts/${tool.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateUrl: customAffiliate })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Publish failed.');
      }

      showToast(`🚀 "${tool.name}" is now live on the public directory!`);
      setDrafts(prev => prev.filter(d => d.id !== tool.id));
      setPublishedTools(prev => [data.publishedTool, ...prev.filter(t => t.id !== tool.id)]);

      if (onToolPublished) onToolPublished(data.publishedTool);
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  const handleQuickMoveToDraft = async (tool) => {
    try {
      const res = await fetch('/api/admin/tools/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'draft', ids: [tool.id] })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`📝 "${tool.name}" moved to drafts.`);
        setPublishedTools(prev => prev.filter(t => t.id !== tool.id));
        setDrafts(prev => [{ ...tool, status: 'draft' }, ...prev]);
        if (onToolDeleted) onToolDeleted(tool.id);
      }
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    }
  };

  // -------------------------------------------------------------
  // INLINE CELL AFFILIATE LINK SAVE
  // -------------------------------------------------------------
  const handleSaveAffiliate = async (toolId) => {
    const link = affiliateInputs[toolId] || '';
    setSavingAffiliateId(toolId);
    try {
      const res = await fetch(`/api/admin/tools/${toolId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ affiliateUrl: link })
      });
      if (res.ok) {
        showToast('🔗 Affiliate link updated.');
        // Update local object
        setDrafts(prev => prev.map(t => t.id === toolId ? { ...t, affiliateUrl: link } : t));
        setPublishedTools(prev => prev.map(t => t.id === toolId ? { ...t, affiliateUrl: link } : t));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAffiliateId(null);
    }
  };

  // -------------------------------------------------------------
  // STREAMLINED LIVE SYNC PIPELINE (GITHUB + VERCEL VERIFICATION)
  // -------------------------------------------------------------
  const handlePublishLive = async () => {
    setIsPublishingLive(true);
    setPublishLiveModal({
      status: 'syncing',
      step: '1/4: Pulling state from remote GitHub repository...'
    });

    try {
      const res = await fetch('/api/admin/publish-live', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Live publish pipeline encountered an error.');
      }

      setPublishLiveModal({
        status: 'verified',
        data
      });
      showToast(`🎉 ${data.message}`);
    } catch (err) {
      setPublishLiveModal({
        status: 'error',
        error: err.message
      });
      showToast(`❌ Publish Live failed: ${err.message}`);
    } finally {
      setIsPublishingLive(false);
    }
  };

  // -------------------------------------------------------------
  // AI BATCH SYNC (10 TOOLS)
  // -------------------------------------------------------------
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
        throw new Error(data.error || 'Batch generation failed.');
      }

      showToast(`🎉 Generated & staged ${data.count} curated tools with official logos!`);
      await loadTools();
      setActiveFolder('drafts');
    } catch (err) {
      showToast(`❌ Batch sync error: ${err.message}`);
    } finally {
      setIsBatchSyncing(false);
    }
  };

  // -------------------------------------------------------------
  // EXPORT STATIC ASSETS
  // -------------------------------------------------------------
  const handleExportStatic = async () => {
    setIsExportingStatic(true);
    showToast('📦 Synchronizing and compiling static production dataset...');
    try {
      const res = await fetch('/api/admin/export-static', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Export failed');
      }
      showToast(`🎉 Exported ${data.count} published tools! Ready for static build.`);
    } catch (err) {
      showToast(`❌ Static export notice: ${err.message}`);
    } finally {
      setIsExportingStatic(false);
    }
  };

  // -------------------------------------------------------------
  // INLINE EDIT DRAWER / MODAL
  // -------------------------------------------------------------
  const startEditTool = (tool) => {
    setEditingTool(tool);
    setEditFormData({
      name: tool.name || '',
      description: tool.description || tool.tagline || '',
      category: tool.category || 'Utilities',
      tags: Array.isArray(tool.tags) ? tool.tags.join(', ') : (tool.tags || ''),
      learningCurveLevel: tool.learningCurve?.level || 'Gentle',
      learningCurveTime: tool.learningCurve?.timeToLearn || '5 mins',
      learningCurveSummary: tool.learningCurve?.summary || '',
      tutorialCount: tool.tutorialCount || 10,
      affiliateUrl: affiliateInputs[tool.id] !== undefined ? affiliateInputs[tool.id] : (tool.affiliateUrl || ''),
      whatItReplaces: tool.whatItReplaces || '',
      replacesDetailed: tool.replacesDetailed || '',
      targetAudience: tool.targetAudience || ''
    });
  };

  const handleSaveEdit = async () => {
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

      const res = await fetch(`/api/admin/tools/${editingTool.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to update tool.');
      }

      const updated = data.tool;
      showToast(`✨ "${updated.name}" updated successfully!`);

      setDrafts(prev => prev.map(t => t.id === editingTool.id ? updated : t));
      setPublishedTools(prev => prev.map(t => t.id === editingTool.id ? updated : t));
      setTrashTools(prev => prev.map(t => t.id === editingTool.id ? updated : t));
      setAffiliateInputs(prev => ({ ...prev, [editingTool.id]: updated.affiliateUrl }));
      setEditingTool(null);

      if (onToolUpdated) onToolUpdated(updated);
    } catch (err) {
      showToast(`❌ Update failed: ${err.message}`);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // -------------------------------------------------------------
  // MANUAL ADD SUBMISSION
  // -------------------------------------------------------------
  const handleManualAddSubmit = async (publishImmediately) => {
    if (!manualName.trim() || !manualWebsite.trim()) {
      showToast('⚠️ Tool Name and Website URL are required.');
      return;
    }

    setIsManualSubmitting(true);
    try {
      const tagsArray = manualTagsInput.split(',').map(t => t.trim()).filter(Boolean);
      const payload = {
        name: manualName.trim(),
        website: manualWebsite.trim(),
        category: manualCategory,
        description: manualDescription.trim(),
        whatItReplaces: manualReplaces.trim() || 'Bloated legacy software',
        replacesDetailed: manualReplacesDetailed.trim(),
        targetAudience: manualAudience.trim() || 'Developers & lean creators',
        tags: tagsArray,
        learningCurveLevel: manualCurveLevel,
        learningCurveTime: manualCurveTime.trim() || '5 mins',
        tutorialCount: parseInt(manualTutorialCount, 10) || 12,
        affiliateUrl: manualAffiliate.trim(),
        publishImmediately
      };

      const res = await fetch('/api/admin/manual-tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create tool.');
      }

      showToast(`🎉 ${data.message}`);
      setShowAddModal(false);
      setManualName('');
      setManualWebsite('');
      setManualDescription('');

      await loadTools();
      setActiveFolder(publishImmediately ? 'published' : 'drafts');
    } catch (err) {
      showToast(`❌ Error: ${err.message}`);
    } finally {
      setIsManualSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // BATCH IMPORT HANDLERS
  // -------------------------------------------------------------
  const handleBatchInputChange = (val) => {
    setBatchJsonInput(val);
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
        setBatchJsonInput(JSON.stringify(data.sampleBatch, null, 2));
        setBatchParsedCount(data.sampleBatch.length);
        setBatchParseError(null);
        showToast(`📋 Loaded sample batch of ${data.sampleBatch.length} micro-tools!`);
      }
    } catch (err) {
      showToast(`❌ Error loading sample: ${err.message}`);
    }
  };

  const handleIngestBatch = async () => {
    if (!batchJsonInput.trim()) return;
    setIsIngestingBatch(true);
    try {
      const parsed = JSON.parse(batchJsonInput);
      const list = Array.isArray(parsed) ? parsed : (parsed?.tools || parsed?.batch || []);
      const res = await fetch('/api/admin/ingest-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tools: list })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Batch import failed.');
      }
      showToast(`🎉 Ingested ${data.importedCount} tools into Drafts Queue!`);
      setShowBatchModal(false);
      setBatchJsonInput('');
      await loadTools();
      setActiveFolder('drafts');
    } catch (err) {
      showToast(`❌ Ingest failed: ${err.message}`);
    } finally {
      setIsIngestingBatch(false);
    }
  };

  // -------------------------------------------------------------
  // RENDER COMPONENT
  // -------------------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-2xl text-xs font-semibold flex items-center gap-2 animate-fade-in border border-zinc-700 dark:border-zinc-200">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER & TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-5 border-b border-zinc-200 dark:border-zinc-800">
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

        {/* Global Primary Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Manual Add Button */}
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-500" />
            <span>Add Tool</span>
          </button>

          {/* Batch Ingest JSON Modal Button */}
          <button
            type="button"
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/80 transition-colors shadow-sm"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-500" />
            <span>Batch JSON</span>
          </button>

          {/* AI 10-Tool Batch Sync Button */}
          <button
            type="button"
            disabled={isBatchSyncing}
            onClick={handleBatchSync10}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-sm transition-all disabled:opacity-50"
            title="Generate a curated batch of 10 distinct anti-bloat tools with downloaded local logos"
          >
            {isBatchSyncing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>AI Curating 10 Tools...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>AI Batch Sync (10 Tools)</span>
              </>
            )}
          </button>

          {/* STREAMLINED LIVE SYNC PIPELINE (GITHUB + VERCEL) */}
          <button
            type="button"
            disabled={isPublishingLive}
            onClick={handlePublishLive}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm hover:shadow transition-all disabled:opacity-50"
            title="Pulls remote state, compiles additions/deletions, pushes to GitHub, and verifies live Vercel deployment"
          >
            {isPublishingLive ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing & Verifying Vercel...</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Publish Live 🚀</span>
              </>
            )}
          </button>

          {/* Refresh Data */}
          <button
            type="button"
            onClick={loadTools}
            className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            title="Refresh tools from database"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* FOLDER TABS NAVIGATION (All, Drafts, Live, Trash) */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 text-xs">
          {/* ALL ACTIVE */}
          <button
            type="button"
            onClick={() => setActiveFolder('all')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeFolder === 'all'
                ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>All Active</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
              {drafts.length + publishedTools.length}
            </span>
          </button>

          {/* DRAFTS */}
          <button
            type="button"
            onClick={() => setActiveFolder('drafts')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeFolder === 'drafts'
                ? 'bg-white dark:bg-zinc-900 text-amber-600 dark:text-amber-400 shadow-sm font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Drafts Queue</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold">
              {drafts.length}
            </span>
          </button>

          {/* LIVE PUBLISHED */}
          <button
            type="button"
            onClick={() => setActiveFolder('published')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeFolder === 'published'
                ? 'bg-white dark:bg-zinc-900 text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
            }`}
          >
            <span>Live Published</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold">
              {publishedTools.length}
            </span>
          </button>

          {/* TRASH FOLDER */}
          <button
            type="button"
            onClick={() => setActiveFolder('trash')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all ${
              activeFolder === 'trash'
                ? 'bg-white dark:bg-zinc-900 text-rose-600 dark:text-rose-400 shadow-sm font-bold'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-rose-600 dark:hover:text-rose-300'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Trash Folder</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
              trashTools.length > 0 
                ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300' 
                : 'bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
            }`}>
              {trashTools.length}
            </span>
          </button>
        </div>

        {/* View Toggle (Excel Table vs Cards) & Export */}
        <div className="flex items-center gap-2">
          {activeFolder === 'trash' && trashTools.length > 0 && (
            <button
              type="button"
              onClick={handleEmptyTrash}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 hover:bg-rose-100 transition-colors"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Empty Trash</span>
            </button>
          )}

          <div className="inline-flex items-center p-0.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Excel-style Spreadsheet Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
              }`}
              title="Card Preview View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* SPREADSHEET FILTER & SEARCH TOOLBAR */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 p-3 bg-white dark:bg-[#141517] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search tools by name, domain, tags, replaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-zinc-400 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-medium"
            >
              <option value="All">All Categories</option>
              {CATEGORIES.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-medium">
          Showing <span className="font-bold text-zinc-900 dark:text-zinc-100">{displayedTools.length}</span> of {currentFolderTools.length} {activeFolder}
        </div>
      </div>

      {/* MULTI-SELECT BULK ACTIONS BAR (STICKY WHEN SELECTIONS EXIST) */}
      {selectedIds.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/70 border border-indigo-200 dark:border-indigo-800 shadow-md flex flex-wrap items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-indigo-950 dark:text-indigo-200">
              {selectedIds.length} tool{selectedIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeFolder !== 'trash' ? (
              <>
                {/* Bulk Publish */}
                <button
                  type="button"
                  disabled={isBulkOperating}
                  onClick={() => handleBulkAction('publish')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>Publish Selected ({selectedIds.length})</span>
                </button>

                {/* Bulk Move to Draft */}
                <button
                  type="button"
                  disabled={isBulkOperating}
                  onClick={() => handleBulkAction('draft')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 hover:bg-amber-50 transition-all disabled:opacity-50"
                >
                  <span>Stage as Draft ({selectedIds.length})</span>
                </button>

                {/* Bulk Soft Delete / Trash */}
                <button
                  type="button"
                  disabled={isBulkOperating}
                  onClick={() => handleBulkAction('trash')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Move to Trash ({selectedIds.length})</span>
                </button>
              </>
            ) : (
              <>
                {/* Bulk Restore from Trash */}
                <button
                  type="button"
                  disabled={isBulkOperating}
                  onClick={() => handleBulkAction('restore')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restore Selected ({selectedIds.length})</span>
                </button>

                {/* Bulk Permanent Purge */}
                <button
                  type="button"
                  disabled={isBulkOperating}
                  onClick={() => handleBulkAction('permanent-delete')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-50"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Permanently Delete ({selectedIds.length})</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* EXCEL-STYLE TABLE GRID VIEW (PRIMARY) */}
      {loadingTools ? (
        <div className="py-20 text-center bg-white dark:bg-[#141517] rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-xs text-zinc-400">Loading spreadsheet data...</p>
        </div>
      ) : displayedTools.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-[#141517] rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-lg mx-auto shadow-sm">
          <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
            {activeFolder === 'trash' ? <Trash2 className="w-6 h-6" /> : <TableIcon className="w-6 h-6" />}
          </div>
          <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100 mb-1">
            {activeFolder === 'trash' ? 'Trash is Empty' : 'No Tools Found'}
          </h4>
          <p className="text-xs text-zinc-500 mb-5">
            {activeFolder === 'trash' 
              ? 'Deleted tools will appear here where you can restore them or purge them permanently.' 
              : 'Add tools manually or run AI Batch Sync to populate your directory.'}
          </p>
          {activeFolder !== 'trash' && (
            <button
              type="button"
              disabled={isBatchSyncing}
              onClick={handleBatchSync10}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Generate 10 AI Drafts</span>
            </button>
          )}
        </div>
      ) : viewMode === 'table' ? (
        /* SPREADSHEET TABLE */
        <div className="bg-white dark:bg-[#141517] rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              {/* SPREADSHEET HEADER */}
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/90 border-b border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 select-none">
                  {/* Select All Checkbox */}
                  <th className="w-10 px-3 py-3 text-center border-r border-zinc-200 dark:border-zinc-800/60">
                    <input
                      type="checkbox"
                      checked={displayedTools.length > 0 && selectedIds.length === displayedTools.length}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>

                  {/* Row # */}
                  <th className="w-12 px-2 py-3 text-center font-mono font-semibold text-zinc-400 border-r border-zinc-200 dark:border-zinc-800/60">
                    #
                  </th>

                  {/* Tool Name & Logo */}
                  <th 
                    onClick={() => handleSort('name')}
                    className="px-4 py-3 font-bold text-zinc-800 dark:text-zinc-200 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-r border-zinc-200 dark:border-zinc-800/60 min-w-[200px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Tool & Domain</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  {/* Category */}
                  <th 
                    onClick={() => handleSort('category')}
                    className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-r border-zinc-200 dark:border-zinc-800/60 min-w-[110px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Category</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  {/* Status */}
                  <th 
                    onClick={() => handleSort('status')}
                    className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-r border-zinc-200 dark:border-zinc-800/60 min-w-[90px]"
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span>Status</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  {/* Affiliate Link (Direct Cell Edit) */}
                  <th className="px-3 py-3 font-semibold text-indigo-950 dark:text-indigo-300 border-r border-zinc-200 dark:border-zinc-800/60 min-w-[220px]">
                    <div className="flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Affiliate / Referral Link</span>
                    </div>
                  </th>

                  {/* Learning Curve */}
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800/60 min-w-[130px]">
                    Learning Curve
                  </th>

                  {/* Tutorials */}
                  <th 
                    onClick={() => handleSort('tutorialCount')}
                    className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors border-r border-zinc-200 dark:border-zinc-800/60 text-center w-24"
                  >
                    <div className="flex items-center justify-center gap-1">
                      <span>Guides</span>
                      <ArrowUpDown className="w-3 h-3 text-zinc-400" />
                    </div>
                  </th>

                  {/* Replaces */}
                  <th className="px-3 py-3 font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800/60 min-w-[150px]">
                    Replaces
                  </th>

                  {/* Actions Column */}
                  <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 text-right min-w-[160px]">
                    Actions
                  </th>
                </tr>
              </thead>

              {/* SPREADSHEET ROWS */}
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {displayedTools.map((tool, idx) => {
                  const isSelected = selectedIds.includes(tool.id);
                  const isDraft = tool.status === 'draft';
                  const isLive = tool.status === 'published';
                  const isTrash = tool.status === 'trash';
                  const affiliateVal = affiliateInputs[tool.id] !== undefined 
                    ? affiliateInputs[tool.id] 
                    : (tool.affiliateUrl || '');
                  const isSavingAff = savingAffiliateId === tool.id;

                  return (
                    <tr 
                      key={tool.id} 
                      className={`transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 ${
                        isSelected ? 'bg-indigo-50/50 dark:bg-indigo-950/30' : ''
                      } ${isTrash ? 'opacity-85' : ''}`}
                    >
                      {/* Checkbox */}
                      <td className="px-3 py-2.5 text-center border-r border-zinc-200 dark:border-zinc-800/60">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectRow(tool.id)}
                          className="rounded border-zinc-300 dark:border-zinc-700 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>

                      {/* Row # */}
                      <td className="px-2 py-2.5 text-center font-mono text-[11px] text-zinc-400 border-r border-zinc-200 dark:border-zinc-800/60">
                        {idx + 1}
                      </td>

                      {/* Tool Logo & Name */}
                      <td className="px-4 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60">
                        <div className="flex items-center gap-2.5">
                          <ToolBrandLogo tool={tool} size="sm" />
                          <div className="min-w-0">
                            <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5 truncate">
                              <span>{tool.name}</span>
                              {tool.localLogoPath && (
                                <span className="text-[10px] text-emerald-600 font-mono" title="Self-hosted local logo">✓</span>
                              )}
                            </div>
                            <a
                              href={tool.website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[11px] text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-mono flex items-center gap-1 truncate"
                            >
                              <span>{tool.domain || tool.website?.replace(/^https?:\/\//, '')}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60">
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                          {tool.category}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60">
                        {isTrash ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            TRASH
                          </span>
                        ) : isLive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                            LIVE
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                            DRAFT
                          </span>
                        )}
                      </td>

                      {/* Affiliate Link (Inline Cell Input) */}
                      <td className="px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="url"
                            value={affiliateVal}
                            onChange={(e) => setAffiliateInputs(prev => ({ ...prev, [tool.id]: e.target.value }))}
                            onBlur={() => handleSaveAffiliate(tool.id)}
                            placeholder="https://.../?ref=yourname"
                            className="w-full px-2 py-1 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveAffiliate(tool.id)}
                            disabled={isSavingAff}
                            className="p-1 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-zinc-500 hover:text-indigo-600 transition-colors"
                            title="Save affiliate link"
                          >
                            {isSavingAff ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                          </button>
                        </div>
                      </td>

                      {/* Learning Curve */}
                      <td className="px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                            {tool.learningCurve?.level || 'Gentle'}
                          </span>
                          <span className="text-[10px] text-zinc-400 font-mono">
                            ({tool.learningCurve?.timeToLearn || '5m'})
                          </span>
                        </div>
                      </td>

                      {/* Tutorial Count */}
                      <td className="px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60 text-center font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                        {tool.tutorialCount || 12}
                      </td>

                      {/* What It Replaces */}
                      <td className="px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800/60">
                        <div className="truncate max-w-[180px] text-[11px] text-zinc-600 dark:text-zinc-400" title={tool.whatItReplaces}>
                          {tool.whatItReplaces || '—'}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-2.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* NON-TRASH ACTIONS */}
                          {!isTrash ? (
                            <>
                              {/* Quick Edit */}
                              <button
                                type="button"
                                onClick={() => startEditTool(tool)}
                                className="p-1.5 rounded-lg text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                title="Edit Tool Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>

                              {/* Toggle Publish / Draft */}
                              {isDraft ? (
                                <button
                                  type="button"
                                  onClick={() => handleQuickPublish(tool)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                  title="Publish to Live Directory"
                                >
                                  <UploadCloud className="w-3 h-3" />
                                  <span>Publish</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => handleQuickMoveToDraft(tool)}
                                  className="px-2 py-1 rounded-lg text-[11px] font-semibold border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                                  title="Move back to drafts"
                                >
                                  To Draft
                                </button>
                              )}

                              {/* Move to Trash */}
                              <button
                                type="button"
                                onClick={() => handleMoveToTrash(tool)}
                                className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                                title="Move to Trash folder"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            /* TRASH ACTIONS */
                            <>
                              {/* Restore Button */}
                              <button
                                type="button"
                                onClick={() => handleRestoreFromTrash(tool)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
                                title="Restore tool from Trash"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Restore</span>
                              </button>

                              {/* Permanent Delete */}
                              <button
                                type="button"
                                onClick={() => handlePermanentDelete(tool)}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 transition-colors"
                                title="Permanently delete from database"
                              >
                                <XCircle className="w-3 h-3" />
                                <span>Purge</span>
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW MODE */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {displayedTools.map(tool => {
            const isDraft = tool.status === 'draft';
            const isTrash = tool.status === 'trash';

            return (
              <div 
                key={tool.id} 
                className={`rounded-2xl border-2 ${
                  isTrash 
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/20' 
                    : isDraft 
                    ? 'border-amber-300/80 dark:border-amber-700/60 bg-white dark:bg-[#141517]' 
                    : 'border-zinc-200/90 dark:border-zinc-800/90 bg-white dark:bg-[#141517]'
                } p-6 shadow-sm flex flex-col justify-between relative overflow-hidden`}
              >
                <div className="absolute top-0 right-0 p-2 flex items-center gap-1.5">
                  {isTrash ? (
                    <span className="px-2.5 py-0.5 bg-rose-500 text-white font-bold text-[10px] uppercase font-mono rounded">TRASH</span>
                  ) : isDraft ? (
                    <span className="px-2.5 py-0.5 bg-amber-500 text-zinc-900 font-bold text-[10px] uppercase font-mono rounded">DRAFT</span>
                  ) : (
                    <span className="px-2.5 py-0.5 bg-emerald-500 text-white font-bold text-[10px] uppercase font-mono rounded">LIVE</span>
                  )}
                </div>

                <div>
                  <div className="flex items-start gap-3 mb-4 pr-24">
                    <ToolBrandLogo tool={tool} size="md" />
                    <div>
                      <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50">{tool.name}</h4>
                      <span className="text-xs text-zinc-400 font-mono">{tool.domain || tool.website}</span>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-700 dark:text-zinc-200 mb-3">{tool.description || tool.tagline}</p>
                  
                  {tool.whatItReplaces && (
                    <div className="p-2.5 mb-3 rounded-lg bg-zinc-50 dark:bg-zinc-900 text-xs">
                      <strong className="text-rose-600">Replaces:</strong> {tool.whatItReplaces}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                  <div className="flex items-center gap-2">
                    {!isTrash ? (
                      <>
                        <button
                          type="button"
                          onClick={() => startEditTool(tool)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveToTrash(tool)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          Trash
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleRestoreFromTrash(tool)}
                          className="px-3 py-1.5 text-xs font-bold text-emerald-600 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                        >
                          Restore
                        </button>
                        <button
                          type="button"
                          onClick={() => handlePermanentDelete(tool)}
                          className="px-3 py-1.5 text-xs font-semibold text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        >
                          Purge
                        </button>
                      </>
                    )}
                  </div>

                  {!isTrash && isDraft && (
                    <button
                      type="button"
                      onClick={() => handleQuickPublish(tool)}
                      className="px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow"
                    >
                      Publish Live
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* -----------------------------------------------------------------
          LIVE SYNC & VERCEL VERIFICATION MODAL
          ----------------------------------------------------------------- */}
      {publishLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl relative">
            <button
              type="button"
              onClick={() => setPublishLiveModal(null)}
              className="absolute top-4 right-4 p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>

            {publishLiveModal.status === 'syncing' && (
              <div className="text-center py-6">
                <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Streamlined Live Sync Pipeline
                </h3>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  Pulling live remote repository state, applying local database additions/deletions, pushing to GitHub main, and polling Vercel deployment...
                </p>
                <div className="mt-4 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                  {publishLiveModal.step || 'Executing sync pipeline...'}
                </div>
              </div>
            )}

            {publishLiveModal.status === 'verified' && (
              <div>
                <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center mb-4">
                  <CheckCircle className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight mb-2">
                  Live Sync Verified!
                </h3>
                <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-5 leading-relaxed">
                  Your local additions and deletions have been safely synchronized, pushed to GitHub main, and incorporated live on Vercel.
                </p>

                {/* Vercel Status Box */}
                <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 mb-6 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Commit SHA:</span>
                    <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                      {publishLiveModal.data?.commitHash}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-400">Published Tools Live:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {publishLiveModal.data?.publishedCount} Tools
                    </span>
                  </div>
                  {publishLiveModal.data?.vercel && (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-zinc-400">Vercel Build State:</span>
                        <span className="font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-[10px]">
                          {publishLiveModal.data.vercel.state || 'READY'}
                        </span>
                      </div>
                      {publishLiveModal.data.vercel.buildDuration && (
                        <div className="flex justify-between items-center">
                          <span className="text-zinc-400">Build Duration:</span>
                          <span className="font-mono text-zinc-700 dark:text-zinc-300">
                            {publishLiveModal.data.vercel.buildDuration}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-zinc-200 dark:border-zinc-800">
                    <span className="text-zinc-400">Production URL:</span>
                    <a
                      href="https://micro-saas-directory.vercel.app"
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-mono truncate max-w-[200px]"
                    >
                      micro-saas-directory.vercel.app
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setPublishLiveModal(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100"
                  >
                    Close
                  </button>
                  <a
                    href="https://micro-saas-directory.vercel.app"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow"
                  >
                    <span>View Live Site</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {publishLiveModal.status === 'error' && (
              <div>
                <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 flex items-center justify-center mb-4">
                  <AlertCircle className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                  Sync Pipeline Notice
                </h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 mb-6 font-mono p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900">
                  {publishLiveModal.error}
                </p>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setPublishLiveModal(null)}
                    className="px-4 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          INLINE EDIT TOOL MODAL / DRAWER
          ----------------------------------------------------------------- */}
      {editingTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <ToolBrandLogo tool={editingTool} size="sm" />
                <div>
                  <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                    Edit Tool: {editingTool.name}
                  </h4>
                  <span className="text-xs text-zinc-400 font-mono">{editingTool.domain || editingTool.website}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingTool(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Row 1: Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tool Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Category</label>
                  <select
                    value={editFormData.category || 'Utilities'}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description / Tagline</label>
                <textarea
                  rows={2}
                  value={editFormData.description || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              {/* Affiliate Link */}
              <div>
                <label className="block font-bold text-indigo-950 dark:text-indigo-300 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Custom Affiliate / Referral Link</span>
                  </span>
                </label>
                <input
                  type="url"
                  value={editFormData.affiliateUrl || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, affiliateUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/30 dark:bg-indigo-950/20 text-zinc-900 dark:text-zinc-100 font-mono"
                  placeholder="https://.../?ref=yourname"
                />
              </div>

              {/* Learning Curve, Time, Tutorial Count */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Learning Curve</label>
                  <select
                    value={editFormData.learningCurveLevel || 'Gentle'}
                    onChange={(e) => setEditFormData({ ...editFormData, learningCurveLevel: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  >
                    <option value="Gentle">Gentle (1/4)</option>
                    <option value="Low">Low (2/4)</option>
                    <option value="Moderate">Moderate (3/4)</option>
                    <option value="Steep">Steep (4/4)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Est. Time</label>
                  <input
                    type="text"
                    value={editFormData.learningCurveTime || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, learningCurveTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                    placeholder="5 mins"
                  />
                </div>
                <div>
                  <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Guides Count</label>
                  <input
                    type="number"
                    min="0"
                    value={editFormData.tutorialCount || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, tutorialCount: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              {/* What It Replaces */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">What Heavy Tool Does It Replace?</label>
                <input
                  type="text"
                  value={editFormData.whatItReplaces || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, whatItReplaces: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  placeholder="e.g. Miro, Mural, Jira"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block font-bold text-zinc-700 dark:text-zinc-300 mb-1">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={editFormData.tags || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, tags: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                  placeholder="Beginner-Friendly, Free Tier Available"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingTool(null)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSavingEdit}
                  onClick={handleSaveEdit}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow disabled:opacity-50"
                >
                  {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          QUICK ADD TOOL MODAL
          ----------------------------------------------------------------- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 max-w-xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Add New Anti-Bloat Tool</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Tool Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Supabase"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Website URL *</label>
                  <input
                    type="url"
                    placeholder="https://supabase.com"
                    value={manualWebsite}
                    onChange={(e) => setManualWebsite(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1">Category</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-semibold"
                >
                  {CATEGORIES.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">Description / Tagline</label>
                <textarea
                  rows={2}
                  placeholder="Concise anti-bloat description..."
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Affiliate Link (Optional)</label>
                <input
                  type="url"
                  placeholder="https://supabase.com/?ref=yourname"
                  value={manualAffiliate}
                  onChange={(e) => setManualAffiliate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">What It Replaces</label>
                <input
                  type="text"
                  placeholder="e.g. Complex AWS RDS & Firebase"
                  value={manualReplaces}
                  onChange={(e) => setManualReplaces(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isManualSubmitting}
                  onClick={() => handleManualAddSubmit(false)}
                  className="px-4 py-2 rounded-xl border border-amber-300 text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 font-semibold"
                >
                  Stage as Draft
                </button>
                <button
                  type="button"
                  disabled={isManualSubmitting}
                  onClick={() => handleManualAddSubmit(true)}
                  className="px-5 py-2 rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow"
                >
                  Publish Immediately
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -----------------------------------------------------------------
          BATCH JSON IMPORT MODAL
          ----------------------------------------------------------------- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">Batch Ingest Tool Records</h3>
              </div>
              <button type="button" onClick={() => setShowBatchModal(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-500 mb-3">
              Paste a JSON array of tool records. Logos will be fetched and saved into local storage automatically.
            </p>

            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={handleLoadSampleBatch}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100"
              >
                Load Sample 10-Tool Batch
              </button>
              {batchParsedCount !== null && (
                <span className="text-xs font-mono font-semibold text-emerald-600">
                  ✓ Valid JSON ({batchParsedCount} tools detected)
                </span>
              )}
            </div>

            {batchParseError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-xs text-rose-700 font-mono">
                {batchParseError}
              </div>
            )}

            <textarea
              rows={10}
              value={batchJsonInput}
              onChange={(e) => handleBatchInputChange(e.target.value)}
              placeholder='[ { "name": "Zed Editor", "website": "https://zed.dev", "category": "Utilities", ... } ]'
              className="w-full p-3 font-mono text-xs rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-950 text-emerald-400 mb-4 focus:outline-none"
              spellCheck={false}
            />

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isIngestingBatch || !batchParsedCount}
                onClick={handleIngestBatch}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow disabled:opacity-50"
              >
                {isIngestingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                <span>Ingest {batchParsedCount || ''} Tools into Drafts</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
