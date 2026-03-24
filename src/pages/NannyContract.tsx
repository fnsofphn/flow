import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Coins, FileSignature, Save } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type ContractDocument = {
  id: string;
  title: string;
  content: string;
  updated_at: string;
};

export default function NannyContract() {
  const [documentState, setDocumentState] = useState<ContractDocument | null>(null);
  const [title, setTitle] = useState('Hợp đồng bảo mẫu');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const words = content.trim() ? content.trim().split(/\s+/).length : 0;
    const paragraphs = content.trim() ? content.trim().split(/\n\s*\n/).length : 0;
    return { words, paragraphs };
  }, [content]);

  const loadDocument = async () => {
    const { data, error: queryError } = await supabase
      .from('contract_documents')
      .select('id, title, content, updated_at')
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (queryError) {
      setError(queryError.message);
      return;
    }

    if (data) {
      const contract = data as ContractDocument;
      setDocumentState(contract);
      setTitle(contract.title);
      setContent(contract.content);
    }
  };

  useEffect(() => {
    void loadDocument();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    if (documentState) {
      const { data, error: updateError } = await supabase
        .from('contract_documents')
        .update({ title: title.trim() || 'Hợp đồng bảo mẫu', content, updated_at: new Date().toISOString() })
        .eq('id', documentState.id)
        .select('id, title, content, updated_at')
        .single();

      if (updateError) {
        setError(updateError.message);
      } else if (data) {
        setDocumentState(data as ContractDocument);
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('contract_documents')
        .insert({ title: title.trim() || 'Hợp đồng bảo mẫu', content })
        .select('id, title, content, updated_at')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setDocumentState(data as ContractDocument);
      }
    }

    setIsSaving(false);
  };

  return (
    <div className="relative space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Hợp đồng bảo mẫu
            <FileSignature className="h-8 w-8 text-amber-500" />
          </h1>
          <p className="text-lg text-white/60">Không còn mockup hợp đồng. Bạn có thể tự biên soạn và lưu nội dung chính thức tại đây.</p>
        </motion.div>

        <button
          onClick={() => void handleSave()}
          disabled={isSaving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 px-6 py-3 font-bold text-black shadow-lg shadow-amber-500/30 disabled:opacity-60"
        >
          <Save className="h-5 w-5" />
          {isSaving ? 'Đang lưu...' : 'Lưu hợp đồng'}
        </button>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <TiltCard className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/60">Tiêu đề</label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/60">Nội dung hợp đồng</label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Bạn có thể tự nhập toàn bộ điều khoản, phạm vi công việc, thời hạn và điều kiện thanh toán tại đây."
              className="min-h-[520px] w-full rounded-2xl border border-white/10 bg-white/5 p-5 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
            />
          </div>
        </TiltCard>

        <div className="space-y-6">
          <TiltCard className="bg-gradient-to-br from-amber-900/35 to-yellow-900/35 border-amber-500/25">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-500/20 p-3">
                <Coins className="h-6 w-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60">Từ khóa nội dung</p>
                <p className="text-3xl font-bold text-amber-300">{stats.words}</p>
              </div>
            </div>
          </TiltCard>

          <TiltCard>
            <h2 className="text-xl font-semibold text-white/90">Trạng thái tài liệu</h2>
            <div className="mt-4 space-y-4 text-sm text-white/65">
              <p>Số đoạn nội dung: <span className="font-semibold text-white">{stats.paragraphs}</span></p>
              <p>Lần cập nhật gần nhất: <span className="font-semibold text-white">{documentState ? new Date(documentState.updated_at).toLocaleString('vi-VN') : 'Chưa lưu lần nào'}</span></p>
              <p>Gợi ý: bạn có thể tách hợp đồng thành các phần như phạm vi công việc, quy định phối hợp, thanh toán và điều khoản thay đổi.</p>
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
