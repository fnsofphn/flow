import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRight,
  CalendarHeart,
  CheckCircle2,
  Clock3,
  Heart,
  Image as ImageIcon,
  Mail,
  Sparkles,
  Stars,
  Target,
  Wallet,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type FeaturedMemory = {
  id: string;
  title: string;
  image_url: string;
  description: string;
};

type DashboardPulse = {
  memoryCount: number;
  openTodoCount: number;
};

const quickDestinations = [
  {
    title: 'Album kỷ niệm',
    description: 'Mở ngay thư viện ảnh và các khoảnh khắc đã lưu.',
    icon: ImageIcon,
    path: '/memories',
    accent: 'from-orange-500/20 to-pink-500/20',
  },
  {
    title: 'Việc cần làm',
    description: 'Đi tới danh sách to-do để theo dõi và xử lý nhanh.',
    icon: CheckCircle2,
    path: '/todo',
    accent: 'from-sky-500/20 to-cyan-500/20',
  },
  {
    title: 'Mục tiêu 2026',
    description: 'Xem dashboard kế hoạch năm: sức khoẻ, gắn kết, tài chính và phát triển.',
    icon: Target,
    path: '/goals-2026',
    accent: 'from-violet-500/20 to-sky-500/20',
  },
  {
    title: 'Tài chính chung',
    description: 'Quản lý đóng quỹ, trừ quỹ và dòng tiền trong một nơi.',
    icon: Wallet,
    path: '/finance',
    accent: 'from-emerald-500/20 to-lime-500/20',
  },
  {
    title: 'Kế hoạch hẹn hò',
    description: 'Xem lịch hẹn và các hoạt động đã lên kế hoạch.',
    icon: CalendarHeart,
    path: '/date-planner',
    accent: 'from-rose-500/20 to-fuchsia-500/20',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [quickLetter, setQuickLetter] = useState('');
  const [quickEmotion, setQuickEmotion] = useState('Yêu thương');
  const [unlockDays, setUnlockDays] = useState(3);
  const [featuredMemory, setFeaturedMemory] = useState<FeaturedMemory | null>(null);
  const [pulse, setPulse] = useState<DashboardPulse>({ memoryCount: 0, openTodoCount: 0 });

  useEffect(() => {
    const loadDashboardData = async () => {
      const [{ data: memory }, { count: memoryCount }, { count: openTodoCount }] = await Promise.all([
        supabase
          .from('memories')
          .select('id, title, image_url, description')
          .order('memory_date', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase.from('memories').select('id', { count: 'exact', head: true }),
        supabase.from('todos').select('id', { count: 'exact', head: true }).eq('done', false),
      ]);

      setFeaturedMemory((memory as FeaturedMemory | null) ?? null);
      setPulse({
        memoryCount: memoryCount ?? 0,
        openTodoCount: openTodoCount ?? 0,
      });
    };

    void loadDashboardData();
  }, []);

  const handleQuickLetter = () => {
    navigate('/emotional-memory', {
      state: {
        compose: true,
        draft: {
          content: quickLetter,
          emotion: quickEmotion,
          unlockDays,
        },
      },
    });
  };

  return (
    <div className="space-y-8 pb-24">
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,248,241,0.12),rgba(255,248,241,0.03)),radial-gradient(circle_at_top_right,rgba(242,95,122,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(244,154,98,0.2),transparent_24%),rgba(8,17,31,0.7)] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-8 xl:p-10"
      >
        <div className="absolute right-6 top-6 hidden h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24),transparent_60%)] blur-2xl md:block" />
        <div className="relative grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <div>
            <div className="app-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm text-white/80">
              <Stars className="h-4 w-4 text-orange-300" />
              Hệ điều hành yêu thương cho Cy
            </div>
            <h1 className="headline-serif mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl xl:text-6xl">
              Mọi điều Cy cần,
              <span className="bg-gradient-to-r from-[#f6c18b] via-[#f49a62] to-[#f25f7a] bg-clip-text text-transparent">
                {' '}đều ở đúng chỗ và đúng cảm xúc.
              </span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-white/68 sm:text-lg">
              NamCy giờ không chỉ là nơi cất dữ liệu, mà là một không gian dịu mắt, dễ chạm,
              và đủ tinh tế để Cy muốn mở lên mỗi ngày.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Khoảnh khắc</p>
                <p className="mt-3 text-3xl font-semibold text-white">{pulse.memoryCount}</p>
                <p className="mt-2 text-sm text-white/55">Kỷ niệm đã được giữ lại an toàn.</p>
              </div>
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Việc mở</p>
                <p className="mt-3 text-3xl font-semibold text-white">{pulse.openTodoCount}</p>
                <p className="mt-2 text-sm text-white/55">Việc còn chờ Cy xử lý hoặc xem qua.</p>
              </div>
              <div className="app-chip rounded-[24px] px-4 py-4">
                <p className="text-xs uppercase tracking-[0.28em] text-white/35">Nhịp hôm nay</p>
                <p className="mt-3 inline-flex items-center gap-2 text-lg font-semibold text-white">
                  <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
                  Dịu dàng và chủ động
                </p>
                <p className="mt-2 text-sm text-white/55">Ít thao tác hơn, nhiều niềm vui hơn.</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="app-chip rounded-[28px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/35">Next best move</p>
                  <h2 className="mt-3 text-2xl font-semibold text-white">Lưu nhanh một điều đẹp</h2>
                  <p className="mt-3 text-sm leading-7 text-white/60">
                    Từ giờ vào Kỷ niệm chỉ cần chọn ảnh là có thể lưu. Mọi thứ còn lại hệ thống tự đỡ cho Cy.
                  </p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-[#f49a62]/25 to-[#f25f7a]/15 p-3">
                  <Sparkles className="h-6 w-6 text-orange-200" />
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/memories')}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition-transform hover:scale-[1.02]"
              >
                Mở Kỷ niệm
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>

            <div className="app-chip rounded-[28px] p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/35">Nhắc khẽ</p>
              <div className="mt-4 flex items-start gap-3">
                <div className="rounded-2xl bg-white/8 p-3">
                  <Clock3 className="h-5 w-5 text-sky-200" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">Cy không cần nhớ mọi thứ.</p>
                  <p className="mt-2 text-sm leading-7 text-white/60">
                    Dashboard này được làm để dẫn đường: ít nghĩ, ít tìm, ít bực mình khi cần quay lại một việc cũ.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {quickDestinations.map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <TiltCard className={`cursor-pointer bg-gradient-to-br ${item.accent}`} glow={false}>
                <button
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex h-full w-full flex-col items-start gap-4 text-left"
                >
                  <div className="rounded-2xl bg-white/10 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{item.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-white/65">{item.description}</p>
                  </div>
                </button>
              </TiltCard>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-rose-500/20 p-3">
              <Mail className="h-6 w-6 text-rose-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Gửi nhanh vào hộp tâm thư</h2>
              <p className="text-sm text-white/60">
                Viết nhanh tại đây, rồi chuyển thẳng sang hũ bí ẩn để niêm phong.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <textarea
              value={quickLetter}
              onChange={(event) => setQuickLetter(event.target.value)}
              placeholder="Nhập điều bạn muốn gửi gắm..."
              rows={5}
              className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-white placeholder:text-white/30 focus:border-rose-400 focus:outline-none"
            />

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/60">Sắc thái</label>
                <select
                  value={quickEmotion}
                  onChange={(event) => setQuickEmotion(event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-400 focus:outline-none"
                >
                  <option value="Yêu thương">Yêu thương</option>
                  <option value="Biết ơn">Biết ơn</option>
                  <option value="Xin lỗi">Xin lỗi</option>
                  <option value="Bất ngờ">Bất ngờ</option>
                  <option value="Nhớ thương">Nhớ thương</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">Mở sau</label>
                <input
                  type="number"
                  min="1"
                  value={unlockDays}
                  onChange={(event) => setUnlockDays(parseInt(event.target.value, 10) || 1)}
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-rose-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleQuickLetter}
                disabled={!quickLetter.trim()}
                className="w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                Chuyển vào hũ bí ẩn
              </button>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="overflow-hidden p-0">
          <button
            type="button"
            onClick={() => navigate('/memories')}
            className="group relative h-full min-h-[280px] w-full text-left sm:min-h-[320px]"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-transparent" />
            {featuredMemory ? (
              <img
                src={featuredMemory.image_url}
                alt={featuredMemory.title}
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-rose-500/10 to-pink-500/20" />
            )}
            <div className="relative z-10 flex h-full flex-col justify-end p-6">
              <p className="text-sm uppercase tracking-[0.28em] text-orange-300">Album kỷ niệm</p>
              <h3 className="headline-serif mt-3 text-3xl font-bold text-white sm:text-4xl">
                {featuredMemory?.title ?? 'Mở ngay những khoảnh khắc đẹp nhất'}
              </h3>
              <p className="mt-3 max-w-md text-white/70">
                {featuredMemory?.description ??
                  'Chỉnh sửa, thay ảnh, hoặc thêm ảnh mới trực tiếp từ máy ngay trong thư viện.'}
              </p>
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/85">
                Chạm để bước vào album
                <ArrowRight className="h-4 w-4" />
              </div>
            </div>
          </button>
        </TiltCard>
      </div>
    </div>
  );
}
