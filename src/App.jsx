import React, { useState, useEffect, useMemo } from 'react';
import Navbar from './components/Navbar';
import SearchBar from './components/SearchBar';
import FilterPanel, { INITIAL_FILTERS } from './components/FilterPanel';
import ResultsGrid from './components/ResultsGrid';
import FavoritesPanel from './components/FavoritesPanel';
import ApiKeySettings from './components/ApiKeySettings';
import OnboardingModal from './components/OnboardingModal';
import ExportButtons, { downloadChannelsCsv } from './components/ExportButtons';
import { AlertCircleIcon, KeyIcon, SparklesIcon, RefreshCwIcon } from './components/Icons';
import {
  getStoredApiKey,
  getCachedSearch,
  setCachedSearch,
  searchPodcastChannels,
  parseSearchInput,
  resolveHandleChannel,
  SAMPLE_CHANNELS,
} from './api/youtube';

const STORAGE_KEY_FAVORITES = 'yt_podcast_finder_favorites';
const STORAGE_KEY_HAS_VISITED = 'yt_podcast_finder_has_visited';
const STORAGE_KEY_THEME = 'yt_podcast_finder_theme';

export default function App() {
  // Theme state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_THEME);
    if (saved) return saved === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // UI Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'favorites'

  // API Key & Demo State
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Search State
  const [currentQuery, setCurrentQuery] = useState('');
  const [channels, setChannels] = useState([]);
  const [nextPageToken, setNextPageToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null); // { type: 'quota'|'key'|'network'|'general', message: string }

  // Filters & Sorting
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState('score'); // 'score' | 'subs' | 'views' | 'recency' | 'name'

  // Favorites
  const [favorites, setFavorites] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Theme synchronization
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(STORAGE_KEY_THEME, 'light');
    }
  }, [darkMode]);

  // Check first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem(STORAGE_KEY_HAS_VISITED);
    if (!hasVisited) {
      setIsOnboardingOpen(true);
      localStorage.setItem(STORAGE_KEY_HAS_VISITED, 'true');
    }
  }, []);

  // Save favorites to localStorage
  const saveFavorites = (updated) => {
    setFavorites(updated);
    localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(updated));
  };

  const handleToggleFavorite = (channel) => {
    const exists = favorites.some((f) => f.id === channel.id);
    if (exists) {
      saveFavorites(favorites.filter((f) => f.id !== channel.id));
    } else {
      saveFavorites([{ ...channel, note: '' }, ...favorites]);
    }
  };

  const handleUpdateNote = (id, note) => {
    saveFavorites(
      favorites.map((f) => (f.id === id ? { ...f, note } : f))
    );
  };

  const handleRemoveFavorite = (id) => {
    saveFavorites(favorites.filter((f) => f.id !== id));
  };

  // Demo mode trigger
  const handleUseDemo = () => {
    setIsDemoMode(true);
    setCurrentQuery('True Crime & Tech Podcasts (Demo)');
    setChannels(SAMPLE_CHANNELS);
    setNextPageToken(null);
    setError(null);
    setActiveTab('search');
  };

  // Main search function
  const executeSearch = async (queryToSearch, isNextPage = false) => {
    const cleanQuery = queryToSearch.trim();
    if (!cleanQuery) return;

    if (!isNextPage) {
      setCurrentQuery(cleanQuery);
      setError(null);
      setLoading(true);
      setProgress(5);
      setLoadingStep('Initializing query...');
    } else {
      setLoadingMore(true);
    }

    try {
      // 1. If user doesn't have an API key, suggest demo or prompt settings
      if (!apiKey) {
        setIsSettingsOpen(true);
        throw new Error('Please configure your YouTube Data API v3 key to search live data.');
      }

      setIsDemoMode(false);

      // Check handle or URL format
      const parsedInput = parseSearchInput(cleanQuery);
      let targetQuery = cleanQuery;

      if (parsedInput.isHandle) {
        setLoadingStep(`Resolving channel handle @${parsedInput.handle}...`);
        setProgress(15);
        const resolved = await resolveHandleChannel(parsedInput.handle, apiKey);
        targetQuery = resolved.suggestedKeyword;
      }

      // Check 24-hour localStorage cache (only for first page)
      if (!isNextPage) {
        const cached = getCachedSearch(targetQuery);
        if (cached && cached.channels && cached.channels.length > 0) {
          setChannels(cached.channels);
          setNextPageToken(cached.nextPageToken || null);
          setLoading(false);
          setProgress(100);
          return;
        }
      }

      // Execute live YouTube API pipeline
      const result = await searchPodcastChannels({
        query: targetQuery,
        pageToken: isNextPage ? nextPageToken : '',
        apiKey,
        onProgress: (step, pct) => {
          setLoadingStep(step);
          setProgress(pct);
        },
      });

      if (isNextPage) {
        const combined = [...channels, ...result.channels];
        setChannels(combined);
        setNextPageToken(result.nextPageToken);
        // Cache combined results
        setCachedSearch(targetQuery, { channels: combined, nextPageToken: result.nextPageToken });
      } else {
        setChannels(result.channels);
        setNextPageToken(result.nextPageToken);
        // Cache initial results
        setCachedSearch(targetQuery, { channels: result.channels, nextPageToken: result.nextPageToken });
      }
    } catch (err) {
      console.error('Search error:', err);
      let errorType = 'general';
      let message = err.message || 'Failed to search channels. Please try again.';

      if (err.reason === 'quotaExceeded' || err.status === 403) {
        errorType = 'quota';
        message = 'Your daily YouTube API quota is exhausted. Google resets free quotas at midnight Pacific Time (PT).';
      } else if (err.reason === 'keyInvalid' || err.status === 400) {
        errorType = 'key';
        message = 'Your YouTube Data API key appears invalid or expired. Please check it in Settings.';
      } else if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorType = 'network';
        message = 'Network request failed. Please check your internet connection.';
      }

      setError({ type: errorType, message });
    } finally {
      setLoading(false);
      setLoadingMore(false);
      setProgress(0);
    }
  };

  // Find similar podcast trigger
  const handleFindSimilar = (channel) => {
    setActiveTab('search');
    const query = channel.handle && channel.handle.startsWith('@')
      ? channel.handle
      : channel.title;
    executeSearch(query);
  };

  // Extract unique countries from results
  const availableCountries = useMemo(() => {
    const set = new Set();
    channels.forEach((ch) => {
      if (ch.country) set.add(ch.country.toLowerCase());
    });
    return Array.from(set).sort();
  }, [channels]);

  // Client-side filtering logic
  const filteredChannels = useMemo(() => {
    return channels.filter((ch) => {
      // 1. Podcast score slider
      if (ch.podcastScore < filters.minScore) return false;

      // 2. Podcast-only toggle (score >= 60)
      if (filters.podcastOnly && ch.podcastScore < 60) return false;

      // 3. Subscribers range
      if (filters.minSubs !== '') {
        if (ch.subscriberCount === null || ch.subscriberCount < Number(filters.minSubs)) {
          return false;
        }
      }
      if (filters.maxSubs !== '') {
        if (ch.subscriberCount !== null && ch.subscriberCount > Number(filters.maxSubs)) {
          return false;
        }
      }

      // 4. Hide hidden subscriber counts
      if (filters.hideHiddenSubs && ch.hiddenSubscriberCount) {
        return false;
      }

      // 5. Total Videos range
      if (filters.minVideos !== '') {
        if (ch.videoCount < Number(filters.minVideos)) return false;
      }
      if (filters.maxVideos !== '') {
        if (ch.videoCount > Number(filters.maxVideos)) return false;
      }

      // 6. Last upload recency
      if (filters.lastUploadWithin !== 'all' && ch.lastUploadDate) {
        const uploadTime = new Date(ch.lastUploadDate).getTime();
        const diffDays = (Date.now() - uploadTime) / (1000 * 60 * 60 * 24);
        if (filters.lastUploadWithin === '7d' && diffDays > 7) return false;
        if (filters.lastUploadWithin === '30d' && diffDays > 30) return false;
        if (filters.lastUploadWithin === '90d' && diffDays > 90) return false;
      }

      // 7. Country
      if (filters.country !== 'all') {
        const c = (ch.country || 'unknown').toLowerCase();
        if (c !== filters.country.toLowerCase()) return false;
      }

      return true;
    });
  }, [channels, filters]);

  // Client-side sorting logic
  const sortedChannels = useMemo(() => {
    const list = [...filteredChannels];
    list.sort((a, b) => {
      if (sortBy === 'score') {
        return b.podcastScore - a.podcastScore;
      }
      if (sortBy === 'subs') {
        const subsA = a.subscriberCount ?? -1;
        const subsB = b.subscriberCount ?? -1;
        return subsB - subsA;
      }
      if (sortBy === 'views') {
        return (b.avgViewsLast10 || 0) - (a.avgViewsLast10 || 0);
      }
      if (sortBy === 'recency') {
        const timeA = a.lastUploadDate ? new Date(a.lastUploadDate).getTime() : 0;
        const timeB = b.lastUploadDate ? new Date(b.lastUploadDate).getTime() : 0;
        return timeB - timeA;
      }
      if (sortBy === 'name') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
    return list;
  }, [filteredChannels, sortBy]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Header */}
      <Navbar
        darkMode={darkMode}
        onToggleDarkMode={() => setDarkMode(!darkMode)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsOnboardingOpen(true)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        favoritesCount={favorites.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Error Banner */}
        {error && (
          <div
            className={`p-4 rounded-2xl border text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fadeIn ${
              error.type === 'quota'
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200 border-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-start gap-3">
              <AlertCircleIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">{error.type === 'quota' ? 'API Quota Exceeded' : 'Search Request Failed'}</p>
                <p className="text-xs opacity-90 mt-0.5 leading-relaxed">{error.message}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              {error.type === 'key' && (
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="px-3 py-1.5 bg-red-600 text-white rounded-xl text-xs font-bold"
                >
                  Update API Key
                </button>
              )}
              {error.type === 'quota' && (
                <button
                  onClick={handleUseDemo}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                >
                  Explore in Demo Mode
                </button>
              )}
              {error.type === 'network' && (
                <button
                  onClick={() => executeSearch(currentQuery)}
                  className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1"
                >
                  <RefreshCwIcon className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              )}
              <button
                onClick={() => setError(null)}
                className="px-2.5 py-1 text-xs border border-current rounded-lg opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* Demo Mode Notice */}
        {isDemoMode && activeTab === 'search' && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-4 h-4 text-amber-500" />
              <span>
                <strong>Demo Mode Active:</strong> Showing sample podcasts without consuming your quota.
              </span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-amber-700 dark:text-amber-300 font-bold hover:underline"
            >
              Add API Key for Live Searches &rarr;
            </button>
          </div>
        )}

        {/* TAB 1: SEARCH & DISCOVERY */}
        {activeTab === 'search' && (
          <div className="space-y-6">
            {/* Search Box */}
            <SearchBar
              onSearch={(q) => executeSearch(q)}
              loading={loading}
              loadingStep={loadingStep}
              progress={progress}
              initialQuery={currentQuery}
            />

            {/* When channels exist: Show Filter Panel + Results Grid */}
            {channels.length > 0 ? (
              <div className="flex flex-col lg:flex-row items-start gap-6 pt-2">
                {/* Left Filter Sidebar */}
                <FilterPanel
                  filters={filters}
                  onChange={setFilters}
                  onReset={() => setFilters(INITIAL_FILTERS)}
                  availableCountries={availableCountries}
                  totalCount={channels.length}
                  filteredCount={sortedChannels.length}
                />

                {/* Right Results Grid */}
                <div className="flex-1 w-full space-y-4">
                  {/* Export Filtered Button */}
                  <div className="flex justify-end">
                    <ExportButtons channels={sortedChannels} query={currentQuery} />
                  </div>

                  <ResultsGrid
                    channels={sortedChannels}
                    totalFound={channels.length}
                    favorites={favorites}
                    onToggleFavorite={handleToggleFavorite}
                    onFindSimilar={handleFindSimilar}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    hasNextPage={Boolean(nextPageToken)}
                    onLoadMore={() => executeSearch(currentQuery, true)}
                    loadingMore={loadingMore}
                    onResetFilters={() => setFilters(INITIAL_FILTERS)}
                  />
                </div>
              </div>
            ) : !loading ? (
              /* Hero / Welcome Banner before search */
              <div className="text-center py-12 px-4 max-w-2xl mx-auto space-y-5">
                <div className="inline-flex p-3 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 mb-1">
                  <SparklesIcon className="w-8 h-8" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Discover True YouTube Podcasts
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Search any topic or paste a YouTube handle to filter channels by average video length, upload consistency, and episode patterns.
                </p>

                <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
                  <button
                    onClick={handleUseDemo}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold shadow-md transition"
                  >
                    Try Sample Dataset
                  </button>
                  <button
                    onClick={() => setIsSettingsOpen(true)}
                    className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition flex items-center gap-1.5"
                  >
                    <KeyIcon className="w-4 h-4 text-red-500" />
                    <span>{apiKey ? 'Change API Key' : 'Configure Free API Key'}</span>
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* TAB 2: FAVORITES */}
        {activeTab === 'favorites' && (
          <FavoritesPanel
            favorites={favorites}
            onUpdateNote={handleUpdateNote}
            onRemoveFavorite={handleRemoveFavorite}
            onExportFavorites={() => downloadChannelsCsv(favorites, 'youtube_favorite_podcasts.csv', true)}
            onFindSimilar={handleFindSimilar}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 py-6 text-center text-xs text-slate-500">
        <p>
          YouTube Podcast Channel Finder — 100% Free &amp; Client-Side. Powered by YouTube Data API v3.
        </p>
      </footer>

      {/* Modals */}
      <ApiKeySettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onKeySaved={(newKey) => {
          setApiKey(newKey);
          setError(null);
        }}
        onUseDemo={handleUseDemo}
      />

      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
