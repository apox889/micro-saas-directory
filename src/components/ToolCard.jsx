import React, { useState, useRef } from 'react';
import LearningCurveMeter from './LearningCurveMeter';
import TutorialCounter from './TutorialCounter';
import TagBadge from './TagBadge';
import ToolBrandLogo from './ToolBrandLogo';
import ToolHoverCard from './ToolHoverCard';
import { ExternalLink, BookOpen, Users, RefreshCw, Zap, ShieldCheck, Info } from 'lucide-react';

export default function ToolCard({
  tool,
  onSelectLessonPlan,
  onTagClick,
  activeTag
}) {
  const [showHoverCard, setShowHoverCard] = useState(false);
  const hoverTimeoutRef = useRef(null);

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setShowHoverCard(true);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setShowHoverCard(false);
    }, 200);
  };

  // Stored affiliate/referral link mapping with fallback
  const targetAffiliateUrl = 
    (tool?.affiliateUrl && tool.affiliateUrl.trim().length > 0)
      ? tool.affiliateUrl
      : tool?.website
        ? `${tool.website.replace(/\/+$/, '')}/?ref=curateless`
        : `https://${tool?.domain || 'example.com'}/?ref=curateless`;

  return (
    <article 
      className="card-hover-effect relative flex flex-col justify-between bg-white dark:bg-[#141517] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-5 shadow-sm transition-all duration-200 hover:border-zinc-300 dark:hover:border-zinc-700"
      onMouseLeave={handleMouseLeave}
    >
      {/* Top Header: Logo, Name, Category, Tutorial Count */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            {/* Logo Container with hover trigger for full unabridged metadata */}
            <div
              className="relative cursor-pointer group/logo"
              onMouseEnter={handleMouseEnter}
              onClick={() => setShowHoverCard(!showHoverCard)}
              title="Hover or click logo for complete unabridged description & full metadata"
            >
              <ToolBrandLogo tool={tool} size="md" />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-indigo-50 dark:bg-indigo-950 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 flex items-center justify-center opacity-0 group-hover/logo:opacity-100 transition-opacity">
                <Info className="w-2.5 h-2.5" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-zinc-900 dark:text-zinc-50 tracking-tight">
                  {tool.name}
                </h3>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {tool.category}
                </span>
                <button
                  type="button"
                  onClick={() => setShowHoverCard(true)}
                  className="p-0.5 rounded text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  title="View complete unabridged description & specs"
                  aria-label="View complete unabridged description"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tool Description: Cleanly truncated to 2 lines with ellipsis */}
              <p 
                className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 leading-relaxed mt-1 overflow-hidden text-ellipsis cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors"
                onClick={() => setShowHoverCard(true)}
                title="Click or hover logo to view full unabridged description"
              >
                {tool.description || tool.tagline}
              </p>
            </div>
          </div>

          {/* Tutorial Counter Component */}
          <TutorialCounter
            count={tool.tutorialCount}
            meta={tool.tutorialMeta}
            toolName={tool.name}
          />
        </div>

        {/* What It Replaces Box - Prominent Anti-Bloat Badge (Cleanly truncated to 2 lines) */}
        <div className="mt-3.5 mb-3 p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
          <div className="flex items-start gap-2">
            <RefreshCw className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs w-full">
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Replaces: </span>
              <span className="text-zinc-600 dark:text-zinc-300 font-medium">{tool.whatItReplaces}</span>
              <p 
                className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2 leading-relaxed overflow-hidden text-ellipsis cursor-pointer hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                onClick={() => setShowHoverCard(true)}
                title="Click to view complete unabridged anti-bloat rationale"
              >
                {tool.replacesDetailed}
              </p>
            </div>
          </div>
        </div>

        {/* Target Audience */}
        <div className="flex items-start gap-2 text-xs text-zinc-600 dark:text-zinc-400 mb-3.5">
          <Users className="w-3.5 h-3.5 text-zinc-400 mt-0.5 flex-shrink-0" />
          <p className="leading-snug line-clamp-2 overflow-hidden text-ellipsis">
            <strong className="font-medium text-zinc-700 dark:text-zinc-300">Audience: </strong>
            {tool.targetAudience}
          </p>
        </div>

        {/* Tag Badges Container */}
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tool.tags.map((tag) => (
            <TagBadge
              key={tag}
              tag={tag}
              active={activeTag === tag}
              onClick={onTagClick}
            />
          ))}
        </div>
      </div>

      {/* Footer Area: Learning Curve Meter + Action Buttons */}
      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
        <div className="flex items-center justify-between mb-3 text-xs">
          <span className="text-zinc-400 dark:text-zinc-500 text-[11px] font-medium uppercase tracking-wider">
            Learning Curve
          </span>
          <LearningCurveMeter learningCurve={tool.learningCurve} />
        </div>

        {/* Affiliate Perk / Pricing subtitle */}
        {tool.affiliatePerk && (
          <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-3 px-1">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              {tool.affiliateBadge || "Partner Perk"}
            </span>
            <span className="truncate max-w-[170px]" title={tool.affiliatePerk}>
              {tool.affiliatePerk}
            </span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="grid grid-cols-2 gap-2">
          {/* Dedicated Lesson Plan Button */}
          <button
            type="button"
            onClick={() => onSelectLessonPlan(tool)}
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
            <span>Lesson Plan</span>
          </button>

          {/* Primary Action / Affiliate Link Button: Opens directly in a brand new tab with NO popup */}
          <a
            href={targetAffiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-sm transition-all select-none"
            title={`Try ${tool.name} (Opens affiliate link in a brand new tab)`}
          >
            <span>Try {tool.name}</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>
        </div>
      </div>

      {/* Complete Unabridged Hover Card / Tooltip Popover */}
      {showHoverCard && (
        <div
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <ToolHoverCard
            tool={tool}
            targetAffiliateUrl={targetAffiliateUrl}
            onClose={() => setShowHoverCard(false)}
            onSelectLessonPlan={onSelectLessonPlan}
          />
        </div>
      )}
    </article>
  );
}
