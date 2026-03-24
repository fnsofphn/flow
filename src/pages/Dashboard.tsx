import React from 'react';
import { motion } from 'motion/react';
import { Wallet, TrendingUp, Heart, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import TiltCard from '../components/TiltCard';

export default function Dashboard() {
  return (
    <div className="space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Chào buổi sáng, <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">Nam & Cy</span>
          </h1>
          <p className="text-white/60 text-lg">Hôm nay là một ngày tuyệt vời để tạo thêm kỷ niệm.</p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md border border-white/10"
        >
          <Heart className="w-5 h-5 text-pink-500 fill-pink-500 animate-pulse" />
          <span className="font-medium">Mood: Hạnh phúc</span>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Finance Overview */}
        <TiltCard className="col-span-1 md:col-span-2">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-orange-400" />
                Tổng Quỹ Chung
              </h2>
              <p className="text-4xl font-bold mt-2 tracking-tight">24,500,000 <span className="text-xl text-white/50 font-normal">VND</span></p>
            </div>
            <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium border border-green-500/30">
              +12% tháng này
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-8">
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-sm text-white/50 mb-1">Đã chi</p>
              <p className="text-xl font-semibold text-red-400">-4,200,000đ</p>
            </div>
            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
              <p className="text-sm text-white/50 mb-1">Mục tiêu (Đà Lạt)</p>
              <p className="text-xl font-semibold text-blue-400">65% hoàn thành</p>
            </div>
          </div>
        </TiltCard>

        {/* Quick Actions */}
        <TiltCard glow={false} className="col-span-1 bg-gradient-to-br from-orange-500/20 to-pink-500/20">
          <h2 className="text-xl font-semibold text-white/90 mb-6">Hành động nhanh</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl border border-white/10 group">
              <span className="font-medium">Ghi chép chi tiêu</span>
              <Wallet className="w-5 h-5 text-white/50 group-hover:text-white transition-colors" />
            </button>
            <button className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl border border-white/10 group">
              <span className="font-medium">Lên lịch hẹn hò</span>
              <Heart className="w-5 h-5 text-white/50 group-hover:text-pink-400 transition-colors" />
            </button>
            <button className="w-full flex items-center justify-between bg-white/10 hover:bg-white/20 transition-colors p-4 rounded-xl border border-white/10 group">
              <span className="font-medium">Gửi lời nhắn tâm tư</span>
              <Heart className="w-5 h-5 text-white/50 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* To-Do List */}
        <TiltCard>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white/90 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-blue-400" />
              Việc cần làm
            </h2>
            <button className="text-sm text-orange-400 hover:text-orange-300">Xem tất cả</button>
          </div>
          
          <div className="space-y-3">
            {[
              { id: 1, task: 'Mua vé xem phim Dune 2', assignee: 'Nam', done: false },
              { id: 2, task: 'Đặt bàn nhà hàng kỷ niệm', assignee: 'Cy', done: true },
              { id: 3, task: 'Chuyển tiền quỹ tháng', assignee: 'Nam', done: false },
            ].map((todo) => (
              <div key={todo.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group cursor-pointer">
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.done ? 'bg-green-500 border-green-500' : 'border-white/30 group-hover:border-orange-400'}`}>
                  {todo.done && <CheckCircle2 className="w-4 h-4 text-white" />}
                </div>
                <span className={`flex-1 ${todo.done ? 'line-through text-white/40' : 'text-white/90'}`}>
                  {todo.task}
                </span>
                <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/60">
                  {todo.assignee}
                </span>
              </div>
            ))}
          </div>
        </TiltCard>

        {/* Memory Highlight */}
        <TiltCard className="relative overflow-hidden group p-0">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10" />
          <img 
            src="https://images.unsplash.com/photo-1522673607200-164d1b6ce486?q=80&w=2070&auto=format&fit=crop" 
            alt="Memory" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
            <div className="flex items-center gap-2 mb-2">
              <ImageIcon className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-semibold uppercase tracking-wider text-orange-400">Kỷ niệm nổi bật</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">Chuyến đi Đà Lạt</h3>
            <p className="text-white/70 text-sm">Ngày này 1 năm trước</p>
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
