import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, CheckCircle2, CheckSquare, Circle, DollarSign, MapPin, Plus, RefreshCcw, X } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type Todo = {
  id: string;
  task: string;
  assignee: string;
  deadline: string;
  cost: number;
  location: string | null;
  map_url: string | null;
  done: boolean;
};

const emptyForm = {
  task: '',
  assignee: 'Nam',
  deadline: '',
  cost: '',
  location: '',
  mapUrl: '',
};

export default function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const summary = useMemo(() => {
    const completed = todos.filter((todo) => todo.done).length;
    const budget = todos.reduce((sum, todo) => sum + Number(todo.cost || 0), 0);
    return { completed, budget };
  }, [todos]);

  const loadTodos = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('todos')
      .select('id, task, assignee, deadline, cost, location, map_url, done')
      .order('deadline', { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setTodos([]);
    } else {
      setTodos((data as Todo[]) ?? []);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadTodos();
  }, []);

  const toggleTodo = async (todo: Todo) => {
    const nextDone = !todo.done;
    setTodos((current) => current.map((item) => (item.id === todo.id ? { ...item, done: nextDone } : item)));

    const { error: updateError } = await supabase.from('todos').update({ done: nextDone }).eq('id', todo.id);

    if (updateError) {
      setTodos((current) => current.map((item) => (item.id === todo.id ? todo : item)));
      setError(updateError.message);
    }
  };

  const handleCreate = async () => {
    if (!form.task.trim() || !form.deadline) {
      setError('Hãy nhập tên công việc và thời gian.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      task: form.task.trim(),
      assignee: form.assignee,
      deadline: new Date(form.deadline).toISOString(),
      cost: Number(form.cost || 0),
      location: form.location.trim() || null,
      map_url: form.mapUrl.trim() || null,
      done: false,
    };

    const { data, error: insertError } = await supabase
      .from('todos')
      .insert(payload)
      .select('id, task, assignee, deadline, cost, location, map_url, done')
      .single();

    if (insertError) {
      setError(insertError.message);
    } else if (data) {
      setTodos((current) =>
        [...current, data as Todo].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime()),
      );
      setIsCreating(false);
      setForm(emptyForm);
    }

    setIsSaving(false);
  };

  const handleDelete = async (id: string) => {
    const previous = todos;
    setTodos((current) => current.filter((todo) => todo.id !== id));

    const { error: deleteError } = await supabase.from('todos').delete().eq('id', id);

    if (deleteError) {
      setTodos(previous);
      setError(deleteError.message);
    }
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Việc cần làm
            <CheckSquare className="h-8 w-8 text-blue-400" />
          </h1>
          <p className="text-lg text-white/60">Theo dõi danh sách công việc chung theo thời gian thực.</p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void loadTodos()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCreating(true)}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-medium text-white shadow-lg shadow-blue-500/30"
          >
            <Plus className="h-5 w-5" />
            Thêm việc mới
          </motion.button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Tổng việc</p>
          <p className="mt-3 text-3xl font-bold text-white">{todos.length}</p>
        </TiltCard>
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Đã xong</p>
          <p className="mt-3 text-3xl font-bold text-emerald-300">{summary.completed}</p>
        </TiltCard>
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Ngân sách</p>
          <p className="mt-3 text-3xl font-bold text-orange-300">{summary.budget.toLocaleString('vi-VN')}đ</p>
        </TiltCard>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {isLoading ? (
        <TiltCard className="text-center text-white/60">Đang tải danh sách công việc...</TiltCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div key={todo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} layout>
                <TiltCard glow={!todo.done} className={`transition-all duration-500 ${todo.done ? 'opacity-60 grayscale-[50%]' : ''}`}>
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex flex-1 items-center gap-4">
                      <button onClick={() => void toggleTodo(todo)} className="text-white/50 transition-colors hover:text-white">
                        {todo.done ? <CheckCircle2 className="h-8 w-8 text-green-500" /> : <Circle className="h-8 w-8 hover:text-blue-400" />}
                      </button>
                      <div>
                        <h3 className={`text-xl font-bold ${todo.done ? 'line-through text-white/50' : 'text-white/90'}`}>{todo.task}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-white/60">
                          <span className="rounded bg-white/10 px-2 py-1 font-medium text-white/80">{todo.assignee}</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(todo.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 md:justify-end">
                      <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 px-3 py-2 text-orange-400">
                        <DollarSign className="h-4 w-4" />
                        <span className="font-semibold">{Number(todo.cost || 0).toLocaleString('vi-VN')}đ</span>
                      </div>

                      {todo.location ? (
                        <button
                          onClick={() => todo.map_url && setSelectedMap(todo.map_url)}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-colors ${
                            todo.map_url
                              ? 'border-blue-500/20 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20'
                              : 'cursor-default border-white/10 bg-white/5 text-white/50'
                          }`}
                        >
                          <MapPin className="h-4 w-4" />
                          <span className="max-w-[150px] truncate font-medium">{todo.location}</span>
                        </button>
                      ) : null}

                      <button
                        onClick={() => void handleDelete(todo.id)}
                        className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {!todos.length ? <TiltCard className="text-center text-white/60">Chưa có công việc nào.</TiltCard> : null}
        </div>
      )}

      <AnimatePresence>
        {isCreating ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-6 shadow-2xl md:left-1/2 md:top-1/2 md:w-[640px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">Thêm việc mới</h2>
                <button onClick={() => setIsCreating(false)} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input value={form.task} onChange={(e) => setForm((current) => ({ ...current, task: e.target.value }))} placeholder="Tên công việc" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none" />
                <div className="grid gap-4 md:grid-cols-2">
                  <select value={form.assignee} onChange={(e) => setForm((current) => ({ ...current, assignee: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400 focus:outline-none">
                    <option value="Nam">Nam</option>
                    <option value="Cy">Cy</option>
                  </select>
                  <input type="datetime-local" value={form.deadline} onChange={(e) => setForm((current) => ({ ...current, deadline: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400 focus:outline-none [color-scheme:dark]" />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <input type="number" value={form.cost} onChange={(e) => setForm((current) => ({ ...current, cost: e.target.value }))} placeholder="Chi phí dự kiến" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none" />
                  <input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} placeholder="Địa điểm hoặc ghi chú vị trí" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none" />
                </div>
                <input value={form.mapUrl} onChange={(e) => setForm((current) => ({ ...current, mapUrl: e.target.value }))} placeholder="Liên kết Google Maps (không bắt buộc)" className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-blue-400 focus:outline-none" />
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => void handleCreate()} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 disabled:opacity-60">
                  {isSaving ? 'Đang lưu...' : 'Lưu công việc'}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {selectedMap ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelectedMap(null)}>
            <div className="mx-auto flex h-full max-w-5xl items-center">
              <div className="w-full overflow-hidden rounded-3xl border border-white/10 bg-black/40" onClick={(event) => event.stopPropagation()}>
                <iframe title="Google Maps" src={selectedMap} className="h-[70vh] w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" />
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
