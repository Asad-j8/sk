import React from 'react';
import { CloseIcon, KeyIcon, SearchIcon, FilterIcon, DownloadIcon } from './Icons';

export default function OnboardingModal({ isOpen, onClose, onOpenSettings }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6 sm:p-7 relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
              Welcome to
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
              YouTube Podcast Channel Finder
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* 4 Step Walkthrough */}
        <div className="space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
              1
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <KeyIcon className="w-4 h-4 text-red-500" />
                <span>Add Your Free YouTube API Key</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Google provides 10,000 free quota units daily. Stored only in your local browser storage—never sent to any server.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
              2
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <SearchIcon className="w-4 h-4 text-amber-500" />
                <span>Type a Niche or YouTube Channel Handle</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Enter any niche (e.g. <em>"true crime"</em>, <em>"personal finance"</em>) or paste an @handle (e.g. <em>@hubermanlab</em>) to find similar podcasts.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
              3
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <FilterIcon className="w-4 h-4 text-emerald-500" />
                <span>Score &amp; Filter Instantly</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Our algorithm scores video durations (&ge; 20 min), episode numbering, keywords, and upload consistency to filter out short-form spam.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-0.5">
              4
            </div>
            <div className="text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 text-sm">
                <DownloadIcon className="w-4 h-4 text-blue-500" />
                <span>Star &amp; Export to CSV</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Save channels to your favorites with custom outreach notes, and export Excel-ready CSV files with 1 click.
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-end gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenSettings();
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Configure API Key
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/20 transition"
          >
            Got it, Let's Explore!
          </button>
        </div>
      </div>
    </div>
  );
}
