import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  Calendar,
  Heart,
  ImagePlus,
  Image as ImageIcon,
  MapPin,
  PencilLine,
  Plus,
  RefreshCcw,
  Upload,
  X,
} from 'lucide-react';
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [uploadLabel, setUploadLabel] = useState('Chưa chọn ảnh từ máy');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const featuredMemory = useMemo(() => memories[0] ?? null, [memories]);
  const timeline = useMemo(() => memories.slice(1), [memories]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMemory(null);
    setUploadLabel('Chưa chọn ảnh từ máy');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

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

  const openCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEdit = (memory: Memory) => {
    setEditingMemory(memory);
    setForm({
      title: memory.title,
      memoryDate: memory.memory_date,
      location: memory.location,
      imageUrl: memory.image_url,
      description: memory.description,
    });
    setUploadLabel('Đang dùng ảnh hiện tại');
    setIsModalOpen(true);
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        setForm((current) => ({ ...current, imageUrl: result }));
        setUploadLabel(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (
      !form.title.trim() ||
      !form.memoryDate ||
      !form.location.trim() ||
      !form.imageUrl.trim() ||
      !form.description.trim()
    ) {
      setError('Hãy điền đủ tiêu đề, ngày, địa điểm, ảnh và mô tả kỷ niệm.');
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
    };

    if (editingMemory) {
      const { data, error: updateError } = await supabase
        .from('memories')
        .update(payload)
        .eq('id', editingMemory.id)
        .select('id, title, memory_date, location, image_url, description, likes')
        .single();

      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setMemories((current) =>
          current
            .map((memory) => (memory.id === editingMemory.id ? (data as Memory) : memory))
            .sort(
              (a, b) =>
                new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime(),
            ),
        );
        closeModal();
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('memories')
        .insert({ ...payload, likes: 0 })
        .select('id, title, memory_date, location, image_url, description, likes')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setMemories((current) =>
          [...current, data as Memory].sort(
            (a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime(),
          ),
        );
        closeModal();
      }
    }

    setIsSaving(false);
  };

  const handleLike = async (memory: Memory) => {
    const nextLikes = memory.likes + 1;
    setMemories((current) =>
      current.map((item) => (item.id === memory.id ? { ...item, likes: nextLikes } : item)),
    );

    const { error: updateError } = await supabase
      .from('memories')
      .update({ likes: nextLikes })
      .eq('id', memory.id);

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
            Kỷ niệm của chúng ta
            <Heart className="h-8 w-8 animate-pulse fill-pink-500 text-pink-500" />
          </h1>
          <p className="text-lg text-white/60">
            Giờ bạn có thể sửa kỷ niệm, đổi ảnh, hoặc upload ảnh trực tiếp từ máy.
          </p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void loadMemories()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={openCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-medium text-white shadow-lg shadow-orange-500/30"
          >
            <Plus className="h-5 w-5" />
            Thêm kỷ niệm
          </motion.button>
        </div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <TiltCard className="text-center text-white/60">Đang tải kỷ niệm từ Supabase...</TiltCard>
      ) : null}

      {!isLoading && featuredMemory ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative h-64 w-full cursor-pointer overflow-hidden rounded-3xl md:h-96"
            onClick={() => setSelectedImage(featuredMemory.image_url)}
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <img
              src={featuredMemory.image_url}
              alt={featuredMemory.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                openEdit(featuredMemory);
              }}
              className="absolute right-6 top-6 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm font-medium text-white backdrop-blur-md"
            >
              <PencilLine className="h-4 w-4" />
              Chỉnh sửa
            </button>
            <div className="absolute left-6 top-6 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-4 py-2 backdrop-blur-md">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span className="text-sm font-semibold tracking-wide text-white">KỶ NIỆM NỔI BẬT</span>
            </div>
            <div className="absolute bottom-6 left-6 z-20 max-w-2xl md:bottom-10 md:left-10">
              <h2 className="mb-4 text-3xl font-bold text-white drop-shadow-lg md:text-5xl">
                {featuredMemory.title}
              </h2>
              <p className="line-clamp-2 text-lg text-white/80 md:text-xl">
                {featuredMemory.description}
              </p>
            </div>
          </motion.div>

          <div className="mt-12">
            <h3 className="mb-8 flex items-center gap-2 text-2xl font-bold">
              <ImageIcon className="h-6 w-6 text-orange-400" />
              Dòng thời gian
            </h3>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {timeline.map((memory, index) => (
                <motion.div
                  key={memory.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.08 * index }}
                >
                  <TiltCard className="flex h-[460px] flex-col overflow-hidden p-0">
                    <div
                      className="relative h-52 cursor-pointer overflow-hidden"
                      onClick={() => setSelectedImage(memory.image_url)}
                    >
                      <img
                        src={memory.image_url}
                        alt={memory.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-md">
                          Xem ảnh
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-6">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="text-xl font-bold text-white/90">{memory.title}</h4>
                        <button
                          type="button"
                          onClick={() => openEdit(memory)}
                          className="rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:text-white"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
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

                      <p className="flex-1 text-sm leading-6 text-white/70">{memory.description}</p>

                      <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-4">
                        <button
                          onClick={() => void handleLike(memory)}
                          className="flex items-center gap-2 text-sm font-medium text-pink-500 transition-colors hover:text-pink-400"
                        >
                          <Heart className="h-4 w-4 fill-current" />
                          {memory.likes}
                        </button>
                        <button
                          type="button"
                          onClick={() => openEdit(memory)}
                          className="text-sm font-medium text-white/60 transition-colors hover:text-white"
                        >
                          Đổi ảnh hoặc chỉnh nội dung
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

      {!isLoading && !memories.length ? (
        <TiltCard className="text-center text-white/60">Chưa có kỷ niệm nào trong Supabase.</TiltCard>
      ) : null}

      <AnimatePresence>
        {selectedImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm"
            onClick={() => setSelectedImage(null)}
          >
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={selectedImage}
              alt="Ảnh kỷ niệm"
              className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            />
            <button
              className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white/50 backdrop-blur-md transition-colors hover:text-white"
              onClick={() => setSelectedImage(null)}
            >
              Đóng
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
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
                  {editingMemory ? 'Chỉnh sửa kỷ niệm' : 'Thêm kỷ niệm mới'}
                </h2>
                <button
                  onClick={closeModal}
                  className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, title: event.target.value }))
                  }
                  placeholder="Tiêu đề kỷ niệm"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <input
                    type="date"
                    value={form.memoryDate}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, memoryDate: event.target.value }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-pink-400 focus:outline-none [color-scheme:dark]"
                  />
                  <input
                    value={form.location}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, location: event.target.value }))
                    }
                    placeholder="Địa điểm"
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">Ảnh kỷ niệm</p>
                      <p className="text-sm text-white/55">
                        Bạn có thể dán link ảnh hoặc upload trực tiếp từ máy.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10"
                    >
                      <Upload className="h-4 w-4" />
                      Chọn ảnh từ máy
                    </button>
                  </div>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  <p className="mt-3 text-sm text-white/45">{uploadLabel}</p>

                  <input
                    value={form.imageUrl}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, imageUrl: event.target.value }))
                    }
                    placeholder="Link ảnh công khai hoặc ảnh data URL"
                    className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none"
                  />

                  {form.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                      <img
                        src={form.imageUrl}
                        alt="Xem trước ảnh kỷ niệm"
                        className="h-56 w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="mt-4 flex h-40 items-center justify-center rounded-2xl border border-dashed border-white/10 text-white/35">
                      <div className="text-center">
                        <ImagePlus className="mx-auto h-8 w-8" />
                        <p className="mt-3 text-sm">Ảnh xem trước sẽ hiện tại đây</p>
                      </div>
                    </div>
                  )}
                </div>

                <textarea
                  value={form.description}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, description: event.target.value }))
                  }
                  placeholder="Mô tả khoảnh khắc"
                  rows={5}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none"
                />
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => void handleSubmit()}
                  disabled={isSaving}
                  className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60"
                >
                  {isSaving
                    ? 'Đang lưu...'
                    : editingMemory
                      ? 'Lưu thay đổi'
                      : 'Lưu kỷ niệm'}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
