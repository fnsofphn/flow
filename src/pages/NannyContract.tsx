import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { FileSignature, Coins, History, CheckCircle2, AlertCircle } from 'lucide-react';
import TiltCard from '../components/TiltCard';

interface Payment {
  id: number;
  amount: number;
  date: string;
  reason: string;
}

const initialPayments: Payment[] = [
  { id: 1, amount: 50, date: '2024-03-01T10:00', reason: 'Lương tháng 2' },
  { id: 2, amount: 10, date: '2024-03-15T14:30', reason: 'Thưởng nấu ăn ngon' },
];

export default function NannyContract() {
  const [payments, setPayments] = useState<Payment[]>(initialPayments);
  const [isPaying, setIsPaying] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payReason, setPayReason] = useState('');

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

  const handlePay = () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) return;
    
    const newPayment: Payment = {
      id: Date.now(),
      amount: Number(payAmount),
      date: new Date().toISOString(),
      reason: payReason || 'Thanh toán định kỳ'
    };

    setPayments([newPayment, ...payments]);
    setIsPaying(false);
    setPayAmount('');
    setPayReason('');
  };

  return (
    <div className="space-y-8 pb-24 relative">
      <header className="flex justify-between items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="text-4xl font-bold tracking-tight mb-2 flex items-center gap-3">
            Hợp đồng Bảo Mẫu
            <FileSignature className="w-8 h-8 text-amber-500" />
          </h1>
          <p className="text-white/60 text-lg">Bản hợp đồng đặc biệt giữa Nam và Cy.</p>
        </motion.div>
        
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsPaying(true)}
          className="bg-gradient-to-r from-amber-500 to-yellow-500 text-black px-6 py-3 rounded-xl font-bold shadow-lg shadow-amber-500/30 flex items-center gap-2"
        >
          <Coins className="w-5 h-5" />
          Trả lương (Bạc)
        </motion.button>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contract Document */}
        <TiltCard className="lg:col-span-2 bg-[#fdfbf7] text-[#3a2a22] relative overflow-hidden" glow={false}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }} />
          
          <div className="relative z-10 p-4 md:p-8 border-4 border-double border-[#3a2a22]/20">
            <div className="text-center mb-8 border-b-2 border-[#3a2a22]/20 pb-6">
              <h2 className="text-3xl font-serif font-bold uppercase tracking-widest text-[#5c4033]">Hợp Đồng Thuê Bảo Mẫu</h2>
              <p className="font-serif italic text-[#3a2a22]/60 mt-2">Số: 01/NC-2024</p>
            </div>

            <div className="space-y-6 font-serif leading-relaxed text-lg">
              <p>
                Hôm nay, ngày 01 tháng 01 năm 2024, tại "Không gian sống số NamCy", chúng tôi gồm:
              </p>
              
              <div className="pl-4 border-l-2 border-[#5c4033]/30">
                <p><strong>Bên A (Người thuê):</strong> Nam</p>
                <p><strong>Bên B (Bảo mẫu):</strong> Cy</p>
              </div>

              <p>Hai bên thống nhất ký kết hợp đồng với các điều khoản sau:</p>

              <ol className="list-decimal list-inside space-y-4 pl-4">
                <li>
                  <strong>Công việc:</strong> Bên B chịu trách nhiệm chăm sóc, nhắc nhở, và mang lại niềm vui cho Bên A mỗi ngày.
                </li>
                <li>
                  <strong>Mức lương:</strong> Thanh toán bằng đơn vị "Bạc". Mức lương cơ bản: 50 Bạc/tháng.
                </li>
                <li>
                  <strong>Thưởng phạt:</strong> Thưởng thêm Bạc nếu Bên B hoàn thành xuất sắc nhiệm vụ (nấu ăn ngon, dỗ dành khi Bên A buồn). Phạt (trừ Bạc) nếu Bên B dỗi vô cớ quá 3 lần/tuần.
                </li>
                <li>
                  <strong>Thời hạn:</strong> Hợp đồng có giá trị vô thời hạn, hoặc cho đến khi hai bên quyết định nâng cấp lên "Hợp đồng Hôn nhân".
                </li>
              </ol>

              <div className="mt-12 flex justify-between items-end pt-8 border-t-2 border-[#3a2a22]/20">
                <div className="text-center">
                  <p className="font-bold mb-8">Bên A</p>
                  <p className="font-signature text-3xl text-blue-800 -rotate-6">Nam</p>
                  <p className="text-sm mt-2 opacity-60">Đã ký (Digital)</p>
                </div>
                <div className="text-center">
                  <p className="font-bold mb-8">Bên B</p>
                  <p className="font-signature text-3xl text-rose-600 -rotate-3">Cy</p>
                  <p className="text-sm mt-2 opacity-60">Đã ký (Digital)</p>
                </div>
              </div>
            </div>
          </div>
        </TiltCard>

        {/* Tracking Panel */}
        <div className="space-y-6">
          <TiltCard className="bg-gradient-to-br from-amber-900/40 to-yellow-900/40 border-amber-500/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Coins className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-white/60 font-medium">Tổng Bạc đã trả</p>
                <p className="text-3xl font-bold text-amber-400">{totalPaid}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-2 text-sm text-white/50">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              Đã thanh toán đầy đủ tháng này
            </div>
          </TiltCard>

          <TiltCard>
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-amber-400" />
              Lịch sử thanh toán
            </h3>
            
            <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
              {payments.map((payment) => (
                <div key={payment.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex justify-between items-center hover:bg-white/10 transition-colors">
                  <div>
                    <p className="font-medium text-white/90">{payment.reason}</p>
                    <p className="text-xs text-white/50 mt-1">
                      {new Date(payment.date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </p>
                  </div>
                  <div className="font-bold text-amber-400 flex items-center gap-1">
                    +{payment.amount} <Coins className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          </TiltCard>
        </div>
      </div>

      {/* Payment Modal */}
      <AnimatePresence>
        {isPaying && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
              onClick={() => setIsPaying(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[101] w-full max-w-md bg-gray-900 rounded-3xl border border-white/10 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2 text-amber-400">
                <Coins className="w-6 h-6" />
                Trả lương (Bạc)
              </h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Số lượng Bạc</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      placeholder="VD: 50"
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500 text-xl font-bold"
                    />
                    <Coins className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-amber-500/50" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">Lý do / Ghi chú</label>
                  <input 
                    type="text" 
                    value={payReason}
                    onChange={(e) => setPayReason(e.target.value)}
                    placeholder="VD: Lương tháng 3, thưởng..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3 mt-4">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-200/80">
                    Bạc đã chuyển sẽ không thể thu hồi. Hãy chắc chắn bạn muốn trả số Bạc này cho Cy.
                  </p>
                </div>

                <button 
                  onClick={handlePay}
                  disabled={!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0}
                  className="w-full mt-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-black py-4 rounded-xl font-bold shadow-lg shadow-amber-500/30 hover:scale-[1.02] transition-transform disabled:opacity-50 disabled:hover:scale-100"
                >
                  Xác nhận chuyển Bạc
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
