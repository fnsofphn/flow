import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownCircle, ArrowUpCircle, Landmark, Plus, Wallet } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type FinanceEntry = {
  id: string;
  entry_type: 'contribution' | 'expense' | 'adjustment';
  amount: number;
  currency: string;
  person: string | null;
  reason: string;
  entry_at: string;
  source: string | null;
};

const emptyForm = {
  entryType: 'contribution',
  amount: '',
  person: '',
  reason: '',
  entryAt: '',
};

export default function Finance() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const loadEntries = async () => {
    const { data, error: queryError } = await supabase
      .from('finance_entries')
      .select('id, entry_type, amount, currency, person, reason, entry_at, source')
      .order('entry_at', { ascending: false });

    if (queryError) {
      setError(queryError.message);
      return;
    }

    setEntries((data as FinanceEntry[]) ?? []);
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const summary = useMemo(() => {
    const contributions = entries
      .filter((entry) => entry.entry_type === 'contribution')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const expenses = entries
      .filter((entry) => entry.entry_type === 'expense')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    const adjustments = entries
      .filter((entry) => entry.entry_type === 'adjustment')
      .reduce((sum, entry) => sum + Number(entry.amount), 0);

    return {
      contributions,
      expenses,
      adjustments,
      balance: contributions - expenses + adjustments,
    };
  }, [entries]);

  const handleSubmit = async () => {
    if (!form.amount || !form.reason.trim()) {
      setError('Vui lòng nhập số tiền và lý do.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      entry_type: form.entryType,
      amount: Number(form.amount),
      currency: 'VND',
      person: form.person.trim() || null,
      reason: form.reason.trim(),
      entry_at: form.entryAt ? new Date(form.entryAt).toISOString() : new Date().toISOString(),
    };

    const { data, error: insertError } = await supabase
      .from('finance_entries')
      .insert(payload)
      .select('id, entry_type, amount, currency, person, reason, entry_at, source')
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setEntries((current) => [data as FinanceEntry, ...current]);
      setForm(emptyForm);
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const previous = entries;
    setEntries((current) => current.filter((entry) => entry.id !== id));

    const { error: deleteError } = await supabase.from('finance_entries').delete().eq('id', id);

    if (deleteError) {
      setEntries(previous);
      setError(deleteError.message);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <header>
        <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-2 text-4xl font-bold tracking-tight">
          Tài chính chung
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-lg text-white/60">
          Theo dõi đóng quỹ, chi quỹ và các khoản điều chỉnh bằng đơn vị VNĐ.
        </motion.p>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <TiltCard className="border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/20 p-3"><Wallet className="h-6 w-6 text-blue-400" /></div>
            <div>
              <p className="text-sm font-medium text-white/60">Số dư quỹ</p>
              <p className="text-2xl font-bold">{summary.balance.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>
        </TiltCard>
        <TiltCard className="border-green-500/30 bg-gradient-to-br from-green-500/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-green-500/20 p-3"><ArrowUpCircle className="h-6 w-6 text-green-400" /></div>
            <div>
              <p className="text-sm font-medium text-white/60">Đã đóng quỹ</p>
              <p className="text-2xl font-bold text-green-300">+{summary.contributions.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>
        </TiltCard>
        <TiltCard className="border-red-500/30 bg-gradient-to-br from-red-500/20 to-transparent">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-red-500/20 p-3"><ArrowDownCircle className="h-6 w-6 text-red-400" /></div>
            <div>
              <p className="text-sm font-medium text-white/60">Đã chi quỹ</p>
              <p className="text-2xl font-bold text-red-300">-{summary.expenses.toLocaleString('vi-VN')} đ</p>
            </div>
          </div>
        </TiltCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <TiltCard>
          <div className="mb-6 flex items-center gap-2">
            <Landmark className="h-5 w-5 text-orange-300" />
            <h2 className="text-2xl font-semibold text-white/90">Ghi nhận giao dịch quỹ</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <select value={form.entryType} onChange={(event) => setForm((current) => ({ ...current, entryType: event.target.value as typeof current.entryType }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-orange-400 focus:outline-none">
                <option value="contribution">Đóng quỹ</option>
                <option value="expense">Trừ quỹ</option>
                <option value="adjustment">Điều chỉnh số dư</option>
              </select>
              <input type="number" value={form.amount} onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))} placeholder="Số tiền (VNĐ)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <input value={form.person} onChange={(event) => setForm((current) => ({ ...current, person: event.target.value }))} placeholder="Người đóng / người ghi nhận" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none" />
              <input type="datetime-local" value={form.entryAt} onChange={(event) => setForm((current) => ({ ...current, entryAt: event.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-orange-400 focus:outline-none [color-scheme:dark]" />
            </div>

            <textarea value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} rows={4} placeholder="Lý do, ví dụ: Nam đóng quỹ tháng 3 / Chi ăn tối kỷ niệm / Điều chỉnh đối chiếu cuối tuần" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none" />

            <button onClick={() => void handleSubmit()} disabled={isSaving} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-pink-500 px-5 py-3 font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60">
              <Plus className="h-4 w-4" />
              {isSaving ? 'Đang lưu...' : 'Lưu giao dịch'}
            </button>
          </div>
        </TiltCard>

        <TiltCard>
          <h2 className="mb-6 text-2xl font-semibold text-white/90">Sổ quỹ</h2>
          {!entries.length ? (
            <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-white/55">Chưa có giao dịch quỹ nào.</div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry) => {
                const isContribution = entry.entry_type === 'contribution';
                const isExpense = entry.entry_type === 'expense';
                return (
                  <div key={entry.id} className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${isContribution ? 'bg-green-500/15 text-green-300' : isExpense ? 'bg-red-500/15 text-red-300' : 'bg-white/10 text-white/70'}`}>
                          {isContribution ? 'Đóng quỹ' : isExpense ? 'Trừ quỹ' : 'Điều chỉnh'}
                        </span>
                        {entry.source === 'date_plan_activity' ? <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-semibold text-blue-200">Tự động từ hoạt động</span> : null}
                      </div>
                      <p className="font-medium text-white/90">{entry.reason}</p>
                      <p className="text-sm text-white/50">
                        {entry.person ? `${entry.person} • ` : ''}
                        {new Date(entry.entry_at).toLocaleString('vi-VN')}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className={`text-right text-lg font-bold ${isContribution ? 'text-green-300' : isExpense ? 'text-red-300' : 'text-orange-300'}`}>
                        {isContribution ? '+' : isExpense ? '-' : '±'}{Number(entry.amount).toLocaleString('vi-VN')} đ
                      </div>
                      <button onClick={() => void handleDelete(entry.id)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                        Xóa
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TiltCard>
      </div>
    </div>
  );
}
