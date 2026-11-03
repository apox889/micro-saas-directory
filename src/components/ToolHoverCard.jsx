import React from 'react';
import ToolBrandLogo from './ToolBrandLogo';
import LearningCurveMeter from './LearningCurveMeter';
import TagBadge from './TagBadge';
import { 
  X, 
  ExternalLink, 
  BookOpen, 
  RefreshCw, 
  Users, 
  GraduationCap, 
  Zap, 
  ShieldCheck, 
  Video, 
  FileText, 
  Sparkles,
  Layers
} from 'lucide-react';

export default function ToolHoverCard({
  tool,
  targetAffiliateUrl,
  onClose,
  onSelectLessonPlan,
  position = 'top'
}) {
  if (!tool) return null;

  // Stored affiliate/referral link mapping with fallback
  const affiliateLink = 
    targetAffiliateUrl || 
    (tool?.affiliateUrl && tool.affiliateUrl.trim().length > 0 ? tool.affiliateUrl : null) || 
    (tool?.website ? `${tool.website.replace(/\/+$/, '')}/?ref=curateless` : `https://${tool?.domain || 'example.com'}/?ref=curateless`);

  return (
    <div
      role="tooltip"
      aria-label={`${tool.name} full details`}
      className="absolute inset-0 z-40 bg-white/95 dark:bg-[#161719]/95 backdrop-blur-md rounded-xl border-2 border-indigo-500/80 dark:border-indigo-500/70 p-5 shadow-2xl animate-hover-card flex flex-col justify-between overflow-y-auto"
    >
      {/* Top Header */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5 pb-3 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div className="flex items-center gap-3">
            <ToolBrandLogo tool={tool} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {tool.name}
                </h4>
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  {tool.category}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 mt-0.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{tool.domain || 'Verified anti-bloat'}</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title="Close details"
            aria-label="Close details"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Complete Unabridged Tagline & Description */}
        <div className="mb-3.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500 block mb-1">
            Complete Overview
          </span>
          <p className="text-xs text-zinc-700 dark:text-zinc-200 leading-relaxed font-normal">
            {tool.description || tool.tagline}
          </p>
        </div>

        {/* Complete What It Replaces (Unabridged) */}
        <div className="p-3 mb-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/70 dark:border-zinc-800/70 text-xs">
          <div className="flex items-start gap-2 mb-1">
            <RefreshCw className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Replaces: </span>
              <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{tool.whatItReplaces}</span>
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed pl-5">
            {tool.replacesDetailed}
          </p>
        </div>

        {/* Target Audience (Unabridged) */}
        <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-300 mb-3.5">
          <Users className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
          <p className="leading-relaxed">
            <strong className="font-semibold text-zinc-800 dark:text-zinc-200">Target Audience: </strong>
            {tool.targetAudience}
          </p>
        </div>

        {/* Learning Curve Breakdown */}
        <div className="p-3 mb-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200/60 dark:border-zinc-800/60 text-xs">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Learning Curve
            </span>
            <LearningCurveMeter learningCurve={tool.learningCurve} />
          </div>
          {tool.learningCurve?.summary && (
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {tool.learningCurve.summary}
            </p>
          )}
        </div>

        {/* Tutorials Breakdown */}
        {tool.tutorialMeta && (
          <div className="flex items-center justify-between text-xs p-2.5 mb-3.5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200/50 dark:border-indigo-800/50">
            <span className="flex items-center gap-1.5 font-semibold text-indigo-700 dark:text-indigo-300 text-[11px]">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{tool.tutorialCount || 12} Verified Guides Available</span>
            </span>
            <div className="flex items-center gap-2 text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              {tool.tutorialMeta.videoGuides && <span>📹 {tool.tutorialMeta.videoGuides} videos</span>}
              {tool.tutorialMeta.stepByStepDocs && <span>📖 {tool.tutorialMeta.stepByStepDocs} docs</span>}
            </div>
          </div>
        )}

        {/* Full Tags List */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.tags.map((tag) => (
            <TagBadge key={tag} tag={tag} clickable={false} />
          ))}
        </div>
      </div>

      {/* Action Footer */}
      <div className="pt-3 border-t border-zinc-200/80 dark:border-zinc-800/80 grid grid-cols-2 gap-2 mt-2">
        <button
          type="button"
          onClick={() => {
            if (onClose) onClose();
            if (onSelectLessonPlan) onSelectLessonPlan(tool);
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span>Lesson Plan</span>
        </button>

        {/* Primary Action Button: Opens affiliate link directly in a brand new tab with NO popup */}
        <a
          href={affiliateLink}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (onClose) onClose();
          }}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow transition-all select-none"
          title={`Try ${tool.name} (Opens affiliate link in a brand new tab)`}
        >
          <span>Try {tool.name}</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </a>
      </div>
    </div>
  );
}
