import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarHeart, Clock, Heart, Plus, RefreshCcw, X } from 'lucide-react';
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
      .select('id, title, scheduled_for, date_plan_activities(id, name, cost, sort_order)')
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
      setError('Hay nhap ten ke hoach, thoi gian va it nhat mot hoat dong.');
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
      setIsSaving(false);
      setError(planError?.message ?? 'Khong the tao ke hoach.');
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
      setIsSaving(false);
      setError(activityError.message);
      return;
    }

    resetForm();
    setIsCreating(false);
    setIsSaving(false);
    await loadPlans();
  };

  const handleDelete = async (id: string) => {
    const previous = plans;
    setPlans((current) => current.filter((plan) => plan.id !== id));

    const { error: deleteError } = await supabase.from('date_plans').delete().eq('id', id);

    if (deleteError) {
      setPlans(previous);
      setError(deleteError.message);
    }
  };

  return (
    <div className="relative space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-4xl font-bold tracking-tight">
            He thong hen ho
            <CalendarHeart className="h-8 w-8 text-pink-500" />
          </h1>
          <p className="text-lg text-white/60">Lap lich hen ho va luu tung hoat dong vao Supabase.</p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => void loadPlans()} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10">
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tai lai
          </button>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} onClick={() => setIsCreating(true)} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-medium text-white shadow-lg shadow-pink-500/30">
            <Plus className="h-5 w-5" />
            Tao cuoc hen
          </motion.button>
        </div>
      </header>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {isLoading ? (
        <TiltCard className="text-center text-white/60">Dang tai lich hen ho tu Supabase...</TiltCard>
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

                      <button onClick={() => void handleDelete(plan.id)} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white">
                        Xoa
                      </button>
                    </div>

                    <div className="mb-6 space-y-3">
                      {plan.date_plan_activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                          <span className="flex items-center gap-2 text-white/80">
                            <div className="h-2 w-2 rounded-full bg-pink-500" />
                            {activity.name}
                          </span>
                          <span className="font-medium text-orange-300">{Number(activity.cost || 0).toLocaleString('vi-VN')}d</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm font-semibold uppercase tracking-wider text-white/50">Tong chi phi du kien</span>
                      <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-2xl font-bold text-transparent">
                        {totalCost.toLocaleString('vi-VN')}d
                      </span>
                    </div>
                  </TiltCard>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {!plans.length ? <TiltCard className="text-center text-white/60">Chua co lich hen ho nao trong Supabase.</TiltCard> : null}
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
                    Len lich hen ho moi
                  </h2>
                  <button onClick={() => setIsCreating(false)} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Ten cuoc hen</label>
                    <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="VD: Ky niem 2 nam..." className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none transition-colors" />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-white/70">Thoi gian</label>
                    <input type="datetime-local" value={newDatetime} onChange={(e) => setNewDatetime(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-pink-500 focus:outline-none transition-colors [color-scheme:dark]" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="block text-sm font-medium text-white/70">Danh sach hoat dong</label>
                      <button onClick={handleAddActivity} className="flex items-center gap-1 text-sm text-pink-400 hover:text-pink-300">
                        <Plus className="h-4 w-4" /> Them
                      </button>
                    </div>

                    <div className="space-y-3">
                      {newActivities.map((activity) => (
                        <div key={activity.id} className="flex items-center gap-3">
                          <input type="text" value={activity.name} onChange={(e) => handleActivityChange(activity.id, 'name', e.target.value)} placeholder="Ten hoat dong" className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none" />
                          <input type="number" value={activity.cost || ''} onChange={(e) => handleActivityChange(activity.id, 'cost', parseInt(e.target.value, 10) || 0)} placeholder="Chi phi" className="w-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/30 focus:border-pink-500 focus:outline-none" />
                          <button onClick={() => handleRemoveActivity(activity.id)} className="rounded-xl border border-white/10 bg-white/5 p-3 text-white/30 hover:text-red-400">
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between border-t border-white/10 pt-6">
                    <div>
                      <p className="text-sm text-white/50">Tong du kien</p>
                      <p className="text-2xl font-bold text-orange-400">
                        {newActivities.reduce((sum, activity) => sum + (activity.cost || 0), 0).toLocaleString('vi-VN')}d
                      </p>
                    </div>
                    <button onClick={() => void handleSave()} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-8 py-3 font-bold text-white shadow-lg shadow-pink-500/30 transition-transform hover:scale-105 disabled:opacity-60">
                      {isSaving ? 'Dang luu...' : 'Luu ke hoach'}
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
