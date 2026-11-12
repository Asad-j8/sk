import React, { useState } from 'react';
import { StarIcon, TrashIcon, ExternalLinkIcon, DownloadIcon } from './Icons';
import { formatCompactNumber, formatRelativeTime } from './ChannelCard';

export default function FavoritesPanel({
  favorites = [],
  onUpdateNote,
  onRemoveFavorite,
  onExportFavorites,
  onFindSimilar,
}) {
  const [editingId, setEditingId] = useState(null);
  const [tempNote, setTempNote] = useState('');

  const startEditing = (fav) => {
    setEditingId(fav.id);
    setTempNote(fav.note || '');
  };

  const saveNote = (id) => {
    onUpdateNote(id, tempNote);
    setEditingId(null);
  };

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-950/60 text-amber-500 rounded-xl">
            <StarIcon className="w-5 h-5" filled={true} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Starred Podcast Channels ({favorites.length})
            </h2>
            <p className="text-xs text-slate-500">
              Saved locally. Add notes for outreach, pitch angles, or editor assignments.
            </p>
          </div>
        </div>

        {favorites.length > 0 && (
          <button
            onClick={onExportFavorites}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
          >
            <DownloadIcon className="w-4 h-4" />
            <span>Export Favorites CSV</span>
          </button>
        )}
      </div>

      {/* Empty State */}
      {favorites.length === 0 && (
        <div className="text-center py-16 px-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center text-amber-500">
            <StarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No saved channels yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
            Click the star icon on any channel card or table row during your search to save it here for outreach and research.
          </p>
        </div>
      )}

      {/* Favorites List */}
      {favorites.length > 0 && (
        <div className="space-y-3">
          {favorites.map((fav) => (
            <div
              key={fav.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Channel Title & Meta */}
                <div className="flex items-center gap-3 min-w-0">
                  {fav.thumbnail ? (
                    <img
                      src={fav.thumbnail}
                      alt={fav.title}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-red-600 text-white font-bold flex items-center justify-center flex-shrink-0 text-base">
                      {fav.title.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <a
                      href={fav.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-red-600 dark:hover:text-red-400 line-clamp-1 inline-flex items-center gap-1"
                    >
                      <span>{fav.title}</span>
                      <ExternalLinkIcon className="w-3.5 h-3.5 text-slate-400" />
                    </a>
                    <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                      <span>{fav.handle}</span>
                      <span>•</span>
                      <span>{formatCompactNumber(fav.subscriberCount)} subs</span>
                      <span>•</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold font-sans">
                        Score {fav.podcastScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => onFindSimilar(fav)}
                    className="px-2.5 py-1 text-xs border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-700 dark:text-slate-300 transition"
                  >
                    Find Similar
                  </button>
                  <button
                    onClick={() => onRemoveFavorite(fav.id)}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition"
                    title="Remove from favorites"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Editable Notes Field */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                {editingId === fav.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={tempNote}
                      onChange={(e) => setTempNote(e.target.value)}
                      placeholder="e.g. Outreach email sent on Tuesday, good for AI guest spot..."
                      className="flex-1 px-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveNote(fav.id);
                        if (e.key === 'Escape') setEditingId(null);
                      }}
                    />
                    <button
                      onClick={() => saveNote(fav.id)}
                      className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => startEditing(fav)}
                    className="cursor-pointer group flex items-center justify-between text-xs py-1 px-2.5 rounded-lg bg-slate-50 dark:bg-slate-950/60 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition"
                  >
                    <span className={fav.note ? 'font-medium' : 'italic text-slate-400'}>
                      {fav.note ? `Note: "${fav.note}"` : '+ Click to add a private outreach note...'}
                    </span>
                    <span className="text-[10px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Edit
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
