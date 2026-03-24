import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card max-w-xl space-y-5 px-8 py-10 text-center"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
          <Compass className="h-8 w-8 text-orange-300" />
        </div>
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/40">404</p>
          <h1 className="text-3xl font-bold text-white">Trang khong ton tai</h1>
          <p className="text-white/60">
            Duong dan nay khong con hop le hoac chua duoc cau hinh trong ung dung.
          </p>
        </div>
        <Link
          to="/"
          className="inline-flex items-center rounded-xl bg-white/10 px-5 py-3 font-medium text-white transition-colors hover:bg-white/20"
        >
          Quay ve dashboard
        </Link>
      </motion.div>
    </div>
  );
}
