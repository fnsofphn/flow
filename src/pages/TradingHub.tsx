import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, BarChart2, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import TiltCard from '../components/TiltCard';

type MarketPoint = {
  timestamp: number;
  close: number;
};

type MarketAsset = {
  key: 'btc' | 'gold' | 'silver';
  label: string;
  symbol: string;
  usd: number;
  vnd: number;
  changePercent: number;
  series: MarketPoint[];
};

type MarketOverview = {
  updatedAt: string;
  usdToVnd: number;
  assets: MarketAsset[];
};

export default function TradingHub() {
  const [overview, setOverview] = useState<MarketOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/market-overview');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Không thể tải dữ liệu thị trường.');
      }

      setOverview(payload as MarketOverview);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Không thể tải dữ liệu thị trường.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadOverview();
    const intervalId = window.setInterval(() => {
      void loadOverview();
    }, 120000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const btcSeries = useMemo(() => {
    const asset = overview?.assets.find((item) => item.key === 'btc');
    return (asset?.series ?? []).map((point) => ({
      time: new Date(point.timestamp * 1000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      price: point.close,
    }));
  }, [overview]);

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Thị trường
            <Activity className="h-8 w-8 text-green-400" />
          </h1>
          <p className="text-lg text-white/60">Theo dõi Bitcoin, vàng và bạc theo thời gian thực với cả USD và VNĐ.</p>
        </motion.div>

        <div className="flex items-center gap-3">
          <button onClick={() => void loadOverview()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <div className="rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/65">
            {overview ? `Cập nhật ${new Date(overview.updatedAt).toLocaleTimeString('vi-VN')}` : 'Đang chờ dữ liệu'}
          </div>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {(overview?.assets ?? []).map((asset) => {
          const isPositive = asset.changePercent >= 0;
          return (
            <div key={asset.key}>
              <TiltCard className="border-white/10 bg-gradient-to-br from-white/10 to-transparent">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-bold text-white/90">{asset.label}</h3>
                    <p className="text-sm text-white/50">{asset.symbol}</p>
                  </div>
                  <div className={`flex items-center gap-1 text-sm font-semibold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                    {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    {asset.changePercent.toFixed(2)}%
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-2xl font-bold text-white">${asset.usd.toLocaleString('en-US', { maximumFractionDigits: 2 })}</p>
                  <p className="text-sm text-white/55">≈ {asset.vnd.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} đ</p>
                </div>
              </TiltCard>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TiltCard className="h-[420px]">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <BarChart2 className="h-5 w-5 text-orange-400" />
            Biểu đồ Bitcoin trong ngày
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={btcSeries} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="time" stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{ fill: 'rgba(255,255,255,0.5)' }} axisLine={false} tickLine={false} tickFormatter={(value) => `$${Math.round(value / 1000)}k`} />
                <Tooltip contentStyle={{ backgroundColor: 'rgba(20, 25, 40, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }} itemStyle={{ color: '#fff' }} formatter={(value: number) => [`$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`, 'Giá']} />
                <Area type="monotone" dataKey="price" stroke="#F7931A" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard>
          <h2 className="mb-6 text-xl font-semibold text-white/90">Tỷ giá quy đổi</h2>
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm text-white/50">1 USD</p>
              <p className="mt-2 text-3xl font-bold text-white">{overview?.usdToVnd?.toLocaleString('vi-VN', { maximumFractionDigits: 0 }) ?? '--'} đ</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-relaxed text-white/65">
              <p>Dữ liệu thị trường đang được lấy động từ Yahoo Finance qua Vercel Function.</p>
              <p className="mt-2">Giá vàng và bạc đang hiển thị theo hợp đồng tương lai USD/ounce để bạn có góc nhìn tham chiếu quốc tế, đồng thời quy đổi thêm sang VNĐ.</p>
            </div>
            {!overview && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-white/10 p-4 text-sm text-white/50">Chưa nhận được dữ liệu thị trường. Hãy thử làm mới.</div>
            ) : null}
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
