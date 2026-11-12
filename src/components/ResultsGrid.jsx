import React, { useState } from 'react';
import ChannelCard from './ChannelCard';
import ResultsTable from './ResultsTable';
import { GridIcon, TableIcon, AlertCircleIcon } from './Icons';

export default function ResultsGrid({
  channels = [],
  totalFound = 0,
  favorites = [],
  onToggleFavorite,
  onFindSimilar,
  sortBy,
  onSortChange,
  hasNextPage = false,
  onLoadMore,
  loadingMore = false,
  onResetFilters,
}) {
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [showQuotaWarning, setShowQuotaWarning] = useState(false);

  const isFavorite = (id) => favorites.some((f) => f.id === id);

  const handleLoadMoreClick = () => {
    if (!showQuotaWarning) {
      setShowQuotaWarning(true);
    } else {
      setShowQuotaWarning(false);
      onLoadMore();
    }
  };

  return (
    <div className="space-y-4">
      {/* Control bar: count, sort, view toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 sm:px-4 sm:py-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
          Showing <strong className="text-slate-900 dark:text-white font-bold">{channels.length}</strong> of{' '}
          <strong className="text-slate-900 dark:text-white font-bold">{totalFound}</strong> discovered channels
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 hidden md:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-1 focus:ring-red-500"
            >
              <option value="score">Podcast Score (Highest)</option>
              <option value="subs">Subscribers (Highest)</option>
              <option value="views">Avg Views (Highest)</option>
              <option value="recency">Last Upload (Newest)</option>
              <option value="name">Name (A &rarr; Z)</option>
            </select>
          </div>

          {/* View Toggle (Grid / Table) */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Card Grid View"
              aria-label="Grid view"
            >
              <GridIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-red-600 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="Compact Table View"
              aria-label="Table view"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {channels.length === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
            <AlertCircleIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No matching podcast channels found
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Try adjusting or loosening your filters (e.g. lowering the minimum score or expanding upload recency), or try a broader search niche.
          </p>
          {onResetFilters && (
            <div className="pt-2">
              <button
                onClick={onResetFilters}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-red-600/20 transition"
              >
                Reset Filter Settings
              </button>
            </div>
          )}
        </div>
      )}

      {/* Content: Grid or Table */}
      {channels.length > 0 && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {channels.map((ch) => (
                <ChannelCard
                  key={ch.id}
                  channel={ch}
                  isFavorite={isFavorite(ch.id)}
                  onToggleFavorite={onToggleFavorite}
                  onFindSimilar={onFindSimilar}
                />
              ))}
            </div>
          ) : (
            <ResultsTable
              channels={channels}
              favorites={favorites}
              onToggleFavorite={onToggleFavorite}
              onFindSimilar={onFindSimilar}
            />
          )}

          {/* Load More Section */}
          {hasNextPage && (
            <div className="pt-6 pb-2 text-center space-y-2">
              {showQuotaWarning ? (
                <div className="inline-block p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl max-w-md mx-auto text-xs space-y-2.5">
                  <p className="text-amber-800 dark:text-amber-200 font-medium">
                    ⚠️ Fetching the next 50 channels will consume <strong>~100 API quota units</strong> (search.list). Proceed?
                  </p>
                  <div className="flex justify-center gap-2">
                    <button
                      onClick={() => setShowQuotaWarning(false)}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleLoadMoreClick}
                      disabled={loadingMore}
                      className="px-4 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold"
                    >
                      {loadingMore ? 'Fetching...' : 'Yes, Load Next Page'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleLoadMoreClick}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl border-2 border-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 font-bold text-xs shadow-sm transition"
                >
                  {loadingMore ? 'Loading Next Page...' : 'Load Next 50 Results'}
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
