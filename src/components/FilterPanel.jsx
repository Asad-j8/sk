import React, { useState } from 'react';
import { FilterIcon, CloseIcon, RefreshCwIcon } from './Icons';

export const INITIAL_FILTERS = {
  minSubs: '',
  maxSubs: '',
  minVideos: '',
  maxVideos: '',
  lastUploadWithin: 'all', // '7d', '30d', '90d', 'all'
  minScore: 0,
  podcastOnly: true, // Default to true so users see likely podcasts first
  hideHiddenSubs: false,
  country: 'all',
};

export default function FilterPanel({
  filters,
  onChange,
  onReset,
  availableCountries = [],
  totalCount = 0,
  filteredCount = 0,
}) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const updateFilter = (key, value) => {
    onChange({
      ...filters,
      [key]: value,
    });
  };

  const subscriberPresets = [
    { label: '1K+', value: 1000 },
    { label: '10K+', value: 10000 },
    { label: '100K+', value: 100000 },
    { label: '1M+', value: 1000000 },
  ];

  const content = (
    <div className="space-y-5 text-sm">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <FilterIcon className="w-4 h-4 text-red-500" />
          <h3 className="font-bold text-slate-900 dark:text-white">Filters</h3>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 flex items-center gap-1 transition"
        >
          <RefreshCwIcon className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Podcast Score Slider & Toggle */}
      <div className="space-y-3 p-3 bg-red-50/50 dark:bg-red-950/20 rounded-xl border border-red-100 dark:border-red-900/30">
        <div className="flex items-center justify-between">
          <label className="font-semibold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span>Podcast-Only (Score &ge; 60)</span>
          </label>
          <input
            type="checkbox"
            checked={filters.podcastOnly}
            onChange={(e) => updateFilter('podcastOnly', e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 cursor-pointer"
          />
        </div>

        <div>
          <div className="flex justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>Minimum Podcast Score</span>
            <span className="font-bold text-red-600 dark:text-red-400 font-mono">
              {filters.minScore} / 100
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={filters.minScore}
            onChange={(e) => updateFilter('minScore', Number(e.target.value))}
            className="w-full accent-red-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Subscribers Range */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Subscribers Range
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min (e.g. 5000)"
            value={filters.minSubs}
            onChange={(e) => updateFilter('minSubs', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxSubs}
            onChange={(e) => updateFilter('maxSubs', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
        {/* Presets */}
        <div className="flex items-center gap-1.5 pt-1">
          {subscriberPresets.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => updateFilter('minSubs', preset.value)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium border transition ${
                Number(filters.minSubs) === preset.value
                  ? 'bg-red-600 text-white border-red-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-400'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Upload Recency */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Last Upload Within
        </label>
        <select
          value={filters.lastUploadWithin}
          onChange={(e) => updateFilter('lastUploadWithin', e.target.value)}
          className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          <option value="all">Any time</option>
          <option value="7d">Last 7 days (Very active)</option>
          <option value="30d">Last 30 days (Active)</option>
          <option value="90d">Last 90 days (Quarterly)</option>
        </select>
      </div>

      {/* Video Count Range */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Total Channel Videos
        </label>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            min="0"
            placeholder="Min (e.g. 10)"
            value={filters.minVideos}
            onChange={(e) => updateFilter('minVideos', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxVideos}
            onChange={(e) => updateFilter('maxVideos', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
        </div>
      </div>

      {/* Country Filter */}
      {availableCountries.length > 0 && (
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
            Channel Country
          </label>
          <select
            value={filters.country}
            onChange={(e) => updateFilter('country', e.target.value)}
            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          >
            <option value="all">All countries (including unknown)</option>
            {availableCountries.map((c) => (
              <option key={c} value={c}>
                {c === 'unknown' ? 'Unknown / Not set' : c.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Checkbox Toggles */}
      <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={filters.hideHiddenSubs}
            onChange={(e) => updateFilter('hideHiddenSubs', e.target.checked)}
            className="w-4 h-4 rounded text-red-600 focus:ring-red-500 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
          />
          <span>Hide channels with hidden subscriber counts</span>
        </label>
      </div>

      {/* Results Count Summary */}
      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
        Showing <strong className="text-slate-900 dark:text-white font-semibold">{filteredCount}</strong> of{' '}
        <strong className="text-slate-900 dark:text-white font-semibold">{totalCount}</strong> channels
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <div className="lg:hidden flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm mb-4">
        <button
          onClick={() => setIsOpenMobile(true)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-600 text-white font-semibold text-xs shadow-sm"
        >
          <FilterIcon className="w-4 h-4" />
          <span>Filters ({filteredCount}/{totalCount})</span>
        </button>

        <span className="text-xs text-slate-500">
          {filters.podcastOnly ? 'Podcast only' : 'All channels'}
        </span>
      </div>

      {/* Mobile Slide-over Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpenMobile(false)}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white dark:bg-slate-900 h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div>
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => setIsOpenMobile(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <CloseIcon className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>
            <div className="pt-6">
              <button
                onClick={() => setIsOpenMobile(false)}
                className="w-full py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Sticky Sidebar */}
      <div className="hidden lg:block w-72 flex-shrink-0">
        <div className="sticky top-20 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          {content}
        </div>
      </div>
    </>
  );
}
