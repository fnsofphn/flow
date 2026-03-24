import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Moon, Sparkles, Loader2, Brain, History } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { GoogleGenAI } from '@google/genai';
import { supabase } from '../lib/supabase';

const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

type DreamEntry = {
  id: string;
  content: string;
  analysis: string;
  created_at: string;
};

export default function DreamAI() {
  const [dream, setDream] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [history, setHistory] = useState<DreamEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = async () => {
    const { data, error: queryError } = await supabase
      .from('dream_entries')
      .select('id, content, analysis, created_at')
      .order('created_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
    } else {
      setHistory((data as DreamEntry[]) ?? []);
    }
  };

  useEffect(() => {
    void loadHistory();
  }, []);

  const handleAnalyze = async () => {
    if (!dream.trim()) return;
    if (!ai) {
      setError('Thiáº¿u VITE_GEMINI_API_KEY nÃªn chÆ°a thá»ƒ phÃ¢n tÃ­ch giáº¥c mÆ¡.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `PhÃ¢n tÃ­ch giáº¥c mÆ¡ sau Ä‘Ã¢y cá»§a tÃ´i: "${dream}".
        HÃ£y phÃ¢n tÃ­ch theo cÃ¡c khÃ­a cáº¡nh:
        1. Ã nghÄ©a tá»•ng quan
        2. Cáº£m xÃºc áº©n giáº¥u
        3. Biá»ƒu tÆ°á»£ng chÃ­nh
        4. Lá»i khuyÃªn hoáº·c gá»£i Ã½ cho ngÃ y má»›i.
        Tráº£ lá»i báº±ng tiáº¿ng Viá»‡t, ngáº¯n gá»n, rÃµ rÃ ng vÃ  tÃ­ch cá»±c.`,
        config: {
          temperature: 0.7,
        },
      });

      const nextAnalysis = response.text;
      setAnalysis(nextAnalysis);

      const { data, error: insertError } = await supabase
        .from('dream_entries')
        .insert({
          content: dream.trim(),
          analysis: nextAnalysis,
        })
        .select('id, content, analysis, created_at')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setHistory((current) => [data as DreamEntry, ...current]);
      }

      setDream('');
    } catch (caughtError) {
      console.error('Error analyzing dream:', caughtError);
      setError('Xin lá»—i, cÃ³ lá»—i xáº£y ra khi phÃ¢n tÃ­ch giáº¥c mÆ¡. Vui lÃ²ng thá»­ láº¡i sau.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="relative space-y-8 pb-24">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Giáº¥c mÆ¡ AI
            <Moon className="h-8 w-8 fill-indigo-400 text-indigo-400" />
          </h1>
          <p className="text-lg text-white/60">
            PhÃ¢n tÃ­ch giáº¥c mÆ¡ vÃ  lÆ°u toÃ n bá»™ lá»‹ch sá»­ giáº£i mÃ£ vÃ o kho dữ liệu.
          </p>
        </motion.div>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TiltCard glow={false} className="border-indigo-500/30 bg-gradient-to-br from-indigo-900/40 to-purple-900/40">
          <div className="mb-6 flex items-center gap-3">
            <Brain className="h-6 w-6 text-indigo-400" />
            <h2 className="text-2xl font-bold text-white/90">Ká»ƒ láº¡i giáº¥c mÆ¡</h2>
          </div>

          <textarea
            value={dream}
            onChange={(event) => setDream(event.target.value)}
            placeholder="ÄÃªm qua báº¡n mÆ¡ tháº¥y gÃ¬? HÃ£y ká»ƒ chi tiáº¿t nhÃ©..."
            className="mb-6 h-48 w-full resize-none rounded-2xl border border-white/10 bg-white/5 p-4 text-white placeholder:text-white/30 transition-colors focus:border-indigo-500 focus:outline-none"
          />

          <button
            onClick={() => void handleAnalyze()}
            disabled={isAnalyzing || !dream.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 py-4 font-bold text-white shadow-lg shadow-indigo-500/30 transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Äang giáº£i mÃ£...
              </>
            ) : (
              <>
                <Sparkles className="h-5 w-5" />
                PhÃ¢n tÃ­ch giáº¥c mÆ¡
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
              <TiltCard className="h-full border-purple-500/30 bg-gradient-to-br from-purple-900/40 to-pink-900/40">
                <div className="mb-6 flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                  <h2 className="text-2xl font-bold text-white/90">Lá»i giáº£i mÃ£</h2>
                </div>

                <div className="custom-scrollbar max-h-[420px] overflow-y-auto pr-2">
                  {analysis.split('\n').map((line, index) => (
                    <p key={index} className="mb-2 leading-relaxed text-white/80">
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
              <TiltCard glow={false} className="flex h-full flex-col items-center justify-center border-2 border-dashed border-white/10 bg-transparent text-center">
                <Moon className="mb-4 h-16 w-16 text-white/20" />
                <p className="text-lg text-white/40">
                  AI Ä‘ang chá» Ä‘á»ƒ láº¯ng nghe giáº¥c mÆ¡ cá»§a báº¡n...
                </p>
              </TiltCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <TiltCard className="bg-white/5">
        <div className="mb-6 flex items-center gap-3">
          <History className="h-5 w-5 text-indigo-300" />
          <h2 className="text-2xl font-bold text-white">Lá»‹ch sá»­ giáº¥c mÆ¡ Ä‘Ã£ lÆ°u</h2>
        </div>

        {!history.length ? (
          <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-8 text-center text-white/55">
            ChÆ°a cÃ³ giáº¥c mÆ¡ nÃ o Ä‘Æ°á»£c lÆ°u trong kho dữ liệu.
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4"
              >
                <p className="font-semibold text-white">{entry.content}</p>
                <p className="mt-2 text-sm text-white/50">
                  {new Date(entry.created_at).toLocaleString('vi-VN')}
                </p>
                <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/70">
                  {entry.analysis}
                </p>
              </div>
            ))}
          </div>
        )}
      </TiltCard>
    </div>
  );
}

