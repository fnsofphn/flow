import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, ExternalLink, Link2, Music, Pause, Play, Save, SkipForward, X } from 'lucide-react';
import YouTube from 'react-youtube';
import { supabase } from '../lib/supabase';
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

export default function MusicPlayer() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [player, setPlayer] = useState<any>(null);
  const [source, setSource] = useState<MusicSource | null>(null);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadSource = async () => {
      setIsLoading(true);
      const { data } = await supabase
        .from('music_sources')
        .select('id, title, subtitle, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const nextSource = (data as MusicSource | null) ?? {
        id: 'default-lofi',
        title: 'Lo-fi thư giãn',
        subtitle: 'Phát từ YouTube để thư giãn hoặc tập trung',
        youtube_url: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
        source_kind: 'video' as const,
        youtube_video_id: 'jfKfPfyJRdk',
        youtube_playlist_id: null,
      };

      setSource(nextSource);
      setYoutubeUrl(nextSource.youtube_url);
      setTitle(nextSource.title);
      setSubtitle(nextSource.subtitle);
      setIsLoading(false);
    };

    void loadSource();
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
    setIsPlaying(!isPlaying);
  };

  const embedOptions = useMemo(() => {
    const playerVars: Record<string, string | number> = {
      autoplay: 0,
      controls: 0,
    };

    if (source?.source_kind === 'playlist' && source.youtube_playlist_id) {
      playerVars.listType = 'playlist';
      playerVars.list = source.youtube_playlist_id;
    }

    return { playerVars };
  }, [source]);

  const activeVideoId =
    source?.source_kind === 'video' ? source.youtube_video_id ?? undefined : source?.youtube_video_id ?? undefined;

  const saveSource = async () => {
    const parsed = parseYouTubeUrl(youtubeUrl);

    if (!parsed) {
      setMessage('Hãy dán đúng liên kết video hoặc playlist YouTube.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    const payload = {
      title: title.trim() || 'YouTube của chúng ta',
      subtitle: subtitle.trim() || 'Danh sách phát riêng đã được liên kết',
      youtube_url: youtubeUrl.trim(),
      source_kind: parsed.kind,
      youtube_video_id: parsed.videoId ?? null,
      youtube_playlist_id: parsed.playlistId ?? null,
      updated_at: new Date().toISOString(),
    };

    if (source && source.id !== 'default-lofi') {
      const { data, error } = await supabase
        .from('music_sources')
        .update(payload)
        .eq('id', source.id)
        .select('id, title, subtitle, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
        .single();

      if (error) {
        setMessage(error.message);
      } else {
        setSource(data as MusicSource);
        setMessage('Nguồn nhạc YouTube đã được cập nhật.');
      }
    } else {
      const { data, error } = await supabase
        .from('music_sources')
        .insert(payload)
        .select('id, title, subtitle, youtube_url, source_kind, youtube_video_id, youtube_playlist_id')
        .single();

      if (error) {
        setMessage(error.message);
      } else {
        setSource(data as MusicSource);
        setMessage('Đã liên kết nguồn phát YouTube của bạn.');
      }
    }

    setIsSaving(false);
  };

  return (
    <>
      {/* Hidden YouTube Player */}
      <div className="hidden">
        <YouTube 
          key={`${source?.source_kind ?? 'video'}-${source?.youtube_video_id ?? ''}-${source?.youtube_playlist_id ?? ''}`}
          videoId={activeVideoId}
          opts={embedOptions}
          onReady={onReady} 
          onStateChange={(e) => setIsPlaying(e.data === 1)}
        />
      </div>

      {/* Floating Widget */}
      <motion.div 
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-4"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1 }}
      >
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 20 }}
              className="glass-card p-4 w-64 rounded-2xl shadow-2xl border border-white/20"
            >
              <div className="flex justify-between items-center mb-4">
                <span className="text-sm font-semibold text-white/80">Trình nhạc YouTube</span>
                <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white">
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center animate-pulse">
                  <Music className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">
                    {isLoading ? 'Đang chuẩn bị nguồn phát...' : source?.title ?? 'Nguồn nhạc riêng'}
                  </p>
                  <p className="text-xs text-white/50 truncate">
                    {source?.subtitle ?? 'Liên kết video hoặc playlist YouTube của bạn'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-center gap-6 mt-6">
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5 rotate-180" />
                </button>
                <button 
                  onClick={togglePlay}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                </button>
                <button className="text-white/70 hover:text-white transition-colors">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white/85">
                  <Link2 className="h-4 w-4" />
                  Liên kết YouTube của bạn
                </div>

                <div className="space-y-3">
                  <input
                    value={youtubeUrl}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="Dán link video hoặc playlist YouTube"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
                  />
                  <input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="Tên hiển thị, ví dụ: Playlist của NamCy"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
                  />
                  <input
                    value={subtitle}
                    onChange={(event) => setSubtitle(event.target.value)}
                    placeholder="Mô tả ngắn cho nguồn nhạc"
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
                    Mở YouTube để lấy liên kết
                  </a>
                  <button
                    type="button"
                    onClick={() => void saveSource()}
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
                  >
                    {isSaving ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                    {isSaving ? 'Đang lưu' : 'Lưu liên kết'}
                  </button>
                </div>

                {message ? <p className="mt-3 text-xs text-white/65">{message}</p> : null}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 shadow-lg shadow-orange-500/30 flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <div className="flex gap-1 items-end h-5">
                <motion.div animate={{ height: ["20%", "100%", "20%"] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-1 bg-white rounded-full" />
                <motion.div animate={{ height: ["40%", "80%", "40%"] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-full" />
                <motion.div animate={{ height: ["60%", "100%", "60%"] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 bg-white rounded-full" />
              </div>
            ) : (
              <Music className="w-6 h-6" />
            )}
          </motion.button>
        )}
      </motion.div>
    </>
  );
}
