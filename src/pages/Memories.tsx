import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, Heart, Image as ImageIcon, MapPin, PencilLine, Plus, RefreshCcw, X } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type Memory = {
  id: string;
  title: string;
  memory_date: string;
  location: string;
  image_url: string;
  description: string;
  likes: number;
};

const emptyForm = {
  title: '',
  memoryDate: '',
  location: '',
  imageUrl: '',
  description: '',
};

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const featuredMemory = useMemo(() => memories[0] ?? null, [memories]);
  const timeline = useMemo(() => memories.slice(1), [memories]);

  const loadMemories = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('memories')
      .select('id, title, memory_date, location, image_url, description, likes')
      .order('memory_date', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      setMemories([]);
    } else {
      setMemories((data as Memory[]) ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadMemories();
  }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.memoryDate || !form.location.trim() || !form.imageUrl.trim() || !form.description.trim()) {
      setError('Hay dien day du thong tin ky niem.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim(),
      memory_date: form.memoryDate,
      location: form.location.trim(),
      image_url: form.imageUrl.trim(),
      description: form.description.trim(),
      likes: 0,
    };

    const { data, error: insertError } = await supabase
      .from('memories')
      .insert(payload)
      .select('id, title, memory_date, location, image_url, description, likes')
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setMemories((current) =>
        [...current, data as Memory].sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime()),
      );
      setForm(emptyForm);
      setIsCreating(false);
    }

    setIsSaving(false);
  };

  const handleLike = async (memory: Memory) => {
    const nextLikes = memory.likes + 1;
    setMemories((current) => current.map((item) => (item.id === memory.id ? { ...item, likes: nextLikes } : item)));

    const { error: updateError } = await supabase.from('memories').update({ likes: nextLikes }).eq('id', memory.id);

    if (updateError) {
      setMemories((current) => current.map((item) => (item.id === memory.id ? memory : item)));
      setError(updateError.message);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Ky niem cua chung ta
            <Heart className="h-8 w-8 animate-pulse fill-pink-500 text-pink-500" />
          </h1>
          <p className="text-lg text-white/60">Album nay dang doc va ghi du lieu truc tiep tu Supabase.</p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => void loadMemories()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tai lai
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIsCreating(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg shadow-orange-500/30">
            <Plus className="h-5 w-5" />
            Them ky niem
          </motion.button>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {isLoading ? <TiltCard className="text-center text-white/60">Dang tai ky niem tu Supabase...</TiltCard> : null}

      {!isLoading && featuredMemory ? (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative h-64 w-full cursor-pointer overflow-hidden rounded-3xl md:h-96" onClick={() => setSelectedImage(featuredMemory.image_url)}>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <img src={featuredMemory.image_url} alt={featuredMemory.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-105" />
            <div className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-2 backdrop-blur-md">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold tracking-wide text-white">KY NIEM NOI BAT</span>
            </div>
            <div className="absolute bottom-6 left-6 z-20 max-w-2xl md:bottom-10 md:left-10">
              <h2 className="mb-4 text-3xl font-bold text-white drop-shadow-lg md:text-5xl">{featuredMemory.title}</h2>
              <p className="line-clamp-2 text-lg text-white/80 md:text-xl">{featuredMemory.description}</p>
            </div>
          </motion.div>

          <div className="mt-12">
            <h3 className="mb-8 flex items-center gap-2 text-2xl font-bold">
              <ImageIcon className="h-6 w-6 text-orange-400" />
              Dong thoi gian
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {timeline.map((memory, index) => (
                <motion.div key={memory.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index }}>
                  <TiltCard className="flex h-[420px] flex-col overflow-hidden p-0">
                    <div className="relative h-48 cursor-pointer overflow-hidden" onClick={() => setSelectedImage(memory.image_url)}>
                      <img src={memory.image_url} alt={memory.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-md">Xem anh</span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="text-xl font-bold text-white/90">{memory.title}</h4>
                        <PencilLine className="h-4 w-4 text-white/30" />
                      </div>

                      <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-white/50">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(memory.memory_date).toLocaleDateString('vi-VN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {memory.location}
                        </span>
                      </div>

                      <p className="flex-1 text-sm text-white/70">{memory.description}</p>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <button onClick={() => void handleLike(memory)} className="flex items-center gap-2 text-sm font-medium text-pink-500 transition-colors hover:text-pink-400">
                          <Heart className="h-4 w-4 fill-current" />
                          {memory.likes}
                        </button>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!isLoading && !memories.length ? <TiltCard className="text-center text-white/60">Chua co ky niem nao trong Supabase.</TiltCard> : null}

      <AnimatePresence>
        {selectedImage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={selectedImage} alt="Enlarged" className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" onClick={(e) => e.stopPropagation()} />
            <button className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white/50 backdrop-blur-md transition-colors hover:text-white" onClick={() => setSelectedImage(null)}>
              Dong
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isCreating ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
            <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl md:left-1/2 md:top-1/2 md:w-[680px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Them ky niem moi</h2>
                <button onClick={() => setIsCreating(false)} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input value={form.title} onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))} placeholder="Tieu de ky niem" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="date" value={form.memoryDate} onChange={(e) => setForm((current) => ({ ...current, memoryDate: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-pink-400 focus:outline-none [color-scheme:dark]" />
                  <input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} placeholder="Dia diem" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />
                </div>
                <input value={form.imageUrl} onChange={(e) => setForm((current) => ({ ...current, imageUrl: e.target.value }))} placeholder="Link anh cong khai" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />
                <textarea value={form.description} onChange={(e) => setForm((current) => ({ ...current, description: e.target.value }))} placeholder="Mo ta khoanh khac" rows={5} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => void handleCreate()} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60">
                  {isSaving ? 'Dang luu...' : 'Luu vao Supabase'}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
