import React, { useState } from 'react';
import { SearchIcon, SparklesIcon, CloseIcon } from './Icons';

export default function SearchBar({
  onSearch,
  loading,
  loadingStep,
  progress = 0,
  initialQuery = ''
}) {
  const [inputValue, setInputValue] = useState(initialQuery);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;
    onSearch(inputValue.trim());
  };

  const handleQuickTag = (tag) => {
    setInputValue(tag);
    onSearch(tag);
  };

  const quickTags = [
    'True Crime',
    'Personal Finance',
    'Startup Founders',
    'AI & Tech',
    'Fitness & Health',
    'Philosophy & Culture'
  ];

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3">
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex items-center shadow-lg hover:shadow-xl dark:shadow-slate-950/50 rounded-2xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 focus-within:border-red-500 dark:focus-within:border-red-500 transition-all duration-200">
          <div className="pl-4 sm:pl-5 text-slate-400 group-focus-within:text-red-500 transition-colors">
            <SearchIcon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>

          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={loading}
            placeholder="Search niche (e.g. 'true crime', 'personal finance') or channel link / @handle..."
            className="w-full py-4 pl-3 sm:pl-4 pr-24 sm:pr-32 text-sm sm:text-base bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none disabled:opacity-50"
            aria-label="Search niche or YouTube handle"
          />

          {inputValue && !loading && (
            <button
              type="button"
              onClick={() => setInputValue('')}
              className="p-1.5 mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Clear input"
            >
              <CloseIcon className="w-4 h-4" />
            </button>
          )}

          <div className="pr-2 sm:pr-3">
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="inline-flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-red-600/30 transition-all duration-150"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>Find Podcasts</span>
              )}
            </button>
          </div>
        </div>

        {/* Loading Progress Bar & Status message */}
        {loading && (
          <div className="mt-3 p-3.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-md space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                {loadingStep || 'Searching YouTube and analyzing videos...'}
              </span>
              <span className="font-mono text-red-600 dark:text-red-400 font-bold">
                {progress}%
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-red-600 to-amber-500 transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </form>

      {/* Suggested Quick Tags */}
      <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400 pt-1">
        <span className="flex items-center gap-1 font-medium text-slate-600 dark:text-slate-300">
          <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>Popular niches:</span>
        </span>
        {quickTags.map((tag) => (
          <button
            key={tag}
            type="button"
            disabled={loading}
            onClick={() => handleQuickTag(tag)}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors disabled:opacity-50"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
