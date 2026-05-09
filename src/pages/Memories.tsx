import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRight,
  Calendar,
  Download,
  Heart,
  ImagePlus,
  Image as ImageIcon,
  MapPin,
  PencilLine,
  Plus,
  RefreshCcw,
  Sparkles,
  Stars,
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

const MEMORIES_BUCKET = 'memories-images';
const MAX_IMAGE_EDGE = 1600;
const JPEG_UPLOAD_QUALITY = 0.82;
const MAX_INLINE_IMAGE_LENGTH = 3_500_000;

const emptyForm = {
  title: '',
  memoryDate: '',
  location: '',
  imageUrl: '',
  description: '',
};

const sanitizeFileName = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toLowerCase() || 'ky-niem';

const getTodayDate = () => new Date().toISOString().slice(0, 10);

const readBlobAsDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('Không thể đọc tệp ảnh.'));
    reader.readAsDataURL(blob);
  });

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Không thể xử lý ảnh này.'));
    image.src = src;
  });

const canvasToJpegBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Không thể nén ảnh.'));
        }
      },
      'image/jpeg',
      JPEG_UPLOAD_QUALITY,
    );
  });

const prepareImageForUpload = async (file: File) => {
  const originalDataUrl = await readBlobAsDataUrl(file);

  if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
    return {
      blob: file,
      contentType: file.type,
      extension: file.type === 'image/gif' ? 'gif' : 'svg',
      inlineDataUrl: originalDataUrl,
    };
  }

  try {
    const image = await loadImage(originalDataUrl);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('Trình duyệt không hỗ trợ xử lý ảnh.');
    }

    context.drawImage(image, 0, 0, width, height);
    const blob = await canvasToJpegBlob(canvas);

    return {
      blob,
      contentType: 'image/jpeg',
      extension: 'jpg',
      inlineDataUrl: await readBlobAsDataUrl(blob),
    };
  } catch {
    const fallbackExtension = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
    return {
      blob: file,
      contentType: file.type || 'image/jpeg',
      extension: fallbackExtension,
      inlineDataUrl: originalDataUrl,
    };
  }
};

const getUploadIssueMessage = (issue: unknown) => {
  const message = issue instanceof Error ? issue.message : String(issue || '');

  if (/load failed|failed to fetch|network/i.test(message)) {
    return 'không kết nối được Supabase Storage từ trình duyệt';
  }

  return message || 'không thể tải ảnh lên Supabase Storage';
};

const triggerBrowserDownload = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

export default function Memories() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploadNotice, setUploadNotice] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [uploadLabel, setUploadLabel] = useState('Chưa chọn ảnh từ máy');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const featuredMemory = useMemo(() => memories[0] ?? null, [memories]);
  const timeline = useMemo(() => memories.slice(1), [memories]);
  const totalLikes = useMemo(
    () => memories.reduce((sum, memory) => sum + Number(memory.likes || 0), 0),
    [memories],
  );

  const resetForm = () => {
    setForm(emptyForm);
    setEditingMemory(null);
    setUploadLabel('Chưa chọn ảnh từ máy');
    setUploadNotice(null);
    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn một tệp ảnh hợp lệ.');
      return;
    }

    setError(null);
    setUploadNotice(null);
    setUploadLabel(file.name);
    setIsUploadingImage(true);

    try {
      const uploadResult = await uploadMemoryImage(file);
      setForm((current) => ({ ...current, imageUrl: uploadResult.imageUrl }));
      setUploadLabel(`${file.name} - ${uploadResult.storedInSupabase ? 'đã tải lên' : 'đã chọn'}`);

      if (!uploadResult.storedInSupabase) {
        setUploadNotice(
          `Không tải được lên Supabase Storage (${uploadResult.issueMessage}). Ảnh đã được nén và vẫn có thể lưu trực tiếp.`,
        );
      }
    } catch (uploadIssue) {
      const message =
        uploadIssue instanceof Error ? uploadIssue.message : 'Không thể tải ảnh lên lúc này.';
      setError(`Tải ảnh thất bại: ${message}`);
      setUploadLabel(`${file.name} - tải lên thất bại`);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const uploadMemoryImage = async (file: File) => {
    const preparedImage = await prepareImageForUpload(file);
    const safeName = sanitizeFileName(file.name.replace(/\.[^.]+$/, ''));
    const uniqueId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const filePath = `${uniqueId}-${safeName}.${preparedImage.extension}`;

    try {
      const { error: uploadError } = await supabase.storage.from(MEMORIES_BUCKET).upload(filePath, preparedImage.blob, {
        cacheControl: '3600',
        upsert: false,
        contentType: preparedImage.contentType,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(filePath);
      return { imageUrl: data.publicUrl, storedInSupabase: true, issueMessage: null };
    } catch (uploadIssue) {
      if (preparedImage.inlineDataUrl.length <= MAX_INLINE_IMAGE_LENGTH) {
        return {
          imageUrl: preparedImage.inlineDataUrl,
          storedInSupabase: false,
          issueMessage: getUploadIssueMessage(uploadIssue),
        };
      }

      throw new Error(
        `${getUploadIssueMessage(uploadIssue)}. Ảnh sau khi nén vẫn quá lớn, hãy thử chọn ảnh nhỏ hơn.`,
      );
    }
  };

  const handleSubmit = async () => {
    if (!form.imageUrl.trim()) {
      setError('Hãy chọn hoặc dán ảnh kỷ niệm trước khi lưu.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      title: form.title.trim() || 'Kỷ niệm mới',
      memory_date: form.memoryDate || getTodayDate(),
      location: form.location.trim() || 'Chưa cập nhật địa điểm',
      image_url: form.imageUrl.trim(),
      description: form.description.trim() || 'Chưa thêm mô tả.',
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
            .sort((a, b) => new Date(b.memory_date).getTime() - new Date(a.memory_date).getTime()),
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
    setMemories((current) => current.map((item) => (item.id === memory.id ? { ...item, likes: nextLikes } : item)));

    const { error: updateError } = await supabase.from('memories').update({ likes: nextLikes }).eq('id', memory.id);

    if (updateError) {
      setMemories((current) => current.map((item) => (item.id === memory.id ? memory : item)));
      setError(updateError.message);
    }
  };

  const downloadMemoryImage = async (memory: Memory) => {
    setDownloadError(null);

    try {
      const filename = `${sanitizeFileName(memory.title)}.jpg`;

      if (memory.image_url.startsWith('data:')) {
        triggerBrowserDownload(memory.image_url, filename);
        return;
      }

      const imageUrl = new URL(memory.image_url, window.location.origin);
      const isSameOrigin = imageUrl.origin === window.location.origin;

      if (isSameOrigin) {
        const response = await fetch(memory.image_url);
        if (!response.ok) {
          throw new Error('Không thể tải ảnh từ nguồn hiện tại.');
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        triggerBrowserDownload(objectUrl, filename);
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
        return;
      }

      window.open(memory.image_url, '_blank', 'noopener,noreferrer');
      setDownloadError('Ảnh đang được mở ở tab mới để bạn tải về từ nguồn gốc.');
    } catch (downloadIssue) {
      const message =
        downloadIssue instanceof Error
          ? downloadIssue.message
          : 'Không thể tải ảnh về máy ngay lúc này.';
      setDownloadError(message);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[linear-gradient(145deg,rgba(255,248,241,0.12),rgba(255,248,241,0.03)),radial-gradient(circle_at_top_right,rgba(242,95,122,0.2),transparent_25%),radial-gradient(circle_at_bottom_left,rgba(244,154,98,0.16),transparent_24%),rgba(8,17,31,0.68)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8"
      >
        <div className="relative grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="app-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80">
              <Stars className="h-4 w-4 text-orange-300" />
              Memory Atlas
            </div>
            <h1 className="headline-serif mt-5 flex items-center gap-3 text-4xl font-semibold text-white sm:text-5xl">
              Kỷ niệm của chúng ta
              <Heart className="h-8 w-8 animate-pulse fill-pink-500 text-pink-500" />
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/65 sm:text-lg">
              Một thư viện cảm xúc nơi Cy chỉ cần chạm vào ảnh là có thể giữ lại khoảnh khắc,
              chỉnh sửa nhẹ nhàng, và quay lại đúng ký ức cần xem.
            </p>

            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Kho ảnh</p>
                <p className="mt-3 text-3xl font-semibold text-white">{memories.length}</p>
                <p className="mt-2 text-sm text-white/55">Kỷ niệm đã được lưu vào atlas.</p>
              </div>
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Yêu thích</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalLikes}</p>
                <p className="mt-2 text-sm text-white/55">Lượt tim tích lũy cho các khoảnh khắc.</p>
              </div>
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Điểm chạm</p>
                <p className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-white">
                  <Sparkles className="h-5 w-5 text-orange-200" />
                  Chọn ảnh là lưu được
                </p>
                <p className="mt-2 text-sm text-white/55">Ít bước hơn để Cy không bị tụt cảm xúc.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="app-chip rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Quick actions</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button onClick={() => void loadMemories()} className="flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-4 font-medium text-white/85 transition-colors hover:bg-white/10">
                  <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Làm mới thư viện
                </button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={openCreate} className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-4 py-4 font-medium text-white shadow-lg shadow-orange-500/25">
                  <Plus className="h-5 w-5" />
                  Thêm kỷ niệm
                </motion.button>
              </div>
            </div>

            <div className="app-chip rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Cy note</p>
              <p className="mt-3 text-xl font-semibold text-white">Mọi thứ đều xoay quanh ảnh.</p>
              <p className="mt-3 text-sm leading-7 text-white/60">
                Nếu bận, Cy có thể bỏ trống tiêu đề, ngày, mô tả. Chỉ cần ảnh là hệ thống sẽ tự đỡ phần còn lại.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80">
                Ưu tiên cảm xúc trước biểu mẫu
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}
      {uploadNotice ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
          {uploadNotice}
        </div>
      ) : null}
      {downloadError ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
          {downloadError}
        </div>
      ) : null}

      {isLoading ? <TiltCard className="text-center text-white/60">Đang tải thư viện kỷ niệm...</TiltCard> : null}

      {!isLoading && featuredMemory ? (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="relative h-72 w-full cursor-pointer overflow-hidden rounded-3xl md:h-96" onClick={() => setSelectedImage(featuredMemory.image_url)}>
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
            <img src={featuredMemory.image_url} alt={featuredMemory.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-105" />
            <button type="button" onClick={(event) => { event.stopPropagation(); openEdit(featuredMemory); }} className="absolute right-4 top-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-sm font-medium text-white backdrop-blur-md sm:right-6 sm:top-6 sm:px-4">
              <PencilLine className="h-4 w-4" />
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                void downloadMemoryImage(featuredMemory);
              }}
              className="absolute right-4 top-16 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/30 px-3 py-2 text-sm font-medium text-white backdrop-blur-md sm:right-6 sm:top-20 sm:px-4"
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Tải ảnh về máy</span>
            </button>
            <div className="absolute left-4 top-4 z-20 flex items-center gap-2 rounded-full border border-white/20 bg-white/20 px-3 py-2 backdrop-blur-md sm:left-6 sm:top-6 sm:px-4">
              <Calendar className="h-4 w-4 text-orange-400" />
              <span className="text-xs font-semibold tracking-wide text-white sm:text-sm">KỶ NIỆM NỔI BẬT</span>
            </div>
            <div className="absolute bottom-4 left-4 z-20 max-w-2xl sm:bottom-6 sm:left-6 md:bottom-10 md:left-10">
              <h2 className="mb-3 text-2xl font-bold text-white drop-shadow-lg sm:text-3xl md:mb-4 md:text-5xl">{featuredMemory.title}</h2>
              <p className="line-clamp-2 text-base text-white/80 md:text-xl">{featuredMemory.description}</p>
            </div>
          </motion.div>

          <div className="mt-12">
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/35">Timeline</p>
                <h3 className="mt-3 flex items-center gap-2 text-2xl font-bold">
                  <ImageIcon className="h-6 w-6 text-orange-400" />
                  Dòng thời gian
                </h3>
              </div>
              <div className="app-chip rounded-full px-4 py-2 text-sm text-white/70">
                Vuốt, xem, đổi ảnh, hoặc tải về ngay
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {timeline.map((memory, index) => (
                <motion.div key={memory.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 * index }}>
                  <TiltCard className="flex h-[460px] flex-col overflow-hidden p-0">
                    <div className="relative h-52 cursor-pointer overflow-hidden" onClick={() => setSelectedImage(memory.image_url)}>
                      <img src={memory.image_url} alt={memory.title} className="h-full w-full object-cover transition-transform duration-500 hover:scale-110" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity hover:opacity-100">
                        <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium backdrop-blur-md">Xem ảnh</span>
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-6">
                      <div className="mb-2 flex items-start justify-between gap-3">
                        <h4 className="text-xl font-bold text-white/90">{memory.title}</h4>
                        <button type="button" onClick={() => openEdit(memory)} className="rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:text-white">
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

                      <div className="mt-4 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <button onClick={() => void handleLike(memory)} className="flex items-center gap-2 text-sm font-medium text-pink-500 transition-colors hover:text-pink-400">
                          <Heart className="h-4 w-4 fill-current" />
                          {memory.likes}
                        </button>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => void downloadMemoryImage(memory)}
                            className="inline-flex items-center gap-2 text-sm font-medium text-white/60 transition-colors hover:text-white"
                          >
                            <Download className="h-4 w-4" />
                            Tải ảnh
                          </button>
                          <button type="button" onClick={() => openEdit(memory)} className="text-sm font-medium text-white/60 transition-colors hover:text-white">
                            Đổi ảnh hoặc chỉnh nội dung
                          </button>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </>
      ) : null}

      {!isLoading && !memories.length ? <TiltCard className="text-center text-white/60">Chưa có kỷ niệm nào được lưu.</TiltCard> : null}

      <AnimatePresence>
        {selectedImage ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm" onClick={() => setSelectedImage(null)}>
            <motion.img initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} src={selectedImage} alt="Ảnh kỷ niệm" className="max-h-[90vh] max-w-full rounded-xl object-contain shadow-2xl" onClick={(event) => event.stopPropagation()} />
            {memories.find((memory) => memory.image_url === selectedImage) ? (
              <button
                type="button"
                className="absolute bottom-6 rounded-full bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur-md transition-colors hover:bg-white/15"
                onClick={(event) => {
                  event.stopPropagation();
                  const matchedMemory = memories.find((memory) => memory.image_url === selectedImage);
                  if (matchedMemory) {
                    void downloadMemoryImage(matchedMemory);
                  }
                }}
              >
                Tải ảnh này về máy
              </button>
            ) : null}
            <button className="absolute right-6 top-6 rounded-full bg-white/10 p-2 text-white/50 backdrop-blur-md transition-colors hover:text-white" onClick={(event) => { event.stopPropagation(); setSelectedImage(null); }}>
              Đóng
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {isModalOpen ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={closeModal} />
            <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} className="fixed bottom-0 left-0 right-0 z-[101] flex max-h-[90vh] flex-col rounded-t-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,248,241,0.08),rgba(255,248,241,0.03)),rgba(9,18,31,0.96)] shadow-2xl md:left-1/2 md:top-1/2 md:w-[720px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-4 sm:px-6">
                <h2 className="text-2xl font-bold text-white">{editingMemory ? 'Chỉnh sửa kỷ niệm' : 'Thêm kỷ niệm mới'}</h2>
                <button onClick={closeModal} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                {error ? (
                  <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
                    {error}
                  </div>
                ) : null}
                {uploadNotice ? (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
                    {uploadNotice}
                  </div>
                ) : null}

                <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Tiêu đề kỷ niệm" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />

                <div className="grid gap-4 md:grid-cols-2">
                  <input type="date" value={form.memoryDate} onChange={(event) => setForm((current) => ({ ...current, memoryDate: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-pink-400 focus:outline-none [color-scheme:dark]" />
                  <input value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Địa điểm" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />
                </div>

                <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-white">Ảnh kỷ niệm</p>
                      <p className="text-sm text-white/55">Bạn có thể dán liên kết ảnh hoặc tải trực tiếp từ máy.</p>
                    </div>
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:bg-white/10">
                      <Upload className="h-4 w-4" />
                      Chọn ảnh từ máy
                    </button>
                  </div>

                  <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

                  <p className="mt-3 text-sm text-white/45">{uploadLabel}</p>
                  {isUploadingImage ? <p className="mt-2 text-sm text-orange-200">Đang tải ảnh lên Supabase...</p> : null}

                  <input
                    value={form.imageUrl}
                    onChange={(event) => {
                      setForm((current) => ({ ...current, imageUrl: event.target.value }));
                    }}
                    placeholder="Liên kết ảnh công khai"
                    className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none"
                  />

                  {form.imageUrl ? (
                    <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                      <img src={form.imageUrl} alt="Xem trước ảnh kỷ niệm" className="h-56 w-full object-cover" />
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

                <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Mô tả khoảnh khắc" rows={5} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-400 focus:outline-none" />
              </div>

              <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-white/10 bg-[rgba(9,18,31,0.92)] px-4 py-4 backdrop-blur sm:px-6">
                <p className="text-sm text-white/55">Chỉ cần có ảnh là có thể lưu ngay.</p>
                <button onClick={() => void handleSubmit()} disabled={isSaving || isUploadingImage} className="rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60">
                  {isSaving ? 'Đang lưu...' : editingMemory ? 'Lưu thay đổi' : 'Lưu kỷ niệm'}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
