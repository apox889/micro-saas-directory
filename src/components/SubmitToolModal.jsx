import React, { useState } from 'react';
import { X, Send, Sparkles, Check, Download, AlertCircle, Loader2 } from 'lucide-react';
import { CATEGORIES } from '../data/toolsData';

export default function SubmitToolModal({ isOpen, onClose, onAddTool }) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [whatItReplaces, setWhatItReplaces] = useState('');
  const [category, setCategory] = useState('Utilities');
  const [learningCurve, setLearningCurve] = useState('Gentle');
  const [targetAudience, setTargetAudience] = useState('');
  
  // Backend logo download states
  const [isDownloadingLogo, setIsDownloadingLogo] = useState(false);
  const [downloadedLogoMeta, setDownloadedLogoMeta] = useState(null);
  const [logoDownloadError, setLogoDownloadError] = useState(null);
  
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  // Trigger backend utility to download official logo directly to permanent local storage
  const handleFetchLogo = async (urlToFetch) => {
    const targetUrl = urlToFetch || website;
    if (!targetUrl.trim()) return;

    setIsDownloadingLogo(true);
    setLogoDownloadError(null);

    try {
      const slug = name.trim() ? name.toLowerCase().replace(/\s+/g, '-') : undefined;
      const res = await fetch('/api/tools/fetch-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ website: targetUrl, slug, name })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to download logo');
      }

      setDownloadedLogoMeta(data);
    } catch (err) {
      console.warn('[Modal] Automatic backend logo fetch notice:', err.message);
      // Fallback preview
      setLogoDownloadError(err.message);
    } finally {
      setIsDownloadingLogo(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !whatItReplaces.trim()) return;

    let localLogoPath = downloadedLogoMeta?.localLogoPath || null;

    // If logo not yet downloaded, trigger backend download now
    if (!localLogoPath && website.trim()) {
      setIsDownloadingLogo(true);
      try {
        const slug = name.toLowerCase().replace(/\s+/g, '-');
        const res = await fetch('/api/tools/fetch-logo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ website, slug, name })
        });
        const data = await res.json();
        if (data.success) {
          localLogoPath = data.localLogoPath;
        }
      } catch (err) {
        console.warn('Backend download on submit:', err);
      } finally {
        setIsDownloadingLogo(false);
      }
    }

    if (onAddTool) {
      onAddTool({
        name,
        website,
        localLogoPath,
        whatItReplaces,
        category,
        learningCurve,
        targetAudience: targetAudience || 'Builders & digital craftsmen looking for lean software.'
      });
    }

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      // Reset form
      setName('');
      setWebsite('');
      setWhatItReplaces('');
      setTargetAudience('');
      setDownloadedLogoMeta(null);
      setLogoDownloadError(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161719] rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-lg w-full p-6 sm:p-7 shadow-2xl relative">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Curator Submission & Backend Logo Pipeline</span>
        </div>

        <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 mb-1">
          Suggest an Anti-Bloat Tool
        </h3>
        <p className="text-xs text-zinc-500 mb-5">
          Input the tool's website URL and our backend server will automatically download its official logo to permanent storage.
        </p>

        {submitted ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm">
              Tool & Local Logo Successfully Stored!
            </h4>
            <p className="text-xs text-zinc-500">
              {name} has been added with permanent local logo storage.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zed Editor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Official Website URL *
                </label>
                <div className="relative">
                  <input
                    type="url"
                    required
                    placeholder="https://zed.dev"
                    value={website}
                    onChange={(e) => {
                      setWebsite(e.target.value);
                      setDownloadedLogoMeta(null);
                    }}
                    onBlur={() => {
                      if (website.trim().length > 6 && !downloadedLogoMeta) {
                        handleFetchLogo(website);
                      }
                    }}
                    className="w-full pl-3 pr-8 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                  />
                  {isDownloadingLogo && (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                  )}
                </div>
              </div>
            </div>

            {/* Backend Logo Status Box */}
            {website && (
              <div className="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
                {isDownloadingLogo ? (
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Backend downloading official brand logo to permanent local storage...</span>
                  </div>
                ) : downloadedLogoMeta ? (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded bg-white dark:bg-zinc-800 border p-1 flex items-center justify-center flex-shrink-0">
                        <img
                          src={downloadedLogoMeta.localLogoPath}
                          alt="Downloaded logo"
                          className="w-6 h-6 object-contain"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px]">
                          <Check className="w-3.5 h-3.5" />
                          <span>Logo Permanently Downloaded to Server</span>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono">
                          path: {downloadedLogoMeta.localLogoPath} ({downloadedLogoMeta.sizeBytes} B)
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Zero Broken Links
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-zinc-500">
                    <span className="text-[11px]">Domain: {website.replace(/^https?:\/\//, '').split('/')[0]}</span>
                    <button
                      type="button"
                      onClick={() => handleFetchLogo()}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      <Download className="w-3 h-3" />
                      <span>Fetch Logo Now</span>
                    </button>
                  </div>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                What Heavy Software Does It Replace? *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Replaces VS Code's memory bloat with instant 120fps GPU editor"
                value={whatItReplaces}
                onChange={(e) => setWhatItReplaces(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                >
                  {CATEGORIES.filter(c => c !== "All").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Learning Curve
                </label>
                <select
                  value={learningCurve}
                  onChange={(e) => setLearningCurve(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
                >
                  <option value="Gentle">Gentle (Instant to learn)</option>
                  <option value="Low">Low (~10 minutes)</option>
                  <option value="Moderate">Moderate (Requires practice)</option>
                  <option value="Steep">Steep (High mastery)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Target Audience
              </label>
              <input
                type="text"
                placeholder="e.g. Systems programmers, minimalists, fast typists"
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isDownloadingLogo}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow transition-all disabled:opacity-50"
              >
                {isDownloadingLogo ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>Save Tool & Local Logo</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
