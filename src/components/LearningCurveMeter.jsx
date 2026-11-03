import React, { useState } from 'react';
import { LEARNING_CURVE_CONFIG } from '../data/toolsData';
import { Zap, HelpCircle } from 'lucide-react';

export default function LearningCurveMeter({ learningCurve, compact = false }) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = LEARNING_CURVE_CONFIG[learningCurve.level] || LEARNING_CURVE_CONFIG.Gentle;
  const score = config.score; // 1 to 4

  return (
    <div className="relative inline-flex items-center">
      <div 
        className="flex items-center gap-2 group cursor-pointer"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={() => setShowTooltip(!showTooltip)}
      >
        {/* Segmented meter */}
        <div className="flex items-center gap-1" title={`Learning curve: ${config.label} (${config.description})`}>
          {[1, 2, 3, 4].map((seg) => {
            const isActive = seg <= score;
            let activeColor = "bg-emerald-500 dark:bg-emerald-400";
            if (score === 2) activeColor = "bg-blue-500 dark:bg-blue-400";
            if (score === 3) activeColor = "bg-amber-500 dark:bg-amber-400";
            if (score === 4) activeColor = "bg-rose-500 dark:bg-rose-400";

            return (
              <span
                key={seg}
                className={`h-2 rounded-full transition-all duration-300 ${
                  compact ? 'w-2.5' : 'w-3.5'
                } ${
                  isActive
                    ? activeColor
                    : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              />
            );
          })}
        </div>

        {/* Text Badge */}
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border transition-colors ${config.bgClass}`}>
          {learningCurve.level}
        </span>

        {learningCurve.timeToLearn && !compact && (
          <span className="text-[11px] text-zinc-400 dark:text-zinc-500">
            ~{learningCurve.timeToLearn}
          </span>
        )}
      </div>

      {/* Floating Tooltip */}
      {showTooltip && (
        <div className="absolute bottom-full left-0 mb-2 w-56 p-2.5 bg-zinc-900 text-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 text-xs rounded-lg shadow-xl z-30 pointer-events-none transition-all duration-200">
          <div className="flex items-center gap-1.5 font-semibold mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Learning Curve: {learningCurve.level}</span>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90">
            {learningCurve.summary || config.description}
          </p>
          <div className="absolute top-full left-4 -mt-1 border-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100" />
        </div>
      )}
    </div>
  );
}
