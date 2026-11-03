import React from 'react';
import { CATEGORIES } from '../data/toolsData';
import { Search, X, SlidersHorizontal, ArrowUpDown, Filter } from 'lucide-react';

export default function FilterBar({
  selectedCategory,
  onSelectCategory,
  searchQuery,
  onSearchChange,
  sortBy,
  onSortChange,
  activeTag,
  onClearTag,
  categoryCounts,
  totalResults
}) {
  return (
    <div className="space-y-4 mb-8">
      {/* Search & Sort Controls Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search input with icon */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search micro-tools by name, 'replaces Jira', 'video', 'obsidian'..."
            className="w-full pl-10 pr-9 py-2.5 text-sm rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141517] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sort Dropdown */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <span className="text-xs text-zinc-400 hidden xs:inline flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="text-xs font-medium py-2.5 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#141517] text-zinc-800 dark:text-zinc-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 cursor-pointer"
          >
            <option value="newest">Newest Tools First</option>
            <option value="learning-gentle">Learning Curve: Gentlest First</option>
            <option value="tutorials-most">Most Tutorials / Guides</option>
            <option value="name-asc">Tool Name (A to Z)</option>
          </select>
        </div>
      </div>

      {/* Category Pills & Active Tag Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count = categoryCounts[cat] || 0;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => onSelectCategory(cat)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm'
                    : 'bg-white dark:bg-[#141517] text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] font-mono px-1 rounded ${
                    isSelected
                      ? 'bg-zinc-800 text-zinc-300 dark:bg-zinc-200 dark:text-zinc-700'
                      : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Tag Filter Indicator */}
        {activeTag && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-xs text-indigo-700 dark:text-indigo-300">
            <span className="text-[11px] opacity-80">Filter tag:</span>
            <strong>{activeTag}</strong>
            <button
              type="button"
              onClick={onClearTag}
              className="p-0.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-500"
              title="Clear tag filter"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
