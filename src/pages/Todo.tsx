import { useEffect, useMemo, useState, type JSX, type MouseEvent } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Calendar, CalendarDays, CheckCircle2, CheckSquare, Circle, Clock3, MapPin, Plus, RefreshCcw, X } from 'lucide-react';
import TiltCard from '../components/TiltCard';
import { supabase } from '../lib/supabase';

type Todo = {
  id: string;
  task: string;
  assignee: string;
  deadline: string | null;
  cost: number;
  location: string | null;
  map_url: string | null;
  done: boolean;
};

type TodoComment = {
  id: string;
  todo_id: string;
  parent_id: string | null;
  author: string;
  content: string;
  created_at: string;
};

type ReactionName = 'love' | 'haha';

type TodoCommentReaction = {
  id: string;
  comment_id: string;
  reaction: ReactionName;
  actor_id: string;
  created_at: string;
};

type TodoCommentNode = TodoComment & {
  replies: TodoCommentNode[];
};

type ReactionMeta = {
  count: number;
  active: boolean;
  reactionId: string | null;
};

type ReactionSummary = Record<ReactionName, ReactionMeta>;

type ReactionBurst = {
  id: number;
  emoji: string;
  x: number;
  y: number;
  driftX: number;
  driftY: number;
  rotate: number;
  scale: number;
  duration: number;
};

const emptyForm = {
  task: '',
  assignee: 'Nam',
  deadlineDate: '',
  deadlineTime: '',
  cost: '',
  location: '',
  mapUrl: '',
};

const assigneeOptions = [
  {
    value: 'Nam',
    title: 'Nam',
    className:
      'border-sky-400/30 bg-[radial-gradient(circle_at_top,#38bdf8_0%,#0f172a_58%,#020617_100%)] text-sky-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_18px_40px_rgba(14,165,233,0.22)]',
  },
  {
    value: 'Cy',
    title: 'Cy',
    className:
      'border-fuchsia-400/30 bg-[radial-gradient(circle_at_top,#f472b6_0%,#312e81_55%,#111827_100%)] text-fuchsia-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_18px_40px_rgba(217,70,239,0.2)]',
  },
  {
    value: 'Nam & Cy',
    title: 'Ca hai',
    className:
      'border-amber-300/30 bg-[radial-gradient(circle_at_top,#fbbf24_0%,#7c2d12_42%,#1f2937_100%)] text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.28),0_20px_45px_rgba(251,191,36,0.18)]',
  },
] as const;

const reactionOptions: { value: ReactionName; emoji: string; label: string }[] = [
  { value: 'love', emoji: 'LOVE', label: 'Tim' },
  { value: 'haha', emoji: 'HAHA', label: 'Haha' },
];

const createReactionSummary = (): ReactionSummary => ({
  love: { count: 0, active: false, reactionId: null },
  haha: { count: 0, active: false, reactionId: null },
});

const formatCurrency = (amount: number) => `${amount.toLocaleString('vi-VN')} VND`;

const toDateTimeLocalValue = (value: string) => {
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const formatDeadlineLabel = (date: string, time: string) => {
  if (!date) return 'Chua chot lich';
  if (!time) return new Date(`${date}T00:00`).toLocaleDateString('vi-VN', { dateStyle: 'short' });
  return new Date(`${date}T${time}`).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
};

const combineDeadline = (date: string, time: string) => {
  if (!date) return null;
  return new Date(`${date}T${time || '09:00'}`).toISOString();
};

const parseDeadlineParts = (value: string | null) => {
  if (!value) {
    return { deadlineDate: '', deadlineTime: '' };
  }

  const localValue = toDateTimeLocalValue(value);
  const [deadlineDate, deadlineTime = ''] = localValue.split('T');
  return { deadlineDate, deadlineTime: deadlineTime.slice(0, 5) };
};

const sortTodosByDeadline = (items: Todo[]) =>
  [...items].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });

const renderAssigneeBadges = (assignee: string) => {
  const people = assignee.split('&').map((item) => item.trim()).filter(Boolean);

  return people.map((person) => {
    const palette =
      person === 'Nam'
        ? 'border-sky-400/20 bg-sky-400/10 text-sky-100'
        : person === 'Cy'
          ? 'border-fuchsia-400/20 bg-fuchsia-400/10 text-fuchsia-100'
          : 'border-white/10 bg-white/10 text-white/80';

    return (
      <span key={`${assignee}-${person}`} className={`rounded-full border px-2.5 py-1 font-medium ${palette}`}>
        {person}
      </span>
    );
  });
};

const buildCommentTree = (comments: TodoComment[]) => {
  const nodes = new Map<string, TodoCommentNode>();
  const roots: TodoCommentNode[] = [];

  comments.forEach((comment) => {
    nodes.set(comment.id, { ...comment, replies: [] });
  });

  comments.forEach((comment) => {
    const node = nodes.get(comment.id);
    if (!node) return;

    if (comment.parent_id) {
      const parent = nodes.get(comment.parent_id);
      if (parent) {
        parent.replies.push(node);
        return;
      }
    }

    roots.push(node);
  });

  return roots;
};

const isSchemaMismatchError = (message: string) =>
  /column|relation|does not exist|Could not find/i.test(message);

const getTodoActorId = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = 'flow-todo-reactor-id';
  const existing = window.localStorage.getItem(storageKey);
  if (existing) {
    return existing;
  }

  const nextId =
    typeof window.crypto?.randomUUID === 'function'
      ? window.crypto.randomUUID()
      : `todo-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(storageKey, nextId);
  return nextId;
};

export default function Todo() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [todoComments, setTodoComments] = useState<TodoComment[]>([]);
  const [commentReactions, setCommentReactions] = useState<TodoCommentReaction[]>([]);
  const [selectedMap, setSelectedMap] = useState<string | null>(null);
  const [selectedTodo, setSelectedTodo] = useState<Todo | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [isDeadlinePickerOpen, setIsDeadlinePickerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [isCommentSaving, setIsCommentSaving] = useState(false);
  const [isReactionSaving, setIsReactionSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [reactorId, setReactorId] = useState('');
  const [reactionBursts, setReactionBursts] = useState<ReactionBurst[]>([]);
  const [form, setForm] = useState(emptyForm);

  const summary = useMemo(() => {
    const completed = todos.filter((todo) => todo.done).length;
    const budget = todos.reduce((sum, todo) => sum + Number(todo.cost || 0), 0);
    return { completed, budget };
  }, [todos]);

  const commentTree = useMemo(() => buildCommentTree(todoComments), [todoComments]);

  const reactionLookup = useMemo(() => {
    const map = new Map<string, ReactionSummary>();

    todoComments.forEach((comment) => {
      map.set(comment.id, createReactionSummary());
    });

    commentReactions.forEach((reaction) => {
      const current = map.get(reaction.comment_id) ?? createReactionSummary();
      current[reaction.reaction].count += 1;
      if (reaction.actor_id === reactorId) {
        current[reaction.reaction].active = true;
        current[reaction.reaction].reactionId = reaction.id;
      }
      map.set(reaction.comment_id, current);
    });

    return map;
  }, [commentReactions, reactorId, todoComments]);

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
      setTodos(sortTodosByDeadline((data as Todo[]) ?? []));
    }

    setIsLoading(false);
  };

  useEffect(() => {
    void loadTodos();
  }, []);

  useEffect(() => {
    setReactorId(getTodoActorId());
  }, []);

  useEffect(() => {
    const loadComments = async () => {
      if (!selectedTodo) {
        setTodoComments([]);
        setCommentReactions([]);
        setCommentDraft('');
        setReplyDrafts({});
        setReplyingToId(null);
        return;
      }

      setIsCommentsLoading(true);

      let loadedComments: TodoComment[] = [];
      const commentsResult = await supabase
        .from('todo_comments')
        .select('id, todo_id, parent_id, author, content, created_at')
        .eq('todo_id', selectedTodo.id)
        .order('created_at', { ascending: true });

      if (commentsResult.error) {
        if (isSchemaMismatchError(commentsResult.error.message)) {
          const fallbackComments = await supabase
            .from('todo_comments')
            .select('id, todo_id, content, created_at')
            .eq('todo_id', selectedTodo.id)
            .order('created_at', { ascending: true });

          if (fallbackComments.error) {
            setError(fallbackComments.error.message);
            setTodoComments([]);
          } else {
            loadedComments = ((fallbackComments.data as Omit<TodoComment, 'author' | 'parent_id'>[]) ?? []).map((comment) => ({
              ...comment,
              parent_id: null,
              author: 'Ban',
            }));
            setTodoComments(loadedComments);
          }

          setCommentReactions([]);
        } else {
          setError(commentsResult.error.message);
          setTodoComments([]);
          setCommentReactions([]);
        }
      } else {
        loadedComments = (commentsResult.data as TodoComment[]) ?? [];
        setTodoComments(loadedComments);

        if (loadedComments.length) {
          const reactionsResult = await supabase
            .from('todo_comment_reactions')
            .select('id, comment_id, reaction, actor_id, created_at')
            .in('comment_id', loadedComments.map((comment) => comment.id));

          if (reactionsResult.error) {
            if (!isSchemaMismatchError(reactionsResult.error.message)) {
              setError(reactionsResult.error.message);
            }
            setCommentReactions([]);
          } else {
            setCommentReactions((reactionsResult.data as TodoCommentReaction[]) ?? []);
          }
        } else {
          setCommentReactions([]);
        }
      }

      setIsCommentsLoading(false);
    };

    void loadComments();
  }, [selectedTodo]);

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
    if (!form.task.trim()) {
      setError('Hay nhap ten cong viec.');
      return;
    }

    setIsSaving(true);
    setError(null);

    const payload = {
      task: form.task.trim(),
      assignee: form.assignee,
      deadline: combineDeadline(form.deadlineDate, form.deadlineTime),
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
      setTodos((current) => sortTodosByDeadline([...current, data as Todo]));
      handleCloseForm();
    }

    setIsSaving(false);
  };

  const handleEdit = (todo: Todo) => {
    setError(null);
    setEditingTodoId(todo.id);
    setForm({
      task: todo.task,
      assignee: todo.assignee,
      ...parseDeadlineParts(todo.deadline),
      cost: String(Number(todo.cost || 0)),
      location: todo.location ?? '',
      mapUrl: todo.map_url ?? '',
    });
    setIsCreating(true);
  };

  const handleSave = async () => {
    if (editingTodoId) {
      if (!form.task.trim()) {
        setError('Hay nhap ten cong viec.');
        return;
      }

      setIsSaving(true);
      setError(null);

      const payload = {
        task: form.task.trim(),
        assignee: form.assignee,
        deadline: combineDeadline(form.deadlineDate, form.deadlineTime),
        cost: Number(form.cost || 0),
        location: form.location.trim() || null,
        map_url: form.mapUrl.trim() || null,
      };

      const previous = todos;
      setTodos((current) =>
        sortTodosByDeadline(current.map((todo) => (todo.id === editingTodoId ? { ...todo, ...payload } : todo))),
      );

      const { error: updateError } = await supabase.from('todos').update(payload).eq('id', editingTodoId);

      if (updateError) {
        setTodos(previous);
        setError(updateError.message);
      } else {
        handleCloseForm();
      }

      setIsSaving(false);
      return;
    }

    await handleCreate();
  };

  const handleCloseForm = () => {
    setIsCreating(false);
    setEditingTodoId(null);
    setIsDeadlinePickerOpen(false);
    setForm(emptyForm);
  };

  const handleCloseDetails = () => {
    setSelectedTodo(null);
    setTodoComments([]);
    setCommentReactions([]);
    setCommentDraft('');
    setReplyDrafts({});
    setReplyingToId(null);
  };

  const spawnReactionBurst = (reaction: ReactionName, element: HTMLElement) => {
    const rect = element.getBoundingClientRect();
    const emoji = reactionOptions.find((option) => option.value === reaction)?.emoji ?? '?';
    const burstCount = reaction === 'love' ? 10 : 8;
    const nextBursts = Array.from({ length: burstCount }, (_, index) => ({
      id: Date.now() + index + Math.floor(Math.random() * 1000),
      emoji,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      driftX: (Math.random() - 0.5) * (reaction === 'love' ? 140 : 170),
      driftY: 90 + Math.random() * 80,
      rotate: (Math.random() - 0.5) * 70,
      scale: 0.9 + Math.random() * 0.8,
      duration: 0.75 + Math.random() * 0.45,
    }));

    setReactionBursts((current) => [...current, ...nextBursts]);
    window.setTimeout(() => {
      setReactionBursts((current) => current.filter((item) => !nextBursts.some((burst) => burst.id === item.id)));
    }, 1400);
  };

  const handleAddComment = async (parentId: string | null = null) => {
    const draft = parentId ? (replyDrafts[parentId] ?? '') : commentDraft;

    if (!selectedTodo || !draft.trim()) {
      return;
    }

    setIsCommentSaving(true);
    setError(null);

    const insertResult = await supabase
      .from('todo_comments')
      .insert({
        todo_id: selectedTodo.id,
        parent_id: parentId,
        author: 'Ban',
        content: draft.trim(),
      })
      .select('id, todo_id, parent_id, author, content, created_at')
      .single();

    if (insertResult.error) {
      if (isSchemaMismatchError(insertResult.error.message) && !parentId) {
        const fallbackResult = await supabase
          .from('todo_comments')
          .insert({
            todo_id: selectedTodo.id,
            content: draft.trim(),
          })
          .select('id, todo_id, content, created_at')
          .single();

        if (fallbackResult.error) {
          setError(fallbackResult.error.message);
        } else if (fallbackResult.data) {
          setTodoComments((current) => [
            ...current,
            {
              ...(fallbackResult.data as Omit<TodoComment, 'author' | 'parent_id'>),
              parent_id: null,
              author: 'Ban',
            },
          ]);
          setCommentDraft('');
        }
      } else {
        setError(parentId ? 'Hay chay migration comment moi de dung tra loi nhieu tang.' : insertResult.error.message);
      }
    } else if (insertResult.data) {
      setTodoComments((current) => [...current, insertResult.data as TodoComment]);
      if (parentId) {
        setReplyDrafts((current) => ({ ...current, [parentId]: '' }));
        setReplyingToId(null);
      } else {
        setCommentDraft('');
      }
    }

    setIsCommentSaving(false);
  };

  const handleToggleReaction = async (
    commentId: string,
    reaction: ReactionName,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    if (!reactorId) {
      return;
    }

    const savingKey = `${commentId}:${reaction}`;
    const existingReaction = commentReactions.find(
      (item) => item.comment_id === commentId && item.reaction === reaction && item.actor_id === reactorId,
    );

    setIsReactionSaving(savingKey);
    setError(null);

    if (existingReaction) {
      setCommentReactions((current) => current.filter((item) => item.id !== existingReaction.id));

      const { error: deleteError } = await supabase.from('todo_comment_reactions').delete().eq('id', existingReaction.id);

      if (deleteError) {
        setCommentReactions((current) => [...current, existingReaction]);
        setError(isSchemaMismatchError(deleteError.message) ? 'Hay chay migration reaction moi de bat react comment.' : deleteError.message);
      }
    } else {
      const optimisticReaction: TodoCommentReaction = {
        id: `temp-${Date.now()}`,
        comment_id: commentId,
        reaction,
        actor_id: reactorId,
        created_at: new Date().toISOString(),
      };

      setCommentReactions((current) => [...current, optimisticReaction]);

      const { data, error: insertError } = await supabase
        .from('todo_comment_reactions')
        .insert({
          comment_id: commentId,
          reaction,
          actor_id: reactorId,
        })
        .select('id, comment_id, reaction, actor_id, created_at')
        .single();

      if (insertError) {
        setCommentReactions((current) => current.filter((item) => item.id !== optimisticReaction.id));
        setError(isSchemaMismatchError(insertError.message) ? 'Hay chay migration reaction moi de bat react comment.' : insertError.message);
      } else if (data) {
        setCommentReactions((current) =>
          current.map((item) => (item.id === optimisticReaction.id ? (data as TodoCommentReaction) : item)),
        );
        spawnReactionBurst(reaction, event.currentTarget);
      }
    }

    setIsReactionSaving(null);
  };

  const handleDelete = async (id: string) => {
    const previous = todos;
    setTodos((current) => current.filter((todo) => todo.id !== id));
    setSelectedTodo((current) => (current?.id === id ? null : current));

    const { error: deleteError } = await supabase.from('todos').delete().eq('id', id);

    if (deleteError) {
      setTodos(previous);
      setError(deleteError.message);
    }
  };

  const renderCommentNode = (comment: TodoCommentNode, depth = 0): JSX.Element => {
    const summary = reactionLookup.get(comment.id) ?? createReactionSummary();
    const isReplying = replyingToId === comment.id;
    const replyDraft = replyDrafts[comment.id] ?? '';
    const indent = Math.min(depth, 4) * 18;

    return (
      <div key={comment.id} className="space-y-3" style={{ marginLeft: indent }}>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] uppercase tracking-[0.22em] text-white/35">{comment.author}</div>
            <div className="text-[11px] uppercase tracking-[0.16em] text-white/30">
              {new Date(comment.created_at).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
            </div>
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-white/82">{comment.content}</p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {reactionOptions.map((option) => {
              const reactionState = summary[option.value];
              const savingKey = `${comment.id}:${option.value}`;

              return (
                <button
                  key={`${comment.id}-${option.value}`}
                  type="button"
                  onClick={(event) => void handleToggleReaction(comment.id, option.value, event)}
                  disabled={isReactionSaving === savingKey}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    reactionState.active
                      ? 'border-cyan-300/45 bg-cyan-400/15 text-cyan-100'
                      : 'border-white/10 bg-white/[0.03] text-white/65 hover:bg-white/[0.08]'
                  } ${isReactionSaving === savingKey ? 'opacity-60' : ''}`}
                >
                  <span className="mr-1.5">{option.emoji}</span>
                  {reactionState.count ? reactionState.count : option.label}
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => setReplyingToId((current) => (current === comment.id ? null : comment.id))}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/65 transition-colors hover:bg-white/[0.08]"
            >
              {isReplying ? 'An tra loi' : 'Tra loi'}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {isReplying ? (
              <motion.div
                initial={{ opacity: 0, height: 0, y: 6 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -4 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
                  <textarea
                    value={replyDraft}
                    onChange={(event) => setReplyDrafts((current) => ({ ...current, [comment.id]: event.target.value }))}
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-cyan-300 focus:outline-none"
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => void handleAddComment(comment.id)}
                      disabled={isCommentSaving || !replyDraft.trim()}
                      className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isCommentSaving ? 'Dang gui...' : 'Gui tra loi'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>

        {comment.replies.length ? (
          <div className="space-y-3 border-l border-white/10 pl-3">
            {comment.replies.map((reply) => renderCommentNode(reply, depth + 1))}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-8 pb-24">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <h1 className="mb-2 flex items-center gap-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Viec can lam
            <CheckSquare className="h-8 w-8 text-blue-400" />
          </h1>
          <p className="text-base text-white/60 sm:text-lg">Theo doi danh sach cong viec chung theo thoi gian thuc.</p>
        </motion.div>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <button
            onClick={() => void loadTodos()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-medium text-white/80 transition-colors hover:bg-white/10 sm:w-auto"
          >
            <RefreshCcw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Tai lai
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsCreating(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-medium text-white shadow-lg shadow-blue-500/30 sm:w-auto"
          >
            <Plus className="h-5 w-5" />
            Them viec moi
          </motion.button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Tong viec</p>
          <p className="mt-3 text-3xl font-bold text-white">{todos.length}</p>
        </TiltCard>
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Da xong</p>
          <p className="mt-3 text-3xl font-bold text-emerald-300">{summary.completed}</p>
        </TiltCard>
        <TiltCard className="bg-white/5">
          <p className="text-sm uppercase tracking-[0.2em] text-white/40">Ngân sách</p>
          <p className="mt-3 text-3xl font-bold text-orange-300">{formatCurrency(summary.budget)}</p>
        </TiltCard>
      </div>

      {error ? <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</div> : null}

      {isLoading ? (
        <TiltCard className="text-center text-white/60">Dang tai danh sach cong viec...</TiltCard>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.div key={todo.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.98 }} layout>
                <TiltCard
                  glow={!todo.done}
                  className={`overflow-hidden transition-all duration-500 ${todo.done ? 'opacity-70 grayscale-[28%]' : ''}`}
                >
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedTodo((current) => (current?.id === todo.id ? null : todo))}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          setSelectedTodo((current) => (current?.id === todo.id ? null : todo));
                        }
                      }}
                      className="group relative overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] p-5 text-left transition-all hover:border-white/20 hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.1),rgba(255,255,255,0.03))]"
                    >
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_38%),radial-gradient(circle_at_bottom_left,rgba(251,191,36,0.14),transparent_28%)] opacity-70" />
                      <div className="relative flex items-start gap-4">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void toggleTodo(todo);
                          }}
                          className="mt-1 text-white/50 transition-colors hover:text-white"
                        >
                        {todo.done ? <CheckCircle2 className="h-8 w-8 text-green-500" /> : <Circle className="h-8 w-8 hover:text-blue-400" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="mb-2 text-[11px] font-medium uppercase tracking-[0.28em] text-white/35">
                                {todo.done ? 'Da hoan thanh' : 'Dang theo doi'}
                              </p>
                              <h3 className={`truncate text-xl font-bold ${todo.done ? 'line-through text-white/45' : 'text-white/95'}`}>
                                {todo.task}
                              </h3>
                            </div>
                            <div className="rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1.5 text-sm font-semibold text-orange-300">
                              {formatCurrency(Number(todo.cost || 0))}
                            </div>
                          </div>

                          <div className="mt-4 flex flex-wrap items-center gap-2.5 text-sm text-white/65">
                            {renderAssigneeBadges(todo.assignee)}
                            <span className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5">
                              <Calendar className="h-4 w-4 text-cyan-300/80" />
                              {todo.deadline
                                ? new Date(todo.deadline).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })
                                : 'Chua chot ngay'}
                            </span>
                            {todo.location ? (
                              <span className="flex max-w-full items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-white/55">
                                <MapPin className="h-4 w-4 text-fuchsia-300/80" />
                                <span className="truncate">{todo.location}</span>
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-5 flex justify-end">
                            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-sm font-medium text-white/70 transition-colors group-hover:border-cyan-300/30 group-hover:text-cyan-100">
                              {selectedTodo?.id === todo.id ? 'An chi tiet' : 'Chi tiet'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:w-[190px] lg:flex-col lg:justify-center">
                      {todo.location ? (
                        <button
                          type="button"
                          onClick={() => todo.map_url && setSelectedMap(todo.map_url)}
                        className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 transition-colors sm:w-auto ${
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
                        type="button"
                        onClick={() => handleEdit(todo)}
                        className="w-full rounded-lg border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-sm text-blue-300 transition-colors hover:bg-blue-500/20 lg:w-full"
                      >
                        Sua
                      </button>

                      <button
                        type="button"
                        onClick={() => void handleDelete(todo.id)}
                        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:w-full"
                      >
                        Xóa
                      </button>
                    </div>
                  </div>

                  <AnimatePresence initial={false}>
                    {selectedTodo?.id === todo.id ? (
                      <motion.div
                        initial={{ opacity: 0, height: 0, y: 8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, y: -6 }}
                        transition={{ duration: 0.28, ease: 'easeOut' }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 grid gap-5 border-t border-white/10 pt-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)]">
                          <div className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Nguoi thuc hien</p>
                                <div className="mt-3 flex flex-wrap gap-2">{renderAssigneeBadges(todo.assignee)}</div>
                              </div>
                              <div className="rounded-2xl border border-cyan-400/15 bg-cyan-400/[0.06] p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/45">Thoi gian</p>
                                <p className="mt-3 text-base font-semibold text-cyan-50">
                                  {todo.deadline
                                    ? new Date(todo.deadline).toLocaleString('vi-VN', { dateStyle: 'full', timeStyle: 'short' })
                                    : 'Chua chot ngay gio'}
                                </p>
                              </div>
                              <div className="rounded-2xl border border-amber-300/15 bg-amber-400/[0.06] p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-amber-100/45">Ngân sách</p>
                                <p className="mt-3 text-base font-semibold text-amber-50">{formatCurrency(Number(todo.cost || 0))}</p>
                              </div>
                              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Dia diem</p>
                                <p className="mt-3 text-base font-semibold text-white/85">{todo.location || 'Chua them dia diem'}</p>
                              </div>
                            </div>

                            {todo.map_url ? (
                              <button
                                type="button"
                                onClick={() => setSelectedMap(todo.map_url)}
                                className="flex items-center gap-2 rounded-2xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
                              >
                                <MapPin className="h-4 w-4" />
                                Mo ban do
                              </button>
                            ) : null}

                            <div className="flex flex-wrap gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  handleCloseDetails();
                                  handleEdit(todo);
                                }}
                                className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-2.5 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/20"
                              >
                                Chinh sua
                              </button>
                              <button
                                type="button"
                                onClick={() => void toggleTodo(todo)}
                                className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-2.5 text-sm font-medium text-emerald-300 transition-colors hover:bg-emerald-500/20"
                              >
                                {todo.done ? 'Danh dau chua xong' : 'Danh dau da xong'}
                              </button>
                            </div>
                          </div>

                          <div className="rounded-[26px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))] p-4 md:p-5">
                            <div className="mb-4 flex items-center justify-between gap-3">
                              <div>
                                <p className="text-[11px] uppercase tracking-[0.26em] text-white/35">Comment</p>
                                <h3 className="mt-2 text-xl font-semibold text-white">Trao doi cong viec</h3>
                              </div>
                              <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-white/60">
                                {todoComments.length}
                              </div>
                            </div>

                            <div className="space-y-3">
                              <textarea
                                value={commentDraft}
                                onChange={(event) => setCommentDraft(event.target.value)}
                                rows={4}
                                className="w-full resize-none rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white focus:border-cyan-300 focus:outline-none"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => void handleAddComment(null)}
                                  disabled={isCommentSaving || !commentDraft.trim()}
                                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  {isCommentSaving ? 'Dang gui...' : 'Gui comment'}
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 space-y-3">
                              {isCommentsLoading ? (
                                <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-5 text-sm text-white/55">
                                  Dang tai comment...
                                </div>
                              ) : commentTree.length ? (
                                commentTree.map((comment) => renderCommentNode(comment))
                              ) : (
                                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-sm text-white/45" />
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </TiltCard>
              </motion.div>
            ))}
          </AnimatePresence>

          {!todos.length ? <TiltCard className="text-center text-white/60">Chua co cong viec nao.</TiltCard> : null}
        </div>
      )}

      <AnimatePresence>
        {isCreating ? (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm" onClick={handleCloseForm} />
            <motion.div
              initial={{ opacity: 0, y: '100%' }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: '100%' }}
              className="fixed bottom-0 left-0 right-0 z-[101] max-h-[90vh] overflow-y-auto rounded-t-3xl border border-white/10 bg-gray-900 p-4 shadow-2xl sm:p-6 md:left-1/2 md:top-1/2 md:w-[640px] md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{editingTodoId ? 'Chinh sua cong viec' : 'Them viec moi'}</h2>
                <button onClick={handleCloseForm} className="rounded-full bg-white/5 p-2 text-white/50 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <input value={form.task} onChange={(e) => setForm((current) => ({ ...current, task: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400 focus:outline-none" />
                <div className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
                  <div className="space-y-3">
                    <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/45">Nguoi thuc hien</p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:grid-cols-1 xl:grid-cols-3">
                      {assigneeOptions.map((option) => {
                        const active = form.assignee === option.value;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setForm((current) => ({ ...current, assignee: option.value }))}
                            className={`group relative overflow-hidden rounded-2xl border p-4 text-left transition-all duration-300 ${
                              active
                                ? `${option.className} -translate-y-0.5 scale-[1.01]`
                                : 'border-white/10 bg-white/[0.04] text-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_10px_28px_rgba(0,0,0,0.18)] hover:border-white/20 hover:bg-white/[0.08] hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="absolute inset-x-0 top-0 h-px bg-white/25" />
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-base font-semibold">{option.title}</p>
                              <div className={`mt-0.5 h-3.5 w-3.5 rounded-full border ${active ? 'border-white/70 bg-white/90' : 'border-white/25 bg-transparent group-hover:border-white/45'}`} />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="relative overflow-visible rounded-2xl border border-cyan-400/20 bg-[radial-gradient(circle_at_top,#164e63_0%,#0f172a_52%,#020617_100%)] p-4 text-cyan-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_20px_45px_rgba(8,145,178,0.16)]">
                    <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-cyan-100/55">Thoi gian</p>
                    <button
                      type="button"
                      onClick={() => setIsDeadlinePickerOpen((current) => !current)}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-left transition-colors hover:border-cyan-300/60 hover:bg-black/25"
                    >
                      <span className={`truncate ${form.deadlineDate ? 'text-white' : 'text-white/45'}`}>
                        {formatDeadlineLabel(form.deadlineDate, form.deadlineTime)}
                      </span>
                      <CalendarDays className="h-5 w-5 shrink-0 text-cyan-200/80" />
                    </button>
                    <p className="mt-3 text-xs text-cyan-100/55">Co the de trong neu chua chot lich.</p>

                    <AnimatePresence>
                      {isDeadlinePickerOpen ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.98 }}
                          className="absolute left-0 right-0 top-[calc(100%+12px)] z-30 overflow-hidden rounded-2xl border border-cyan-300/20 bg-[radial-gradient(circle_at_top,#164e63_0%,#111827_56%,#020617_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_24px_60px_rgba(8,145,178,0.18)] backdrop-blur-xl"
                        >
                          <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                          <div className="grid gap-3">
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100/55">
                                <CalendarDays className="h-3.5 w-3.5" />
                                Ngày
                              </div>
                              <input
                                type="date"
                                value={form.deadlineDate}
                                onChange={(e) => setForm((current) => ({ ...current, deadlineDate: e.target.value }))}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-300 focus:outline-none [color-scheme:dark]"
                              />
                            </div>
                            <div className="rounded-2xl border border-white/10 bg-black/20 p-3">
                              <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-cyan-100/55">
                                <Clock3 className="h-3.5 w-3.5" />
                                Gio
                              </div>
                              <input
                                type="time"
                                value={form.deadlineTime}
                                onChange={(e) => setForm((current) => ({ ...current, deadlineTime: e.target.value }))}
                                className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-4 py-3 text-white focus:border-cyan-300 focus:outline-none [color-scheme:dark]"
                              />
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {['09:00', '14:00', '19:30'].map((time) => (
                                <button
                                  key={time}
                                  type="button"
                                  onClick={() => setForm((current) => ({ ...current, deadlineTime: time }))}
                                  className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                                    form.deadlineTime === time
                                      ? 'border-cyan-300/50 bg-cyan-400/15 text-cyan-100'
                                      : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
                                  }`}
                                >
                                  {time}
                                </button>
                              ))}
                            </div>
                            <div className="flex items-center justify-between gap-3 pt-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setForm((current) => ({ ...current, deadlineDate: '', deadlineTime: '' }));
                                  setIsDeadlinePickerOpen(false);
                                }}
                                className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
                              >
                                Xoa lich
                              </button>
                              <button
                                type="button"
                                onClick={() => setIsDeadlinePickerOpen(false)}
                                className="rounded-xl border border-cyan-300/20 bg-cyan-400/10 px-3 py-2 text-sm font-medium text-cyan-100 transition-colors hover:bg-cyan-400/15"
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
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="relative overflow-hidden rounded-2xl border border-amber-300/20 bg-[radial-gradient(circle_at_top,#7c2d12_0%,#1f2937_50%,#020617_100%)] p-4 text-amber-50 shadow-[inset_0_1px_0_rgba(255,255,255,0.2),0_20px_45px_rgba(245,158,11,0.14)]">
                    <div className="absolute inset-x-0 top-0 h-px bg-white/20" />
                    <p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-amber-100/60">Chi phi du kien</p>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.cost}
                        onChange={(e) => setForm((current) => ({ ...current, cost: e.target.value }))}
                        className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 pr-16 text-white focus:border-amber-300 focus:outline-none"
                      />
                      <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold uppercase tracking-[0.16em] text-amber-100/65">
                        VND
                      </span>
                    </div>
                  </div>
                  <input value={form.location} onChange={(e) => setForm((current) => ({ ...current, location: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400 focus:outline-none" />
                </div>
                <input value={form.mapUrl} onChange={(e) => setForm((current) => ({ ...current, mapUrl: e.target.value }))} className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-blue-400 focus:outline-none" />
              </div>

              <div className="mt-6 flex justify-end">
                <button onClick={() => void handleSave()} disabled={isSaving} className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-500/30 disabled:opacity-60">
                  {isSaving ? 'Dang luu...' : editingTodoId ? 'Cap nhat cong viec' : 'Luu cong viec'}
                </button>
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>

      <div className="pointer-events-none fixed inset-0 z-[170] overflow-hidden">
        <AnimatePresence>
          {reactionBursts.map((burst) => (
            <motion.span
              key={burst.id}
              initial={{ opacity: 0, x: burst.x, y: burst.y, scale: 0.4, rotate: 0 }}
              animate={{
                opacity: [0, 1, 1, 0],
                x: burst.x + burst.driftX,
                y: burst.y - burst.driftY,
                scale: [0.4, burst.scale, burst.scale * 0.92],
                rotate: burst.rotate,
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: burst.duration, ease: 'easeOut' }}
              className="absolute text-2xl drop-shadow-[0_8px_20px_rgba(255,255,255,0.3)]"
              style={{ left: 0, top: 0 }}
            >
              {burst.emoji}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

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




