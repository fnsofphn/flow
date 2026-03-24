import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarHeart, CheckCircle2, Clock, Heart, Plus, RefreshCcw, Wallet, X } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

interface ActivityDraft {
  id: number;
  name: string;
  cost: number;
}

interface StoredActivity {
  id: string;
  name: string;
  cost: number;
  sort_order: number;
  executed_at: string | null;
  finance_entry_id: string | null;
}

interface DatePlan {
  id: string;
  title: string;
  scheduled_for: string;
  date_plan_activities: StoredActivity[];
}

export default function DatePlanner() {
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDatetime, setNewDatetime] = useState('');
  const [newActivities, setNewActivities] = useState<ActivityDraft[]>([{ id: Date.now(), name: '', cost: 0 }]);

  const loadPlans = async () => {
    setIsLoading(true);
    setError(null);

    const { data, error: queryError } = await supabase
      .from('date_plans')
      .select('id, title, scheduled_for, date_plan_activities(id, name, cost, sort_order, executed_at, finance_entry_id)')
      .order('scheduled_for', { ascending: true });

    if (queryError) {
      setError(queryError.message);
      setPlans([]);
    } else {
      const normalized = ((data as DatePlan[]) ?? []).map((plan) => ({
        ...plan,
        date_plan_activities: [...(plan.date_plan_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order),
      }));
      setPlans(normalized);
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadPlans();
  }, []);

  const handleAddActivity = () => {
    setNewActivities((current) => [...current, { id: Date.now(), name: '', cost: 0 }]);
  };

  const handleActivityChange = (id: number, field: keyof ActivityDraft, value: string | number) => {
    setNewActivities((current) => current.map((activity) => (activity.id === id ? { ...activity, [field]: value } : activity)));
  };

  const handleRemoveActivity = (id: number) => {
    setNewActivities((current) => current.filter((activity) => activity.id !== id));
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDatetime('');
    setNewActivities([{ id: Date.now(), name: '', cost: 0 }]);
  };

  const handleSave = async () => {
    const cleanActivities = newActivities
      .map((activity, index) => ({
        name: activity.name.trim(),
        cost: Number(activity.cost || 0),
        sort_order: index,
      }))
      .filter((activity) => activity.name);

    if (!newTitle.trim() || !newDatetime || !cleanActivities.length) {
      setError('Vui lòng nhập tên kế hoạch, thời gian và ít nhất một hoạt động.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const { data: insertedPlan, error: planError } = await supabase
      .from('date_plans')
      .insert({
        title: newTitle.trim(),
        scheduled_for: new Date(newDatetime).toISOString(),
      })
      .select('id, title, scheduled_for')
      .single();

    if (planError || !insertedPlan) {
      setError(planError?.message ?? 'Không thể tạo kế hoạch.');
      setIsSaving(false);
      return;
    }

    const { error: activityError } = await supabase.from('date_plan_activities').insert(
      cleanActivities.map((activity) => ({
        ...activity,
        plan_id: insertedPlan.id,
      })),
    );

    if (activityError) {
      await supabase.from('date_plans').delete().eq('id', insertedPlan.id);
      setError(activityError.message);
      setIsSaving(false);
      return;
    }

    resetForm();
    setIsCreating(false);
    setIsSaving(false);
    await loadPlans();
  };

  const handleDeletePlan = async (id: string) => {
    const previous = plans;
    setPlans((current) => current.filter((plan) => plan.id !== id));

    const { error: deleteError } = await supabase.from('date_plans').delete().eq('id', id);

    if (deleteError) {
      setPlans(previous);
      setError(deleteError.message);
    }
  };

  const handleExecuteActivity = async (plan: DatePlan, activity: StoredActivity) => {
    if (activity.executed_at) {
      return;
    }

    let financeEntryId: string | null = null;

    if (Number(activity.cost) > 0) {
      const { data: financeEntry, error: financeError } = await supabase
        .from('finance_entries')
        .insert({
          entry_type: 'expense',
          amount: Number(activity.cost),
          currency: 'VND',
          reason: `${plan.title} - ${activity.name}`,
          entry_at: new Date().toISOString(),
          source: 'date_plan_activity',
          source_id: activity.id,
        })
        .select('id')
        .single();

      if (financeError) {
        setError(financeError.message);
        return;
      }

      financeEntryId = financeEntry?.id ?? null;
    }

    const executedAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('date_plan_activities')
      .update({ executed_at: executedAt, finance_entry_id: financeEntryId })
      .eq('id', activity.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setPlans((current) =>
      current.map((currentPlan) =>
        currentPlan.id === plan.id
          ? {
              ...currentPlan,
              date_plan_activities: currentPlan.date_plan_activities.map((item) =>
                item.id === activity.id ? { ...item, executed_at: executedAt, finance_entry_id: financeEntryId } : item,
              ),
            }
          : currentPlan,
      ),
    );
  };

  return (
    <div className="relative space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            Kế hoạch hẹn hò
            <CalendarHeart className="h-8 w-8 text-pink-500" />
          </h1>
          <p className="text-lg text-white/60">Khi đánh dấu đã thực hiện một hoạt động có chi phí, hệ thống sẽ tự động trừ quỹ.</p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => void loadPlans()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIsCreating(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-medium text-white shadow-lg shadow-pink-500/30">
            <Plus className="h-5 w-5" />
            Tạo cuộc hẹn
          </motion.button>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {isLoading ? (
        <TiltCard className="text-center text-white/60">Đang tải kế hoạch hẹn hò...</TiltCard>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <AnimatePresence>
            {plans.map((plan) => {
              const totalCost = plan.date_plan_activities.reduce((sum, activity) => sum + Number(activity.cost || 0), 0);

              return (
                <motion.div key={plan.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} layout>
                  <TiltCard className="border-pink-500/20 bg-gradient-to-br from-pink-500/10 to-transparent">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <h2 className="flex items-center gap-2 text-2xl font-bold text-white/90">
                          <Heart className="h-5 w-5 fill-pink-500 text-pink-500" />
                          {plan.title}
                        </h2>
                        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium">
                          <Clock className="h-4 w-4 text-orange-400" />
                          {new Date(plan.scheduled_for).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                        </div>
                      </div>

                      <button onClick={() => void handleDeletePlan(plan.id)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                        Xóa
                      </button>
                    </div>

                    <div className="mb-6 space-y-3">
                      {plan.date_plan_activities.map((activity) => (
                        <div key={activity.id} className="rounded-lg border border-white/5 bg-white/5 p-3">
                          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                              <span className="flex items-center gap-2 text-white/85">
                                <div className="h-2 w-2 rounded-full bg-pink-500" />
                                {activity.name}
                              </span>
                              <p className="mt-2 text-sm text-white/50">
                                {Number(activity.cost || 0).toLocaleString('vi-VN')} đ
                                {activity.executed_at ? ` • Đã thực hiện ${new Date(activity.executed_at).toLocaleString('vi-VN')}` : ''}
                              </p>
                            </div>

                            <button
                              onClick={() => void handleExecuteActivity(plan, activity)}
                              disabled={Boolean(activity.executed_at)}
                              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {activity.executed_at ? <CheckCircle2 className="h-4 w-4 text-emerald-300" /> : <Wallet className="h-4 w-4" />}
                              {activity.executed_at ? 'Đã ghi nhận' : 'Đánh dấu đã thực hiện'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm font-semibold uppercase tracking-wider text-white/50">Tổng chi phí dự kiến</span>
                      <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-2xl font-bold text-transparent">
                        {totalCost.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!plans.length ? <TiltCard className="text-center text-white/60">Chưa có kế hoạch hẹn hò nào.</TiltCard> : null}
        </div>
      )}

      <AnimatePresence>
        {isCreating ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
            <motion.div initial={{ opacity: 0, y: '100%' }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 md:left-1/2 md:top-1/2 md:w-[600px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl">
              <div className="p-6 md:p-8">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-2xl font-bold">
                    <CalendarHeart className="h-6 w-6 text-pink-500" />
                    Lên lịch hẹn hò mới
                  </h2>
                  <button onClick={() => setIsCreating(false)} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Tên cuộc hẹn</label>
                    <input type="text" value={newTitle} onChange={(event) => setNewTitle(event.target.value)} placeholder="Ví dụ: Kỷ niệm 2 năm..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Thời gian</label>
                    <input type="datetime-local" value={newDatetime} onChange={(event) => setNewDatetime(event.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-pink-500 focus:outline-none [color-scheme:dark]" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-white/70">Danh sách hoạt động</label>
                      <button onClick={handleAddActivity} className="flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300">
                        <Plus className="h-4 w-4" /> Thêm
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3">
                          <input type="text" value={activity.name} onChange={(event) => handleActivityChange(activity.id, 'name', event.target.value)} placeholder="Tên hoạt động" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none" />
                          <input type="number" value={activity.cost || ''} onChange={(event) => handleActivityChange(activity.id, 'cost', parseInt(event.target.value, 10) || 0)} placeholder="Chi phí" className="w-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none" />
                          <button onClick={() => handleRemoveActivity(activity.id)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/30 hover:text-red-400">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
                    <div>
                      <p className="text-sm text-white/50">Tổng dự kiến</p>
                      <p className="text-2xl font-bold text-orange-400">{newActivities.reduce((sum, activity) => sum + (activity.cost || 0), 0).toLocaleString('vi-VN')} đ</p>
                    </div>
                    <button onClick={() => void handleSave()} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-3 font-bold text-white shadow-lg shadow-pink-500/30 hover:scale-105 disabled:opacity-60">
                      {isSaving ? 'Đang lưu...' : 'Lưu kế hoạch'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
