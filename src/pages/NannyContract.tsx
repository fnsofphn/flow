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
  title: 'Há»£p Ä‘á»“ng báº£o máº«u',
  monthlySilverSalary: '0.5',
  bonusSilver: '0.1',
  paymentCycle: 'Thanh toÃ¡n vÃ o ngÃ y 25 háº±ng thÃ¡ng',
  content:
    'Äiá»u 1. BÃªn B chá»‹u trÃ¡ch nhiá»‡m chÄƒm sÃ³c, nháº¯c nhá»Ÿ vÃ  Ä‘á»“ng hÃ nh cÃ¹ng BÃªn A má»—i ngÃ y.\n\nÄiá»u 2. LÆ°Æ¡ng cÆ¡ báº£n Ä‘Æ°á»£c chi tráº£ báº±ng lÆ°á»£ng báº¡c theo thá»a thuáº­n giá»¯a hai bÃªn.\n\nÄiá»u 3. ThÆ°á»Ÿng hoáº·c phá»¥ cáº¥p cÃ³ thá»ƒ Ä‘Æ°á»£c cá»™ng thÃªm báº±ng lÆ°á»£ng báº¡c khi hoÃ n thÃ nh tá»‘t nhiá»‡m vá»¥.\n\nÄiá»u 4. Hai bÃªn cÃ³ quyá»n tá»± bá»• sung Ä‘iá»u khoáº£n chi tiáº¿t vÃ o Ä‘Ã¢y.',
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
        showSavedMessage('ÄÃ£ lÆ°u há»£p Ä‘á»“ng vÃ o kho dữ liệu.');
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
        showSavedMessage('ÄÃ£ táº¡o vÃ  lÆ°u há»£p Ä‘á»“ng vÃ o kho dữ liệu.');
      }
    }

    setIsSavingContract(false);
  };

  const handleAddPayment = async () => {
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setError('HÃ£y nháº­p sá»‘ lÆ°á»£ng báº¡c há»£p lá»‡.');
      return;
    }

    setIsSavingPayment(true);
    setError(null);

    const payload = {
      amount: Number(paymentForm.amount),
      reason: paymentForm.reason.trim() || 'Thanh toÃ¡n lÆ°á»£ng báº¡c Ä‘á»‹nh ká»³',
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
      showSavedMessage('ÄÃ£ lÆ°u láº§n tráº£ lÆ°Æ¡ng báº¡c vÃ o kho dữ liệu.');
    }

    setIsSavingPayment(false);
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Há»£p Ä‘á»“ng báº£o máº«u
            <FileSignature className="h-8 w-8 text-amber-400" />
          </h1>
          <p className="text-lg text-white/60">
            Há»£p Ä‘á»“ng vÃ  lá»‹ch sá»­ tráº£ lÆ°Æ¡ng báº±ng lÆ°á»£ng báº¡c Ä‘á»u Ä‘Æ°á»£c lÆ°u tháº­t trong kho dữ liệu.
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
          LÆ°u há»£p Ä‘á»“ng
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
                Äiá»u khoáº£n trá»ng tÃ¢m: lÆ°Æ¡ng cÆ¡ báº£n vÃ  thÆ°á»Ÿng Ä‘á»u cÃ³ thá»ƒ tÃ­nh báº±ng lÆ°á»£ng báº¡c.
              </p>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <label className="text-sm">
                <span className="mb-2 block font-medium text-[#3a2a22]/70">LÆ°Æ¡ng cÆ¡ báº£n</span>
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
                  <p className="mt-2 text-xs text-[#3a2a22]/50">ÄÆ¡n vá»‹: lÆ°á»£ng báº¡c / ká»³</p>
                </div>
              </label>

              <label className="text-sm">
                <span className="mb-2 block font-medium text-[#3a2a22]/70">ThÆ°á»Ÿng thÃªm</span>
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
                  <p className="mt-2 text-xs text-[#3a2a22]/50">ÄÆ¡n vá»‹: lÆ°á»£ng báº¡c / láº§n</p>
                </div>
              </label>

              <label className="text-sm">
                <span className="mb-2 block font-medium text-[#3a2a22]/70">Chu ká»³ chi tráº£</span>
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
                  <p className="font-semibold text-[#5c4033]">Má»¥c lÆ°Æ¡ng báº±ng lÆ°á»£ng báº¡c</p>
                  <p className="mt-2 text-sm leading-6 text-[#5c4033]/75">
                    LÆ°Æ¡ng cÆ¡ báº£n hiá»‡n táº¡i lÃ  {contract.monthlySilverSalary} lÆ°á»£ng báº¡c má»—i ká»³,
                    thÆ°á»Ÿng thÃªm {contract.bonusSilver} lÆ°á»£ng báº¡c theo tá»«ng thÃ nh tÃ­ch hoáº·c há»—
                    trá»£ Ä‘áº·c biá»‡t.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="mb-2 block font-medium text-[#3a2a22]/70">
                TiÃªu Ä‘á» há»£p Ä‘á»“ng
              </label>
              <input
                value={contract.title}
                onChange={(event) =>
                  setContract((current) => ({ ...current, title: event.target.value }))
                }
                className="mb-4 w-full rounded-xl border border-[#3a2a22]/10 bg-white px-4 py-3 text-[#3a2a22] outline-none"
              />

              <label className="mb-2 block font-medium text-[#3a2a22]/70">
                Ná»™i dung há»£p Ä‘á»“ng
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
                  ÄÃ£ chi tráº£
                </p>
                <p className="mt-2 text-3xl font-bold text-amber-300">
                  {totalSilverPaid.toLocaleString('vi-VN')} lÆ°á»£ng báº¡c
                </p>
              </div>
            </div>
          </TiltCard>

          <TiltCard className="bg-white/5">
            <h2 className="text-2xl font-bold text-white">Ghi nháº­n tráº£ lÆ°Æ¡ng báº±ng báº¡c</h2>
            <p className="mt-2 text-sm text-white/60">
              DÃ¹ng khi thanh toÃ¡n lÆ°Æ¡ng cÆ¡ báº£n, thÆ°á»Ÿng hoáº·c há»— trá»£ phÃ¡t sinh.
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
                placeholder="VÃ­ dá»¥: 0.5 lÆ°á»£ng báº¡c"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-amber-400 focus:outline-none"
              />
              <input
                value={paymentForm.reason}
                onChange={(event) =>
                  setPaymentForm((current) => ({ ...current, reason: event.target.value }))
                }
                placeholder="LÃ½ do chi tráº£"
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
                {isSavingPayment ? 'Äang lÆ°u láº§n chi tráº£...' : 'ThÃªm láº§n tráº£ lÆ°Æ¡ng báº±ng báº¡c'}
              </button>
            </div>
          </TiltCard>

          <TiltCard className="bg-white/5">
            <h2 className="text-2xl font-bold text-white">Lá»‹ch sá»­ chi tráº£</h2>

            {isLoading ? (
              <div className="mt-5 rounded-2xl border border-white/10 bg-black/10 px-4 py-8 text-center text-white/55">
                Äang táº£i dá»¯ liá»‡u há»£p Ä‘á»“ng...
              </div>
            ) : null}

            <div className="mt-5 space-y-3">
              {!isLoading && !payments.length ? (
                <div className="rounded-2xl border border-white/10 bg-black/10 px-4 py-8 text-center text-white/55">
                  ChÆ°a cÃ³ láº§n chi tráº£ nÃ o Ä‘Æ°á»£c ghi nháº­n.
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
                      {Number(payment.amount).toLocaleString('vi-VN')} lÆ°á»£ng báº¡c
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

