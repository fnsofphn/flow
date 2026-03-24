import { useEffect, useState } from 'react';
import { Database, Loader2, TriangleAlert } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Status = 'checking' | 'ready' | 'error';

export default function SupabaseStatus() {
  const [status, setStatus] = useState<Status>(isSupabaseConfigured ? 'checking' : 'error');

  useEffect(() => {
    let cancelled = false;

    if (!isSupabaseConfigured) {
      setStatus('error');
      return () => {
        cancelled = true;
      };
    }

    const checkConnection = async () => {
      const { error } = await supabase.auth.getSession();

      if (cancelled) {
        return;
      }

      setStatus(error ? 'error' : 'ready');
    };

    void checkConnection();

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'checking') {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-sm text-white/70">
        <Loader2 className="h-4 w-4 animate-spin text-orange-300" />
        Đang kiểm tra kết nối dữ liệu...
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-3 text-sm text-red-100">
        <TriangleAlert className="h-4 w-4 text-red-300" />
        Chưa kết nối được Supabase
      </div>
    );
  }

  return (
    <div className="mt-6 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-3 text-sm text-emerald-100">
      <Database className="h-4 w-4 text-emerald-300" />
      Đã kết nối Supabase
    </div>
  );
}
