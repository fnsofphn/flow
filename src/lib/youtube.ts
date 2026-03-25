export type YouTubeSourceKind = 'video' | 'playlist';

export type ParsedYouTubeSource = {
  kind: YouTubeSourceKind;
  videoId?: string;
  playlistId?: string;
};

const YOUTUBE_HOSTS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'youtu.be',
  'www.youtu.be',
]);

const normalizeId = (value: string | null) => value?.trim() || undefined;

export function parseYouTubeUrl(input: string): ParsedYouTubeSource | null {
  const raw = input.trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);

    if (!YOUTUBE_HOSTS.has(url.hostname)) {
      return null;
    }

    const playlistId = normalizeId(url.searchParams.get('list'));
    const videoIdFromQuery = normalizeId(url.searchParams.get('v'));

    if (url.hostname.includes('youtu.be')) {
      const shortVideoId = normalizeId(url.pathname.replace('/', ''));
      if (playlistId) {
        return {
          kind: 'playlist',
          playlistId,
          videoId: shortVideoId,
        };
      }

      if (shortVideoId) {
        return {
          kind: 'video',
          videoId: shortVideoId,
        };
      }
    }

    if (url.pathname === '/watch') {
      if (playlistId) {
        return {
          kind: 'playlist',
          playlistId,
          videoId: videoIdFromQuery,
        };
      }

      if (videoIdFromQuery) {
        return {
          kind: 'video',
          videoId: videoIdFromQuery,
        };
      }
    }

    if (url.pathname === '/playlist' && playlistId) {
      return {
        kind: 'playlist',
        playlistId,
      };
    }

    if (url.pathname.startsWith('/embed/')) {
      const embeddedId = normalizeId(url.pathname.split('/')[2]);
      if (playlistId) {
        return {
          kind: 'playlist',
          playlistId,
          videoId: embeddedId,
        };
      }

      if (embeddedId) {
        return {
          kind: 'video',
          videoId: embeddedId,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}
