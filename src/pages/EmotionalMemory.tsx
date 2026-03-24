import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Clock3, Heart, Mail, Send, Trash2, Unlock } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type Note = {
  id: string;
  content: string;
  emotion: string;
  unlock_date: string;
  is_opened: boolean;
  created_at: string;
};

export default function EmotionalMemory() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newEmotion, setNewEmotion] = useState('Hạnh phúc');
  const [unlockDays, setUnlockDays] = useState(1);
  const [openedNote, setOpenedNote] = useState<Note | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sortedNotes = useMemo(
    () => [...notes].sort((a, b) => new Date(b.unlock_date).getTime() - new Date(a.unlock_date).getTime()),
    [notes],
  );

  const loadNotes = async () => {
    const { data, error: queryError } = await supabase
      .from('emotional_notes')
      .select('id, content, emotion, unlock_date, is_opened, created_at')
      .order('unlock_date', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      return;
    }

    setNotes((data as Note[]) ?? []);
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  const handleSave = async () => {
    if (!newContent.trim()) {
      return;
    }

    setError(null);

    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + unlockDays);

    const { data, error: insertError } = await supabase
      .from('emotional_notes')
      .insert({
        content: newContent.trim(),
        emotion: newEmotion,
        unlock_date: unlockDate.toISOString(),
      })
      .select('id, content, emotion, unlock_date, is_opened, created_at')
      .single();

    if (insertError) {
      setError(insertError.message);
      return;
    }

    if (data) {
      setNotes((current) => [data as Note, ...current]);
    }

    setIsWriting(false);
    setNewContent('');
    setUnlockDays(1);
    setNewEmotion('Hạnh phúc');
  };

  const handleOpenNote = async (note: Note) => {
    const isReady = new Date(note.unlock_date) <= new Date();
    if (!isReady) {
      return;
    }

    setOpenedNote(note);
    if (note.is_opened) {
      return;
    }

    const { error: updateError } = await supabase
      .from('emotional_notes')
      .update({ is_opened: true })
      .eq('id', note.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setNotes((current) => current.map((item) => (item.id === note.id ? { ...item, is_opened: true } : item)));
  };

  const handleDelete = async (id: string) => {
    const previous = notes;
    setNotes((current) => current.filter((note) => note.id !== id));

    const { error: deleteError } = await supabase.from('emotional_notes').delete().eq('id', id);

    if (deleteError) {
      setNotes(previous);
      setError(deleteError.message);
    }
  };

  return (
    <div className="relative space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Hộp tâm tư
            <Mail className="h-8 w-8 text-rose-400" />
          </h1>
          <p className="text-lg text-white/60">Lưu những điều muốn gửi gắm và mở ra đúng thời điểm bạn chọn.</p>
        </motion.div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsWriting(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg shadow-rose-500/30"
        >
          <Send className="h-5 w-5" />
          Viết thư mới
        </motion.button>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {!sortedNotes.length ? (
        <TiltCard className="space-y-3 text-center">
          <Mail className="mx-auto h-14 w-14 text-white/25" />
          <h2 className="text-2xl font-semibold text-white/85">Chưa có thư nào được lưu</h2>
          <p className="text-white/55">Bạn có thể bắt đầu bằng cách tự nhập dữ liệu thật cho những lời nhắn muốn lưu giữ.</p>
        </TiltCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {sortedNotes.map((note) => {
              const isReady = new Date(note.unlock_date) <= new Date();

              return (
                <motion.div key={note.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} layout>
                  <TiltCard glow={isReady && !note.is_opened} className={`transition-all duration-500 ${!isReady ? 'opacity-70 grayscale-[20%]' : ''}`}>
                    <div className="flex min-h-[220px] flex-col justify-between gap-5">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-rose-200">{note.emotion}</span>
                          <button
                            onClick={() => void handleDelete(note.id)}
                            className="rounded-lg border border-white/10 bg-white/5 p-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        <p className="line-clamp-4 text-white/80">{note.content}</p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-white/50">
                          <Clock3 className="h-4 w-4" />
                          {new Date(note.unlock_date).toLocaleString('vi-VN')}
                        </div>

                        <button
                          onClick={() => void handleOpenNote(note)}
                          disabled={!isReady}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Unlock className="h-4 w-4" />
                          {isReady ? (note.is_opened ? 'Xem lại thư' : 'Mở thư') : 'Chưa đến thời điểm mở'}
                        </button>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {isWriting ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsWriting(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              className="fixed left-1/2 top-1/2 z-[101] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-gray-900 p-8 shadow-2xl"
            >
              <h2 className="mb-6 flex items-center gap-2 text-2xl font-bold">
                <Heart className="h-6 w-6 text-rose-500" />
                Gửi gắm tâm tư
              </h2>

              <div className="space-y-4">
                <textarea
                  value={newContent}
                  onChange={(event) => setNewContent(event.target.value)}
                  placeholder="Bạn muốn giữ lại điều gì cho tương lai?"
                  className="h-32 w-full resize-none rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-white/30 focus:border-rose-500 focus:outline-none"
                />

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="mb-2 block text-sm text-white/60">Cảm xúc</label>
                    <select
                      value={newEmotion}
                      onChange={(event) => setNewEmotion(event.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                    >
                      <option value="Hạnh phúc">Hạnh phúc</option>
                      <option value="Biết ơn">Biết ơn</option>
                      <option value="Nhớ nhung">Nhớ nhung</option>
                      <option value="Xin lỗi">Xin lỗi</option>
                      <option value="Hy vọng">Hy vọng</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="mb-2 block text-sm text-white/60">Mở sau (ngày)</label>
                    <input
                      type="number"
                      min="1"
                      value={unlockDays}
                      onChange={(event) => setUnlockDays(parseInt(event.target.value, 10) || 1)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  onClick={() => void handleSave()}
                  className="mt-6 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 py-4 font-bold text-white shadow-lg shadow-rose-500/30 transition-transform hover:scale-[1.02]"
                >
                  Lưu thư
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {openedNote ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md" onClick={() => setOpenedNote(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.88, rotateY: 90 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 0.88, rotateY: -90 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }} className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2">
              <div className="rounded-sm bg-[#fdfbf7] p-8 text-[#3a2a22] shadow-2xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                <div className="mb-6 flex items-center justify-between border-b border-[#3a2a22]/10 pb-4">
                  <span className="font-serif italic text-rose-600">{openedNote.emotion}</span>
                  <span className="font-mono text-sm opacity-60">{new Date(openedNote.unlock_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed">{openedNote.content}</p>
                <div className="mt-8 text-right font-serif italic opacity-60">NamCy</div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
