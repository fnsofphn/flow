import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Archive, ArrowRight, Heart, Loader2, Lock, Mail, Send, Sparkles, Stars } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

interface Note {
  id: string;
  content: string;
  emotion: string;
  unlock_date: string;
  is_opened: boolean;
  created_at: string;
}

type DraftState = {
  compose?: boolean;
  draft?: {
    content?: string;
    emotion?: string;
    unlockDays?: number;
  };
};

const isNoteReady = (note: Pick<Note, 'unlock_date'>) =>
  new Date(note.unlock_date) <= new Date();

export default function EmotionalMemory() {
  const location = useLocation();
  const navigate = useNavigate();
  const routeState = (location.state ?? {}) as DraftState;

  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWriting, setIsWriting] = useState(Boolean(routeState.compose));
  const [isSaving, setIsSaving] = useState(false);
  const [newContent, setNewContent] = useState(routeState.draft?.content ?? '');
  const [newEmotion, setNewEmotion] = useState(routeState.draft?.emotion ?? 'Yêu thương');
  const [unlockDays, setUnlockDays] = useState(routeState.draft?.unlockDays ?? 3);
  const [openedNote, setOpenedNote] = useState<Note | null>(null);
  const [flyingNoteId, setFlyingNoteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadNotes = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('emotional_notes')
      .select('id, content, emotion, unlock_date, is_opened, created_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      setNotes([]);
      setError(queryError.message);
    } else {
      setNotes((data as Note[]) ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadNotes();
  }, []);

  useEffect(() => {
    if (routeState.compose) {
      setIsWriting(true);
      setNewContent(routeState.draft?.content ?? '');
      setNewEmotion(routeState.draft?.emotion ?? 'Yêu thương');
      setUnlockDays(routeState.draft?.unlockDays ?? 3);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, navigate, routeState.compose, routeState.draft]);

  const readyCount = useMemo(
    () => notes.filter((note) => isNoteReady(note) || note.is_opened).length,
    [notes],
  );
  const lockedCount = notes.length - readyCount;

  const nextUnlock = useMemo(() => {
    const lockedNotes = notes
      .filter((note) => !isNoteReady(note))
      .sort((a, b) => new Date(a.unlock_date).getTime() - new Date(b.unlock_date).getTime());
    return lockedNotes[0] ?? null;
  }, [notes]);

  const handleSave = async () => {
    if (!newContent.trim()) return;

    setIsSaving(true);
    setError(null);

    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + unlockDays);

    const pendingId = `pending-${Date.now()}`;
    setFlyingNoteId(pendingId);

    const payload = {
      content: newContent.trim(),
      emotion: newEmotion,
      unlock_date: unlockDate.toISOString(),
      is_opened: false,
    };

    const { data, error: insertError } = await supabase
      .from('emotional_notes')
      .insert(payload)
      .select('id, content, emotion, unlock_date, is_opened, created_at')
      .single();

    window.setTimeout(() => setFlyingNoteId(null), 700);

    if (insertError) {
      setError(insertError.message);
      setIsSaving(false);
      return;
    }

    if (data) {
      setNotes((currentNotes) => [data as Note, ...currentNotes]);
    }

    setIsSaving(false);
    setIsWriting(false);
    setNewContent('');
    setNewEmotion('Yêu thương');
    setUnlockDays(3);
  };

  const handleOpenNote = async (note: Note) => {
    if (!isNoteReady(note)) return;

    const revealedNote = { ...note, is_opened: true };
    setOpenedNote(revealedNote);
    setNotes((currentNotes) =>
      currentNotes.map((currentNote) =>
        currentNote.id === note.id ? revealedNote : currentNote,
      ),
    );

    if (!note.is_opened) {
      const { error: updateError } = await supabase
        .from('emotional_notes')
        .update({ is_opened: true })
        .eq('id', note.id);

      if (updateError) {
        setError(updateError.message);
      }
    }
  };

  return (
    <div className="relative space-y-8 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,248,241,0.12),rgba(255,248,241,0.03)),radial-gradient(circle_at_top_right,rgba(242,95,122,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.16),transparent_28%),rgba(8,17,31,0.7)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
      >
        <div className="relative grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div>
            <div className="app-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80">
              <Stars className="h-4 w-4 text-rose-300" />
              Capsule Vault
            </div>
            <h1 className="headline-serif mt-5 flex items-center gap-3 text-4xl font-semibold text-white sm:text-5xl">
              Hũ bí ẩn tâm thư
              <Mail className="h-8 w-8 text-rose-400" />
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              Một nơi để cất lời yêu thương, bất ngờ, biết ơn hay xin lỗi, rồi để hệ thống
              giữ kín cho đến đúng khoảnh khắc mà trái tim nên mở ra.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Đang giữ</p>
                <p className="mt-3 text-3xl font-semibold text-white">{notes.length}</p>
                <p className="mt-2 text-sm text-white/55">Lá thư đang ở trong hũ.</p>
              </div>
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Có thể mở</p>
                <p className="mt-3 text-3xl font-semibold text-white">{readyCount}</p>
                <p className="mt-2 text-sm text-white/55">Những lời đã đến đúng thời điểm.</p>
              </div>
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Đang niêm phong</p>
                <p className="mt-3 text-3xl font-semibold text-white">{lockedCount}</p>
                <p className="mt-2 text-sm text-white/55">Những điều đẹp vẫn đang được bảo vệ.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="app-chip rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Write flow</p>
              <p className="mt-3 text-2xl font-semibold text-white">Viết rồi thả vào hũ.</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Chỉ vài bước để niêm phong một lá thư mới. Mọi thứ được giữ nguyên cảm xúc và
                mở ra đúng ngày Cy muốn.
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsWriting(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 px-5 py-3 font-medium text-white shadow-lg shadow-rose-500/25"
              >
                <Send className="h-4 w-4" />
                Viết thư mới
              </motion.button>
            </div>

            <div className="app-chip rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Vault note</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Lá thư gần nhất sẽ mở vào{' '}
                <span className="font-semibold text-white/85">
                  {nextUnlock ? new Date(nextUnlock.unlock_date).toLocaleString('vi-VN') : 'chưa có lịch mở mới'}
                </span>
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                Dịu dàng, kín đáo, đúng thời điểm
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
        <TiltCard className="overflow-hidden bg-gradient-to-br from-slate-900/80 via-slate-800/60 to-rose-900/40">
          <div className="relative min-h-[360px]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.12),_transparent_55%)]" />
            <div className="relative flex h-full flex-col items-center justify-center px-6 py-8 text-center">
              <div className="mb-6 flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                <Archive className="h-4 w-4 text-cyan-300" />
                {notes.length} tâm thư đang được giữ trong hũ
              </div>

              <div className="relative">
                <div className="mx-auto h-64 w-48 rounded-[40px] border border-cyan-200/20 bg-gradient-to-b from-cyan-100/20 via-white/10 to-transparent shadow-[0_0_80px_rgba(255,255,255,0.08)] backdrop-blur-md">
                  <div className="mx-auto mt-4 h-6 w-20 rounded-full bg-cyan-100/30" />
                  <div className="relative mx-auto mt-5 h-[185px] w-[150px] overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
                    {[...notes].slice(0, 6).map((note, index) => (
                      <motion.div
                        key={note.id}
                        initial={{ opacity: 0, y: 20, rotate: -6 }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          rotate: index % 2 === 0 ? -8 : 8,
                        }}
                        transition={{ delay: index * 0.05 }}
                        className="absolute left-1/2 top-1/2 flex h-10 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-xl border border-rose-200/20 bg-rose-100/10 text-xs text-white/60"
                        style={{
                          marginLeft: `${(index % 3) * 12 - 12}px`,
                          marginTop: `${index * 10 - 20}px`,
                        }}
                      >
                        <Mail className="h-4 w-4" />
                      </motion.div>
                    ))}
                  </div>
                </div>

                <AnimatePresence>
                  {flyingNoteId ? (
                    <motion.div
                      initial={{ x: 260, y: -120, opacity: 0, scale: 0.7, rotate: 10 }}
                      animate={{ x: 0, y: 20, opacity: 1, scale: 1, rotate: -8 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: 'easeInOut' }}
                      className="absolute right-[-40px] top-[-30px] flex h-14 w-24 items-center justify-center rounded-2xl border border-rose-200/30 bg-rose-200/15 text-rose-100 shadow-lg"
                    >
                      <Mail className="h-6 w-6" />
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="mt-8 grid w-full gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/40">Có thể mở</p>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">{readyCount}</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-left">
                  <p className="text-sm uppercase tracking-[0.22em] text-white/40">Đang niêm phong</p>
                  <p className="mt-2 text-3xl font-bold text-cyan-200">{lockedCount}</p>
                </div>
              </div>

              {nextUnlock ? (
                <p className="mt-6 text-sm text-white/55">
                  Lá thư gần nhất sẽ mở vào{' '}
                  <span className="font-semibold text-white/80">
                    {new Date(nextUnlock.unlock_date).toLocaleString('vi-VN')}
                  </span>
                </p>
              ) : (
                <p className="mt-6 text-sm text-white/55">Hiện không còn thư nào đang chờ mở.</p>
              )}
            </div>
          </div>
        </TiltCard>

        <div className="space-y-4">
          {isLoading ? (
            <TiltCard className="bg-white/5 text-center text-white/60">
              Đang tải những lá thư đã lưu...
            </TiltCard>
          ) : null}

          {!isLoading && !notes.length ? (
            <TiltCard className="bg-white/5 text-center text-white/60">
              Chưa có tâm thư nào trong hũ. Hãy tạo lá thư đầu tiên.
            </TiltCard>
          ) : null}

          {notes.map((note, index) => {
            const isReady = isNoteReady(note);
            const isOpened = note.is_opened;

            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
              >
                <TiltCard className="bg-white/5">
                  <button
                    type="button"
                    onClick={() => void handleOpenNote(note)}
                    className="flex w-full items-start justify-between gap-4 text-left"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`rounded-2xl p-3 ${isReady ? 'bg-rose-500/15' : 'bg-white/5'}`}>
                        {isReady ? (
                          <Sparkles className="h-5 w-5 text-rose-300" />
                        ) : (
                          <Lock className="h-5 w-5 text-white/40" />
                        )}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{note.emotion}</p>
                          <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/45">
                            {isOpened ? 'Đã mở' : isReady ? 'Đến giờ mở' : 'Đang niêm phong'}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-white/55">
                          {isReady ? 'Chạm để mở thư.' : `Mở vào ${new Date(note.unlock_date).toLocaleString('vi-VN')}`}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-white/70">
                          {isOpened ? note.content : 'Nội dung đang được giữ kín cho đến đúng thời điểm mở.'}
                        </p>
                      </div>
                    </div>

                    {isSaving && flyingNoteId ? (
                      <Loader2 className="mt-1 h-5 w-5 shrink-0 animate-spin text-white/35" />
                    ) : (
                      <Mail className="mt-1 h-5 w-5 shrink-0 text-white/35" />
                    )}
                  </button>
                </TiltCard>
              </motion.div>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {isWriting ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsWriting(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="fixed left-1/2 top-1/2 z-[101] flex max-h-[90vh] w-full max-w-xl -translate-x-1/2 -translate-y-1/2 flex-col rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,248,241,0.08),rgba(255,248,241,0.03)),rgba(9,18,31,0.96)] shadow-2xl">
              <div className="border-b border-white/10 px-8 py-6">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <Heart className="h-6 w-6 text-rose-500" />
                Niêm phong lá thư mới
              </h2>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto px-8 py-6">
                <textarea value={newContent} onChange={(event) => setNewContent(event.target.value)} placeholder="Viết điều bạn muốn cất trong hũ bí ẩn..." rows={6} className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-white placeholder:text-white/30 focus:border-rose-500 focus:outline-none" />

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm text-white/60">Sắc thái lá thư</label>
                    <select value={newEmotion} onChange={(event) => setNewEmotion(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none">
                      <option value="Yêu thương">Yêu thương</option>
                      <option value="Biết ơn">Biết ơn</option>
                      <option value="Xin lỗi">Xin lỗi</option>
                      <option value="Bất ngờ">Bất ngờ</option>
                      <option value="Nhớ thương">Nhớ thương</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-white/60">Mở sau (ngày)</label>
                    <input type="number" min="1" value={unlockDays} onChange={(event) => setUnlockDays(parseInt(event.target.value, 10) || 1)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-500 focus:outline-none" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between gap-4 border-t border-white/10 bg-[rgba(9,18,31,0.92)] px-8 py-5 backdrop-blur">
                <p className="text-sm text-white/55">Lá thư sẽ được giữ kín cho đến ngày mở.</p>
                <button type="button" onClick={() => void handleSave()} disabled={isSaving} className="rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-4 font-semibold text-white shadow-lg shadow-rose-500/30 disabled:opacity-60">
                  {isSaving ? 'Đang niêm phong...' : 'Niêm phong và thả thư vào hũ'}
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
            <motion.div initial={{ opacity: 0, scale: 0.8, rotateY: 90 }} animate={{ opacity: 1, scale: 1, rotateY: 0 }} exit={{ opacity: 0, scale: 0.8, rotateY: -90 }} transition={{ type: 'spring', damping: 20, stiffness: 100 }} className="fixed left-1/2 top-1/2 z-[101] w-full max-w-md -translate-x-1/2 -translate-y-1/2">
              <div className="relative rounded-sm bg-[#fdfbf7] p-8 text-[#3a2a22] shadow-2xl" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                <div className="absolute left-0 top-0 h-2 w-full bg-gradient-to-r from-rose-400 to-pink-400" />
                <div className="mb-6 flex items-center justify-between border-b border-[#3a2a22]/10 pb-4">
                  <span className="font-serif italic text-rose-600">{openedNote.emotion}</span>
                  <span className="text-sm opacity-60">{new Date(openedNote.unlock_date).toLocaleDateString('vi-VN')}</span>
                </div>
                <p className="whitespace-pre-wrap font-serif text-lg leading-relaxed">{openedNote.content}</p>
                <div className="mt-8 text-right">
                  <span className="font-serif italic opacity-60">NamCy</span>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
