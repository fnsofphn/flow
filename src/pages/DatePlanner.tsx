import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CalendarHeart, Plus, Clock, MapPin, DollarSign, Heart, X } from 'lucide-react';
import TiltCard from '../components/TiltCard';

interface Activity {
  id: number;
  name: string;
  cost: number;
}

interface DatePlan {
  id: number;
  title: string;
  datetime: string;
  activities: Activity[];
}

const initialPlans: DatePlan[] = [
  {
    id: 1,
    title: 'Kỷ niệm 2 năm yêu nhau',
    datetime: '2024-05-10T18:00',
    activities: [
      { id: 1, name: 'Ăn tối The Deck', cost: 2500000 },
      { id: 2, name: 'Xem phim', cost: 300000 },
      { id: 3, name: 'Dạo phố đi bộ', cost: 100000 }
    ]
  }
];

export default function DatePlanner() {
  const [plans, setPlans] = useState<DatePlan[]>(initialPlans);
  const [isCreating, setIsCreating] = useState(false);
  
  const [newTitle, setNewTitle] = useState('');
  const [newDatetime, setNewDatetime] = useState('');
  const [newActivities, setNewActivities] = useState<Activity[]>([{ id: Date.now(), name: '', cost: 0 }]);

  const handleAddActivity = () => {
    setNewActivities([...newActivities, { id: Date.now(), name: '', cost: 0 }]);
  };

  const handleActivityChange = (id: number, field: keyof Activity, value: string | number) => {
    setNewActivities(newActivities.map(a => a.id === id ? { ...a, [field]: value } : a));
  };

  const handleRemoveActivity = (id: number) => {
    setNewActivities(newActivities.filter(a => a.id !== id));
  };

  const handleSave = () => {
    if (!newTitle || !newDatetime) return;
    const newPlan: DatePlan = {
      id: Date.now(),
      title: newTitle,
      datetime: newDatetime,
      activities: newActivities.filter(a => a.name.trim() !== '')
    };
    setPlans([newPlan, ...plans]);
    setIsCreating(false);
    setNewTitle('');
    setNewDatetime('');
    setNewActivities([{ id: Date.now(), name: '', cost: 0 }]);
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Hệ thống hẹn hò
            <CalendarHeart className="w-8 h-8 text-pink-500" />
          </h1>
          <p className="text-white/60 text-lg">Lên kế hoạch cho những buổi hẹn hoàn hảo.</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsCreating(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-pink-500/30 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tạo cuộc hẹn
        </motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {plans.map((plan) => {
            const totalCost = plan.activities.reduce((sum, act) => sum + act.cost, 0);
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                layout
              >
                <TiltCard className="border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-transparent">
                  <div className="flex justify-between items-start mb-6">
                    <h2 className="text-2xl font-bold text-white/90 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                      {plan.title}
                    </h2>
                    <div className="bg-white/10 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-400" />
                      {new Date(plan.datetime).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </div>
                  </div>

                  <div className="space-y-3 mb-6">
                    {plan.activities.map((act, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/5">
                        <span className="flex items-center gap-2 text-white/80">
                          <div className="w-2 h-2 rounded-full bg-pink-500" />
                          {act.name}
                        </span>
                        <span className="font-medium text-orange-300">{act.cost.toLocaleString()}đ</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/10">
                    <span className="text-white/50 text-sm uppercase tracking-wider font-semibold">Tổng chi phí dự kiến</span>
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
                      {totalCost.toLocaleString()}đ
                    </span>
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {isCreating && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsCreating(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 md:left-1/2 md:-translate-x-1/2 md:bottom-auto md:top-1/2 md:-translate-y-1/2 z-[101] w-full md:w-[600px] max-h-[90vh] overflow-y-auto bg-gray-900 md:rounded-3xl rounded-t-3xl border border-white/10 shadow-2xl"
            >
              <div className="p-6 md:p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <CalendarHeart className="w-6 h-6 text-pink-500" />
                    Lên lịch hẹn hò mới
                  </h2>
                  <button onClick={() => setIsCreating(false)} className="text-white/50 hover:text-white p-2 bg-white/5 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Tên cuộc hẹn</label>
                    <input 
                      type="text" 
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="VD: Kỷ niệm 2 năm..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/70 mb-2">Thời gian</label>
                    <input 
                      type="datetime-local" 
                      value={newDatetime}
                      onChange={(e) => setNewDatetime(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-pink-500 transition-colors [color-scheme:dark]"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-sm font-medium text-white/70">Danh sách hoạt động</label>
                      <button onClick={handleAddActivity} className="text-sm text-pink-400 hover:text-pink-300 flex items-center gap-1">
                        <Plus className="w-4 h-4" /> Thêm
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      {newActivities.map((act, idx) => (
                        <div key={act.id} className="flex gap-3 items-center">
                          <input 
                            type="text" 
                            value={act.name}
                            onChange={(e) => handleActivityChange(act.id, 'name', e.target.value)}
                            placeholder="Tên hoạt động"
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500"
                          />
                          <input 
                            type="number" 
                            value={act.cost || ''}
                            onChange={(e) => handleActivityChange(act.id, 'cost', parseInt(e.target.value) || 0)}
                            placeholder="Chi phí"
                            className="w-32 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-pink-500"
                          />
                          <button 
                            onClick={() => handleRemoveActivity(act.id)}
                            className="p-3 text-white/30 hover:text-red-400 bg-white/5 rounded-xl border border-white/10"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t border-white/10 flex justify-between items-center">
                    <div>
                      <p className="text-sm text-white/50">Tổng dự kiến</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {newActivities.reduce((sum, act) => sum + (act.cost || 0), 0).toLocaleString()}đ
                      </p>
                    </div>
                    <button 
                      onClick={handleSave}
                      className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
                    >
                      Lưu kế hoạch
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
