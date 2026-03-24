import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, Mail, Lock, Unlock, Send, Sparkles } from 'lucide-react';
import TiltCard from '../components/TiltCard';

interface Note {
  id: number;
  content: string;
  emotion: string;
  unlockDate: string;
  isUnlocked: boolean;
}

const initialNotes: Note[] = [
  {
    id: 1,
    content: 'Hôm nay anh thấy em cười rất tươi khi được ăn món yêu thích. Anh sẽ nhớ mãi khoảnh khắc này.',
    emotion: 'Hạnh phúc',
    unlockDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    isUnlocked: true,
  },
  {
    id: 2,
    content: 'Em xin lỗi vì đã cáu gắt sáng nay. Em yêu anh nhiều lắm.',
    emotion: 'Hối lỗi',
    unlockDate: new Date(Date.now() + 86400000 * 7).toISOString(), // Next week
    isUnlocked: false,
  }
];

export default function EmotionalMemory() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isWriting, setIsWriting] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newEmotion, setNewEmotion] = useState('Hạnh phúc');
  const [unlockDays, setUnlockDays] = useState(1);
  const [openedNote, setOpenedNote] = useState<Note | null>(null);

  const handleSave = () => {
    if (!newContent.trim()) return;
    
    const unlockDate = new Date();
    unlockDate.setDate(unlockDate.getDate() + unlockDays);

    const newNote: Note = {
      id: Date.now(),
      content: newContent,
      emotion: newEmotion,
      unlockDate: unlockDate.toISOString(),
      isUnlocked: false,
    };

    setNotes([newNote, ...notes]);
    setIsWriting(false);
    setNewContent('');
  };

  const handleOpenNote = (note: Note) => {
    if (new Date(note.unlockDate) <= new Date()) {
      setOpenedNote(note);
      setNotes(notes.map(n => n.id === note.id ? { ...n, isUnlocked: true } : n));
    }
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Hộp tâm tư
            <Mail className="w-8 h-8 text-rose-400" />
          </h1>
          <p className="text-white/60 text-lg">Gửi gắm cảm xúc, mở ra theo thời gian.</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsWriting(true)}
          className="bg-gradient-to-r from-rose-500 to-pink-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-rose-500/30 flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Viết thư mới
        </motion.button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {notes.map((note) => {
            const isReady = new Date(note.unlockDate) <= new Date();
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                layout
              >
                <TiltCard 
                  glow={isReady && !note.isUnlocked} 
                  className={`cursor-pointer transition-all duration-500 ${!isReady ? 'opacity-60 grayscale-[30%]' : ''}`}
                >
                  <div 
                    className="h-48 flex flex-col items-center justify-center text-center relative"
                    onClick={() => handleOpenNote(note)}
                  >
                    {note.isUnlocked ? (
                      <>
                        <Mail className="w-12 h-12 text-rose-400 mb-4" />
                        <p className="text-white/90 font-medium line-clamp-2 px-4">{note.content}</p>
                        <span className="absolute bottom-0 text-xs text-white/40">Đã mở</span>
                      </>
                    ) : isReady ? (
                      <>
                        <div className="relative">
                          <Mail className="w-16 h-16 text-rose-400 mb-4 animate-bounce" />
                          <Sparkles className="w-6 h-6 text-yellow-400 absolute -top-2 -right-2 animate-pulse" />
                        </div>
                        <p className="text-white/90 font-bold text-lg">Thư đã sẵn sàng!</p>
                        <p className="text-rose-400 text-sm mt-2">Nhấn để mở</p>
                      </>
                    ) : (
                      <>
                        <Lock className="w-12 h-12 text-white/30 mb-4" />
                        <p className="text-white/50 font-medium">Sẽ mở vào</p>
                        <p className="text-white/80 font-bold mt-1">
                          {new Date(note.unlockDate).toLocaleDateString('vi-VN')}
                        </p>
                      </>
                    )}
                  </div>
                </TiltCard>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Write Modal */}
      <AnimatePresence>
        {isWriting && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsWriting(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-lg bg-gray-900 rounded-3xl border border-white/10 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Heart className="w-6 h-6 text-rose-500" />
                Gửi gắm tâm tư
              </h2>
              
              <div className="space-y-4">
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì? Cảm xúc lúc này ra sao..."
                  className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-rose-500 resize-none"
                />
                
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm text-white/60 mb-2">Cảm xúc</label>
                    <select 
                      value={newEmotion}
                      onChange={(e) => setNewEmotion(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500 appearance-none"
                    >
                      <option value="Hạnh phúc">Hạnh phúc</option>
                      <option value="Biết ơn">Biết ơn</option>
                      <option value="Hối lỗi">Hối lỗi</option>
                      <option value="Bất ngờ">Bất ngờ</option>
                      <option value="Buồn">Buồn</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm text-white/60 mb-2">Mở sau (ngày)</label>
                    <input 
                      type="number" 
                      min="1"
                      value={unlockDays}
                      onChange={(e) => setUnlockDays(parseInt(e.target.value) || 1)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  className="w-full mt-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-rose-500/30 hover:scale-[1.02] transition-transform"
                >
                  Niêm phong & Gửi
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Read Modal */}
      <AnimatePresence>
        {openedNote && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md"
              onClick={() => setOpenedNote(null)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
              transition={{ type: 'spring', damping: 20, stiffness: 100 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md"
            >
              <div className="bg-[#fdfbf7] text-[#3a2a22] p-8 rounded-sm shadow-2xl relative" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}>
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-400 to-pink-400" />
                <div className="flex justify-between items-center mb-6 border-b border-[#3a2a22]/10 pb-4">
                  <span className="font-serif italic text-rose-600">{openedNote.emotion}</span>
                  <span className="text-sm opacity-60 font-mono">
                    {new Date(openedNote.unlockDate).toLocaleDateString('vi-VN')}
                  </span>
                </div>
                <p className="font-serif text-lg leading-relaxed whitespace-pre-wrap">
                  {openedNote.content}
                </p>
                <div className="mt-8 text-right">
                  <span className="font-serif italic opacity-60">NamCy</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
