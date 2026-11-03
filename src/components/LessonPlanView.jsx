import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  CheckCircle, 
  Circle, 
  Clock, 
  ExternalLink, 
  Share2, 
  Sparkles, 
  BookOpen, 
  Download, 
  ShieldCheck, 
  Lightbulb, 
  Check, 
  PlusCircle, 
  GraduationCap
} from 'lucide-react';
import LearningCurveMeter from './LearningCurveMeter';
import TagBadge from './TagBadge';
import ToolBrandLogo from './ToolBrandLogo';

export default function LessonPlanView({ tool, onBack, onAffiliateClick }) {
  const [completedSteps, setCompletedSteps] = useState(() => {
    try {
      const saved = localStorage.getItem(`progress_${tool.id}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [copiedLink, setCopiedLink] = useState(false);
  const [showAddCustomModal, setShowAddCustomModal] = useState(false);
  const [customSteps, setCustomSteps] = useState([]);
  const [newStepTitle, setNewStepTitle] = useState('');
  const [newStepDesc, setNewStepDesc] = useState('');

  const lesson = tool.lessonPlan;
  const allSteps = [...(lesson?.steps || []), ...customSteps];
  const totalSteps = allSteps.length;
  const progressPercent = totalSteps > 0 ? Math.round((completedSteps.length / totalSteps) * 100) : 0;

  useEffect(() => {
    try {
      localStorage.setItem(`progress_${tool.id}`, JSON.stringify(completedSteps));
    } catch {
      // storage unavailable
    }
  }, [completedSteps, tool.id]);

  const toggleStep = (stepNumber) => {
    setCompletedSteps((prev) =>
      prev.includes(stepNumber) ? prev.filter((s) => s !== stepNumber) : [...prev, stepNumber]
    );
  };

  const markAllComplete = () => {
    setCompletedSteps(allSteps.map((s) => s.stepNumber));
  };

  const resetProgress = () => {
    setCompletedSteps([]);
  };

  const handleCopyLink = () => {
    const dummyUrl = `${window.location.origin}${window.location.pathname}#/lesson-plan/${tool.slug}`;
    navigator.clipboard.writeText(dummyUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  const handleAddCustomStep = (e) => {
    e.preventDefault();
    if (!newStepTitle.trim()) return;

    const newStep = {
      stepNumber: allSteps.length + 1,
      title: newStepTitle,
      timeEstimate: "5 mins",
      description: newStepDesc || "Custom team or user step added to this lesson plan.",
      actionItems: ["Custom action item configured for your workflow."],
      proTip: "Keep steps short, measurable, and free of unnecessary cognitive load."
    };

    setCustomSteps([...customSteps, newStep]);
    setNewStepTitle('');
    setNewStepDesc('');
    setShowAddCustomModal(false);
  };

  const exportMarkdown = () => {
    const md = [
      `# ${lesson.title}`,
      `**Tool:** ${tool.name} (${tool.category})`,
      `**Duration:** ${lesson.estimatedTime} | **Difficulty:** ${lesson.difficulty}`,
      `**What it replaces:** ${tool.whatItReplaces}`,
      `**Affiliate Link:** ${tool.affiliateUrl}`,
      ``,
      `## Overview`,
      lesson.overview,
      ``,
      `## Step-by-Step Curriculum`,
      ...allSteps.map(
        (step) => `### Step ${step.stepNumber}: ${step.title} (${step.timeEstimate})\n${step.description}\n\n**Action Items:**\n${step.actionItems.map(a => `- [ ] ${a}`).join('\n')}\n\n*Pro-Tip:* ${step.proTip}\n`
      )
    ].join('\n\n');

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tool.slug}-lesson-plan.md`;
    a.click();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Dummy Clean Route Pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200 dark:border-zinc-700 text-[11px] font-mono text-zinc-500">
            <span>route:</span>
            <span className="text-zinc-800 dark:text-zinc-200 font-semibold">/lesson-plan/{tool.slug}</span>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            title="Copy shareable link to this lesson plan"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copiedLink ? "Link Copied" : "Share"}</span>
          </button>

          <button
            type="button"
            onClick={exportMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            title="Download lesson plan as Markdown checklist"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Lesson Header Card */}
      <div className="bg-white dark:bg-[#141517] rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 p-6 sm:p-8 shadow-sm mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3.5">
            <ToolBrandLogo tool={tool} size="lg" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  {tool.category} Onboarding Course
                </span>
                <span className="text-zinc-300 dark:text-zinc-700">•</span>
                <span className="text-xs text-zinc-500">{tool.tutorialCount} total guides</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight mt-0.5">
                {lesson.title}
              </h1>
            </div>
          </div>

          {/* Primary Affiliate Action Button: Opens affiliate link directly in a brand new tab with NO popup */}
          <a
            href={(tool?.affiliateUrl && tool.affiliateUrl.trim().length > 0) ? tool.affiliateUrl : (tool?.website ? `${tool.website.replace(/\/+$/, '')}/?ref=curateless` : `https://${tool?.domain || 'example.com'}/?ref=curateless`)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 shadow transition-all flex-shrink-0 select-none"
            title={`Launch ${tool.name} (Opens affiliate link in a brand new tab)`}
          >
            <span>Launch {tool.name}</span>
            <ExternalLink className="w-4 h-4 opacity-80" />
          </a>
        </div>

        <p className="text-sm sm:text-base text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6">
          {lesson.overview}
        </p>

        {/* Metadata Pills */}
        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 text-xs">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>Estimated Time: <strong>{lesson.estimatedTime}</strong></span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
            <span className="text-zinc-500">Learning Curve:</span>
            <LearningCurveMeter learningCurve={tool.learningCurve} compact={true} />
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800/50">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Target: {tool.targetAudience}</span>
          </div>

          {tool.affiliatePerk && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{tool.affiliatePerk}</span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Progress Tracking Bar */}
      <div className="bg-white dark:bg-[#141517] rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 p-4 sm:p-5 mb-8 shadow-sm">
        <div className="flex items-center justify-between text-xs sm:text-sm font-medium mb-2.5">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-zinc-900 dark:text-zinc-100">Your Onboarding Progress</span>
            <span className="text-xs text-zinc-400 font-mono">
              ({completedSteps.length} of {totalSteps} steps completed)
            </span>
          </div>
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">{progressPercent}%</span>
        </div>

        {/* Progress Bar Track */}
        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
          <span>Click checkboxes on steps below as you complete each one.</span>
          <div className="flex items-center gap-3">
            {completedSteps.length > 0 && (
              <button
                type="button"
                onClick={resetProgress}
                className="hover:text-zinc-900 dark:hover:text-zinc-200 underline text-[11px]"
              >
                Reset Progress
              </button>
            )}
            {completedSteps.length < totalSteps && (
              <button
                type="button"
                onClick={markAllComplete}
                className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline text-[11px]"
              >
                Mark All Done
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Completion Banner if 100% */}
      {progressPercent === 100 && (
        <div className="mb-8 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <h4 className="font-semibold text-emerald-900 dark:text-emerald-200 text-sm">
                Mastery Achieved!
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                You have completed all {totalSteps} steps to de-bloat your workflow with {tool.name}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onAffiliateClick ? onAffiliateClick(tool) : window.open(tool.affiliateUrl, '_blank')}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 flex-shrink-0"
          >
            Open {tool.name} Now
          </button>
        </div>
      )}

      {/* Step-by-Step Curriculum Cards */}
      <div className="space-y-6">
        {allSteps.map((step, idx) => {
          const isDone = completedSteps.includes(step.stepNumber);

          return (
            <div
              key={step.stepNumber}
              className={`rounded-xl border transition-all duration-200 p-5 sm:p-6 ${
                isDone
                  ? 'bg-zinc-50/70 dark:bg-zinc-900/40 border-emerald-200/70 dark:border-emerald-900/40'
                  : 'bg-white dark:bg-[#141517] border-zinc-200/80 dark:border-zinc-800/80 shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  {/* Step Number Tag */}
                  <span className={`text-xs font-mono font-bold px-2 py-1 rounded-md ${
                    isDone 
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}>
                    STEP {step.stepNumber < 10 ? `0${step.stepNumber}` : step.stepNumber}
                  </span>

                  <h3 className={`font-semibold text-base sm:text-lg tracking-tight ${
                    isDone ? 'line-through text-zinc-500 dark:text-zinc-400' : 'text-zinc-900 dark:text-zinc-50'
                  }`}>
                    {step.title}
                  </h3>
                </div>

                {/* Interactive Complete Checkbox */}
                <button
                  type="button"
                  onClick={() => toggleStep(step.stepNumber)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    isDone
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      : 'bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100 dark:bg-zinc-800/50 dark:text-zinc-300 dark:border-zinc-700 dark:hover:bg-zinc-800'
                  }`}
                >
                  {isDone ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Completed</span>
                    </>
                  ) : (
                    <>
                      <Circle className="w-4 h-4 text-zinc-400" />
                      <span>Mark Done</span>
                    </>
                  )}
                </button>
              </div>

              {/* Time Estimate */}
              <div className="flex items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500 mb-3 font-mono">
                <Clock className="w-3 h-3" />
                <span>Estimated: {step.timeEstimate}</span>
              </div>

              {/* Step Description */}
              <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-4 leading-relaxed">
                {step.description}
              </p>

              {/* Actionable Checklist */}
              {step.actionItems && step.actionItems.length > 0 && (
                <div className="mb-4 bg-zinc-50 dark:bg-zinc-900/60 rounded-lg p-3.5 border border-zinc-200/50 dark:border-zinc-800/50">
                  <h4 className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Action Checklist
                  </h4>
                  <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-300">
                    {step.actionItems.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-indigo-500 dark:text-indigo-400 font-bold mt-0.5">•</span>
                        <span className="leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Anti-Bloat Pro Tip Callout */}
              {step.proTip && (
                <div className="flex items-start gap-2.5 p-3 rounded-lg bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/40 text-xs">
                  <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-semibold text-amber-800 dark:text-amber-300">Anti-Bloat Pro-Tip: </span>
                    <span className="text-amber-900 dark:text-amber-200/90">{step.proTip}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Expansion Section: Suggest / Add Custom Step */}
      <div className="mt-8 p-6 rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 text-center">
        <h4 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
          Have an Anti-Bloat workflow step to share for {tool.name}?
        </h4>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-4">
          You can append custom onboarding modules or company-specific shortcuts to this lesson plan.
        </p>
        <button
          type="button"
          onClick={() => setShowAddCustomModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
        >
          <PlusCircle className="w-4 h-4 text-indigo-500" />
          <span>Add Custom Step to Lesson Plan</span>
        </button>
      </div>

      {/* Add Custom Step Modal */}
      {showAddCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#18191b] rounded-2xl border border-zinc-200 dark:border-zinc-700 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              Add Step to {tool.name} Lesson Plan
            </h3>
            <p className="text-xs text-zinc-500 mb-4">
              Add your team's specific shortcut or configuration step to this interactive guide.
            </p>
            <form onSubmit={handleAddCustomStep} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Step Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Setting up Webhook alerts to Discord"
                  value={newStepTitle}
                  onChange={(e) => setNewStepTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Instructions / Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief step-by-step description..."
                  value={newStepDesc}
                  onChange={(e) => setNewStepDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddCustomModal(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  Save Step
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
