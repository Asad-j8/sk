import React, { useState, useEffect } from 'react';
import { getQuotaUsage, resetQuotaTracker, getPacificDateString } from '../api/youtube';
import { InfoIcon, RefreshCwIcon } from './Icons';

export default function QuotaCounter() {
  const [units, setUnits] = useState(getQuotaUsage());
  const [showTooltip, setShowTooltip] = useState(false);
  const maxDailyQuota = 10000;

  useEffect(() => {
    const handleUpdate = (e) => {
      setUnits(e.detail?.units ?? getQuotaUsage());
    };

    window.addEventListener('yt-quota-updated', handleUpdate);
    // Periodic check for day rollover
    const timer = setInterval(() => {
      setUnits(getQuotaUsage());
    }, 60000);

    return () => {
      window.removeEventListener('yt-quota-updated', handleUpdate);
      clearInterval(timer);
    };
  }, []);

  const percentage = Math.min(100, Math.round((units / maxDailyQuota) * 100));

  let colorClass = 'text-emerald-600 dark:text-emerald-400 bg-emerald-500';
  let badgeBorder = 'border-emerald-200 dark:border-emerald-800/60';
  if (units > 8500) {
    colorClass = 'text-rose-600 dark:text-rose-400 bg-rose-500';
    badgeBorder = 'border-rose-300 dark:border-rose-800';
  } else if (units > 5000) {
    colorClass = 'text-amber-600 dark:text-amber-400 bg-amber-500';
    badgeBorder = 'border-amber-200 dark:border-amber-800/60';
  }

  const pacificDate = getPacificDateString();

  return (
    <div className="relative">
      <button
        onClick={() => setShowTooltip(!showTooltip)}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`flex items-center space-x-2 px-3 py-1.5 rounded-full border text-xs font-medium bg-white dark:bg-slate-900 ${badgeBorder} shadow-sm hover:bg-slate-50 dark:hover:bg-slate-850 transition`}
        title="View YouTube API Quota Details"
      >
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: units > 8500 ? '#ef4444' : units > 5000 ? '#f59e0b' : '#10b981' }} />
        <span className="text-slate-700 dark:text-slate-300">
          Quota used today:{' '}
          <strong className="font-semibold text-slate-900 dark:text-white">
            ~{units.toLocaleString()}
          </strong>
          <span className="text-slate-400"> / {maxDailyQuota.toLocaleString()}</span>
        </span>
        <InfoIcon className="w-3.5 h-3.5 text-slate-400" />
      </button>

      {/* Quota Tooltip / Popover */}
      {showTooltip && (
        <div 
          className="absolute right-0 top-full mt-2 w-80 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 text-xs text-slate-600 dark:text-slate-300 space-y-3"
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-900 dark:text-white">API Quota Breakdown</span>
            <span className="text-[11px] font-mono text-slate-400">PT: {pacificDate}</span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px]">
              <span>Daily Free Quota</span>
              <span>{percentage}% used</span>
            </div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${units > 8500 ? 'bg-red-500' : units > 5000 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>

          <p className="leading-relaxed text-[11px] text-slate-500 dark:text-slate-400">
            Google gives <strong>10,000 free units</strong> per key daily. 
            Quotas reset automatically at <strong>midnight Pacific Time (PT)</strong>.
          </p>

          <div className="bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl space-y-1 text-[11px] font-mono">
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>• search.list:</span>
              <span className="font-bold text-red-500">100 units</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>• channels.list (batch):</span>
              <span className="font-semibold text-emerald-500">1 unit</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>• playlistItems.list:</span>
              <span className="font-semibold text-emerald-500">1 unit/ch</span>
            </div>
            <div className="flex justify-between text-slate-700 dark:text-slate-300">
              <span>• videos.list (batch 50):</span>
              <span className="font-semibold text-emerald-500">1 unit</span>
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] text-slate-400">Cached queries cost 0 units</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetQuotaTracker();
              }}
              className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              title="Reset the local counter if it gets out of sync"
            >
              <RefreshCwIcon className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
