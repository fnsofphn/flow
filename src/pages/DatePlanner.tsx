import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CalendarDays, CalendarHeart, Clock, Clock3, Heart, PencilLine, Plus, RefreshCcw, Sparkles, X } from 'lucide-react';
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

interface TodoSuggestion {
  id: string;
  task: string;
  cost: number;
  done: boolean;
}

const createActivityDraft = (seed?: Partial<ActivityDraft>): ActivityDraft => ({
  id: Date.now() + Math.floor(Math.random() * 1000),
  name: '',
  cost: 0,
  ...seed,
});

const emptyForm = () => ({
  title: '',
  date: '',
  time: '',
  activities: [createActivityDraft()],
});

const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')} VNĐ`;

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const parseDateTimeParts = (value: string | null) => {
  if (!value) return { date: '', time: '' };
  const localValue = toDateTimeLocalValue(value);
  const [date, time = ''] = localValue.split('T');
  return { date, time: time.slice(0, 5) };
};

const combineDateTime = (date: string, time: string) => {
  if (!date) return null;
  return new Date(`${date}T${time || '18:30'}`).toISOString();
};

const formatScheduleLabel = (date: string, time: string) => {
  if (!date) return 'Chưa chốt lịch hẹn';
  if (!time) return new Date(`${date}T00:00`).toLocaleDateString('vi-VN', { dateStyle: 'full' });
  return new Date(`${date}T${time}`).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' });
};

export default function DatePlanner() {
  const [plans, setPlans] = useState<DatePlan[]>([]);
  const [todoSuggestions, setTodoSuggestions] = useState<TodoSuggestion[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [isDatetimePickerOpen, setIsDatetimePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const totalCost = useMemo(
    () => form.activities.reduce((sum, activity) => sum + Number(activity.cost || 0), 0),
    [form.activities],
  );

  const loadPlannerData = async () => {
    setIsLoading(true);
    setError(null);

    const [{ data: plansData, error: plansError }, { data: todosData, error: todosError }] = await Promise.all([
      supabase
        .from('date_plans')
        .select('id, title, scheduled_for, date_plan_activities(id, name, cost, sort_order)')
        .order('scheduled_for', { ascending: true }),
      supabase.from('todos').select('id, task, cost, done').order('deadline', { ascending: true }),
    ]);

    if (plansError || todosError) {
      setPlans([]);
      setTodoSuggestions([]);
      setError(plansError?.message ?? todosError?.message ?? 'Không thể tải dữ liệu.');
      setIsLoading(false);
      return;
    }

    const normalizedPlans = ((plansData as DatePlan[]) ?? []).map((plan) => ({
      ...plan,
      date_plan_activities: [...(plan.date_plan_activities ?? [])].sort((a, b) => a.sort_order - b.sort_order),
    }));

    const normalizedTodos = ((todosData as TodoSuggestion[]) ?? []).sort((a, b) => Number(a.done) - Number(b.done));

    setPlans(normalizedPlans);
    setTodoSuggestions(normalizedTodos);
    setIsLoading(false);
  };

  useEffect(() => {
    void loadPlannerData();
  }, []);

  const handleOpenCreate = () => {
    setError(null);
    setEditingPlanId(null);
    setForm(emptyForm());
    setIsDatetimePickerOpen(false);
    setIsCreating(true);
  };

  const handleOpenEdit = (plan: DatePlan) => {
    setError(null);
    setEditingPlanId(plan.id);
    const { date, time } = parseDateTimeParts(plan.scheduled_for);
    setForm({
      title: plan.title,
      date,
      time,
      activities:
        plan.date_plan_activities.map((activity) =>
          createActivityDraft({ name: activity.name, cost: Number(activity.cost || 0) }),
        ) || [createActivityDraft()],
    });
    setIsDatetimePickerOpen(false);
    setIsCreating(true);
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setEditingPlanId(null);
    setIsDatetimePickerOpen(false);
    setForm(emptyForm());
  };

  const handleAddActivity = (seed?: Partial<ActivityDraft>) => {
    setForm((current) => ({
      ...current,
      activities: [...current.activities, createActivityDraft(seed)],
    }));
  };

  const handleActivityChange = (id: number, field: keyof ActivityDraft, value: string | number) => {
    setForm((current) => ({
      ...current,
      activities: current.activities.map((activity) => (activity.id === id ? { ...activity, [field]: value } : activity)),
    }));
  };

  const handleRemoveActivity = (id: number) => {
    setForm((current) => {
      const nextActivities = current.activities.filter((activity) => activity.id !== id);
      return {
        ...current,
        activities: nextActivities.length ? nextActivities : [createActivityDraft()],
      };
    });
  };

  const handleApplyTodoSuggestion = (todo: TodoSuggestion) => {
    setForm((current) => ({
      ...current,
      activities: [...current.activities, createActivityDraft({ name: todo.task, cost: Number(todo.cost || 0) })],
    }));
  };

  const handleSave = async () => {
    const cleanActivities = form.activities
      .map((activity, index) => ({
        name: activity.name.trim(),
        cost: Number(activity.cost || 0),
        sort_order: index,
      }))
      .filter((activity) => activity.name);

    if (!form.title.trim() || !form.date || !cleanActivities.length) {
      setError('Hãy nhập tên cuộc hẹn, lịch hẹn và ít nhất một hoạt động.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const scheduledFor = combineDateTime(form.date, form.time);

    if (!scheduledFor) {
      setIsSaving(false);
      setError('Hãy chọn ngày cho cuộc hẹn.');
      return;
    }

    if (editingPlanId) {
      const { error: updatePlanError } = await supabase
        .from('date_plans')
        .update({
          title: form.title.trim(),
          scheduled_for: scheduledFor,
        })
        .eq('id', editingPlanId);

      if (updatePlanError) {
        setIsSaving(false);
        setError(updatePlanError.message);
        return;
      }

      const { error: deleteActivitiesError } = await supabase.from('date_plan_activities').delete().eq('plan_id', editingPlanId);

      if (deleteActivitiesError) {
        setIsSaving(false);
        setError(deleteActivitiesError.message);
        return;
      }

      const { error: insertActivitiesError } = await supabase.from('date_plan_activities').insert(
        cleanActivities.map((activity) => ({
          ...activity,
          plan_id: editingPlanId,
        })),
      );

      if (insertActivitiesError) {
        setIsSaving(false);
        setError(insertActivitiesError.message);
        return;
      }

      handleCloseForm();
      setIsSaving(false);
      await loadPlannerData();
      return;
    }

    const { data: insertedPlan, error: planError } = await supabase
      .from('date_plans')
      .insert({
        title: form.title.trim(),
        scheduled_for: scheduledFor,
      })
      .select('id')
      .single();

    if (planError || !insertedPlan) {
      setIsSaving(false);
      setError(planError?.message ?? 'Không thể tạo cuộc hẹn.');
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

    handleCloseForm();
    setIsSaving(false);
    await loadPlannerData();
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
            Kế hoạch hẹn hò
            <CalendarHeart className="h-8 w-8 text-pink-500" />
          </h1>
          <p className="text-lg text-white/60">Lên lịch hẹn hò và lưu từng hoạt động một cách rõ ràng.</p>
        </motion.div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => void loadPlannerData()}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tải lại
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenCreate}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 px-6 py-3 font-medium text-white shadow-lg shadow-pink-500/30"
          >
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
              const totalPlanCost = plan.date_plan_activities.reduce((sum, activity) => sum + Number(activity.cost || 0), 0);

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

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(plan)}
                          className="rounded-lg border border-pink-500/20 bg-pink-500/10 px-3 py-2 text-sm text-pink-200 transition-colors hover:bg-pink-500/20"
                        >
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(plan.id)}
                          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <div className="mb-6 space-y-3">
                      {plan.date_plan_activities.map((activity) => (
                        <div key={activity.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 p-3">
                          <span className="flex items-center gap-2 text-white/80">
                            <div className="h-2 w-2 rounded-full bg-pink-500" />
                            {activity.name}
                          </span>
                          <span className="font-medium text-orange-300">{formatCurrency(Number(activity.cost || 0))}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-4">
                      <span className="text-sm font-semibold uppercase tracking-wider text-white/50">Tổng chi phí dự kiến</span>
                      <span className="bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-2xl font-bold text-transparent">
                        {formatCurrency(totalPlanCost)}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/65 backdrop-blur-sm"
              onClick={handleCloseForm}
            />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              transition={{ type: 'spring', damping: 24, stiffness: 210 }}
              className="fixed bottom-0 left-0 right-0 z-[101] max-h-[92vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-[radial-gradient(circle_at_top,#1e293b_0%,#0f172a_45%,#020617_100%)] md:left-1/2 md:top-1/2 md:w-[760px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-[32px]"
            >
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(236,72,153,0.16),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(251,113,133,0.16),transparent_24%)]" />
              <div className="relative p-6 md:p-8">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <p className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-white/40">
                      <Sparkles className="h-3.5 w-3.5" />
                      {editingPlanId ? 'Chỉnh sửa cuộc hẹn' : 'Tạo cuộc hẹn mới'}
                    </p>
                    <h2 className="flex items-center gap-2 text-2xl font-bold text-white">
                      <CalendarHeart className="h-6 w-6 text-pink-400" />
                      {editingPlanId ? 'Làm mới kế hoạch buổi hẹn' : 'Thiết kế buổi hẹn mới'}
                    </h2>
                  </div>
                  <button onClick={handleCloseForm} className="rounded-full bg-white/5 p-2 text-white/50 transition-colors hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-white/45">Tên cuộc hẹn</p>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm((current) => ({ ...current, title: e.target.value }))}
                      placeholder="Ví dụ: Gặp mặt cuối tuần"
                      className="w-full rounded-2xl border border-white/10 bg-slate-950/45 px-4 py-4 text-white placeholder:text-white/25 focus:border-pink-400 focus:outline-none"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                      <div className="mb-3 flex items-center justify-between">
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Gợi ý từ To-do</p>
                        <span className="text-xs text-white/35">Chạm để thêm nhanh</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {todoSuggestions.length ? (
                          todoSuggestions.slice(0, 8).map((todo) => (
                            <button
                              key={todo.id}
                              type="button"
                              onClick={() => handleApplyTodoSuggestion(todo)}
                              className={`rounded-full border px-3 py-2 text-sm transition-colors ${
                                todo.done
                                  ? 'border-emerald-400/15 bg-emerald-400/10 text-emerald-100/85'
                                  : 'border-pink-400/15 bg-pink-400/10 text-pink-100/90 hover:bg-pink-400/15'
                              }`}
                            >
                              {todo.task}
                              {Number(todo.cost || 0) > 0 ? ` · ${formatCurrency(Number(todo.cost || 0))}` : ''}
                            </button>
                          ))
                        ) : (
                          <p className="text-sm text-white/45">Chưa có việc nào trong To-do để gợi ý.</p>
                        )}
                      </div>
                    </div>

                    <div className="relative overflow-visible rounded-2xl border border-pink-400/20 bg-[radial-gradient(circle_at_top,#7f1d1d_0%,#111827_54%,#020617_100%)] p-4 text-pink-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.16),0_20px_45px_rgba(236,72,153,0.16)]">
                      <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                      <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-pink-100/55">Thời gian</p>
                      <button
                        type="button"
                        onClick={() => setIsDatetimePickerOpen((current) => !current)}
                        className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-colors hover:border-pink-300/60 hover:bg-black/25"
                      >
                        <span className={`truncate ${form.date ? 'text-white' : 'text-white/45'}`}>
                          {formatScheduleLabel(form.date, form.time)}
                        </span>
                        <CalendarDays className="h-5 w-5 shrink-0 text-pink-100/80" />
                      </button>
                      <p className="mt-3 text-xs text-pink-100/55">Chọn ngày trước, giờ có thể tinh chỉnh sau.</p>

                      <AnimatePresence>
                        {isDatetimePickerOpen ? (
                          <motion.div
                            initial={{ opacity: 0, y: 12, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 8, scale: 0.98 }}
                            className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-2xl border border-pink-300/20 bg-[radial-gradient(circle_at_top,#7f1d1d_0%,#111827_60%,#020617_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_60px_rgba(244,114,182,0.18)] backdrop-blur-xl"
                          >
                            <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                            <div className="grid gap-3">
                              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-pink-100/55">
                                  <CalendarDays className="h-3.5 w-3.5" />
                                  Ngày hẹn
                                </div>
                                <input
                                  type="date"
                                  value={form.date}
                                  onChange={(e) => setForm((current) => ({ ...current, date: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-pink-300 focus:outline-none [color-scheme:dark]"
                                />
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                                <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-pink-100/55">
                                  <Clock3 className="h-3.5 w-3.5" />
                                  Giờ gặp
                                </div>
                                <input
                                  type="time"
                                  value={form.time}
                                  onChange={(e) => setForm((current) => ({ ...current, time: e.target.value }))}
                                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-pink-300 focus:outline-none [color-scheme:dark]"
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {['10:30', '18:30', '20:00'].map((time) => (
                                  <button
                                    key={time}
                                    type="button"
                                    onClick={() => setForm((current) => ({ ...current, time }))}
                                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                      form.time === time
                                        ? 'border-pink-300/50 bg-pink-400/15 text-pink-100'
                                        : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                                    }`}
                                  >
                                    {time}
                                  </button>
                                ))}
                              </div>
                              <div className="flex items-center justify-end gap-3 pt-1">
                                <button
                                  type="button"
                                  onClick={() => setIsDatetimePickerOpen(false)}
                                  className="rounded-xl border border-pink-300/20 bg-pink-400/10 px-3 py-2 text-sm font-medium text-pink-100 transition-colors hover:bg-pink-400/15"
                                >
                                  Xong
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Danh sách hoạt động</p>
                        <p className="mt-2 text-sm text-white/45">Có thể thêm từ To-do hoặc nhập thủ công từng hoạt động.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddActivity()}
                        className="inline-flex items-center gap-2 rounded-xl border border-pink-400/20 bg-pink-400/10 px-4 py-2.5 text-sm font-medium text-pink-100 transition-colors hover:bg-pink-400/15"
                      >
                        <Plus className="h-4 w-4" />
                        Thêm tay
                      </button>
                    </div>

                    <div className="space-y-3">
                      {form.activities.map((activity, index) => (
                        <div
                          key={activity.id}
                          className="grid gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 md:grid-cols-[minmax(0,1fr)_170px_auto]"
                        >
                          <div>
                            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/35">Hoạt động {index + 1}</p>
                            <input
                              type="text"
                              value={activity.name}
                              onChange={(e) => handleActivityChange(activity.id, 'name', e.target.value)}
                              placeholder="Tên hoạt động"
                              className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 text-white placeholder:text-white/25 focus:border-pink-400 focus:outline-none"
                            />
                          </div>
                          <div>
                            <p className="mb-2 text-xs uppercase tracking-[0.18em] text-white/35">Chi phí</p>
                            <div className="relative">
                              <input
                                type="number"
                                value={activity.cost}
                                onChange={(e) => handleActivityChange(activity.id, 'cost', Number(e.target.value || 0))}
                                placeholder="0"
                                className="w-full rounded-2xl border border-white/10 bg-slate-950/50 px-4 py-3 pr-16 text-white placeholder:text-white/25 focus:border-pink-400 focus:outline-none"
                              />
                              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold uppercase tracking-[0.16em] text-white/45">
                                VNĐ
                              </span>
                            </div>
                          </div>
                          <div className="flex items-end">
                            <button
                              type="button"
                              onClick={() => handleRemoveActivity(activity.id)}
                              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                            >
                              Xóa
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] px-5 py-4">
                    <p className="text-sm uppercase tracking-[0.18em] text-amber-100/45">Tổng dự kiến</p>
                    <p className="mt-2 text-3xl font-bold text-amber-200">{formatCurrency(totalCost)}</p>
                  </div>

                  <button
                    onClick={() => void handleSave()}
                    disabled={isSaving}
                    className="w-full rounded-2xl bg-gradient-to-r from-pink-500 to-rose-500 py-4 font-bold text-white shadow-lg shadow-pink-500/30 disabled:opacity-60"
                  >
                    {isSaving ? 'Đang lưu kế hoạch...' : editingPlanId ? 'Cập nhật cuộc hẹn' : 'Lưu kế hoạch'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
