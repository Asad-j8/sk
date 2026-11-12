import React from 'react';
import QuotaCounter from './QuotaCounter';
import {
  PodcastIcon,
  StarIcon,
  KeyIcon,
  SunIcon,
  MoonIcon,
  InfoIcon,
} from './Icons';

export default function Navbar({
  darkMode,
  onToggleDarkMode,
  onOpenSettings,
  onOpenHelp,
  activeTab,
  onTabChange,
  favoritesCount = 0,
}) {
  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand / Logo */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onTabChange('search')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-500 text-white flex items-center justify-center shadow-md shadow-red-500/25">
            <PodcastIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white leading-tight flex items-center gap-2">
              <span>Podcast Channel Finder</span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400">
                v3 API
              </span>
            </h1>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Filter long-form creators &amp; podcast shows on YouTube
            </p>
          </div>
        </div>

        {/* Center/Right Nav Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quota Counter */}
          <div className="hidden md:block">
            <QuotaCounter />
          </div>

          {/* Search vs Favorites Navigation Tabs */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => onTabChange('search')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-slate-900 text-red-600 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Search
            </button>
            <button
              onClick={() => onTabChange('favorites')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
                activeTab === 'favorites'
                  ? 'bg-white dark:bg-slate-900 text-amber-500 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <StarIcon className="w-3.5 h-3.5" filled={activeTab === 'favorites'} />
              <span>Favorites</span>
              {favoritesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

          {/* API Key Settings Button */}
          <button
            onClick={onOpenSettings}
            className="p-2 rounded-xl text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 dark:hover:border-slate-700 transition"
            title="Configure YouTube Data API v3 Key"
            aria-label="API Settings"
          >
            <KeyIcon className="w-5 h-5" />
          </button>

          {/* Guide / Walkthrough Button */}
          <button
            onClick={onOpenHelp}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="How it works"
            aria-label="User Guide"
          >
            <InfoIcon className="w-5 h-5" />
          </button>

          {/* Dark / Light Mode Switcher */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle Dark Mode"
          >
            {darkMode ? <SunIcon className="w-5 h-5 text-amber-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
          </button>
        </div>
      </div>
    </header>
  );
}
