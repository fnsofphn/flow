import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plane, Map, Filter, Sparkles, DollarSign, Star, Loader2 } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const mockDestinations = [
  {
    id: 1,
    name: 'Đà Lạt',
    image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?q=80&w=2070&auto=format&fit=crop',
    cost: '5,000,000đ - 10,000,000đ',
    mood: 'Lãng mạn, Thư giãn',
    rating: 4.8,
    reviews: 124
  },
  {
    id: 2,
    name: 'Phú Quốc',
    image: 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?q=80&w=2128&auto=format&fit=crop',
    cost: '10,000,000đ - 20,000,000đ',
    mood: 'Sôi động, Biển xanh',
    rating: 4.9,
    reviews: 89
  },
  {
    id: 3,
    name: 'Sapa',
    image: 'https://images.unsplash.com/photo-1528127269322-539801943592?q=80&w=2070&auto=format&fit=crop',
    cost: '6,000,000đ - 12,000,000đ',
    mood: 'Khám phá, Mát mẻ',
    rating: 4.7,
    reviews: 210
  }
];

export default function TravelSystem() {
  const [mood, setMood] = useState('Thư giãn');
  const [budget, setBudget] = useState('10000000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const handleSuggest = async () => {
    setIsGenerating(true);
    setAiSuggestion(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Gợi ý một chuyến du lịch cho cặp đôi. 
        Tâm trạng mong muốn: ${mood}. 
        Ngân sách dự kiến: ${parseInt(budget).toLocaleString()} VNĐ.
        Hãy gợi ý:
        1. Địa điểm phù hợp nhất ở Việt Nam (hoặc gần VN).
        2. Lý do chọn địa điểm này.
        3. 3 hoạt động chính nên làm cùng nhau.
        4. Ước tính chi phí cơ bản.
        Trả lời bằng tiếng Việt, định dạng rõ ràng, lãng mạn và thực tế.`,
      });

      setAiSuggestion(response.text);
    } catch (error) {
      console.error('Error generating travel suggestion:', error);
      setAiSuggestion('Xin lỗi, không thể lấy gợi ý lúc này. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Hệ thống Du lịch
            <Plane className="w-8 h-8 text-cyan-400" />
          </h1>
          <p className="text-white/60 text-lg">Khám phá thế giới cùng nhau.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Suggestion Panel */}
        <TiltCard className="lg:col-span-1 bg-gradient-to-br from-cyan-900/40 to-blue-900/40 border-cyan-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-cyan-400" />
            <h2 className="text-2xl font-bold text-white/90">AI Gợi ý</h2>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Tâm trạng hiện tại</label>
              <select 
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 appearance-none"
              >
                <option value="Thư giãn">Thư giãn, chữa lành</option>
                <option value="Lãng mạn">Lãng mạn, riêng tư</option>
                <option value="Khám phá">Khám phá, mạo hiểm</option>
                <option value="Sôi động">Sôi động, tiệc tùng</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Ngân sách (VNĐ)</label>
              <input 
                type="number" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500"
              />
              <p className="text-xs text-white/50 mt-1 text-right">{parseInt(budget || '0').toLocaleString()}đ</p>
            </div>
          </div>

          <button 
            onClick={handleSuggest}
            disabled={isGenerating}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-cyan-500/30 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Map className="w-5 h-5" />
            )}
            {isGenerating ? 'Đang tìm kiếm...' : 'Gợi ý chuyến đi'}
          </button>

          <AnimatePresence>
            {aiSuggestion && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-6 pt-6 border-t border-white/10"
              >
                <div className="prose prose-invert max-w-none text-sm text-white/80 leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                  {aiSuggestion.split('\n').map((line, i) => (
                    <p key={i} className="mb-2">{line}</p>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </TiltCard>

        {/* Popular Destinations */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          {mockDestinations.map((dest, index) => (
            <motion.div
              key={dest.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <TiltCard className="p-0 overflow-hidden group h-[300px] flex flex-col">
                <div className="relative h-40 overflow-hidden">
                  <img 
                    src={dest.image} 
                    alt={dest.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                  <h3 className="absolute bottom-4 left-4 text-2xl font-bold text-white drop-shadow-md">{dest.name}</h3>
                </div>
                
                <div className="p-5 flex-1 flex flex-col justify-between bg-white/5">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <DollarSign className="w-4 h-4 text-green-400" />
                      {dest.cost}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/70">
                      <Sparkles className="w-4 h-4 text-purple-400" />
                      {dest.mood}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/10">
                    <div className="flex items-center gap-1 text-yellow-400 font-medium text-sm">
                      <Star className="w-4 h-4 fill-current" />
                      {dest.rating} <span className="text-white/40 text-xs">({dest.reviews})</span>
                    </div>
                    <button className="text-sm font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                      Xem chi tiết &rarr;
                    </button>
                  </div>
                </div>
              </TiltCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
