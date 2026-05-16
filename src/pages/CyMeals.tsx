import { FormEvent, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Check, Plus, Search, Sparkles, Tag, Trash2, Utensils, X } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { cn } from '../lib/utils';

type Meal = {
  id: string;
  name: string;
  tags: string[];
  source: 'seed' | 'manual';
  note?: string;
};

const MEAL_STORAGE_KEY = 'namcy-cy-meals';
const CY_COOKED_TAG = 'Cy nấu';

const seedMeals: Meal[] = [
  { id: 'seed-ga-tan-ngai-cuu', name: 'Gà tần ngải cứu', tags: [CY_COOKED_TAG, 'Bổ dưỡng'], source: 'seed' },
  { id: 'seed-thit-kho-cu-cai', name: 'Thịt kho củ cải', tags: [CY_COOKED_TAG, 'Món mặn'], source: 'seed' },
  { id: 'seed-uc-ga-xao-nam', name: 'Ức gà xào nấm', tags: [CY_COOKED_TAG, 'Nhanh gọn'], source: 'seed' },
  { id: 'seed-thit-bam-ca-rot-nam', name: 'Thịt băm cà rốt, nấm', tags: [CY_COOKED_TAG, 'Dễ ăn'], source: 'seed' },
  { id: 'seed-mong-gio-nau-rau-cu', name: 'Móng giò nấu rau củ', tags: [CY_COOKED_TAG, 'Canh'], source: 'seed' },
  { id: 'seed-cha-la-lot', name: 'Chả lá lốt', tags: [CY_COOKED_TAG, 'Món cuốn'], source: 'seed' },
];

const normalizeMealName = (value: string) => value.trim().replace(/\s+/g, ' ');

const readManualMeals = (): Meal[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const savedMeals = window.localStorage.getItem(MEAL_STORAGE_KEY);
    const parsedMeals = savedMeals ? JSON.parse(savedMeals) : [];

    if (!Array.isArray(parsedMeals)) {
      return [];
    }

    return parsedMeals.filter((meal): meal is Meal => (
      typeof meal?.id === 'string'
      && typeof meal?.name === 'string'
      && Array.isArray(meal?.tags)
      && meal.source === 'manual'
    ));
  } catch {
    return [];
  }
};

const saveManualMeals = (meals: Meal[]) => {
  window.localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(meals));
};

export default function CyMeals() {
  const [manualMeals, setManualMeals] = useState<Meal[]>(readManualMeals);
  const [query, setQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(CY_COOKED_TAG);
  const [newMealName, setNewMealName] = useState('');
  const [newMealNote, setNewMealNote] = useState('');
  const [newMealTag, setNewMealTag] = useState('');
  const [notice, setNotice] = useState('');

  const meals = useMemo(() => [...seedMeals, ...manualMeals], [manualMeals]);

  const allTags = useMemo(() => {
    const uniqueTags = new Set<string>();
    meals.forEach((meal) => meal.tags.forEach((tag) => uniqueTags.add(tag)));
    return Array.from(uniqueTags);
  }, [meals]);

  const filteredMeals = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('vi-VN');

    return meals.filter((meal) => {
      const matchesQuery = normalizedQuery.length === 0
        || meal.name.toLocaleLowerCase('vi-VN').includes(normalizedQuery)
        || meal.tags.some((tagName) => tagName.toLocaleLowerCase('vi-VN').includes(normalizedQuery));
      const matchesTag = selectedTag === 'Tất cả' || meal.tags.includes(selectedTag);

      return matchesQuery && matchesTag;
    });
  }, [meals, query, selectedTag]);

  const handleAddMeal = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const mealName = normalizeMealName(newMealName);
    const note = newMealNote.trim();
    const extraTag = normalizeMealName(newMealTag);

    if (!mealName) {
      setNotice('Nhập tên món trước khi thêm.');
      return;
    }

    const isDuplicate = meals.some((meal) => meal.name.toLocaleLowerCase('vi-VN') === mealName.toLocaleLowerCase('vi-VN'));

    if (isDuplicate) {
      setNotice('Món này đã có trong tuyển tập.');
      return;
    }

    const nextManualMeals = [
      {
        id: `manual-${Date.now()}`,
        name: mealName,
        tags: extraTag ? [CY_COOKED_TAG, extraTag] : [CY_COOKED_TAG],
        source: 'manual' as const,
        note: note || undefined,
      },
      ...manualMeals,
    ];

    setManualMeals(nextManualMeals);
    saveManualMeals(nextManualMeals);
    setNewMealName('');
    setNewMealNote('');
    setNewMealTag('');
    setSelectedTag(CY_COOKED_TAG);
    setNotice('Đã thêm món mới.');
  };

  const handleRemoveMeal = (mealId: string) => {
    const nextManualMeals = manualMeals.filter((meal) => meal.id !== mealId);
    setManualMeals(nextManualMeals);
    saveManualMeals(nextManualMeals);
    setNotice('Đã xoá món thủ công.');
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="grid gap-5 xl:grid-cols-[1fr_340px] xl:items-end">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm text-white/70">
            <Utensils className="h-4 w-4 text-amber-300" />
            Tuyển tập món ăn
          </div>
          <h1 className="mb-3 text-4xl font-bold tracking-tight text-white">Món Cy nấu</h1>
          <p className="max-w-3xl text-lg leading-8 text-white/62">
            Những món đã được lưu dưới tag Cy nấu để Nam và Cy xem nhanh khi cần chọn bữa.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/10 bg-white/10 px-5 py-4 backdrop-blur-md"
        >
          <p className="text-sm text-white/55">Tổng món trong tuyển tập</p>
          <p className="mt-1 text-3xl font-bold text-white">{meals.length}</p>
          <div className="mt-3 flex items-center gap-2 text-sm text-emerald-200">
            <Check className="h-4 w-4" />
            {manualMeals.length} món thêm thủ công
          </div>
        </motion.div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <TiltCard className="bg-white/5">
          <div className="mb-5 flex items-start gap-3">
            <div className="rounded-2xl bg-amber-500/15 p-3">
              <Plus className="h-6 w-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Thêm món thủ công</h2>
              <p className="mt-2 text-sm text-white/60">Món mới tự động được gắn tag Cy nấu.</p>
            </div>
          </div>

          <form onSubmit={handleAddMeal} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/70">Tên món</span>
              <input
                value={newMealName}
                onChange={(event) => setNewMealName(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-amber-300/70"
                placeholder="Ví dụ: Canh bí đỏ thịt băm"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/70">Tag phụ</span>
              <input
                value={newMealTag}
                onChange={(event) => setNewMealTag(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-amber-300/70"
                placeholder="Canh, món mặn, nhanh gọn..."
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white/70">Ghi chú</span>
              <textarea
                value={newMealNote}
                onChange={(event) => setNewMealNote(event.target.value)}
                className="min-h-28 w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-amber-300/70"
                placeholder="Khẩu vị, nguyên liệu chính, dịp nên nấu..."
              />
            </label>

            <button
              type="submit"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-amber-300"
            >
              <Plus className="h-4 w-4" />
              Thêm vào tuyển tập
            </button>

            {notice ? (
              <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white/70">
                <span>{notice}</span>
                <button type="button" onClick={() => setNotice('')} className="text-white/45 transition hover:text-white" aria-label="Ẩn thông báo">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </form>
        </TiltCard>

        <section className="space-y-5">
          <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-white/5 p-4 backdrop-blur-md md:flex-row md:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-black/20 py-3 pl-11 pr-4 text-white outline-none transition placeholder:text-white/30 focus:border-sky-300/70"
                placeholder="Tìm theo tên món hoặc tag"
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 md:max-w-[52%]">
              {['Tất cả', ...allTags].map((tagName) => (
                <button
                  key={tagName}
                  type="button"
                  onClick={() => setSelectedTag(tagName)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm transition',
                    selectedTag === tagName
                      ? 'border-sky-300/60 bg-sky-400/18 text-sky-100'
                      : 'border-white/10 bg-black/15 text-white/58 hover:border-white/20 hover:text-white',
                  )}
                >
                  <Tag className="h-3.5 w-3.5" />
                  {tagName}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {filteredMeals.map((meal, index) => (
              <motion.article
                key={meal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.04, 0.24) }}
                className="rounded-[24px] border border-white/10 bg-white/[0.055] p-5 shadow-xl shadow-black/10 backdrop-blur-md"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-200">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold leading-7 text-white">{meal.name}</h3>
                      <p className="mt-1 text-sm text-white/45">{meal.source === 'seed' ? 'Món nhập sẵn' : 'Món thêm thủ công'}</p>
                    </div>
                  </div>

                  {meal.source === 'manual' ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveMeal(meal.id)}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/45 transition hover:border-rose-300/50 hover:bg-rose-500/10 hover:text-rose-100"
                      aria-label={`Xoá ${meal.name}`}
                      title="Xoá món"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                {meal.note ? <p className="mb-4 text-sm leading-6 text-white/62">{meal.note}</p> : null}

                <div className="flex flex-wrap gap-2">
                  {meal.tags.map((tagName) => (
                    <span key={tagName} className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-xs font-medium text-white/65">
                      {tagName}
                    </span>
                  ))}
                </div>
              </motion.article>
            ))}
          </div>

          {filteredMeals.length === 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-black/15 px-5 py-8 text-center text-white/58">
              Chưa có món nào khớp với bộ lọc hiện tại.
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
