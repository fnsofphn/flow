import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckSquare, MapPin, Calendar, DollarSign, Plus, CheckCircle2, Circle } from 'lucide-react';
import TiltCard from '../components/TiltCard';

const initialTodos = [
  {
    id: 1,
    task: 'Mua vé xem phim Dune 2',
    assignee: 'Nam',
    deadline: '2024-03-25T19:00',
    cost: 250000,
    location: 'CGV Landmark 81',
    done: false,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.274371454522!2d106.7191142148011!3d10.790282992312015!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317528ab1a145625%3A0x6b45a9990b79144!2sLandmark%2081!5e0!3m2!1sen!2s!4v1645432123456!5m2!1sen!2s'
  },
  {
    id: 2,
    task: 'Đặt bàn nhà hàng kỷ niệm',
    assignee: 'Cy',
    deadline: '2024-03-26T20:00',
    cost: 1500000,
    location: 'The Deck Saigon',
    done: true,
    mapUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.123456789!2d106.73456789!3d10.80123456!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317526123456789%3A0x123456789abcdef!2sThe%20Deck%20Saigon!5e0!3m2!1sen!2s!4v1645432123456!5m2!1sen!2s'
  },
  {
    id: 3,
    task: 'Mua quà sinh nhật mẹ',
    assignee: 'Nam',
    deadline: '2024-04-01T10:00',
    cost: 500000,
    location: 'Vincom Center',
    done: false,
    mapUrl: null
  }
];

export default function Todo() {
  const [todos, setTodos] = useState(initialTodos);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  const toggleTodo = (id: number) => {
    setTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Việc cần làm
            <CheckSquare className="w-8 h-8 text-blue-400" />
          </h1>
          <p className="text-white/60 text-lg">Cùng nhau hoàn thành mục tiêu.</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-blue-500/30 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Thêm việc mới
        </motion.button>
      </header>

      <div className="grid grid-cols-1 gap-4">
        <AnimatePresence>
          {todos.map((todo) => (
            <motion.div
              key={todo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              layout
            >
              <TiltCard glow={!todo.done} className={`transition-all duration-500 ${todo.done ? 'opacity-60 grayscale-[50%]' : ''}`}>
                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                  
                  {/* Checkbox & Title */}
                  <div className="flex items-center gap-4 flex-1">
                    <button 
                      onClick={() => toggleTodo(todo.id)}
                      className="text-white/50 hover:text-white transition-colors"
                    >
                      {todo.done ? (
                        <CheckCircle2 className="w-8 h-8 text-green-500" />
                      ) : (
                        <Circle className="w-8 h-8 hover:text-blue-400" />
                      )}
                    </button>
                    <div>
                      <h3 className={`text-xl font-bold ${todo.done ? 'line-through text-white/50' : 'text-white/90'}`}>
                        {todo.task}
                      </h3>
                      <div className="flex items-center gap-3 mt-2 text-sm text-white/60">
                        <span className="bg-white/10 px-2 py-1 rounded text-white/80 font-medium">
                          {todo.assignee}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(todo.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details & Actions */}
                  <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto pl-12 md:pl-0">
                    <div className="flex items-center gap-2 bg-orange-500/10 text-orange-400 px-3 py-2 rounded-lg border border-orange-500/20">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-semibold">{todo.cost.toLocaleString()}đ</span>
                    </div>
                    
                    {todo.location && (
                      <button 
                        onClick={() => todo.mapUrl && setSelectedMap(todo.mapUrl)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                          todo.mapUrl 
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                            : 'bg-white/5 text-white/50 border-white/10 cursor-default'
                        }`}
                      >
                        <MapPin className="w-4 h-4" />
                        <span className="font-medium truncate max-w-[150px]">{todo.location}</span>
                      </button>
                    )}
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Map Modal */}
      <AnimatePresence>
        {selectedMap && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
            onClick={() => setSelectedMap(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="w-full max-w-4xl bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center p-4 border-b border-white/10 bg-black/50">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  Bản đồ địa điểm
                </h3>
                <button 
                  className="text-white/50 hover:text-white transition-colors"
                  onClick={() => setSelectedMap(null)}
                >
                  Đóng
                </button>
              </div>
              <div className="w-full h-[60vh]">
                <iframe 
                  src={selectedMap} 
                  width="100%" 
                  height="100%" 
                  style={{ border: 0 }} 
                  allowFullScreen 
                  loading="lazy" 
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale-[20%] contrast-125"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
