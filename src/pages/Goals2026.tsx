import { motion } from 'motion/react';
import {
  Activity,
  CalendarCheck2,
  HeartHandshake,
  PiggyBank,
  Sparkles,
  Target,
  UserRound,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import TiltCard from '../components/TiltCard';

type Goal = {
  pillar: string;
  name: string;
  owner: 'Nam' | 'Cy' | 'Chung';
  target: string;
  current: string;
  progress: number;
};

const pillarSummary = [
  { name: 'Sức khoẻ', value: 8, color: '#34d399' },
  { name: 'Gắn kết', value: 5, color: '#fb7185' },
  { name: 'Tài chính', value: 4, color: '#fbbf24' },
  { name: 'Phát triển', value: 3, color: '#60a5fa' },
];

const relationshipProgress = [
  { name: 'Cafe mới', current: 9, target: 10 },
  { name: 'Quán tủ', current: 3, target: 5 },
  { name: 'Đồ đôi', current: 0, target: 2 },
  { name: 'Du lịch', current: 0, target: 2 },
];

const fundPlan = [
  { name: 'Tháng', amount: 3 },
  { name: '6 tháng', amount: 18 },
  { name: 'Năm', amount: 36 },
];

const goals: Goal[] = [
  {
    pillar: 'Sức khoẻ',
    name: 'Nam đu xà',
    owner: 'Nam',
    target: '30 cái/lần',
    current: 'Đang theo dõi',
    progress: 0,
  },
  {
    pillar: 'Sức khoẻ',
    name: 'Cy tập cầu lông',
    owner: 'Cy',
    target: 'Tập cùng Nam',
    current: 'Bắt đầu trong năm',
    progress: 0,
  },
  {
    pillar: 'Sức khoẻ',
    name: 'Dậy sớm làm việc',
    owner: 'Chung',
    target: '4h45 sáng',
    current: 'Chuyển dần từ làm đêm',
    progress: 20,
  },
  {
    pillar: 'Gắn kết',
    name: 'Cafe mới',
    owner: 'Chung',
    target: '10 quán',
    current: '9 quán',
    progress: 90,
  },
  {
    pillar: 'Gắn kết',
    name: 'Quán tủ mới',
    owner: 'Chung',
    target: '5 quán',
    current: '3 quán',
    progress: 60,
  },
  {
    pillar: 'Gắn kết',
    name: 'Mua đồ đôi',
    owner: 'Chung',
    target: '2 bộ',
    current: '0 bộ',
    progress: 0,
  },
  {
    pillar: 'Tài chính',
    name: 'Quỹ chung',
    owner: 'Chung',
    target: '3 triệu/tháng',
    current: '1.5 triệu/người',
    progress: 0,
  },
  {
    pillar: 'Tài chính',
    name: 'Nam trả nợ Cy',
    owner: 'Nam',
    target: '19.5 triệu',
    current: 'Tách khỏi quỹ chung',
    progress: 0,
  },
  {
    pillar: 'Phát triển',
    name: 'Agentic AI video',
    owner: 'Nam',
    target: 'Có flow demo',
    current: 'Tự xây dựng',
    progress: 15,
  },
  {
    pillar: 'Phát triển',
    name: 'Tiếng Anh USTH',
    owner: 'Cy',
    target: 'Sáng thứ 4 từ tháng 6',
    current: 'Chuẩn bị học',
    progress: 0,
  },
];

const focusItems = [
  'Chốt cách ghi quỹ chung 1.5 triệu/người/tháng.',
  'Thêm 1 quán cafe mới để hoàn thành mốc 10/10.',
  'Chọn 2 quán tủ mới để thử trong các buổi hẹn.',
  'Lên lịch ngủ sớm, dậy 4h45 theo từng tuần.',
  'Tháng 5 bổ sung thêm kỹ năng cá nhân cho mỗi người.',
];

const ownerStyles = {
  Nam: 'bg-sky-500/15 text-sky-200',
  Cy: 'bg-pink-500/15 text-pink-200',
  Chung: 'bg-emerald-500/15 text-emerald-200',
};

const progressColor = (progress: number) => {
  if (progress >= 80) return 'from-emerald-400 to-lime-300';
  if (progress >= 50) return 'from-amber-300 to-orange-400';
  return 'from-orange-400 to-pink-500';
};

const formatMillion = (value: number) => `${value}tr`;

export default function Goals2026() {
  const completedRelationshipTargets = relationshipProgress.reduce((sum, item) => sum + item.current, 0);
  const totalRelationshipTargets = relationshipProgress.reduce((sum, item) => sum + item.target, 0);
  const relationshipPercent = Math.round((completedRelationshipTargets / totalRelationshipTargets) * 100);

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
            <Target className="h-4 w-4 text-orange-300" />
            Kế hoạch năm 2026
          </div>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Mục tiêu 2026 của NamCy</h1>
          <p className="max-w-3xl text-lg leading-8 text-white/60">
            Một bảng nhìn nhanh cho sức khoẻ, gắn kết, tài chính và phát triển bản thân, đủ rõ để
            hai người cùng xem và cập nhật mỗi tháng.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md"
        >
          <p className="text-sm text-white/55">Cam kết quỹ chung</p>
          <p className="mt-1 text-2xl font-bold text-white">1.5 triệu/người/tháng</p>
        </motion.div>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <TiltCard className="bg-emerald-500/10" glow={false}>
          <Activity className="h-6 w-6 text-emerald-300" />
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-emerald-100/55">Sức khoẻ</p>
          <p className="mt-2 text-2xl font-bold text-white">Dậy sớm, tập đều</p>
        </TiltCard>
        <TiltCard className="bg-rose-500/10" glow={false}>
          <HeartHandshake className="h-6 w-6 text-rose-300" />
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-rose-100/55">Gắn kết</p>
          <p className="mt-2 text-2xl font-bold text-white">{relationshipPercent}% mốc trải nghiệm</p>
        </TiltCard>
        <TiltCard className="bg-amber-500/10" glow={false}>
          <PiggyBank className="h-6 w-6 text-amber-300" />
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-amber-100/55">Tài chính</p>
          <p className="mt-2 text-2xl font-bold text-white">36 triệu/năm</p>
        </TiltCard>
        <TiltCard className="bg-sky-500/10" glow={false}>
          <Sparkles className="h-6 w-6 text-sky-300" />
          <p className="mt-4 text-sm uppercase tracking-[0.22em] text-sky-100/55">Phát triển</p>
          <p className="mt-2 text-2xl font-bold text-white">AI + tiếng Anh</p>
        </TiltCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white">Tỷ trọng mục tiêu</h2>
            <p className="mt-2 text-sm text-white/60">Số lượng đầu việc theo 4 trụ cột chính.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pillarSummary}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={95}
                  paddingAngle={3}
                >
                  {pillarSummary.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'rgba(12, 18, 30, 0.95)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {pillarSummary.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm text-white/70">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name}</span>
                <span className="text-white/40">· {item.value} việc</span>
              </div>
            ))}
          </div>
        </TiltCard>

        <TiltCard className="bg-white/5">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white">Tiến độ gắn kết</h2>
            <p className="mt-2 text-sm text-white/60">Các mốc trải nghiệm dễ nhìn để Cy xem nhanh.</p>
          </div>
          <div className="space-y-5">
            {relationshipProgress.map((item) => {
              const percent = Math.round((item.current / item.target) * 100);
              return (
                <div key={item.name}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <p className="font-semibold text-white">{item.name}</p>
                    <p className="text-sm text-white/55">
                      {item.current}/{item.target}
                    </p>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${progressColor(percent)}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </TiltCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-white">Kế hoạch quỹ chung</h2>
            <p className="mt-2 text-sm text-white/60">
              Mỗi người 1.5 triệu/tháng, tổng 3 triệu/tháng cho hẹn hò, dự phòng và tích luỹ nhỏ.
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={fundPlan}>
                <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.55)" tickLine={false} axisLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.55)"
                  tickFormatter={formatMillion}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  formatter={(value) => [`${value} triệu`, 'Quỹ']}
                  contentStyle={{
                    background: 'rgba(12, 18, 30, 0.95)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: 12,
                    color: '#fff',
                  }}
                />
                <Bar dataKey="amount" radius={[10, 10, 0, 0]} fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard className="bg-white/5">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-orange-500/15 p-3">
              <CalendarCheck2 className="h-6 w-6 text-orange-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Tháng này tập trung</h2>
              <p className="mt-2 text-sm text-white/60">Các việc nên chốt trước khi thêm mục tiêu mới.</p>
            </div>
          </div>
          <div className="space-y-3">
            {focusItems.map((item, index) => (
              <div key={item} className="flex gap-3 rounded-2xl border border-white/10 bg-black/10 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-white/72">{item}</p>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>

      <TiltCard className="bg-white/5">
        <div className="mb-5 flex items-start gap-3">
          <div className="rounded-2xl bg-white/10 p-3">
            <UserRound className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Bảng mục tiêu chi tiết</h2>
            <p className="mt-2 text-sm text-white/60">Dùng để check-in hàng tháng: cập nhật hiện tại và tiến độ.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] border-separate border-spacing-y-2 text-left">
            <thead>
              <tr className="text-sm text-white/45">
                <th className="px-4 py-2 font-medium">Nhóm</th>
                <th className="px-4 py-2 font-medium">Mục tiêu</th>
                <th className="px-4 py-2 font-medium">Phụ trách</th>
                <th className="px-4 py-2 font-medium">Chỉ tiêu</th>
                <th className="px-4 py-2 font-medium">Hiện tại</th>
                <th className="px-4 py-2 font-medium">Tiến độ</th>
              </tr>
            </thead>
            <tbody>
              {goals.map((goal) => (
                <tr key={`${goal.pillar}-${goal.name}`} className="bg-black/10 text-sm text-white/75">
                  <td className="rounded-l-2xl px-4 py-4">{goal.pillar}</td>
                  <td className="px-4 py-4 font-semibold text-white">{goal.name}</td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${ownerStyles[goal.owner]}`}>
                      {goal.owner}
                    </span>
                  </td>
                  <td className="px-4 py-4">{goal.target}</td>
                  <td className="px-4 py-4 text-white/58">{goal.current}</td>
                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r ${progressColor(goal.progress)}`}
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-white/55">{goal.progress}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TiltCard>
    </div>
  );
}
