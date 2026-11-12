import React, { useState } from 'react';
import {
  StarIcon,
  ExternalLinkIcon,
  CopyIcon,
  CheckIcon,
  SparklesIcon,
} from './Icons';
import { formatCompactNumber, formatRelativeTime } from './ChannelCard';

export default function ResultsTable({
  channels = [],
  favorites = [],
  onToggleFavorite,
  onFindSimilar,
}) {
  const [copiedId, setCopiedId] = useState(null);

  const handleCopy = (channel) => {
    navigator.clipboard.writeText(channel.channelUrl);
    setCopiedId(channel.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isFavorite = (id) => favorites.some((f) => f.id === id);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
            <th className="py-3 px-4">Channel</th>
            <th className="py-3 px-3">Score</th>
            <th className="py-3 px-3">Subscribers</th>
            <th className="py-3 px-3">Avg Views (Last 10)</th>
            <th className="py-3 px-3">Avg Episode</th>
            <th className="py-3 px-3">Videos</th>
            <th className="py-3 px-3">Last Upload</th>
            <th className="py-3 px-3">Country</th>
            <th className="py-3 px-4 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
          {channels.map((ch) => {
            const favorited = isFavorite(ch.id);
            const scoreColor =
              ch.podcastScore >= 70
                ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
                : ch.podcastScore >= 60
                ? 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800'
                : ch.podcastScore >= 40
                ? 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/40 border-yellow-300 dark:border-yellow-800'
                : 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-300 dark:border-slate-700';

            return (
              <tr
                key={ch.id}
                className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors"
              >
                {/* Channel Title & Avatar */}
                <td className="py-3 px-4 min-w-[200px]">
                  <div className="flex items-center gap-3">
                    {ch.thumbnail ? (
                      <img
                        src={ch.thumbnail}
                        alt={ch.title}
                        className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-red-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-sm">
                        {ch.title.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <a
                        href={ch.channelUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-bold text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 line-clamp-1 inline-flex items-center gap-1"
                      >
                        <span>{ch.title}</span>
                        <ExternalLinkIcon className="w-3 h-3 text-slate-400" />
                      </a>
                      <p className="text-[11px] text-slate-400 font-mono truncate">
                        {ch.handle}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Podcast Score */}
                <td className="py-3 px-3 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${scoreColor}`}
                  >
                    {ch.podcastScore}/100
                  </span>
                </td>

                {/* Subscribers */}
                <td className="py-3 px-3 whitespace-nowrap font-medium">
                  {formatCompactNumber(ch.subscriberCount)}
                </td>

                {/* Avg Views */}
                <td className="py-3 px-3 whitespace-nowrap font-medium">
                  {formatCompactNumber(ch.avgViewsLast10)}
                </td>

                {/* Avg Episode Length */}
                <td className="py-3 px-3 whitespace-nowrap font-medium">
                  {ch.avgDurationFormatted || `${ch.avgEpisodeMinutes}m`}
                </td>

                {/* Videos */}
                <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                  {ch.videoCount?.toLocaleString() || '0'}
                </td>

                {/* Last Upload */}
                <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                  {formatRelativeTime(ch.lastUploadDate)}
                </td>

                {/* Country */}
                <td className="py-3 px-3 whitespace-nowrap uppercase font-semibold text-[10px] text-slate-500">
                  {ch.country && ch.country !== 'unknown' ? ch.country : '—'}
                </td>

                {/* Actions */}
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      onClick={() => onToggleFavorite(ch)}
                      className={`p-1.5 rounded-lg transition ${
                        favorited
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                      title={favorited ? 'Starred' : 'Star channel'}
                    >
                      <StarIcon className="w-4 h-4" filled={favorited} />
                    </button>

                    <button
                      onClick={() => handleCopy(ch)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-300 transition"
                      title="Copy URL"
                    >
                      {copiedId === ch.id ? (
                        <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <CopyIcon className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      onClick={() => onFindSimilar(ch)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
                      title="Find similar podcasts"
                    >
                      <SparklesIcon className="w-3.5 h-3.5 text-amber-500" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
