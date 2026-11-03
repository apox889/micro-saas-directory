import React, { useState } from 'react';
import { ExternalLink, ShieldCheck, Copy, Check, X, ArrowUpRight, HeartHandshake } from 'lucide-react';
import ToolBrandLogo from './ToolBrandLogo';

export default function AffiliateModal({ tool, isOpen, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tool) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(tool.affiliateUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleProceed = () => {
    window.open(tool.affiliateUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-white dark:bg-[#161719] rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-md w-full p-6 shadow-2xl relative"
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <ToolBrandLogo tool={tool} size="lg" />
          <div>
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified Partner Referral</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
              Visiting {tool.name}
            </h3>
          </div>
        </div>

        {/* Affiliate Perk Highlight */}
        {tool.affiliatePerk && (
          <div className="p-3 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs">
            <span className="font-semibold text-emerald-800 dark:text-emerald-300">Exclusive Directory Perk: </span>
            <span className="text-emerald-700 dark:text-emerald-200">{tool.affiliatePerk}</span>
          </div>
        )}

        {/* Transparency Disclosure */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60 text-xs text-zinc-600 dark:text-zinc-400 space-y-2 mb-5">
          <div className="flex items-start gap-2">
            <HeartHandshake className="w-4 h-4 text-zinc-400 mt-0.5 flex-shrink-0" />
            <p className="leading-relaxed">
              We curate genuinely lightweight, anti-bloat tools. Clicking through our verified partner link helps fund our independent benchmarks and guide authoring at <strong>zero extra cost to you</strong>.
            </p>
          </div>
        </div>

        {/* Target Destination Link Preview */}
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs font-mono text-zinc-600 dark:text-zinc-400 mb-5 overflow-hidden">
          <span className="truncate">{tool.affiliateUrl}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-sans text-[11px] shadow-sm hover:bg-zinc-50 flex-shrink-0"
            title="Copy referral link"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Stay on Directory
          </button>
          <button
            type="button"
            onClick={handleProceed}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow transition-all"
          >
            <span>Proceed to {tool.name}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
