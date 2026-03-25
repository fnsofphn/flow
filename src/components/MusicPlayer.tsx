import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Check,
  ExternalLink,
  Link2,
  LogOut,
  Music,
  Pause,
  Play,
  Radio,
  Save,
  SkipForward,
  UserRoundCheck,
  X,
} from 'lucide-react';
import YouTube from 'react-youtube';
import {
  getStoredGoogleProviderToken,
  supabase,
} from '../lib/supabase';
import { parseYouTubeUrl } from '../lib/youtube';

type MusicSource = {
  id: string;
  title: string;
  subtitle: string;
  youtube_url: string;
  source_kind: 'video' | 'playlist';
  youtube_video_id: string | null;
  youtube_playlist_id: string | null;
};

type YouTubePlaylist = {
  id: string;
  title: string;
  itemCount: number;
  thumbnailUrl: string | null;
};

const fallbackSource: MusicSource = {
  id: 'default-lofi',
  title: 'Lo-fi thu gian',
  subtitle: 'Phat tu YouTube de thu gian hoac tap trung',
  youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  source_kind: 'video',
  youtube_video_id: 'jfKfPfyJRdk',
  youtube_playlist_id: null,
};

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [source, setSource] = useState<MusicSource>(fallbackSource);
  const [youtubeUrl, setYoutubeUrl] = useState(fallbackSource.youtube_url);
  const [title, setTitle] = useState(fallbackSource.title);
  const [subtitle, setSubtitle] = useState(fallbackSource.subtitle);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [providerToken, setProviderToken] = useState<string | null>(getStoredGoogleProviderToken());
  const [playlists, setPlaylists] = useState<YouTubePlaylist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(false);
  const [channelTitle, setChannelTitle] = useState<string | null>(null);

  useEffect(() => {
    const loadSource = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('music_sources')
        .select('id, title, subtitle, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSource = (data as MusicSource | null) ?? fallbackSource;
      setSource(nextSource);
      setYoutubeUrl(nextSource.youtube_url);
      setTitle(nextSource.title);
      setSubtitle(nextSource.subtitle);
      setIsLoading(false);
    };

    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUserEmail(data.session?.user.email ?? null);
      setProviderToken(data.session?.provider_token ?? getStoredGoogleProviderToken());
    };

    void loadSource();
    void syncSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
      setProviderToken(session?.provider_token ?? getStoredGoogleProviderToken());
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const loadYouTubeData = async () => {
      if (!providerToken) {
        setPlaylists([]);
        setChannelTitle(null);
        return;
      }

      setIsLoadingPlaylists(true);

      try {
        const [channelResponse, playlistsResponse] = await Promise.all([
          fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
            headers: { Authorization: `Bearer ${providerToken}` },
          }),
          fetch('https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=8', {
            headers: { Authorization: `Bearer ${providerToken}` },
          }),
        ]);

        if (channelResponse.ok) {
          const channelJson = await channelResponse.json();
          const firstChannel = channelJson.items?.[0];
          setChannelTitle(firstChannel?.snippet?.title ?? null);
        }

        if (playlistsResponse.ok) {
          const playlistJson = await playlistsResponse.json();
          const nextPlaylists =
            playlistJson.items?.map((item: any) => ({
              id: item.id as string,
              title: item.snippet?.title as string,
              itemCount: item.contentDetails?.itemCount as number,
              thumbnailUrl:
                item.snippet?.thumbnails?.medium?.url ??
                item.snippet?.thumbnails?.default?.url ??
                null,
            })) ?? [];

          setPlaylists(nextPlaylists);
        } else {
          setPlaylists([]);
        }
      } catch {
        setPlaylists([]);
        setChannelTitle(null);
      } finally {
        setIsLoadingPlaylists(false);
      }
    };

    void loadYouTubeData();
  }, [providerToken]);

  const onReady = (event: any) => {
    setPlayer(event.target);
  };

  const togglePlay = () => {
    if (isPlaying) {
      player?.pauseVideo();
    } else {
      player?.playVideo();
    }
    setIsPlaying((current) => !current);
  };

  const embedOptions = useMemo(() => {
    const playerVars: Record<string, string | number> = {
      autoplay: 0,
      controls: 0,
    };

    if (source.source_kind === 'playlist' && source.youtube_playlist_id) {
      playerVars.listType = 'playlist';
      playerVars.list = source.youtube_playlist_id;
    }

    return { playerVars };
  }, [source]);

  const activeVideoId =
    source.source_kind === 'video'
      ? source.youtube_video_id ?? undefined
      : source.youtube_video_id ?? undefined;

  const saveSource = async (
    nextUrl = youtubeUrl,
    nextTitle = title,
    nextSubtitle = subtitle,
  ) => {
    if (!userEmail) {
      setMessage('Hay ket noi Google truoc khi luu nguon phat YouTube.');
      return;
    }

    const parsed = parseYouTubeUrl(nextUrl);

    if (!parsed) {
      setMessage('Hay dan dung lien ket video hoac playlist YouTube.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      title: nextTitle.trim() || 'YouTube cua chung ta',
      subtitle: nextSubtitle.trim() || 'Danh sach phat rieng da duoc lien ket',
      youtube_url: nextUrl.trim(),
      source_kind: parsed.kind,
      youtube_video_id: parsed.videoId ?? null,
      youtube_playlist_id: parsed.playlistId ?? null,
      updated_at: new Date().toISOString(),
    };

    if (source.id !== fallbackSource.id) {
      const { data, error } = await supabase
        .from('music_sources')
        .update(payload)
        .eq('id', source.id)
        .select('id, title, subtitle, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
        .single();

      if (error) {
        setMessage(error.message);
      } else if (data) {
        const nextSource = data as MusicSource;
        setSource(nextSource);
        setYoutubeUrl(nextSource.youtube_url);
        setTitle(nextSource.title);
        setSubtitle(nextSource.subtitle);
        setMessage('Nguon phat YouTube da duoc cap nhat.');
      }
    } else {
      const { data, error } = await supabase
        .from('music_sources')
        .insert(payload)
        .select('id, title, subtitle, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
        .single();

      if (error) {
        setMessage(error.message);
      } else if (data) {
        const nextSource = data as MusicSource;
        setSource(nextSource);
        setYoutubeUrl(nextSource.youtube_url);
        setTitle(nextSource.title);
        setSubtitle(nextSource.subtitle);
        setMessage('Da lien ket nguon phat YouTube cua ban.');
      }
    }

    setIsSaving(false);
  };

  const connectGoogle = async () => {
    setMessage(null);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.href,
        scopes:
          'openid profile email https://www.googleapis.com/auth/youtube.readonly',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });
  };

  const disconnectGoogle = async () => {
    await supabase.auth.signOut();
    setMessage('Da ngat ket noi tai khoan Google / YouTube.');
    setPlaylists([]);
    setChannelTitle(null);
  };

  const importPlaylist = async (playlist: YouTubePlaylist) => {
    if (!userEmail) {
      setMessage('Hay ket noi Google truoc khi nhap playlist tu tai khoan cua ban.');
      return;
    }

    const playlistUrl = `https://www.youtube.com/playlist?list=${playlist.id}`;
    const nextTitle = playlist.title;
    const nextSubtitle = `${playlist.itemCount} video trong playlist cua ban`;
    setYoutubeUrl(playlistUrl);
    setTitle(nextTitle);
    setSubtitle(nextSubtitle);
    await saveSource(playlistUrl, nextTitle, nextSubtitle);
  };

  return (
    <>
      <div className="hidden">
        <YouTube
          key={`${source.source_kind}-${source.youtube_video_id ?? ''}-${source.youtube_playlist_id ?? ''}`}
          videoId={activeVideoId}
          opts={embedOptions}
          onReady={onReady}
          onStateChange={(event) => setIsPlaying(event.data === 1)}
        />
      </div>

      <motion.div
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="glass-card w-[360px] rounded-3xl border border-white/20 p-4 shadow-2xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm font-semibold text-white/80">Trinh nhac YouTube</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-white/50 transition-colors hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 animate-pulse">
                  <Music className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0 flex-1 overflow-hidden">
                  <p className="truncate text-sm font-medium">
                    {isLoading ? 'Dang chuan bi nguon phat...' : source.title}
                  </p>
                  <p className="truncate text-xs text-white/50">{source.subtitle}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6">
                <button className="text-white/70 transition-colors hover:text-white">
                  <SkipForward className="h-5 w-5 rotate-180" />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-1 h-5 w-5" />}
                </button>
                <button className="text-white/70 transition-colors hover:text-white">
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                  <UserRoundCheck className="h-4 w-4" />
                  Lien ket Google / YouTube
                </div>

                {userEmail ? (
                  <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <p className="text-sm font-semibold text-white">{userEmail}</p>
                    <p className="mt-1 text-xs text-white/60">
                      {channelTitle ? `Kenh dang dung: ${channelTitle}` : 'Tai khoan da duoc ket noi.'}
                    </p>
                    <button
                      type="button"
                      onClick={() => void disconnectGoogle()}
                      className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-white/75 transition-colors hover:text-white"
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Dang xuat tai khoan nay
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => void connectGoogle()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01]"
                  >
                    <UserRoundCheck className="h-4 w-4" />
                    Ket noi tai khoan Google cua ban
                  </button>
                )}

                <p className="mt-3 text-xs text-white/55">
                  Sau khi ket noi, ban co the nhap playlist YouTube cua chinh minh vao trinh nhac.
                </p>
              </div>

              {userEmail ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                    <Radio className="h-4 w-4" />
                    Playlist trong tai khoan
                  </div>

                  {isLoadingPlaylists ? (
                    <p className="text-sm text-white/55">Dang tai danh sach playlist...</p>
                  ) : playlists.length ? (
                    <div className="space-y-3">
                      {playlists.map((playlist) => (
                        <button
                          key={playlist.id}
                          type="button"
                          onClick={() => void importPlaylist(playlist)}
                          className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                        >
                          {playlist.thumbnailUrl ? (
                            <img
                              src={playlist.thumbnailUrl}
                              alt={playlist.title}
                              className="h-12 w-12 rounded-xl object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10">
                              <Music className="h-5 w-5 text-white/70" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-white">{playlist.title}</p>
                            <p className="text-xs text-white/50">{playlist.itemCount} video</p>
                          </div>
                          <span className="text-xs font-medium text-orange-300">Dung playlist nay</span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-white/55">
                      Chua lay duoc playlist tu tai khoan nay. Ban van co the dan lien ket thu cong o duoi.
                    </p>
                  )}
                </div>
              ) : null}

              <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                  <Link2 className="h-4 w-4" />
                  Nguon phat mac dinh
                </div>

                <div className="space-y-3">
                  <input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="Dan link video hoac playlist YouTube"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
                  />
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Ten hien thi"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
                  />
                  <input
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="Mo ta ngan"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
                  />
                </div>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <a
                    href="https://www.youtube.com"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-medium text-white/55 transition-colors hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Mo YouTube
                  </a>
                  <button
                    type="button"
                    onClick={() => void saveSource()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
                  >
                    {isSaving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Dang luu' : 'Luu nguon phat'}
                  </button>
                </div>

                {message ? <p className="mt-3 text-xs text-white/65">{message}</p> : null}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {!isOpen ? (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30"
          >
            {isPlaying ? (
              <div className="flex h-5 items-end gap-1">
                <motion.div
                  animate={{ height: ['20%', '100%', '20%'] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-1 rounded-full bg-white"
                />
                <motion.div
                  animate={{ height: ['40%', '80%', '40%'] }}
                  transition={{ repeat: Infinity, duration: 0.6 }}
                  className="w-1 rounded-full bg-white"
                />
                <motion.div
                  animate={{ height: ['60%', '100%', '60%'] }}
                  transition={{ repeat: Infinity, duration: 1 }}
                  className="w-1 rounded-full bg-white"
                />
              </div>
            ) : (
              <Music className="h-6 w-6" />
            )}
          </motion.button>
        ) : null}
      </motion.div>
    </>
  );
}
