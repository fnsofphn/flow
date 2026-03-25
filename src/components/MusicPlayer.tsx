import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ExternalLink,
  Music,
  Pause,
  Play,
  Shuffle,
  SkipForward,
  X,
} from 'lucide-react';
import YouTube from 'react-youtube';
import { supabase } from '../lib/supabase';

type MusicTrack = {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  source_kind: 'video' | 'playlist';
  youtube_video_id: string | null;
  youtube_playlist_id: string | null;
};

const fallbackTrack: MusicTrack = {
  id: 'fallback-lofi',
  title: 'Lo-fi thu gian',
  description: 'Them bai hat vao Thu vien am nhac de trinh phat tu dong chon ngau nhien.',
  youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  source_kind: 'video',
  youtube_video_id: 'jfKfPfyJRdk',
  youtube_playlist_id: null,
};

const pickRandomTrack = (tracks: MusicTrack[], currentId?: string) => {
  if (!tracks.length) return fallbackTrack;
  if (tracks.length === 1) return tracks[0];

  const candidates = tracks.filter((track) => track.id !== currentId);
  return candidates[Math.floor(Math.random() * candidates.length)] ?? tracks[0];
};

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [currentTrack, setCurrentTrack] = useState<MusicTrack>(fallbackTrack);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const loadTracks = async () => {
    setIsLoading(true);
    setMessage(null);

    const { data, error } = await supabase
      .from('music_library_items')
      .select('id, title, description, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
      .order('created_at', { ascending: false });

    if (error) {
      setTracks([]);
      setCurrentTrack(fallbackTrack);
      setMessage('Chua tai duoc thu vien am nhac. Trinh nhac dang dung nguon du phong.');
    } else {
      const nextTracks = (data as MusicTrack[]) ?? [];
      setTracks(nextTracks);
      setCurrentTrack(pickRandomTrack(nextTracks));
      if (!nextTracks.length) {
        setMessage('Hay them bai hat vao Thu vien am nhac de trinh nhac phat ngau nhien.');
      }
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadTracks();
  }, []);

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

  const playRandomTrack = () => {
    const nextTrack = pickRandomTrack(tracks, currentTrack.id);
    setCurrentTrack(nextTrack);
    setIsPlaying(false);
    setMessage(
      tracks.length
        ? 'Trinh nhac vua chon ngau nhien mot bai hat moi tu thu vien cua hai ban.'
        : 'Thu vien chua co bai hat nen dang phat nguon mac dinh.',
    );
  };

  const embedOptions = useMemo(() => {
    const playerVars: Record<string, string | number> = {
      autoplay: 0,
      controls: 0,
    };

    if (currentTrack.source_kind === 'playlist' && currentTrack.youtube_playlist_id) {
      playerVars.listType = 'playlist';
      playerVars.list = currentTrack.youtube_playlist_id;
    }

    return { playerVars };
  }, [currentTrack]);

  const activeVideoId =
    currentTrack.source_kind === 'video'
      ? currentTrack.youtube_video_id ?? undefined
      : currentTrack.youtube_video_id ?? undefined;

  return (
    <>
      <div className="hidden">
        <YouTube
          key={`${currentTrack.source_kind}-${currentTrack.youtube_video_id ?? ''}-${currentTrack.youtube_playlist_id ?? ''}`}
          videoId={activeVideoId}
          opts={embedOptions}
          onReady={onReady}
          onStateChange={(event) => {
            setIsPlaying(event.data === 1);

            if (event.data === 0) {
              playRandomTrack();
            }
          }}
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
                <span className="text-sm font-semibold text-white/80">Trinh nhac ngau nhien</span>
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
                    {isLoading ? 'Dang chuan bi thu vien am nhac...' : currentTrack.title}
                  </p>
                  <p className="truncate text-xs text-white/50">{currentTrack.description}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-center gap-6">
                <button
                  type="button"
                  onClick={playRandomTrack}
                  className="text-white/70 transition-colors hover:text-white"
                >
                  <Shuffle className="h-5 w-5" />
                </button>
                <button
                  onClick={togglePlay}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition-transform hover:scale-105"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="ml-1 h-5 w-5" />}
                </button>
                <button
                  type="button"
                  onClick={playRandomTrack}
                  className="text-white/70 transition-colors hover:text-white"
                >
                  <SkipForward className="h-5 w-5" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white/85">Nguon phat hien tai</p>
                    <p className="text-xs text-white/55">
                      {tracks.length
                        ? `${tracks.length} bai hat dang co trong Thu vien am nhac`
                        : 'Thu vien chua co bai hat, trinh nhac dang dung nguon mac dinh'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadTracks()}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    Lam moi
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-base font-semibold text-white">{currentTrack.title}</p>
                  <p className="mt-2 text-sm leading-6 text-white/65">{currentTrack.description}</p>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <a
                      href={currentTrack.youtube_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-orange-300 transition-colors hover:text-orange-200"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Mo tren YouTube
                    </a>
                    <button
                      type="button"
                      onClick={playRandomTrack}
                      className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02]"
                    >
                      <Shuffle className="h-4 w-4" />
                      Chon ngau nhien
                    </button>
                  </div>
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
