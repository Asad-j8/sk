import React from 'react';
import { DownloadIcon } from './Icons';

/**
 * Escapes CSV values and ensures quotes around strings with commas or quotes
 */
function escapeCsvValue(val) {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Generates and triggers download of CSV with UTF-8 BOM
 */
export function downloadChannelsCsv(channels, filename = 'youtube_podcast_channels.csv', isFavorites = false) {
  if (!channels || channels.length === 0) return;

  const headers = [
    'channel_name',
    'channel_url',
    'handle',
    'subscribers',
    'total_videos',
    'avg_views_last10',
    'last_upload_date',
    'avg_episode_minutes',
    'podcast_score',
    'country',
    'description_short',
  ];

  if (isFavorites) {
    headers.push('notes');
  }

  const rows = channels.map((ch) => {
    const row = [
      escapeCsvValue(ch.title),
      escapeCsvValue(ch.channelUrl),
      escapeCsvValue(ch.handle),
      escapeCsvValue(ch.subscriberCount !== null ? ch.subscriberCount : 'hidden'),
      escapeCsvValue(ch.videoCount || 0),
      escapeCsvValue(ch.avgViewsLast10 || 0),
      escapeCsvValue(ch.lastUploadDate ? ch.lastUploadDate.split('T')[0] : 'unknown'),
      escapeCsvValue(ch.avgEpisodeMinutes || 0),
      escapeCsvValue(ch.podcastScore || 0),
      escapeCsvValue(ch.country || 'unknown'),
      escapeCsvValue(ch.descriptionShort || ''),
    ];

    if (isFavorites) {
      row.push(escapeCsvValue(ch.note || ''));
    }

    return row.join(',');
  });

  // Prepend UTF-8 BOM (\uFEFF) so Excel renders UTF-8 correctly
  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ channels = [], query = '' }) {
  const handleExportFiltered = () => {
    const safeQuery = (query || 'podcasts').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `youtube_podcasts_${safeQuery}_${new Date().toISOString().split('T')[0]}.csv`;
    downloadChannelsCsv(channels, filename, false);
  };

  return (
    <button
      onClick={handleExportFiltered}
      disabled={channels.length === 0}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 disabled:pointer-events-none text-white rounded-xl text-xs font-bold shadow-sm transition"
      title="Export currently filtered list to CSV (Excel-ready UTF-8 BOM)"
    >
      <DownloadIcon className="w-3.5 h-3.5" />
      <span>Export CSV ({channels.length})</span>
    </button>
  );
}
