import React, { useState } from 'react';
import {
  StarIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
  UsersIcon,
  VideoIcon,
  ClockIcon,
  EyeIcon,
  InfoIcon,
} from './Icons';

// Format subscriber & view counts (e.g., 1.4M, 250K)
export function formatCompactNumber(num) {
  if (num === null || num === undefined) return 'Hidden';
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

// Relative time formatter
export function formatRelativeTime(dateString) {
  if (!dateString) return 'No recent uploads';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffDays = Math.floor(diffSec / 86400);

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
    return `${Math.floor(diffDays / 365)}y ago`;
  } catch (e) {
    return dateString;
  }
}

export default function ChannelCard({
  channel,
  isFavorite = false,
  onToggleFavorite,
  onFindSimilar,
}) {
  const [copied, setCopied] = useState(false);
  const [showScoreInfo, setShowScoreInfo] = useState(false);

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(channel.channelUrl || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreBadgeColor =
    channel.podcastScore >= 70
      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
      : channel.podcastScore >= 60
      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-800'
      : channel.podcastScore >= 40
      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/70 dark:text-yellow-300 border-yellow-300 dark:border-yellow-800'
      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700';

  const breakdown = channel.scoreBreakdown || {};

  return (
    <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-red-400 dark:hover:border-red-800/80 rounded-2xl p-5 shadow-sm hover:shadow-lg transition-all duration-200 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Channel Thumbnail & Basic Info */}
          <div className="flex items-center gap-3.5 min-w-0">
            {channel.thumbnail ? (
              <img
                src={channel.thumbnail}
                alt={channel.title}
                className="w-14 h-14 rounded-full object-cover flex-shrink-0 border-2 border-slate-100 dark:border-slate-800"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div
              className={`w-14 h-14 rounded-full bg-red-600 text-white font-bold text-xl items-center justify-center flex-shrink-0 shadow-inner ${
                channel.thumbnail ? 'hidden' : 'flex'
              }`}
            >
              {channel.title.charAt(0).toUpperCase()}
            </div>

            <div className="min-w-0">
              <a
                href={channel.channelUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-base text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 transition-colors line-clamp-1 inline-flex items-center gap-1 group/link"
              >
                <span>{channel.title}</span>
                <ExternalLinkIcon className="w-3.5 h-3.5 opacity-0 group-hover/link:opacity-100 transition-opacity" />
              </a>

              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-mono truncate">{channel.handle || `@${channel.id}`}</span>
                {channel.country && channel.country !== 'unknown' && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold uppercase">
                    {channel.country}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Favorite Star Button */}
          <button
            onClick={() => onToggleFavorite(channel)}
            className={`p-2 rounded-xl transition-colors ${
              isFavorite
                ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Save to favorites'}
            aria-label="Toggle favorite"
          >
            <StarIcon className="w-5 h-5" filled={isFavorite} />
          </button>
        </div>

        {/* Podcast Score Badge & Tooltip */}
        <div className="relative mb-3 flex items-center justify-between">
          <div className="relative inline-block">
            <button
              onClick={() => setShowScoreInfo(!showScoreInfo)}
              onMouseEnter={() => setShowScoreInfo(true)}
              onMouseLeave={() => setShowScoreInfo(false)}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${scoreBadgeColor} transition`}
            >
              <span>{channel.podcastScore}/100</span>
              <span className="text-[11px] font-medium opacity-90">
                {channel.podcastScore >= 60 ? 'Likely Podcast' : channel.podcastBadge}
              </span>
              <InfoIcon className="w-3 h-3 opacity-70" />
            </button>

            {/* Score Breakdown Tooltip */}
            {showScoreInfo && (
              <div 
                className="absolute left-0 bottom-full mb-2 w-72 p-3.5 bg-slate-900 text-white border border-slate-700 rounded-xl shadow-2xl z-50 text-xs space-y-2 pointer-events-none animate-fadeIn"
              >
                <div className="font-bold flex justify-between border-b border-slate-700 pb-1.5">
                  <span>Podcast Detection Signals</span>
                  <span className="text-amber-400 font-mono">{channel.podcastScore}/100</span>
                </div>
                <div className="space-y-1 text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-300">Avg Duration &ge; 20m:</span>
                    <span className="font-mono text-emerald-400">+{breakdown.durationPoints || 0} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Channel Keywords:</span>
                    <span className="font-mono text-emerald-400">+{breakdown.keywordPoints || 0} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Episode # in Titles:</span>
                    <span className="font-mono text-emerald-400">+{breakdown.titlePatternPoints || 0} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Recent Upload Frequency:</span>
                    <span className="font-mono text-emerald-400">+{breakdown.frequencyPoints || 0} pts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300">Uploads Playlist Active:</span>
                    <span className="font-mono text-emerald-400">+{breakdown.playlistPoints || 0} pts</span>
                  </div>
                </div>
                {breakdown.matchedKeywords?.length > 0 && (
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                    Matches: {breakdown.matchedKeywords.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Average Episode Duration */}
          <div className="flex items-center gap-1 text-xs font-semibold text-slate-700 dark:text-slate-300">
            <ClockIcon className="w-3.5 h-3.5 text-red-500" />
            <span>{channel.avgDurationFormatted || `${channel.avgEpisodeMinutes}m avg`}</span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-slate-800/80 mb-3 text-center">
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <UsersIcon className="w-3 h-3" />
              <span>Subs</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCompactNumber(channel.subscriberCount)}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <VideoIcon className="w-3 h-3" />
              <span>Videos</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {channel.videoCount ? channel.videoCount.toLocaleString() : '0'}
            </div>
          </div>

          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center justify-center gap-1">
              <EyeIcon className="w-3 h-3" />
              <span>Avg Views</span>
            </div>
            <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
              {formatCompactNumber(channel.avgViewsLast10)}
            </div>
          </div>
        </div>

        {/* Description Preview */}
        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
          {channel.descriptionShort || 'No channel description provided.'}
        </p>

        {/* Last Upload Info */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-4 pt-1 border-t border-slate-100 dark:border-slate-800/60">
          <span>Last uploaded:</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {formatRelativeTime(channel.lastUploadDate)}
          </span>
        </div>
      </div>

      {/* Card Actions Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <a
          href={channel.channelUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 py-1.5 px-3 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-950/70 text-red-600 dark:text-red-400 rounded-lg text-xs font-bold text-center inline-flex items-center justify-center gap-1 transition"
        >
          <span>Open</span>
          <ExternalLinkIcon className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={handleCopy}
          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs transition"
          title="Copy channel URL"
          aria-label="Copy channel URL"
        >
          {copied ? (
            <CheckIcon className="w-4 h-4 text-emerald-600" />
          ) : (
            <CopyIcon className="w-4 h-4" />
          )}
        </button>

        <button
          onClick={() => onFindSimilar(channel)}
          className="py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium inline-flex items-center gap-1 transition"
          title="Find podcasts similar to this channel"
        >
          <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
          <span>Similar</span>
        </button>
      </div>
    </div>
  );
}
