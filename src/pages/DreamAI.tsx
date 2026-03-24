import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sparkles, Send, Loader2, Brain } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function DreamAI() {
  const [dream, setDream] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);

  const handleAnalyze = async () => {
    if (!dream.trim()) return;
    
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Phân tích giấc mơ sau đây của tôi: "${dream}". 
        Hãy phân tích theo các khía cạnh:
        1. Ý nghĩa tổng quan
        2. Cảm xúc ẩn giấu
        3. Biểu tượng chính
        4. Lời khuyên/Gợi ý cho ngày mới.
        Trả lời bằng tiếng Việt, định dạng rõ ràng, ngắn gọn, súc tích và mang tính chất động viên, tích cực.`,
        config: {
          temperature: 0.7,
        }
      });

      setAnalysis(response.text);
    } catch (error) {
      console.error('Error analyzing dream:', error);
      setAnalysis('Xin lỗi, có lỗi xảy ra khi phân tích giấc mơ. Vui lòng thử lại sau.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Dream AI
            <Moon className="w-8 h-8 text-indigo-400 fill-indigo-400" />
          </h1>
          <p className="text-white/60 text-lg">Giải mã những giấc mơ của bạn.</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TiltCard glow={false} className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-indigo-500/30">
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white/90">Kể lại giấc mơ</h2>
          </div>
          
          <textarea
            value={dream}
            onChange={(e) => setDream(e.target.value)}
            placeholder="Đêm qua bạn mơ thấy gì? Hãy kể chi tiết nhé..."
            className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/30 focus:outline-none focus:border-indigo-500 transition-colors resize-none mb-6"
          />

          <button 
            onClick={handleAnalyze}
            disabled={isAnalyzing || !dream.trim()}
            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white py-4 rounded-xl font-bold shadow-lg shadow-indigo-500/30 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Đang giải mã...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Phân tích giấc mơ
              </>
            )}
          </button>
        </TiltCard>

        <AnimatePresence mode="wait">
          {analysis ? (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full"
            >
              <TiltCard className="h-full bg-gradient-to-br from-purple-900/40 to-pink-900/40 border-purple-500/30">
                <div className="flex items-center gap-3 mb-6">
                  <Sparkles className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white/90">Lời giải mã</h2>
                </div>
                
                <div className="prose prose-invert max-w-none overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                  {analysis.split('\n').map((line, i) => (
                    <p key={i} className="mb-2 text-white/80 leading-relaxed">
                      {line}
                    </p>
                  ))}
                </div>
              </TiltCard>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full"
            >
              <TiltCard glow={false} className="h-full flex flex-col items-center justify-center text-center border-dashed border-2 border-white/10 bg-transparent">
                <Moon className="w-16 h-16 text-white/20 mb-4" />
                <p className="text-white/40 text-lg">AI đang chờ để lắng nghe giấc mơ của bạn...</p>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
