import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Coins, FileSignature, Loader2, Save, ShieldCheck } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type ContractDocument = {
  id: string;
  title: string;
  content: string;
  monthly_silver_salary: number;
  bonus_silver: number;
  payment_cycle: string;
  updated_at: string;
};

type SilverPayment = {
  id: string;
  amount: number;
  reason: string;
  paid_at: string;
};

const defaultContract = {
  title: 'Hợp đồng bảo mẫu',
  monthlySilverSalary: '0.5',
  bonusSilver: '0.1',
  paymentCycle: 'Thanh toán vào ngày 25 hằng tháng',
  content:
    'Điều 1. Bên B chịu trách nhiệm chăm sóc, nhắc nhở và đồng hành cùng Bên A mỗi ngày.\n\nĐiều 2. Lương cơ bản được chi trả bằng lượng bạc theo thỏa thuận giữa hai bên.\n\nĐiều 3. Thưởng hoặc phụ cấp có thể được cộng thêm bằng lượng bạc khi hoàn thành tốt nhiệm vụ.\n\nĐiều 4. Hai bên có quyền tự bổ sung điều khoản chi tiết vào đây.',
};

const createDefaultPaymentForm = () => ({
  amount: '',
  reason: '',
  paidAt: new Date().toISOString().slice(0, 16),
});

export default function NannyContract() {
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [contract, setContract] = useState(defaultContract);
  const [payments, setPayments] = useState<SilverPayment[]>([]);
  const [paymentForm, setPaymentForm] = useState(createDefaultPaymentForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingContract, setIsSavingContract] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);
  const [savedMessage, setSavedMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const totalSilverPaid = useMemo(
    () => payments.reduce((sum, payment) => sum + Number(payment.amount), 0),
    [payments],
  );

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    const [documentResult, paymentResult] = await Promise.all([
      supabase
        .from('contract_documents')
        .select(
          'id, title, content, monthly_silver_salary, bonus_silver, payment_cycle, updated_at',
        )
        .order('updated_at', { ascending: false })
        .limit(1),
      supabase
        .from('contract_silver_payments')
        .select('id, amount, reason, paid_at')
        .order('paid_at', { ascending: false }),
    ]);

    if (documentResult.error) {
      setError(documentResult.error.message);
    }

    if (paymentResult.error) {
      setError((current) => current ?? paymentResult.error?.message ?? null);
    }

    const existingDocument = ((documentResult.data as ContractDocument[] | null) ?? [])[0];

    if (existingDocument) {
      setDocumentId(existingDocument.id);
      setContract({
        title: existingDocument.title,
        content: existingDocument.content,
        monthlySilverSalary: String(existingDocument.monthly_silver_salary ?? 0),
        bonusSilver: String(existingDocument.bonus_silver ?? 0),
        paymentCycle: existingDocument.payment_cycle ?? '',
      });
    }

    setPayments((paymentResult.data as SilverPayment[]) ?? []);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, []);

  const showSavedMessage = (message: string) => {
    setSavedMessage(message);
    window.setTimeout(() => setSavedMessage(''), 2400);
  };

  const handleSaveContract = async () => {
    setIsSavingContract(true);
    setError(null);

    const payload = {
      title: contract.title.trim() || defaultContract.title,
      content: contract.content.trim(),
      monthly_silver_salary: Number(contract.monthlySilverSalary || 0),
      bonus_silver: Number(contract.bonusSilver || 0),
      payment_cycle: contract.paymentCycle.trim(),
      updated_at: new Date().toISOString(),
    };

    if (documentId) {
      const { error: updateError } = await supabase
        .from('contract_documents')
        .update(payload)
        .eq('id', documentId);

      if (updateError) {
        setError(updateError.message);
      } else {
        showSavedMessage('Đã lưu hợp đồng vào Supabase.');
      }
    } else {
      const { data, error: insertError } = await supabase
        .from('contract_documents')
        .insert(payload)
        .select('id')
        .single();

      if (insertError) {
        setError(insertError.message);
      } else if (data) {
        setDocumentId((data as { id: string }).id);
        showSavedMessage('Đã tạo và lưu hợp đồng vào Supabase.');
      }
    }

    setIsSavingContract(false);
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setError('Hãy nhập số lượng bạc hợp lệ.');
      return;
    }

    setIsSavingPayment(true);
    setError(null);

    const payload = {
      amount: Number(paymentForm.amount),
      reason: paymentForm.reason.trim() || 'Thanh toán lượng bạc định kỳ',
      paid_at: new Date(paymentForm.paidAt).toISOString(),
    };

    const { data, error: insertError } = await supabase
      .from('contract_silver_payments')
      .insert(payload)
      .select('id, amount, reason, paid_at')
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setPayments((current) => [data as SilverPayment, ...current]);
      setPaymentForm(createDefaultPaymentForm());
      showSavedMessage('Đã lưu lần trả lương bạc vào Supabase.');
    }

    setIsSavingPayment(false);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Hợp đồng bảo mẫu
            <FileSignature className="h-8 w-8 text-amber-400" />
          </h1>
          <p className="text-lg text-white/60">
            Hợp đồng và lịch sử trả lương bằng lượng bạc đều được lưu thật trong Supabase.
          </p>
        </motion.div>

        <button
          type="button"
          onClick={() => void handleSaveContract()}
          disabled={isSavingContract}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-6 py-3 font-semibold text-black shadow-lg shadow-amber-500/30 disabled:opacity-60"
        >
          {isSavingContract ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          Lưu hợp đồng
        </button>
      </header>

      {savedMessage ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {savedMessage}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <TiltCard glow={false} className="bg-[#fdfbf7] text-[#3a2a22]">
          <div className="rounded-2xl border-4 border-double border-[#3a2a22]/15 p-6 md:p-8">
            <div className="border-b border-[#3a2a22]/15 pb-6 text-center">
              <h2 className="text-3xl font-semibold uppercase tracking-[0.22em] text-[#5c4033]">
                {contract.title}
              </h2>
              <p className="mt-3 text-sm text-[#3a2a22]/60">
                Điều khoản trọng tâm: lương cơ bản và thưởng đều có thể tính bằng lượng bạc.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-2 block font-medium text-[#3a2a22]/70">Lương cơ bản</span>
                <div className="rounded-xl border border-[#3a2a22]/10 bg-white px-4 py-3">
                  <input
                    value={contract.monthlySilverSalary}
                    onChange={(event) =>
                      setContract((current) => ({
                        ...current,
                        monthlySilverSalary: event.target.value,
                      }))
                    }
                    className="w-full bg-transparent font-semibold text-[#3a2a22] outline-none"
                  />
                  <p className="mt-2 text-xs text-[#3a2a22]/50">Đơn vị: lượng bạc / kỳ</p>
                </div>
              </label>

              <label className="text-sm">
                <span className="mb-2 block font-medium text-[#3a2a22]/70">Thưởng thêm</span>
                <div className="rounded-xl border border-[#3a2a22]/10 bg-white px-4 py-3">
                  <input
                    value={contract.bonusSilver}
                    onChange={(event) =>
                      setContract((current) => ({
                        ...current,
                        bonusSilver: event.target.value,
                      }))
                    }
                    className="w-full bg-transparent font-semibold text-[#3a2a22] outline-none"
                  />
                  <p className="mt-2 text-xs text-[#3a2a22]/50">Đơn vị: lượng bạc / lần</p>
                </div>
              </label>

              <label className="text-sm">
                <span className="mb-2 block font-medium text-[#3a2a22]/70">Chu kỳ chi trả</span>
                <input
                  value={contract.paymentCycle}
                  onChange={(event) =>
                    setContract((current) => ({
                      ...current,
                      paymentCycle: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-[#3a2a22]/10 bg-white px-4 py-3 text-[#3a2a22] outline-none"
                />
              </label>
            </div>

            <div className="mt-6 rounded-2xl border border-amber-500/20 bg-amber-100/40 p-5">
              <div className="flex items-start gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-amber-700" />
                <div>
                  <p className="font-semibold text-[#5c4033]">Mục lương bằng lượng bạc</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c4033]/75">
                    Lương cơ bản hiện tại là {contract.monthlySilverSalary} lượng bạc mỗi kỳ,
                    thưởng thêm {contract.bonusSilver} lượng bạc theo từng thành tích hoặc hỗ
                    trợ đặc biệt.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block font-medium text-[#3a2a22]/70">
                Tiêu đề hợp đồng
              </label>
              <input
                value={contract.title}
                onChange={(event) =>
                  setContract((current) => ({ ...current, title: event.target.value }))
                }
                className="mb-4 w-full rounded-xl border border-[#3a2a22]/10 bg-white px-4 py-3 text-[#3a2a22] outline-none"
              />

              <label className="mb-2 block font-medium text-[#3a2a22]/70">
                Nội dung hợp đồng
              </label>
              <textarea
                value={contract.content}
                onChange={(event) =>
                  setContract((current) => ({ ...current, content: event.target.value }))
                }
                rows={16}
                className="w-full rounded-2xl border border-[#3a2a22]/10 bg-white px-4 py-4 font-serif text-[17px] leading-8 text-[#3a2a22] outline-none"
              />
            </div>
          </div>
        </TiltCard>

        <div className="space-y-6">
          <TiltCard className="bg-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-amber-500/15 p-3">
                <Coins className="h-6 w-6 text-amber-300" />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-amber-100/60">
                  Đã chi trả
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-300">
                  {totalSilverPaid.toLocaleString('vi-VN')} lượng bạc
                </p>
              </div>
            </div>
          </TiltCard>

          <TiltCard className="bg-white/5">
            <h2 className="text-2xl font-bold text-white">Ghi nhận trả lương bằng bạc</h2>
            <p className="mt-2 text-sm text-white/60">
              Dùng khi thanh toán lương cơ bản, thưởng hoặc hỗ trợ phát sinh.
            </p>

            <div className="mt-5 space-y-4">
              <input
                type="number"
                min="0"
                step="0.01"
                value={paymentForm.amount}
                onChange={(event) =>
                  setPaymentForm((current) => ({ ...current, amount: event.target.value }))
                }
                placeholder="Ví dụ: 0.5 lượng bạc"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
              />
              <input
                value={paymentForm.reason}
                onChange={(event) =>
                  setPaymentForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="Lý do chi trả"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
              />
              <input
                type="datetime-local"
                value={paymentForm.paidAt}
                onChange={(event) =>
                  setPaymentForm((current) => ({ ...current, paidAt: event.target.value }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-amber-400 focus:outline-none [color-scheme:dark]"
              />

              <button
                type="button"
                onClick={() => void handleAddPayment()}
                disabled={isSavingPayment}
                className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 px-5 py-3 font-semibold text-black disabled:opacity-60"
              >
                {isSavingPayment ? 'Đang lưu lần chi trả...' : 'Thêm lần trả lương bằng bạc'}
              </button>
            </div>
          </TiltCard>

          <TiltCard className="bg-white/5">
            <h2 className="text-2xl font-bold text-white">Lịch sử chi trả</h2>

            {isLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-8 text-center text-white/55">
                Đang tải dữ liệu hợp đồng...
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {!isLoading && !payments.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-8 text-center text-white/55">
                  Chưa có lần chi trả nào được ghi nhận.
                </div>
              ) : null}

              {payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-white/10 bg-black/10 px-4 py-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-white">{payment.reason}</p>
                      <p className="mt-1 text-sm text-white/50">
                        {new Date(payment.paid_at).toLocaleString('vi-VN')}
                      </p>
                    </div>
                    <p className="font-bold text-amber-300">
                      {Number(payment.amount).toLocaleString('vi-VN')} lượng bạc
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>
        </div>
      </div>
    </div>
  );
}
