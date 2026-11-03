import React from 'react';
import { ArrowLeftRight, Sparkles, CheckCircle2, Code2, Tag } from 'lucide-react';

export default function TagBadge({ tag, active = false, onClick, clickable = true }) {
  const isAlternative = tag.startsWith("Alternative to");
  const isBeginner = tag === "Beginner-Friendly";
  const isFreeTier = tag === "Free Tier Available";
  const isOpenSource = tag === "Open Source";

  let badgeStyle = "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:text-zinc-300 dark:hover:bg-zinc-700 border-zinc-200/80 dark:border-zinc-700/80";
  let icon = null;

  if (isAlternative) {
    badgeStyle = active
      ? "bg-violet-600 text-white border-violet-600 shadow-sm"
      : "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800/50 hover:bg-violet-100 dark:hover:bg-violet-900/60";
    icon = <ArrowLeftRight className="w-3 h-3 text-violet-500 dark:text-violet-400" />;
  } else if (isBeginner) {
    badgeStyle = active
      ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
      : "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60";
    icon = <Sparkles className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />;
  } else if (isFreeTier) {
    badgeStyle = active
      ? "bg-teal-600 text-white border-teal-600 shadow-sm"
      : "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/50 hover:bg-teal-100 dark:hover:bg-teal-900/60";
    icon = <CheckCircle2 className="w-3 h-3 text-teal-500 dark:text-teal-400" />;
  } else if (isOpenSource) {
    badgeStyle = active
      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
      : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/50 hover:bg-blue-100 dark:hover:bg-blue-900/60";
    icon = <Code2 className="w-3 h-3 text-blue-500 dark:text-blue-400" />;
  } else if (active) {
    badgeStyle = "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-zinc-900 dark:border-white shadow-sm";
  }

  const TagElement = clickable ? 'button' : 'span';

  return (
    <TagElement
      type={clickable ? "button" : undefined}
      onClick={clickable && onClick ? () => onClick(tag) : undefined}
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-all duration-150 ${badgeStyle} ${
        clickable ? 'cursor-pointer' : 'cursor-default'
      }`}
      title={clickable ? `Filter by ${tag}` : tag}
    >
      {icon}
      <span>{tag}</span>
    </TagElement>
  );
}
