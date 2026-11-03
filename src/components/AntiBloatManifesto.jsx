import React from 'react';
import { Zap, ShieldCheck, Cpu, HardDrive, BellOff, X } from 'lucide-react';

export default function AntiBloatManifesto({ isOpen, onClose }) {
  if (!isOpen) return null;

  const principles = [
    {
      icon: <Cpu className="w-5 h-5 text-indigo-500" />,
      title: "Sub-100ms Native Response",
      desc: "No multi-second loading spinners, no 400MB Electron app memory footprints. Tools should open and respond at the speed of thought."
    },
    {
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      title: "Single Focused Superpower",
      desc: "Do one thing exceptionally well rather than 50 mediocre things with 100 confusing sub-menus."
    },
    {
      icon: <HardDrive className="w-5 h-5 text-emerald-500" />,
      title: "Data Sovereignty & Local-First",
      desc: "Your data belongs to you. We favor tools that work offline, use open standards (Markdown, SVG, JSON), and don't lock your notes into proprietary silos."
    },
    {
      icon: <BellOff className="w-5 h-5 text-rose-500" />,
      title: "Zero Distraction & Notification Bloat",
      desc: "No forced corporate onboarding webinars, no intrusive chatbot popups in the corner, and no constant upsell spam."
    },
    {
      icon: <ShieldCheck className="w-5 h-5 text-teal-500" />,
      title: "Honest, Predictable Pricing",
      desc: "Generous free tiers, open-source codebases, or fair one-time licenses instead of extortionate per-seat monthly billing."
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="bg-white dark:bg-[#161719] rounded-2xl border border-zinc-200 dark:border-zinc-800 max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 mb-2">
          <span>Our Curation Philosophy</span>
        </div>

        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mb-3">
          The Anti-Bloat Software Manifesto
        </h2>

        <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
          Over the past decade, modern software has suffered from severe feature creep. Simple tools have transformed into bloated enterprise suites loaded with mandatory analytics, slow cloud roundtrips, and paywalled basic utilities. <strong>CurateLess</strong> exists to index the lightweight alternatives built by craftsmen who value your time.
        </p>

        <div className="grid gap-4 mb-6">
          {principles.map((p, i) => (
            <div key={i} className="flex items-start gap-3.5 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200/60 dark:border-zinc-800/60">
              <div className="p-2 rounded-lg bg-white dark:bg-zinc-800 shadow-sm flex-shrink-0">
                {p.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {p.title}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 transition-colors"
          >
            Got It — Explore Directory
          </button>
        </div>
      </div>
    </div>
  );
}
