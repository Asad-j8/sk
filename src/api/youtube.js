/**
 * YouTube Data API v3 Client & Podcast Detection Service
 * 
 * Manages all YouTube API calls, client-side quota tracking (resets midnight PT),
 * 24-hour search result caching in localStorage, handle resolution, and podcast scoring.
 */

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';
const STORAGE_KEY_API_KEY = 'yt_podcast_finder_api_key';
const STORAGE_KEY_QUOTA = 'yt_podcast_finder_quota';
const STORAGE_KEY_CACHE_PREFIX = 'yt_cache_';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// --- API Key Management ---
export function getStoredApiKey() {
  return localStorage.getItem(STORAGE_KEY_API_KEY) || '';
}

export function setStoredApiKey(key) {
  if (key) {
    localStorage.setItem(STORAGE_KEY_API_KEY, key.trim());
  } else {
    localStorage.removeItem(STORAGE_KEY_API_KEY);
  }
}

// --- Pacific Time Quota Tracker ---
export function getPacificDateString() {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Formats as YYYY-MM-DD
  } catch (e) {
    // Fallback if timezone not supported
    const now = new Date();
    return now.toISOString().split('T')[0];
  }
}

export function getQuotaUsage() {
  const currentPtDate = getPacificDateString();
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTA);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.dateStr === currentPtDate) {
        return data.units || 0;
      }
    }
  } catch (e) {
    console.error('Error reading quota usage:', e);
  }
  // If not for current PT date, reset to 0
  const fresh = { dateStr: currentPtDate, units: 0 };
  localStorage.setItem(STORAGE_KEY_QUOTA, JSON.stringify(fresh));
  return 0;
}

export function incrementQuotaUsage(units) {
  const currentPtDate = getPacificDateString();
  let currentUnits = 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_QUOTA);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.dateStr === currentPtDate) {
        currentUnits = data.units || 0;
      }
    }
  } catch (e) {
    // fallback
  }
  const updatedUnits = currentUnits + units;
  localStorage.setItem(
    STORAGE_KEY_QUOTA,
    JSON.stringify({ dateStr: currentPtDate, units: updatedUnits })
  );
  window.dispatchEvent(new CustomEvent('yt-quota-updated', { detail: { units: updatedUnits } }));
  return updatedUnits;
}

export function resetQuotaTracker() {
  const currentPtDate = getPacificDateString();
  localStorage.setItem(
    STORAGE_KEY_QUOTA,
    JSON.stringify({ dateStr: currentPtDate, units: 0 })
  );
  window.dispatchEvent(new CustomEvent('yt-quota-updated', { detail: { units: 0 } }));
}

// --- Cache Management ---
function getCacheKey(query) {
  return `${STORAGE_KEY_CACHE_PREFIX}${query.trim().toLowerCase()}`;
}

export function getCachedSearch(query) {
  try {
    const raw = localStorage.getItem(getCacheKey(query));
    if (!raw) return null;
    const item = JSON.parse(raw);
    if (Date.now() - item.timestamp < CACHE_TTL_MS) {
      return item.data;
    }
    // Expired
    localStorage.removeItem(getCacheKey(query));
  } catch (e) {
    console.warn('Cache read error:', e);
  }
  return null;
}

export function setCachedSearch(query, data) {
  try {
    const item = {
      timestamp: Date.now(),
      data
    };
    localStorage.setItem(getCacheKey(query), JSON.stringify(item));
  } catch (e) {
    console.warn('Cache write failed (likely quota limit in localStorage):', e);
  }
}

// --- ISO 8601 Duration Parser ---
export function parseISO8601Duration(duration) {
  if (!duration) return 0;
  const regex = /P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const matches = duration.match(regex);
  if (!matches) return 0;

  const days = parseInt(matches[1] || 0, 10);
  const hours = parseInt(matches[2] || 0, 10);
  const minutes = parseInt(matches[3] || 0, 10);
  const seconds = parseInt(matches[4] || 0, 10);

  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

export function formatDurationMinutes(seconds) {
  if (!seconds || seconds <= 0) return '0 min';
  const mins = Math.round(seconds / 60);
  if (mins >= 60) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  return `${mins} min`;
}

// --- Podcast Detection Algorithm ---
export function calculatePodcastScore({
  channelTitle = '',
  channelDescription = '',
  videos = [],
  uploadsPlaylistId = null
}) {
  let score = 0;
  const breakdown = {
    durationPoints: 0,
    keywordPoints: 0,
    titlePatternPoints: 0,
    frequencyPoints: 0,
    playlistPoints: 0,
    avgMinutes: 0,
    uploadsLast30Days: 0,
    uploadsLast90Days: 0,
    matchedKeywords: [],
    matchedEpisodeTitles: 0,
  };

  // Signal 1: Average video duration of recent uploads
  const totalDurationSec = videos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
  const validVideosCount = videos.filter(v => v.durationSec > 0).length || 1;
  const avgSeconds = videos.length > 0 ? totalDurationSec / validVideosCount : 0;
  const avgMinutes = Math.round(avgSeconds / 60);
  breakdown.avgMinutes = avgMinutes;

  if (avgMinutes >= 20) {
    breakdown.durationPoints = 35;
  } else if (avgMinutes >= 10) {
    // Proportional between 10 and 20 min (15 to 34 pts)
    breakdown.durationPoints = Math.round(15 + (20 * (avgMinutes - 10)) / 10);
  } else if (avgMinutes >= 5) {
    breakdown.durationPoints = 5;
  }
  score += breakdown.durationPoints;

  // Signal 2: Channel title & description keywords (+20 points)
  const textToSearch = `${channelTitle} ${channelDescription}`.toLowerCase();
  const podcastKeywords = [
    'podcast', 'podcasts', 'episode', 'episodes', 'interview',
    'interviews', 'conversations', 'conversation', 'show', 'talk', 'talks', 'live stream'
  ];

  const matched = podcastKeywords.filter(kw => {
    const regex = new RegExp(`\\b${kw}\\b`, 'i');
    return regex.test(textToSearch);
  });
  breakdown.matchedKeywords = matched;

  if (matched.length >= 2 || matched.includes('podcast') || matched.includes('podcasts')) {
    breakdown.keywordPoints = 20;
  } else if (matched.length === 1) {
    breakdown.keywordPoints = 12;
  }
  score += breakdown.keywordPoints;

  // Signal 3: Video titles containing Episode / Ep / # patterns (+15 points)
  const episodeTitleRegex = /(?:episode|ep\.?|#)\s*\d+|\bep\s*\d+|\bep\b/i;
  let episodeTitleMatches = 0;
  videos.forEach(v => {
    if (v.title && episodeTitleRegex.test(v.title)) {
      episodeTitleMatches++;
    }
  });
  breakdown.matchedEpisodeTitles = episodeTitleMatches;

  if (videos.length > 0) {
    const ratio = episodeTitleMatches / videos.length;
    if (ratio >= 0.3 || episodeTitleMatches >= 3) {
      breakdown.titlePatternPoints = 15;
    } else if (episodeTitleMatches >= 1) {
      breakdown.titlePatternPoints = 8;
    }
  }
  score += breakdown.titlePatternPoints;

  // Signal 4: Upload frequency (+15 for >=2 in 30d, +5 for >=1 in 90d)
  const now = Date.now();
  const ms30Days = 30 * 24 * 60 * 60 * 1000;
  const ms90Days = 90 * 24 * 60 * 60 * 1000;

  let count30d = 0;
  let count90d = 0;

  videos.forEach(v => {
    if (v.publishedAt) {
      const pubTime = new Date(v.publishedAt).getTime();
      const diff = now - pubTime;
      if (diff <= ms30Days) count30d++;
      if (diff <= ms90Days) count90d++;
    }
  });

  breakdown.uploadsLast30Days = count30d;
  breakdown.uploadsLast90Days = count90d;

  if (count30d >= 2) {
    breakdown.frequencyPoints = 15;
  } else if (count90d >= 1) {
    breakdown.frequencyPoints = 5;
  }
  score += breakdown.frequencyPoints;

  // Signal 5: Has active uploads playlist / content detected (+10 points)
  if (uploadsPlaylistId && videos.length > 0) {
    breakdown.playlistPoints = 10;
    score += breakdown.playlistPoints;
  }

  score = Math.min(100, Math.max(0, score));

  let badgeColor = 'gray';
  let badgeLabel = 'Unlikely';
  if (score >= 70) {
    badgeColor = 'green';
    badgeLabel = 'Likely Podcast';
  } else if (score >= 60) {
    badgeColor = 'amber';
    badgeLabel = 'Likely Podcast';
  } else if (score >= 40) {
    badgeColor = 'yellow';
    badgeLabel = 'Possible Podcast';
  }

  return {
    score,
    badgeColor,
    badgeLabel,
    isLikelyPodcast: score >= 60,
    breakdown
  };
}

// --- YouTube API Requests ---
async function fetchYouTubeApi(endpoint, params, apiKey) {
  const url = new URL(`${YOUTUBE_API_BASE}/${endpoint}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') {
      url.searchParams.append(k, v);
    }
  });
  url.searchParams.append('key', apiKey);

  const res = await fetch(url.toString());
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const message = errorData?.error?.message || `HTTP error ${res.status}`;
    const reason = errorData?.error?.errors?.[0]?.reason || '';

    const error = new Error(message);
    error.status = res.status;
    error.reason = reason;
    error.details = errorData;
    throw error;
  }

  return res.json();
}

/**
 * Handle URL / handle extraction:
 * Accepts: "youtube.com/@HubermanLab", "@HubermanLab", "HubermanLab", "https://youtube.com/channel/UC..."
 */
export function parseSearchInput(input) {
  const trimmed = input.trim();
  // Check if handle
  const handleMatch = trimmed.match(/(?:youtube\.com\/(?:@|c\/))?@?([a-zA-Z0-9_\-\.]{3,30})/);
  if (trimmed.startsWith('@') || (trimmed.includes('youtube.com/@') && handleMatch)) {
    return {
      isHandle: true,
      handle: trimmed.replace(/^https?:\/\/(www\.)?youtube\.com\/@?/, '').replace(/^@/, '')
    };
  }
  return {
    isHandle: false,
    query: trimmed
  };
}

/**
 * Resolve a YouTube handle to a channel and suggest similar search query
 */
export async function resolveHandleChannel(handle, apiKey) {
  incrementQuotaUsage(1); // channels.list costs 1
  const data = await fetchYouTubeApi('channels', {
    part: 'snippet,contentDetails',
    forHandle: handle
  }, apiKey);

  if (!data.items || data.items.length === 0) {
    throw new Error(`Channel @${handle} was not found on YouTube.`);
  }

  const channel = data.items[0];
  const title = channel.snippet?.title || handle;
  const description = channel.snippet?.description || '';

  // Extract common topical keywords
  const cleanTitle = title.replace(/podcast|show|talk|daily|the/gi, '').trim();
  const searchKeyword = cleanTitle || title;

  return {
    channel,
    suggestedKeyword: `${searchKeyword}`.trim()
  };
}

/**
 * Full Pipeline:
 * 1. search.list (100 units)
 * 2. channels.list batch (1 unit)
 * 3. playlistItems.list for recent uploads (1 unit per channel)
 * 4. videos.list batch (1 unit per 50 videos)
 */
export async function searchPodcastChannels({
  query,
  pageToken = '',
  apiKey,
  onProgress = () => {}
}) {
  if (!apiKey) {
    throw new Error('YouTube API key is required. Please set it in Settings.');
  }

  // 1. Search Channels (Cost: 100 units)
  onProgress('Searching YouTube channels for niche...', 10);
  incrementQuotaUsage(100);

  const searchParams = {
    part: 'snippet',
    type: 'channel',
    q: query.toLowerCase().includes('podcast') ? query : `${query} podcast`,
    maxResults: 50,
  };
  if (pageToken) {
    searchParams.pageToken = pageToken;
  }

  const searchData = await fetchYouTubeApi('search', searchParams, apiKey);
  const nextPageToken = searchData.nextPageToken || null;
  const channelItems = searchData.items || [];

  if (channelItems.length === 0) {
    return { channels: [], nextPageToken: null };
  }

  const channelIds = channelItems
    .map(item => item.id?.channelId || item.snippet?.channelId)
    .filter(Boolean);

  if (channelIds.length === 0) {
    return { channels: [], nextPageToken: null };
  }

  // 2. Fetch Channel Details (Cost: 1 unit)
  onProgress('Fetching subscriber counts & channel profiles...', 30);
  incrementQuotaUsage(1);

  const channelsData = await fetchYouTubeApi('channels', {
    part: 'snippet,statistics,contentDetails',
    id: channelIds.join(',')
  }, apiKey);

  const channelMap = new Map();
  (channelsData.items || []).forEach(ch => {
    channelMap.set(ch.id, ch);
  });

  // 3. Fetch Recent Uploads for each channel (Cost: 1 unit per channel with uploads)
  onProgress('Analyzing recent video uploads...', 55);
  const channelsWithUploads = [];
  const videoIdsToFetch = [];
  const channelVideosMap = new Map();

  // Process in small batches of promises to avoid rate limit spikes
  const playlistPromises = [];

  for (const chId of channelIds) {
    const ch = channelMap.get(chId);
    if (!ch) continue;

    const uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads;
    if (uploadsPlaylistId) {
      playlistPromises.push(
        (async () => {
          try {
            incrementQuotaUsage(1);
            const playlistData = await fetchYouTubeApi('playlistItems', {
              part: 'snippet,contentDetails',
              playlistId: uploadsPlaylistId,
              maxResults: 10
            }, apiKey);

            const vids = (playlistData.items || []).map(pItem => ({
              videoId: pItem.contentDetails?.videoId,
              title: pItem.snippet?.title,
              publishedAt: pItem.snippet?.publishedAt || pItem.contentDetails?.videoPublishedAt,
            })).filter(v => Boolean(v.videoId));

            channelVideosMap.set(chId, vids);
            vids.forEach(v => videoIdsToFetch.push(v.videoId));
          } catch (err) {
            console.warn(`Failed to fetch uploads for channel ${chId}:`, err);
            channelVideosMap.set(chId, []);
          }
        })()
      );
    } else {
      channelVideosMap.set(chId, []);
    }
  }

  await Promise.all(playlistPromises);

  // 4. Batch fetch video durations & statistics (Cost: 1 unit per 50 videos)
  onProgress('Computing episode lengths & view averages...', 80);
  const videoDetailsMap = new Map();

  const chunkSize = 50;
  for (let i = 0; i < videoIdsToFetch.length; i += chunkSize) {
    const chunk = videoIdsToFetch.slice(i, i + chunkSize);
    if (chunk.length > 0) {
      incrementQuotaUsage(1);
      try {
        const vData = await fetchYouTubeApi('videos', {
          part: 'contentDetails,statistics',
          id: chunk.join(',')
        }, apiKey);

        (vData.items || []).forEach(vItem => {
          videoDetailsMap.set(vItem.id, {
            durationSec: parseISO8601Duration(vItem.contentDetails?.duration),
            viewCount: parseInt(vItem.statistics?.viewCount || 0, 10)
          });
        });
      } catch (err) {
        console.warn('Error fetching video details batch:', err);
      }
    }
  }

  // 5. Combine and compute metrics & podcast scores
  onProgress('Scoring podcast indicators...', 95);
  const results = [];

  for (const chId of channelIds) {
    const ch = channelMap.get(chId);
    if (!ch) continue;

    const rawVideos = channelVideosMap.get(chId) || [];
    const hydratedVideos = rawVideos.map(v => {
      const details = videoDetailsMap.get(v.videoId) || { durationSec: 0, viewCount: 0 };
      return {
        ...v,
        durationSec: details.durationSec,
        viewCount: details.viewCount
      };
    });

    // Compute metrics
    const totalViewsLast10 = hydratedVideos.reduce((acc, v) => acc + (v.viewCount || 0), 0);
    const avgViewsLast10 = hydratedVideos.length > 0 ? Math.round(totalViewsLast10 / hydratedVideos.length) : 0;

    const totalDurationSec = hydratedVideos.reduce((acc, v) => acc + (v.durationSec || 0), 0);
    const validDurationsCount = hydratedVideos.filter(v => v.durationSec > 0).length || 1;
    const avgDurationSec = hydratedVideos.length > 0 ? Math.round(totalDurationSec / validDurationsCount) : 0;
    const avgEpisodeMinutes = Math.round(avgDurationSec / 60);

    // Latest upload date
    let lastUploadDate = null;
    if (hydratedVideos.length > 0 && hydratedVideos[0].publishedAt) {
      lastUploadDate = hydratedVideos[0].publishedAt;
    }

    const snippet = ch.snippet || {};
    const statistics = ch.statistics || {};
    const uploadsPlaylistId = ch.contentDetails?.relatedPlaylists?.uploads || null;

    const podcastScoreData = calculatePodcastScore({
      channelTitle: snippet.title || '',
      channelDescription: snippet.description || '',
      videos: hydratedVideos,
      uploadsPlaylistId
    });

    const customUrl = snippet.customUrl || '';
    const handle = customUrl ? (customUrl.startsWith('@') ? customUrl : `@${customUrl}`) : '';
    const channelUrl = handle ? `https://www.youtube.com/${handle}` : `https://www.youtube.com/channel/${ch.id}`;

    results.push({
      id: ch.id,
      title: snippet.title || 'Untitled Channel',
      channelUrl,
      handle: handle || (ch.id ? `id:${ch.id}` : ''),
      description: snippet.description || '',
      descriptionShort: (snippet.description || '').slice(0, 140).trim(),
      country: snippet.country || 'unknown',
      publishedAt: snippet.publishedAt,
      thumbnail: snippet.thumbnails?.medium?.url || snippet.thumbnails?.default?.url || '',
      subscriberCount: statistics.hiddenSubscriberCount ? null : parseInt(statistics.subscriberCount || 0, 10),
      hiddenSubscriberCount: Boolean(statistics.hiddenSubscriberCount),
      videoCount: parseInt(statistics.videoCount || 0, 10),
      totalViews: parseInt(statistics.viewCount || 0, 10),
      avgViewsLast10,
      avgEpisodeMinutes,
      avgDurationFormatted: formatDurationMinutes(avgDurationSec),
      lastUploadDate,
      podcastScore: podcastScoreData.score,
      podcastBadge: podcastScoreData.badgeLabel,
      podcastColor: podcastScoreData.badgeColor,
      isLikelyPodcast: podcastScoreData.isLikelyPodcast,
      scoreBreakdown: podcastScoreData.breakdown,
      recentVideos: hydratedVideos.slice(0, 5)
    });
  }

  onProgress('Done!', 100);

  return {
    channels: results,
    nextPageToken
  };
}

// --- Sample / Mock Data (For instant demo & testing without API key) ---
export const SAMPLE_CHANNELS = [
  {
    id: "UC_sample_huberman",
    title: "Huberman Lab",
    channelUrl: "https://www.youtube.com/@hubermanlab",
    handle: "@hubermanlab",
    description: "Dr. Andrew Huberman discusses neuroscience: how our brain and its connections with the organs of our body control our perceptions, our behaviors, and our health.",
    descriptionShort: "Dr. Andrew Huberman discusses neuroscience: how our brain and its connections with the organs of our body control our perceptions...",
    country: "US",
    thumbnail: "https://images.unsplash.com/photo-1579208575657-c595a053b9b7?w=150&auto=format&fit=crop&q=80",
    subscriberCount: 5600000,
    hiddenSubscriberCount: false,
    videoCount: 245,
    totalViews: 380000000,
    avgViewsLast10: 640000,
    avgEpisodeMinutes: 125,
    avgDurationFormatted: "2h 5m",
    lastUploadDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    podcastScore: 95,
    podcastBadge: "Likely Podcast",
    podcastColor: "green",
    isLikelyPodcast: true,
    scoreBreakdown: {
      durationPoints: 35,
      keywordPoints: 20,
      titlePatternPoints: 15,
      frequencyPoints: 15,
      playlistPoints: 10,
      avgMinutes: 125,
      uploadsLast30Days: 4,
      uploadsLast90Days: 12,
      matchedKeywords: ['podcast', 'episode', 'show', 'talk'],
      matchedEpisodeTitles: 9
    }
  },
  {
    id: "UC_sample_lex",
    title: "Lex Fridman Podcast",
    channelUrl: "https://www.youtube.com/@lexfridman",
    handle: "@lexfridman",
    description: "Conversations about science, tech, history, philosophy, and the general intelligence of AI and humanity with Lex Fridman.",
    descriptionShort: "Conversations about science, tech, history, philosophy, and the general intelligence of AI and humanity with Lex Fridman.",
    country: "US",
    thumbnail: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    subscriberCount: 4200000,
    hiddenSubscriberCount: false,
    videoCount: 480,
    totalViews: 490000000,
    avgViewsLast10: 890000,
    avgEpisodeMinutes: 180,
    avgDurationFormatted: "3h",
    lastUploadDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    podcastScore: 98,
    podcastBadge: "Likely Podcast",
    podcastColor: "green",
    isLikelyPodcast: true,
    scoreBreakdown: {
      durationPoints: 35,
      keywordPoints: 20,
      titlePatternPoints: 15,
      frequencyPoints: 15,
      playlistPoints: 10,
      avgMinutes: 180,
      uploadsLast30Days: 4,
      uploadsLast90Days: 14,
      matchedKeywords: ['podcast', 'conversations', 'episode', 'interview'],
      matchedEpisodeTitles: 10
    }
  },
  {
    id: "UC_sample_lenny",
    title: "Lenny's Podcast: Product | Growth | Career",
    channelUrl: "https://www.youtube.com/@LennysPodcast",
    handle: "@LennysPodcast",
    description: "Interviews with world-class product leaders and growth experts to uncover actionable tactical advice for building tech products.",
    descriptionShort: "Interviews with world-class product leaders and growth experts to uncover actionable tactical advice for building tech products.",
    country: "US",
    thumbnail: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    subscriberCount: 290000,
    hiddenSubscriberCount: false,
    videoCount: 160,
    totalViews: 18500000,
    avgViewsLast10: 52000,
    avgEpisodeMinutes: 72,
    avgDurationFormatted: "1h 12m",
    lastUploadDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    podcastScore: 90,
    podcastBadge: "Likely Podcast",
    podcastColor: "green",
    isLikelyPodcast: true,
    scoreBreakdown: {
      durationPoints: 35,
      keywordPoints: 20,
      titlePatternPoints: 15,
      frequencyPoints: 15,
      playlistPoints: 10,
      avgMinutes: 72,
      uploadsLast30Days: 5,
      uploadsLast90Days: 16,
      matchedKeywords: ['podcast', 'interviews', 'show'],
      matchedEpisodeTitles: 8
    }
  },
  {
    id: "UC_sample_crime",
    title: "Casefile True Crime Files",
    channelUrl: "https://www.youtube.com/@CasefileTrueCrime",
    handle: "@CasefileTrueCrime",
    description: "In-depth investigative true crime podcast covering unsolved mysteries, cold cases, and notorious crimes worldwide.",
    descriptionShort: "In-depth investigative true crime podcast covering unsolved mysteries, cold cases, and notorious crimes worldwide.",
    country: "AU",
    thumbnail: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    subscriberCount: 820000,
    hiddenSubscriberCount: false,
    videoCount: 310,
    totalViews: 92000000,
    avgViewsLast10: 145000,
    avgEpisodeMinutes: 65,
    avgDurationFormatted: "1h 5m",
    lastUploadDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    podcastScore: 88,
    podcastBadge: "Likely Podcast",
    podcastColor: "green",
    isLikelyPodcast: true,
    scoreBreakdown: {
      durationPoints: 35,
      keywordPoints: 20,
      titlePatternPoints: 15,
      frequencyPoints: 15,
      playlistPoints: 10,
      avgMinutes: 65,
      uploadsLast30Days: 3,
      uploadsLast90Days: 9,
      matchedKeywords: ['podcast', 'episode'],
      matchedEpisodeTitles: 7
    }
  },
  {
    id: "UC_sample_tech_shorts",
    title: "Quick Tech Explanations",
    channelUrl: "https://www.youtube.com/@quicktechexplained",
    handle: "@quicktechexplained",
    description: "Bite-sized tech news, 3-minute tutorials, hardware specs reviews and smartphone teardowns.",
    descriptionShort: "Bite-sized tech news, 3-minute tutorials, hardware specs reviews and smartphone teardowns.",
    country: "GB",
    thumbnail: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=150&auto=format&fit=crop&q=80",
    subscriberCount: 150000,
    hiddenSubscriberCount: false,
    videoCount: 420,
    totalViews: 25000000,
    avgViewsLast10: 18000,
    avgEpisodeMinutes: 4,
    avgDurationFormatted: "4 min",
    lastUploadDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    podcastScore: 25,
    podcastBadge: "Unlikely",
    podcastColor: "gray",
    isLikelyPodcast: false,
    scoreBreakdown: {
      durationPoints: 0,
      keywordPoints: 0,
      titlePatternPoints: 0,
      frequencyPoints: 15,
      playlistPoints: 10,
      avgMinutes: 4,
      uploadsLast30Days: 8,
      uploadsLast90Days: 24,
      matchedKeywords: [],
      matchedEpisodeTitles: 0
    }
  }
];
