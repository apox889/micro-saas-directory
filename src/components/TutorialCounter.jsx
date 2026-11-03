import React, { useState } from 'react';
import { GraduationCap, Video, BookOpen, Sparkles } from 'lucide-react';

export default function TutorialCounter({ count, meta, toolName }) {
  const [showMeta, setShowMeta] = useState(false);

  return (
    <div className="relative inline-flex items-center">
      <button
        type="button"
        onMouseEnter={() => setShowMeta(true)}
        onMouseLeave={() => setShowMeta(false)}
        onClick={() => setShowMeta(!showMeta)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-300 transition-colors border border-zinc-200/60 dark:border-zinc-700/60"
        title={`${count} verified guides available`}
      >
        <GraduationCap className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
        <span>{count} Guides</span>
      </button>

      {/* Popover Breakdown */}
      {showMeta && meta && (
        <div className="absolute bottom-full left-0 mb-2 w-52 p-3 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg shadow-xl text-xs z-30 pointer-events-none">
          <div className="font-semibold text-xs mb-2 flex items-center justify-between border-b border-zinc-800 dark:border-zinc-200 pb-1.5">
            <span>{toolName} Resources</span>
            <span className="text-[10px] opacity-75 font-mono">{count} total</span>
          </div>
          <div className="space-y-1.5 text-[11px]">
            {meta.videoGuides && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 opacity-80">
                  <Video className="w-3 h-3 text-red-400" /> Video walkthroughs
                </span>
                <span className="font-mono font-medium">{meta.videoGuides}</span>
              </div>
            )}
            {meta.stepByStepDocs && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 opacity-80">
                  <BookOpen className="w-3 h-3 text-blue-400" /> Step-by-step docs
                </span>
                <span className="font-mono font-medium">{meta.stepByStepDocs}</span>
              </div>
            )}
            {meta.communityShortcuts && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 opacity-80">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Quick cheatsheets
                </span>
                <span className="font-mono font-medium">{meta.communityShortcuts}</span>
              </div>
            )}
          </div>
          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
        </div>
      )}
    </div>
  );
}
