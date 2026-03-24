import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Coins,
  RefreshCcw,
  Sparkles,
  Wallet,
} from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type EntryType = 'contribution' | 'expense' | 'adjustment';

type FinanceEntry = {
  id: string;
  entry_type: EntryType;
  amount: number;
  currency: string;
  person: string | null;
  reason: string;
  entry_at: string;
  source: string | null;
};

const typeOptions: Array<{
  value: EntryType;
  label: string;
  description: string;
}> = [
  {
    value: 'contribution',
    label: 'Đóng quỹ',
    description: 'Ghi nhanh khoản nạp vào quỹ chung.',
  },
  {
    value: 'expense',
    label: 'Trừ quỹ',
    description: 'Ghi nhận một khoản chi từ quỹ.',
  },
  {
    value: 'adjustment',
    label: 'Điều chỉnh',
    description: 'Bù quỹ hoặc cân lại số liệu.',
  },
];

const presetAmounts = [100000, 300000, 500000, 1000000, 2000000];

const reasonPresets: Record<EntryType, string[]> = {
  contribution: ['Đóng quỹ tuần', 'Đóng quỹ tháng', 'Bù quỹ phát sinh'],
  expense: ['Ăn uống', 'Di chuyển', 'Mua quà', 'Xem phim'],
  adjustment: ['Cân số dư', 'Hoàn tiền', 'Bổ sung dự phòng'],
};

const createEmptyForm = () => ({
  amount: '',
  person: 'Nam',
  reason: '',
  entryAt: new Date().toISOString().slice(0, 16),
});

const formatCurrency = (amount: number) =>
  `${amount.toLocaleString('vi-VN')} VNĐ`;

export default function Finance() {
  const [entries, setEntries] = useState<FinanceEntry[]>([]);
  const [entryType, setEntryType] = useState<EntryType>('contribution');
  const [form, setForm] = useState(createEmptyForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      balance: contributions + adjustments - expenses,
    };
  }, [entries]);

  const loadEntries = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('finance_entries')
      .select('id, entry_type, amount, currency, person, reason, entry_at, source')
      .order('entry_at', { ascending: false });

    if (queryError) {
      setEntries([]);
      setError(queryError.message);
    } else {
      setEntries((data as FinanceEntry[]) ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadEntries();
  }, []);

  const handleSave = async () => {
    if (!form.amount || Number(form.amount) <= 0 || !form.reason.trim()) {
      setError('Hãy nhập số tiền và lý do để lưu giao dịch.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      entry_type: entryType,
      amount: Number(form.amount),
      currency: 'VND',
      person: form.person.trim() || null,
      reason: form.reason.trim(),
      entry_at: new Date(form.entryAt).toISOString(),
      source: 'manual',
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
      setForm({
        ...createEmptyForm(),
        person: form.person,
      });
    }

    setIsSaving(false);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 text-4xl font-bold tracking-tight">Quản lý tài chính</h1>
          <p className="text-lg text-white/60">
            Ưu tiên nhập thật nhanh: chọn loại giao dịch, bấm số tiền, thêm lý do, lưu.
          </p>
        </motion.div>

        <button
          type="button"
          onClick={() => void loadEntries()}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10"
        >
          <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </header>

      <div className="grid gap-4 md:grid-cols-4">
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.22em] text-white/40">Số dư quỹ</p>
          <p className="mt-3 text-3xl font-bold text-white">{formatCurrency(summary.balance)}</p>
        </TiltCard>
        <TiltCard className="bg-emerald-500/10">
          <p className="text-sm uppercase tracking-[0.22em] text-emerald-200/70">Đã đóng quỹ</p>
          <p className="mt-3 text-3xl font-bold text-emerald-300">
            {formatCurrency(summary.contributions)}
          </p>
        </TiltCard>
        <TiltCard className="bg-rose-500/10">
          <p className="text-sm uppercase tracking-[0.22em] text-rose-200/70">Đã trừ quỹ</p>
          <p className="mt-3 text-3xl font-bold text-rose-300">{formatCurrency(summary.expenses)}</p>
        </TiltCard>
        <TiltCard className="bg-amber-500/10">
          <p className="text-sm uppercase tracking-[0.22em] text-amber-200/70">Điều chỉnh</p>
          <p className="mt-3 text-3xl font-bold text-amber-300">
            {formatCurrency(summary.adjustments)}
          </p>
        </TiltCard>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-6 flex items-center gap-3">
            <div className="rounded-2xl bg-white/10 p-3">
              <Coins className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Nhập giao dịch siêu nhanh</h2>
              <p className="text-sm text-white/60">
                Tối ưu cho thao tác trong 10 giây, không cần mở form dài.
              </p>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            {typeOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setEntryType(option.value)}
                className={`rounded-2xl border px-4 py-4 text-left transition-all ${
                  entryType === option.value
                    ? 'border-white/30 bg-white/15'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <p className="font-semibold text-white">{option.label}</p>
                <p className="mt-2 text-sm leading-6 text-white/55">{option.description}</p>
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-5">
            <div>
              <label className="mb-2 block text-sm text-white/60">Số tiền</label>
              <input
                type="number"
                value={form.amount}
                onChange={(event) =>
                  setForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="Ví dụ: 500000"
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-4 text-2xl font-bold text-white placeholder:text-white/25 focus:border-orange-400 focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {presetAmounts.map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({ ...current, amount: String(amount) }))
                    }
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
                  >
                    {formatCurrency(amount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-white/60">Người ghi nhận</label>
                <div className="flex gap-2">
                  {['Nam', 'Cy', 'Chung'].map((person) => (
                    <button
                      key={person}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, person }))}
                      className={`flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                        form.person === person
                          ? 'bg-white text-black'
                          : 'border border-white/10 bg-white/5 text-white/75 hover:bg-white/10'
                      }`}
                    >
                      {person}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm text-white/60">Thời gian</label>
                <input
                  type="datetime-local"
                  value={form.entryAt}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, entryAt: event.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-orange-400 focus:outline-none [color-scheme:dark]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm text-white/60">Lý do</label>
              <input
                value={form.reason}
                onChange={(event) =>
                  setForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder={
                  entryType === 'contribution'
                    ? 'Ví dụ: Đóng quỹ cuối tháng'
                    : entryType === 'expense'
                      ? 'Ví dụ: Ăn tối The Deck'
                      : 'Ví dụ: Bù quỹ thiếu'
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-orange-400 focus:outline-none"
              />
              <div className="mt-3 flex flex-wrap gap-2">
                {reasonPresets[entryType].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, reason }))}
                    className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="w-full rounded-2xl bg-gradient-to-r from-orange-500 to-pink-500 px-6 py-4 font-semibold text-white shadow-lg shadow-orange-500/30 disabled:opacity-60"
            >
              {isSaving
                ? 'Đang lưu giao dịch...'
                : entryType === 'contribution'
                  ? 'Lưu khoản đóng quỹ'
                  : entryType === 'expense'
                    ? 'Lưu khoản trừ quỹ'
                    : 'Lưu điều chỉnh'}
            </button>
          </div>
        </TiltCard>

        <TiltCard className="bg-white/5">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Dòng tiền gần đây</h2>
              <p className="text-sm text-white/60">
                Theo dõi từng lần đóng quỹ và trừ quỹ bằng dòng ghi ngắn, rõ ràng.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs uppercase tracking-[0.22em] text-white/45">
              <Sparkles className="h-3.5 w-3.5" />
              VNĐ
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-10 text-center text-white/55">
                Đang tải giao dịch từ Supabase...
              </div>
            ) : null}

            {!isLoading && !entries.length ? (
              <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-10 text-center text-white/55">
                Chưa có giao dịch nào. Hãy thử nhập khoản đầu tiên ở khung bên trái.
              </div>
            ) : null}

            {entries.map((entry) => {
              const isIncome =
                entry.entry_type === 'contribution' || entry.entry_type === 'adjustment';

              return (
                <div
                  key={entry.id}
                  className="flex items-start justify-between gap-4 rounded-2xl border border-white/10 bg-black/10 px-4 py-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`rounded-2xl p-3 ${
                        isIncome ? 'bg-emerald-500/15' : 'bg-rose-500/15'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpCircle className="h-5 w-5 text-emerald-300" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-rose-300" />
                      )}
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-white">{entry.reason}</p>
                        <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-white/50">
                          {entry.entry_type === 'contribution'
                            ? 'Đóng quỹ'
                            : entry.entry_type === 'expense'
                              ? 'Trừ quỹ'
                              : 'Điều chỉnh'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-white/50">
                        {entry.person || 'Không ghi người'} ·{' '}
                        {new Date(entry.entry_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                  </div>

                  <p
                    className={`text-right text-lg font-bold ${
                      isIncome ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {isIncome ? '+' : '-'}
                    {formatCurrency(Number(entry.amount))}
                  </p>
                </div>
              );
            })}
          </div>
        </TiltCard>
      </div>
    </div>
  );
}
