import React from 'react';
import { Sun, Moon, Zap, Sparkles, Plus, Info, ShieldCheck, LayoutDashboard, ArrowLeft } from 'lucide-react';

export default function Header({ 
  darkMode, 
  setDarkMode, 
  onOpenSuggest, 
  onTogglePhilosophy,
  isAdminView = false,
  onExitAdmin,
  toolCount 
}) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-[#fafaf9]/90 dark:bg-[#0c0d0e]/90 border-b border-zinc-200/80 dark:border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <a 
            href="/"
            onClick={(e) => {
              if (isAdminView && onExitAdmin) {
                e.preventDefault();
                onExitAdmin();
              }
            }}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 flex items-center justify-center font-bold shadow-sm transition-transform group-hover:scale-105">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
                CurateLess
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-semibold">
                  Anti-Bloat
                </span>
              </span>
            </div>
          </a>

          {/* Local Logo Storage Status Pill */}
          <div className="hidden lg:flex items-center gap-1.5 ml-2 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-800/60 text-[11px] text-emerald-700 dark:text-emerald-300 font-medium" title="All tool brand logos are downloaded and permanently hosted on local server storage">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Locally-Hosted Logos</span>
          </div>

          {/* Exclusively visible when currently on /admin */}
          {isAdminView && (
            <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 ml-2">
              <LayoutDashboard className="w-3 h-3" />
              <span>/admin path</span>
            </div>
          )}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* If inside /admin route: Show quick button to exit to public site */}
          {isAdminView && onExitAdmin && (
            <button
              type="button"
              onClick={onExitAdmin}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-sm hover:opacity-90 transition-opacity"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit Admin</span>
            </button>
          )}

          {/* Anti-bloat Philosophy Pill */}
          <button
            type="button"
            onClick={onTogglePhilosophy}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors"
          >
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <span>Manifesto</span>
          </button>

          {/* Suggest Tool */}
          <button
            type="button"
            onClick={onOpenSuggest}
            className="hidden xs:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Suggest</span>
          </button>

          {/* Dark / Light Mode Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode(!darkMode)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-600" />}
          </button>
        </div>
      </div>
    </header>
  );
}
