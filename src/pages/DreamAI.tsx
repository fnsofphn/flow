import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Brain, Loader2, Moon, Sparkles, Trash2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type DreamEntry = {
  id: string;
  content: string;
  analysis: string;
  created_at: string;
};

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function DreamAI() {
  const [dream, setDream] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [entries, setEntries] = useState<DreamEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = async () => {
    const { data, error: queryError } = await supabase
      .from('dream_entries')
      .select('id, content, analysis, created_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      return;
    }

    setEntries((data as DreamEntry[]) ?? []);
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const handleAnalyze = async () => {
    if (!dream.trim()) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);

    try {
      const prompt = `Phân tích giấc mơ sau đây: "${dream}".
Hãy trả lời bằng tiếng Việt, súc tích, ấm áp và có cấu trúc gồm:
1. Ý nghĩa tổng quan
2. Cảm xúc nổi bật
3. Biểu tượng đáng chú ý
4. Gợi ý nhẹ nhàng cho ngày mới`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          temperature: 0.7,
        },
      });

      const nextAnalysis = response.text ?? 'Chưa nhận được nội dung phân tích.';
      setAnalysis(nextAnalysis);

      const { data: inserted, error: insertError } = await supabase
        .from('dream_entries')
        .insert({
          content: dream.trim(),
          analysis: nextAnalysis,
        })
        .select('id, content, analysis, created_at')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (inserted) {
        setEntries((current) => [inserted as DreamEntry, ...current]);
      }

      setDream('');
    } catch (caughtError) {
      console.error('Error analyzing dream:', caughtError);
      setError('Không thể phân tích giấc mơ vào lúc này. Vui lòng thử lại sau.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id: string) => {
    const previous = entries;
    setEntries((current) => current.filter((entry) => entry.id !== id));

    const { error: deleteError } = await supabase.from('dream_entries').delete().eq('id', id);

    if (deleteError) {
      setEntries(previous);
      setError(deleteError.message);
    }
  };

  return (
    <div className="relative space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Giấc mơ AI
            <Moon className="h-8 w-8 fill-indigo-400 text-indigo-400" />
          </h1>
          <p className="text-lg text-white/60">Phân tích giấc mơ và lưu lại nhật ký để bạn xem lại sau.</p>
        </motion.div>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <TiltCard glow={false} className="border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
          <div className="mb-6 flex items-center gap-3">
            <Brain className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white/90">Nhập giấc mơ mới</h2>
          </div>

          <textarea
            value={dream}
            onChange={(event) => setDream(event.target.value)}
            placeholder="Đêm qua bạn đã mơ thấy điều gì? Hãy kể lại càng chi tiết càng tốt."
            className="mb-6 h-48 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-white/30 focus:border-indigo-500 focus:outline-none transition-colors"
          />

          <button
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing || !dream.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang phân tích...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                Phân tích và lưu lại
              </>
            )}
          </button>
        </TiltCard>

        <AnimatePresence mode="wait">
          <motion.div key={analysis ?? 'empty'} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full">
            <TiltCard className="h-full border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-pink-900/40">
              <div className="mb-6 flex items-center gap-3">
                <Sparkles className="h-6 w-6 text-purple-400" />
                <h2 className="text-2xl font-bold text-white/90">Bản phân tích gần nhất</h2>
              </div>

              {analysis ? (
                <div className="max-h-[420px] overflow-y-auto pr-2">
                  {analysis.split('\n').map((line, index) => (
                    <p key={index} className="mb-3 leading-relaxed text-white/80">
                      {line}
                    </p>
                  ))}
                </div>
              ) : (
                <div className="flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-transparent text-center">
                  <Moon className="mb-4 h-16 w-16 text-white/20" />
                  <p className="text-lg text-white/50">Bản phân tích mới sẽ xuất hiện ở đây sau khi bạn gửi giấc mơ.</p>
                </div>
              )}
            </TiltCard>
          </motion.div>
        </AnimatePresence>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white/90">Lịch sử giấc mơ</h2>
          <span className="text-sm text-white/40">{entries.length} mục đã lưu</span>
        </div>

        {!entries.length ? (
          <TiltCard className="text-center text-white/60">Bạn chưa lưu giấc mơ nào.</TiltCard>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {entries.map((entry) => (
              <div key={entry.id}>
                <TiltCard className="space-y-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm uppercase tracking-[0.2em] text-white/35">{new Date(entry.created_at).toLocaleString('vi-VN')}</p>
                      <h3 className="mt-2 text-lg font-semibold text-white/90">{entry.content}</h3>
                    </div>
                    <button
                      onClick={() => void handleDelete(entry.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                    >
                      <Trash2 className="h-4 w-4" />
                      Xóa
                    </button>
                  </div>

                  <div className="space-y-2 border-t border-white/10 pt-4">
                    {entry.analysis.split('\n').map((line, index) => (
                      <p key={index} className="leading-relaxed text-white/75">
                        {line}
                      </p>
                    ))}
                  </div>
                </TiltCard>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
