import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Activity, BarChart2, RefreshCcw, TrendingDown, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import TiltCard from '../components/TiltCard';

type RatioSnapshot = {
  ratio: number;
  longAccount: number;
  shortAccount: number;
};

type TakerSnapshot = {
  ratio: number;
  buyVolume: number;
  sellVolume: number;
};

type MarketAsset = {
  key: 'btc' | 'gold' | 'silver';
  label: string;
  symbol: string;
  usd: number;
  vnd: number;
  bid?: number;
  ask?: number;
  volume24h?: number;
  changePercent: number;
  series: Array<{
    timestamp: number;
    close: number;
    volume?: number;
  }>;
  metrics?: {
    priceChange4h?: number;
    volumeChange4h?: number;
    volume4h?: number;
    vndPerLuong?: number;
    vndPerChi?: number;
    globalLongShortAccountRatio?: RatioSnapshot | null;
    topLongShortAccountRatio?: RatioSnapshot | null;
    takerBuySellRatio4h?: TakerSnapshot | null;
  };
};

type MarketOverviewResponse = {
  updatedAt: string;
  usdToVnd: number;
  topOiMarketCapCoins?: Array<{
    symbol: string;
    price: number;
    marketCapUsd: number;
    openInterestUsd: number;
    oiMarketCapRatio: number;
    priceChangePercent4h: number;
    oiChangePercent4h: number;
    volumeChangePercent4h: number;
  }>;
  assets: MarketAsset[];
};

const tradeLog = [
  { type: 'LONG', pair: 'BTC/USD', entry: 65000, exit: 67000, pnl: 200, date: 'Hôm nay' },
  { type: 'SHORT', pair: 'ETH/USDT', entry: 3500, exit: 3450, pnl: 50, date: 'Hôm qua' },
  { type: 'LONG', pair: 'SOL/USDT', entry: 140, exit: 135, pnl: -20, date: '2 ngày trước' },
];

const formatUsd = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: value >= 100 ? 2 : 3,
  }).format(value || 0);

const formatVnd = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
const formatRatio = (value: number) => value.toFixed(2);
const formatCompact = (value: number) =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value || 0);

const formatChartTime = (timestamp: number) =>
  new Date(timestamp * 1000).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const badgeClass = 'rounded-full border border-white/10 bg-white/6 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-white/55';

function MetricPill({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-white/40">{label}</p>
      <p className={`mt-2 text-lg font-semibold ${positive === undefined ? 'text-white/90' : positive ? 'text-emerald-300' : 'text-rose-300'}`}>{value}</p>
    </div>
  );
}

export default function TradingHub() {
  const [overview, setOverview] = useState<MarketOverviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOverview = async (background = false) => {
    try {
      if (background) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const response = await fetch('/api/market-overview');
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload?.message ?? 'Không thể tải dữ liệu thị trường.');
      }

      setOverview(payload);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Không thể tải dữ liệu thị trường.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    void loadOverview();

    const intervalId = window.setInterval(() => {
      void loadOverview(true);
    }, 60000);

    return () => window.clearInterval(intervalId);
  }, []);

  const btc = useMemo(() => overview?.assets.find((asset) => asset.key === 'btc') ?? null, [overview]);
  const gold = useMemo(() => overview?.assets.find((asset) => asset.key === 'gold') ?? null, [overview]);
  const silver = useMemo(() => overview?.assets.find((asset) => asset.key === 'silver') ?? null, [overview]);

  const pnl = tradeLog.reduce((sum, trade) => sum + trade.pnl, 0);
  const updatedLabel = overview?.updatedAt
    ? new Date(overview.updatedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '--:--:--';
  const topOiMarketCapCoins = overview?.topOiMarketCapCoins ?? [];

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Trading Hub
            <Activity className="h-8 w-8 text-green-400" />
          </h1>
          <p className="text-lg text-white/60">Theo dõi BTC realtime, vàng bạc quy đổi VND và các chỉ số phái sinh 4h.</p>
        </motion.div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void loadOverview(true)}
            className="flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-sm font-medium text-white/75 transition hover:bg-white/12 hover:text-white"
          >
            <RefreshCcw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md"
          >
            <span className={`font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>PnL: {pnl >= 0 ? '+' : '-'}${Math.abs(pnl)}</span>
            <span className="text-xs uppercase tracking-[0.18em] text-white/40">Live {updatedLabel}</span>
          </motion.div>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <TiltCard className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(247,147,26,0.18),transparent_28%),radial-gradient(circle_at_right,rgba(59,130,246,0.14),transparent_26%),rgba(255,255,255,0.03)]">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.28em] text-white/40">Market Pulse</p>
              <h2 className="mt-3 text-3xl font-bold text-white">Coinbase BTC realtime, Binance derivatives và quy đổi vàng bạc theo VND</h2>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Màn hình này ưu tiên tín hiệu ngắn hạn 4h cho BTC, đồng thời bổ sung tỷ lệ OI / vốn hóa để soi nhanh nhóm coin đang đòn bẩy mạnh.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:min-w-[320px]">
              <MetricPill label="BTC bid" value={btc?.bid ? formatUsd(btc.bid) : '--'} />
              <MetricPill label="BTC ask" value={btc?.ask ? formatUsd(btc.ask) : '--'} />
              <MetricPill label="USD/VND" value={overview ? formatVnd(overview.usdToVnd) : '--'} />
              <MetricPill label="BTC volume 24h" value={btc?.volume24h ? formatCompact(btc.volume24h) : '--'} />
            </div>
          </div>
        </TiltCard>

        <TiltCard className="border-cyan-400/15 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.15),transparent_32%),rgba(255,255,255,0.03)]">
          <p className="text-xs uppercase tracking-[0.22em] text-cyan-200/60">Nguồn dữ liệu</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className={badgeClass}>Coinbase</span>
            <span className={badgeClass}>Binance Futures</span>
            <span className={badgeClass}>Yahoo Finance</span>
            <span className={badgeClass}>CoinGecko</span>
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/15 p-4">
            <p className="text-sm text-white/55">OI / Market Cap không cần API key</p>
            <p className="mt-2 text-lg font-semibold text-white">Binance open interest + CoinGecko market cap</p>
            <p className="mt-2 text-sm text-white/45">
              Bảng top 5 bên dưới được tự tính từ open interest công khai trên Binance Futures và vốn hóa công khai từ CoinGecko.
            </p>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <TiltCard className="bg-gradient-to-br from-[#F7931A]/20 to-transparent border-[#F7931A]/30">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F7931A] font-bold text-white">B</div>
              <div>
                <h3 className="text-lg font-bold text-white/90">Bitcoin</h3>
                <p className="text-sm text-white/50">Coinbase BTC/USD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{btc ? formatUsd(btc.usd) : '--'}</p>
              <p className={`flex items-center justify-end gap-1 text-sm ${btc && btc.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {btc && btc.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {btc ? formatPercent(btc.metrics?.priceChange4h ?? 0) : '--'}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">Khối lượng 4h</p>
              <p className="mt-2 font-semibold text-white/90">{btc ? formatCompact(btc.metrics?.volume4h ?? 0) : '--'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">% Vol 4h</p>
              <p className={`mt-2 font-semibold ${btc && (btc.metrics?.volumeChange4h ?? 0) >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                {btc ? formatPercent(btc.metrics?.volumeChange4h ?? 0) : '--'}
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-[#FFD700]/20 to-transparent border-[#FFD700]/30">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FFD700] font-bold text-black">Au</div>
              <div>
                <h3 className="text-lg font-bold text-white/90">Vàng</h3>
                <p className="text-sm text-white/50">XAU/USD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{gold ? formatUsd(gold.usd) : '--'}</p>
              <p className={`flex items-center justify-end gap-1 text-sm ${gold && gold.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {gold && gold.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {gold ? formatPercent(gold.changePercent) : '--'}
              </p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">VND / lượng</p>
              <p className="mt-2 font-semibold text-white/90">{gold ? formatVnd(gold.metrics?.vndPerLuong ?? 0) : '--'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">VND / chỉ</p>
              <p className="mt-2 font-semibold text-white/90">{gold ? formatVnd(gold.metrics?.vndPerChi ?? 0) : '--'}</p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-[#C0C0C0]/20 to-transparent border-[#C0C0C0]/30">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#C0C0C0] font-bold text-black">Ag</div>
              <div>
                <h3 className="text-lg font-bold text-white/90">Bạc</h3>
                <p className="text-sm text-white/50">XAG/USD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold">{silver ? formatUsd(silver.usd) : '--'}</p>
              <p className={`flex items-center justify-end gap-1 text-sm ${silver && silver.changePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {silver && silver.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {silver ? formatPercent(silver.changePercent) : '--'}
              </p>
            </div>
          </div>
          <div className="space-y-3 text-sm">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">VND / lượng</p>
              <p className="mt-2 font-semibold text-white/90">{silver ? formatVnd(silver.metrics?.vndPerLuong ?? 0) : '--'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-3 py-3">
              <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">VND / chỉ</p>
              <p className="mt-2 font-semibold text-white/90">{silver ? formatVnd(silver.metrics?.vndPerChi ?? 0) : '--'}</p>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <TiltCard className="xl:col-span-2">
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <BarChart2 className="h-5 w-5 text-orange-400" />
            Biểu đồ BTC/USD 24h
          </h2>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={btc?.series ?? []} margin={{ top: 10, right: 18, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis
                  dataKey="timestamp"
                  tickFormatter={formatChartTime}
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['dataMin - 300', 'dataMax + 300']}
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatUsd(value)}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(20, 25, 40, 0.88)',
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(8px)',
                  }}
                  itemStyle={{ color: '#fff' }}
                  labelFormatter={(value) => formatChartTime(Number(value))}
                  formatter={(value: number) => [formatUsd(value), 'Giá']}
                />
                <Area type="monotone" dataKey="close" stroke="#F7931A" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <Activity className="h-5 w-5 text-blue-400" />
            Chỉ số BTC 4h
          </h2>
          <div className="space-y-3">
            <MetricPill
              label="% Giá thay đổi 4h"
              value={btc ? formatPercent(btc.metrics?.priceChange4h ?? 0) : '--'}
              positive={(btc?.metrics?.priceChange4h ?? 0) >= 0}
            />
            <MetricPill
              label="% Khối lượng 4h"
              value={btc ? formatPercent(btc.metrics?.volumeChange4h ?? 0) : '--'}
              positive={(btc?.metrics?.volumeChange4h ?? 0) >= 0}
            />
            <MetricPill
              label="Long/Short tài khoản"
              value={btc?.metrics?.globalLongShortAccountRatio ? formatRatio(btc.metrics.globalLongShortAccountRatio.ratio) : '--'}
            />
            <MetricPill
              label="Long/Short hàng đầu"
              value={btc?.metrics?.topLongShortAccountRatio ? formatRatio(btc.metrics.topLongShortAccountRatio.ratio) : '--'}
            />
            <MetricPill
              label="Taker Buy/Sell 4h"
              value={btc?.metrics?.takerBuySellRatio4h ? formatRatio(btc.metrics.takerBuySellRatio4h.ratio) : '--'}
            />
          </div>
        </TiltCard>
      </div>

      <TiltCard className="border-fuchsia-400/15 bg-[radial-gradient(circle_at_top_right,rgba(217,70,239,0.12),transparent_28%),rgba(255,255,255,0.03)]">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-fuchsia-200/55">OI / Market Cap Ranking</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Top 5 coin có OI / vốn hóa thị trường cao nhất</h2>
            <p className="mt-2 text-sm text-white/50">Ưu tiên các coin đang bị đòn bẩy hóa mạnh so với quy mô vốn hóa hiện tại.</p>
          </div>
          <div className="text-sm text-white/45">Tính từ Binance Futures + CoinGecko</div>
        </div>

        {topOiMarketCapCoins.length ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-5">
            {topOiMarketCapCoins.map((coin, index) => (
              <div
                key={coin.symbol}
                className="rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.07),rgba(255,255,255,0.03))] p-4 shadow-[0_18px_35px_rgba(0,0,0,0.18)]"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/35">#{index + 1}</p>
                    <p className="mt-2 text-2xl font-bold text-white">{coin.symbol}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${coin.priceChangePercent4h >= 0 ? 'bg-emerald-400/15 text-emerald-300' : 'bg-rose-400/15 text-rose-300'}`}>
                    {formatPercent(coin.priceChangePercent4h)}
                  </span>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="rounded-2xl border border-white/8 bg-black/15 px-3 py-3">
                    <p className="text-[11px] uppercase tracking-[0.16em] text-white/40">OI / MCAP</p>
                    <p className="mt-2 text-xl font-semibold text-fuchsia-200">{formatRatio(coin.oiMarketCapRatio)}</p>
                  </div>
                  <div className="flex items-center justify-between text-white/65">
                    <span>Giá</span>
                    <span className="font-medium text-white/90">{formatUsd(coin.price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/65">
                    <span>OI</span>
                    <span className="font-medium text-white/90">{formatCompact(coin.openInterestUsd)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/65">
                    <span>Vốn hóa</span>
                    <span className="font-medium text-white/90">{formatCompact(coin.marketCapUsd)}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/65">
                    <span>OI 4h</span>
                    <span className={coin.oiChangePercent4h >= 0 ? 'font-medium text-emerald-300' : 'font-medium text-rose-300'}>
                      {formatPercent(coin.oiChangePercent4h)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-white/65">
                    <span>Vol 4h</span>
                    <span className={coin.volumeChangePercent4h >= 0 ? 'font-medium text-emerald-300' : 'font-medium text-rose-300'}>
                      {formatPercent(coin.volumeChangePercent4h)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-[28px] border border-dashed border-white/14 bg-black/15 px-6 py-8 text-center text-sm text-white/55">
            Chưa lấy được dữ liệu xếp hạng OI / vốn hóa từ Binance Futures và CoinGecko ở lần tải này.
          </div>
        )}
      </TiltCard>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <TiltCard>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <Activity className="h-5 w-5 text-amber-400" />
            Cấu trúc Long / Short Binance
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white/80">Tài khoản toàn thị trường</p>
              <p className="mt-3 text-2xl font-bold text-white">{btc?.metrics?.globalLongShortAccountRatio ? formatRatio(btc.metrics.globalLongShortAccountRatio.ratio) : '--'}</p>
              <p className="mt-2 text-sm text-white/55">
                Long {((btc?.metrics?.globalLongShortAccountRatio?.longAccount ?? 0) * 100).toFixed(0)}% • Short{' '}
                {((btc?.metrics?.globalLongShortAccountRatio?.shortAccount ?? 0) * 100).toFixed(0)}%
              </p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white/80">Nhóm tài khoản hàng đầu</p>
              <p className="mt-3 text-2xl font-bold text-white">{btc?.metrics?.topLongShortAccountRatio ? formatRatio(btc.metrics.topLongShortAccountRatio.ratio) : '--'}</p>
              <p className="mt-2 text-sm text-white/55">
                Long {((btc?.metrics?.topLongShortAccountRatio?.longAccount ?? 0) * 100).toFixed(0)}% • Short{' '}
                {((btc?.metrics?.topLongShortAccountRatio?.shortAccount ?? 0) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard>
          <h2 className="mb-6 flex items-center gap-2 text-xl font-semibold">
            <Activity className="h-5 w-5 text-blue-400" />
            Nhật ký giao dịch
          </h2>
          <div className="space-y-4">
            {tradeLog.map((trade, index) => (
              <div key={index} className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/10">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs font-bold ${trade.type === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trade.type}
                    </span>
                    <span className="font-semibold text-white/90">{trade.pair}</span>
                  </div>
                  <p className="text-xs text-white/50">
                    {trade.date} • {trade.entry} → {trade.exit}
                  </p>
                </div>
                <div className={`font-bold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnl > 0 ? '+' : '-'}${Math.abs(trade.pnl)}
                </div>
              </div>
            ))}
          </div>
        </TiltCard>
      </div>

      {isLoading ? <TiltCard className="text-center text-white/60">Đang tải dữ liệu thị trường...</TiltCard> : null}
    </div>
  );
}
