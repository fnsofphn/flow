import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Disc3,
  Link2,
  Music,
  PencilLine,
  Plus,
  RefreshCcw,
  Shuffle,
  Trash2,
  X,
} from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';
import { parseYouTubeUrl } from '../lib/youtube';

type MusicTrack = {
  id: string;
  title: string;
  description: string;
  youtube_url: string;
  source_kind: 'video' | 'playlist';
  youtube_video_id: string | null;
  youtube_playlist_id: string | null;
  created_at: string;
};

const emptyForm = {
  title: '',
  description: '',
  youtubeUrl: '',
};

const getThumbnail = (track: MusicTrack) => {
  if (track.youtube_video_id) {
    return `https://img.youtube.com/vi/${track.youtube_video_id}/hqdefault.jpg`;
  }

  return null;
};

export default function MusicLibrary() {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [form, setForm] = useState(emptyForm);

  const randomSuggestion = useMemo(() => {
    if (!tracks.length) return null;
    return tracks[Math.floor(Math.random() * tracks.length)];
  }, [tracks]);

  const loadTracks = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('music_library_items')
      .select('id, title, description, youtube_url, source_kind, youtube_video_id, youtube_playlist_id, created_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setTracks([]);
    } else {
      setTracks((data as MusicTrack[]) ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadTracks();
  }, []);

  const openCreate = () => {
    setEditingTrack(null);
    setForm(emptyForm);
    setIsModalOpen(true);
  };

  const openEdit = (track: MusicTrack) => {
    setEditingTrack(track);
    setForm({
      title: track.title,
      description: track.description,
      youtubeUrl: track.youtube_url,
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingTrack(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    const parsed = parseYouTubeUrl(form.youtubeUrl);

    if (!form.title.trim() || !form.description.trim() || !parsed) {
      setError('Hãy nhập tên bài hát, mô tả ngắn và liên kết YouTube hợp lệ.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      youtube_url: form.youtubeUrl.trim(),
      source_kind: parsed.kind,
      youtube_video_id: parsed.videoId ?? null,
      youtube_playlist_id: parsed.playlistId ?? null,
    };

    if (editingTrack) {
      const { data, error: updateError } = await supabase
        .from('music_library_items')
        .update(payload)
        .eq('id', editingTrack.id)
        .select('id, title, description, youtube_url, source_kind, youtube_video_id, youtube_playlist_id, created_at')
        .single();

      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setTracks((current) =>
          current.map((track) => (track.id === editingTrack.id ? (data as MusicTrack) : track)),
        );
        closeModal();
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('music_library_items')
        .insert(payload)
        .select('id, title, description, youtube_url, source_kind, youtube_video_id, youtube_playlist_id, created_at')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setTracks((current) => [data as MusicTrack, ...current]);
        closeModal();
      }
    }

    setIsSaving(false);
  };

  const handleDelete = async (track: MusicTrack) => {
    const previousTracks = tracks;
    setTracks((current) => current.filter((item) => item.id !== track.id));

    const { error: deleteError } = await supabase.from('music_library_items').delete().eq('id', track.id);

    if (deleteError) {
      setTracks(previousTracks);
      setError(deleteError.message);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Thư viện âm nhạc
            <Music className="h-8 w-8 text-orange-400" />
          </h1>
          <p className="text-lg text-white/60">
            Lưu những bài hát yêu thích, thêm mô tả ngắn, rồi để trình nhạc tự chọn ngẫu nhiên cho hai bạn.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadTracks()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới thư viện
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg shadow-orange-500/30"
          >
            <Plus className="h-5 w-5" />
            Thêm bài hát
          </motion.button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <TiltCard className="bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-orange-500/20 p-3">
              <Shuffle className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Bài hát được chọn ngẫu nhiên</h2>
              <p className="text-sm text-white/60">
                Trình nhạc sẽ bốc ngẫu nhiên từ chính thư viện này mỗi khi cần làm mới nguồn phát.
              </p>
            </div>
          </div>

          {randomSuggestion ? (
            <div className="rounded-3xl border border-white/10 bg-black/20 p-5">
              <div className="flex items-start gap-4">
                {getThumbnail(randomSuggestion) ? (
                  <img
                    src={getThumbnail(randomSuggestion) ?? ''}
                    alt={randomSuggestion.title}
                    className="h-28 w-28 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-28 w-28 items-center justify-center rounded-2xl bg-white/10">
                    <Disc3 className="h-10 w-10 text-white/60" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs uppercase tracking-[0.28em] text-orange-300">Gợi ý hôm nay</p>
                  <h3 className="mt-2 text-2xl font-bold text-white">{randomSuggestion.title}</h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">
                    {randomSuggestion.description}
                  </p>
                  <a
                    href={randomSuggestion.youtube_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-orange-300 transition-colors hover:text-orange-200"
                  >
                    <Link2 className="h-4 w-4" />
                    Mở trên YouTube
                  </a>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-dashed border-white/10 px-5 py-10 text-center text-white/55">
              Hãy thêm vài bài hát đầu tiên để trình nhạc có thể bốc ngẫu nhiên.
            </div>
          )}
        </TiltCard>

        <TiltCard className="bg-white/5">
          <div className="mb-4 flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <Disc3 className="h-6 w-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Tổng quan thư viện</h2>
              <p className="text-sm text-white/60">Mỗi link YouTube sẽ trở thành một lựa chọn phát ngẫu nhiên.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Tổng bài hát</p>
              <p className="mt-3 text-3xl font-bold text-white">{tracks.length}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Video đơn</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {tracks.filter((track) => track.source_kind === 'video').length}
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/45">Playlist</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {tracks.filter((track) => track.source_kind === 'playlist').length}
              </p>
            </div>
          </div>
        </TiltCard>
      </div>

      {isLoading ? (
        <TiltCard className="text-center text-white/60">Đang tải thư viện âm nhạc...</TiltCard>
      ) : null}

      {!isLoading && tracks.length ? (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {tracks.map((track, index) => (
            <motion.div
              key={track.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <TiltCard className="overflow-hidden p-0">
                <div className="flex h-full flex-col md:flex-row">
                  {getThumbnail(track) ? (
                    <img
                      src={getThumbnail(track) ?? ''}
                      alt={track.title}
                      className="h-56 w-full object-cover md:h-auto md:w-44"
                    />
                  ) : (
                    <div className="flex h-56 w-full items-center justify-center bg-white/5 md:h-auto md:w-44">
                      <Disc3 className="h-12 w-12 text-white/45" />
                    </div>
                  )}

                  <div className="flex flex-1 flex-col p-6">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-orange-300">
                          {track.source_kind === 'playlist' ? 'Playlist' : 'Bài hát'}
                        </p>
                        <h3 className="mt-2 text-2xl font-bold text-white">{track.title}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(track)}
                          className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:text-white"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(track)}
                          className="rounded-full bg-white/5 p-2 text-white/60 transition-colors hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>

                    <p className="flex-1 text-sm leading-6 text-white/70">{track.description}</p>

                    <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4">
                      <a
                        href={track.youtube_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-orange-300 transition-colors hover:text-orange-200"
                      >
                        <Link2 className="h-4 w-4" />
                        Xem trên YouTube
                      </a>
                      <span className="text-xs text-white/45">
                        {new Date(track.created_at).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      ) : null}

      {!isLoading && !tracks.length ? (
        <TiltCard className="text-center text-white/60">Chưa có bài hát nào trong thư viện.</TiltCard>
      ) : null}

      {isModalOpen ? (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm"
            onClick={closeModal}
          />
          <motion.div
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl md:left-1/2 md:top-1/2 md:w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                {editingTrack ? 'Chỉnh sửa bài hát' : 'Thêm bài hát mới'}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Tên bài hát hoặc playlist"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
              />
              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm((current) => ({ ...current, description: event.target.value }))
                }
                rows={4}
                placeholder="Mô tả ngắn, ví dụ: Bài hát hay nghe lúc lái xe về nhà hoặc playlist dịu nhẹ mỗi tối."
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
              />
              <input
                value={form.youtubeUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, youtubeUrl: event.target.value }))
                }
                placeholder="Dán link YouTube video hoặc playlist"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void handleSave()}
                disabled={isSaving}
                className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60"
              >
                {isSaving ? 'Đang lưu...' : editingTrack ? 'Lưu thay đổi' : 'Lưu vào thư viện'}
              </button>
            </div>
          </motion.div>
        </>
      ) : null}
    </div>
  );
}
