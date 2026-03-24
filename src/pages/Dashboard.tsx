import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  CalendarHeart,
  CheckCircle2,
  Heart,
  Image as ImageIcon,
  Mail,
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

  useEffect(() => {
    const loadFeaturedMemory = async () => {
      const { data } = await supabase
        .from('memories')
        .select('id, title, image_url, description')
        .order('memory_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      setFeaturedMemory((data as FeaturedMemory | null) ?? null);
    };

    void loadFeaturedMemory();
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
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">
            Bảng điều khiển của{' '}
            <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent">
              NamCy
            </span>
          </h1>
          <p className="text-lg text-white/60">
            Chạm đúng nơi bạn cần: kỷ niệm, việc cần làm, tài chính và hộp tâm thư.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md"
        >
          <Heart className="h-5 w-5 animate-pulse fill-pink-500 text-pink-500" />
          <span className="font-medium text-white/90">Hôm nay ưu tiên lưu lại điều tốt đẹp</span>
        </motion.div>
      </header>

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
                  <div className="rounded-2xl bg-white/10 p-3">
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
                className="rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 px-6 py-3 font-semibold text-white shadow-lg shadow-rose-500/30 disabled:cursor-not-allowed disabled:opacity-50"
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
            className="group relative h-full min-h-[320px] w-full text-left"
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
              <h3 className="mt-3 text-3xl font-bold text-white">
                {featuredMemory?.title ?? 'Mở ngay những khoảnh khắc đẹp nhất'}
              </h3>
              <p className="mt-3 max-w-md text-white/70">
                {featuredMemory?.description ??
                  'Chỉnh sửa, thay ảnh, hoặc thêm ảnh mới trực tiếp từ máy ngay trong thư viện.'}
              </p>
            </div>
          </button>
        </TiltCard>
      </div>
    </div>
  );
}
