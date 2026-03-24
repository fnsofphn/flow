import React from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, TrendingDown, PieChart, Target } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'T1', thu: 4000, chi: 2400 },
  { name: 'T2', thu: 3000, chi: 1398 },
  { name: 'T3', thu: 2000, chi: 9800 },
  { name: 'T4', thu: 2780, chi: 3908 },
  { name: 'T5', thu: 1890, chi: 4800 },
  { name: 'T6', thu: 2390, chi: 3800 },
  { name: 'T7', thu: 3490, chi: 4300 },
];

export default function Finance() {
  return (
    <div className="space-y-8 pb-24">
      <header>
        <motion.h1 
          initial={{ opacity: 0, x: -20 }} 
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl font-bold tracking-tight mb-2"
        >
          Quản lý tài chính
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.1 }}
          className="text-white/60 text-lg"
        >
          Cùng nhau xây dựng tương lai.
        </motion.p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TiltCard className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-blue-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">Tổng Quỹ</p>
              <p className="text-2xl font-bold">24,500,000đ</p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border-green-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-green-500/20 rounded-xl">
              <TrendingUp className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">Thu nhập tháng</p>
              <p className="text-2xl font-bold text-green-400">+12,000,000đ</p>
            </div>
          </div>
        </TiltCard>

        <TiltCard className="bg-gradient-to-br from-red-500/20 to-orange-500/20 border-red-500/30">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-red-500/20 rounded-xl">
              <TrendingDown className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <p className="text-sm text-white/60 font-medium">Chi tiêu tháng</p>
              <p className="text-2xl font-bold text-red-400">-4,200,000đ</p>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TiltCard className="lg:col-span-2 h-[400px]">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-orange-400" />
            Biểu đồ Thu Chi
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThu" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4ade80" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#4ade80" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorChi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" tick={{fill: 'rgba(255,255,255,0.5)'}} axisLine={false} tickLine={false} tickFormatter={(value) => `${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(20, 25, 40, 0.8)', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="thu" stroke="#4ade80" strokeWidth={3} fillOpacity={1} fill="url(#colorThu)" />
                <Area type="monotone" dataKey="chi" stroke="#f87171" strokeWidth={3} fillOpacity={1} fill="url(#colorChi)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </TiltCard>

        <TiltCard>
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            Mục tiêu
          </h2>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-white/90">Du lịch Đà Lạt</span>
                <span className="text-blue-400 font-bold">65%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '65%' }}
                  transition={{ duration: 1, delay: 0.5 }}
                  className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full"
                />
              </div>
              <p className="text-xs text-white/50 mt-2 text-right">13tr / 20tr</p>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-white/90">Mua PS5</span>
                <span className="text-purple-400 font-bold">30%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '30%' }}
                  transition={{ duration: 1, delay: 0.7 }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full"
                />
              </div>
              <p className="text-xs text-white/50 mt-2 text-right">4.5tr / 15tr</p>
            </div>
          </div>

          <button className="w-full mt-8 py-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-colors font-medium flex items-center justify-center gap-2">
            + Thêm mục tiêu
          </button>
        </TiltCard>
      </div>
    </div>
  );
}
