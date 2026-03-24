import React from 'react';
import { motion } from 'motion/react';
import { TrendingUp, TrendingDown, Activity, DollarSign, BarChart2 } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '10:00', price: 65000 },
  { name: '11:00', price: 65200 },
  { name: '12:00', price: 64800 },
  { name: '13:00', price: 66000 },
  { name: '14:00', price: 65900 },
  { name: '15:00', price: 67200 },
  { name: '16:00', price: 67500 },
];

export default function TradingHub() {
  return (
    <div className="space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Trading Hub
            <Activity className="w-8 h-8 text-green-400" />
          </h1>
          <p className="text-white/60 text-lg">Theo dõi thị trường và nhật ký giao dịch.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
        >
          <span className="font-medium text-green-400">PnL: +$1,250.00</span>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TiltCard className="bg-gradient-to-br from-[#F7931A]/20 to-transparent border-[#F7931A]/30">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F7931A] flex items-center justify-center font-bold text-white">
                ₿
              </div>
              <div>
                <h3 className="font-bold text-lg text-white/90">Bitcoin</h3>
                <p className="text-sm text-white/50">BTC/USDT</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">$67,500.00</p>
              <p className="text-sm text-green-400 flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" /> +2.4%
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-[#FFD700]/20 to-transparent border-[#FFD700]/30">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#FFD700] flex items-center justify-center font-bold text-black">
                Au
              </div>
              <div>
                <h3 className="font-bold text-lg text-white/90">Vàng</h3>
                <p className="text-sm text-white/50">XAU/USD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">$2,350.40</p>
              <p className="text-sm text-red-400 flex items-center justify-end gap-1">
                <TrendingDown className="w-3 h-3" /> -0.8%
              </p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-[#C0C0C0]/20 to-transparent border-[#C0C0C0]/30">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C0C0C0] flex items-center justify-center font-bold text-black">
                Ag
              </div>
              <div>
                <h3 className="font-bold text-lg text-white/90">Bạc</h3>
                <p className="text-sm text-white/50">XAG/USD</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl">$28.15</p>
              <p className="text-sm text-green-400 flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" /> +1.2%
              </p>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TiltCard className="lg:col-span-2 h-[400px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-orange-400" />
            Biểu đồ BTC/USDT
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F7931A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F7931A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} />
                <YAxis domain={['dataMin - 1000', 'dataMax + 1000']} stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20, 25, 40, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Price']}
                />
                <Area type="monotone" dataKey="price" stroke="#F7931A" strokeWidth={3} fillOpacity={1} fill="url(#colorPrice)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-400" />
            Nhật ký giao dịch
          </h2>
          
          <div className="space-y-4">
            {[
              { type: 'LONG', pair: 'BTC/USDT', entry: 65000, exit: 67000, pnl: 200, date: 'Hôm nay' },
              { type: 'SHORT', pair: 'ETH/USDT', entry: 3500, exit: 3450, pnl: 50, date: 'Hôm qua' },
              { type: 'LONG', pair: 'SOL/USDT', entry: 140, exit: 135, pnl: -20, date: '2 ngày trước' },
            ].map((trade, idx) => (
              <div key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${trade.type === 'LONG' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                      {trade.type}
                    </span>
                    <span className="font-semibold text-white/90">{trade.pair}</span>
                  </div>
                  <p className="text-xs text-white/50">{trade.date} • {trade.entry} &rarr; {trade.exit}</p>
                </div>
                <div className={`font-bold ${trade.pnl > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {trade.pnl > 0 ? '+' : ''}${Math.abs(trade.pnl)}
                </div>
              </div>
            ))}
          </div>

          <button className="w-full mt-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-medium flex items-center justify-center gap-2">
            Thêm giao dịch
          </button>
        </TiltCard>
      </div>
      
      {/* Coinglass Heatmap Mockup */}
      <TiltCard className="h-[400px] p-0 overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none" />
        <div className="absolute top-6 left-6 z-20 flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <h2 className="text-xl font-bold text-white drop-shadow-md">Coinglass Heatmap</h2>
        </div>
        <div className="w-full h-full bg-[#131722] flex items-center justify-center p-8">
           {/* Mocking a heatmap with a grid of colored blocks */}
           <div className="grid grid-cols-6 gap-2 w-full h-full opacity-80">
              {Array.from({length: 24}).map((_, i) => {
                const isGreen = Math.random() > 0.4;
                const intensity = Math.random() * 0.8 + 0.2;
                return (
                  <div 
                    key={i} 
                    className={`rounded-md flex items-center justify-center text-xs font-bold text-white/80 transition-transform hover:scale-105 cursor-pointer`}
                    style={{ 
                      backgroundColor: isGreen ? `rgba(74, 222, 128, ${intensity})` : `rgba(248, 113, 113, ${intensity})`,
                      boxShadow: `0 0 10px ${isGreen ? 'rgba(74, 222, 128, 0.2)' : 'rgba(248, 113, 113, 0.2)'}`
                    }}
                  >
                    {isGreen ? '+' : '-'}{(Math.random() * 5).toFixed(1)}%
                  </div>
                )
              })}
           </div>
        </div>
      </TiltCard>
    </div>
  );
}
