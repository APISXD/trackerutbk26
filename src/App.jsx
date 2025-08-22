import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  Clock,
  Download,
  Flame,
  Link as LinkIcon,
  ListTodo,
  Minus,
  NotebookPen,
  PieChart,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Sparkles,
  Target,
  Upload,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import StatBadge from "./components/StatBadge.jsx";
import EntryForm from "./components/EntryForm.jsx";

// === CONFIG ===
const TARGET_DATE = "2026-04-24"; // Asia/Jakarta
const START_DATE = (() => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
})();

export const SUBTESTS = [
  "Penalaran Umum",
  "Pengetahuan & Pemahaman Umum",
  "Pemahaman Membaca & Menulis",
  "Pengetahuan Kuantitatif",
  "Literasi Bahasa Indonesia",
  "Literasi Bahasa Inggris",
  "Penalaran Matematika",
];

export const MATERIAL_TYPES = [
  "Latihan Soal",
  "Materi YouTube",
  "Baca/Rangkuman",
  "Try Out/Mini Tryout",
  "Pembahasan Soal",
  "Kelas/Video Course",
  "Lainnya",
];

const MOTIVATION_BANK = [
  "Sedikit tiap hari lebih kuat dari banyak tapi sesekali.",
  "Yang penting konsisten, bukan sempurna.",
  "Hari ini satu langkah—besok kamu berterima kasih.",
  "Skor besar lahir dari kebiasaan kecil.",
  "Kalau capek istirahat, jangan menyerah.",
  "Progress > Excuses.",
  "Belajar pintar: fokus 45–60 menit, istirahat 5–10 menit.",
  "Kamu bersaing dengan dirimu kemarin.",
  "Satu jam fokus sekarang menyelamatkan panik sebulan lagi.",
  "Mulai sekarang, bukan nanti.",
];

const CHART_COLORS = [
  "#8b5cf6",
  "#f59e0b",
  "#22c55e",
  "#ef4444",
  "#06b6d4",
  "#a855f7",
  "#f97316",
  "#10b981",
  "#3b82f6",
];

// === UTILS ===
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
const toDayKey = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(dt.getDate()).padStart(2, "0")}`;
};
const daysBetween = (a, b) => {
  const d1 = new Date(a),
    d2 = new Date(b);
  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);
  return Math.round((d2 - d1) / (1000 * 60 * 60 * 24));
};
const clamp = (n, min = 0, max = 100) => Math.max(min, Math.min(max, n));
const readLS = (k, f) => {
  try {
    const r = localStorage.getItem(k);
    return r ? JSON.parse(r) : f;
  } catch {
    return f;
  }
};
const writeLS = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};
const groupBy = (arr, keyFn) =>
  arr.reduce((acc, it) => {
    const k = keyFn(it);
    (acc[k] ||= []).push(it);
    return acc;
  }, {});
const calcStreak = (entries) => {
  const byDay = new Set(entries.map((e) => e.date));
  let streak = 0;
  let cur = new Date();
  cur.setHours(0, 0, 0, 0);
  while (byDay.has(toDayKey(cur))) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
};

export default function UTBKStudyTracker() {
  const [entries, setEntries] = useState(() => readLS("utbk_entries_v2", []));
  const [filter, setFilter] = useState({
    q: "",
    subtest: "All",
    material: "All",
    from: "",
    to: "",
  });
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [motivation, setMotivation] = useState(() =>
    readLS("utbk_motivation_notes", "")
  );
  const [reasons, setReasons] = useState(() =>
    readLS(
      "utbk_reasons",
      "Masuk Creative Advertising, banggakan orang tua, kerja di industri kreatif"
    )
  );
  const [weeklyPlan, setWeeklyPlan] = useState(() =>
    readLS("utbk_weekly_plan", [])
  );
  const fileRef = useRef(null);

  useEffect(() => writeLS("utbk_entries_v2", entries), [entries]);
  useEffect(() => writeLS("utbk_motivation_notes", motivation), [motivation]);
  useEffect(() => writeLS("utbk_reasons", reasons), [reasons]);
  useEffect(() => writeLS("utbk_weekly_plan", weeklyPlan), [weeklyPlan]);

  const todayKey = toDayKey(new Date());
  const totalDaysToTarget = Math.max(1, daysBetween(START_DATE, TARGET_DATE));
  const daysElapsed = clamp(
    daysBetween(START_DATE, todayKey),
    0,
    totalDaysToTarget
  );
  const timelineProgress = clamp(
    Math.round((daysElapsed / totalDaysToTarget) * 100)
  );

  const studiedUniqueDays = new Set(entries.map((e) => e.date));
  const consistency =
    daysElapsed > 0
      ? Math.round((studiedUniqueDays.size / daysElapsed) * 100)
      : 0;
  const streak = calcStreak(entries);

  const totalsBySubtest = useMemo(() => {
    const map = {};
    for (const s of SUBTESTS) map[s] = 0;
    for (const e of entries) {
      map[e.subtest] = (map[e.subtest] || 0) + (e.durationMinutes || 0);
    }
    return map;
  }, [entries]);

  const totalsByMaterial = useMemo(() => {
    const map = {};
    for (const m of MATERIAL_TYPES) map[m] = 0;
    for (const e of entries) {
      map[e.materialType] =
        (map[e.materialType] || 0) + (e.durationMinutes || 0);
    }
    return map;
  }, [entries]);

  const trendByDay = useMemo(() => {
    const by = groupBy(entries, (e) => e.date);
    const keys = Object.keys(by).sort();
    return keys.map((k) => ({
      date: k,
      minutes: by[k].reduce((a, b) => a + (b.durationMinutes || 0), 0),
    }));
  }, [entries]);

  const tryoutScores = useMemo(
    () =>
      entries
        .filter((e) => e.materialType.toLowerCase().includes("try"))
        .map((e) => ({ date: e.date, score: e.score ?? null }))
        .filter((s) => s.score != null)
        .sort((a, b) => a.date.localeCompare(b.date)),
    [entries]
  );

  const daysLeft = Math.max(0, daysBetween(todayKey, TARGET_DATE));

  const filteredEntries = useMemo(() => {
    return entries
      .filter((e) => {
        if (filter.subtest !== "All" && e.subtest !== filter.subtest)
          return false;
        if (filter.material !== "All" && e.materialType !== filter.material)
          return false;
        if (filter.from && e.date < filter.from) return false;
        if (filter.to && e.date > filter.to) return false;
        if (filter.q) {
          const q = filter.q.toLowerCase();
          const blob = `${e.topic} ${e.notes || ""} ${e.resourceUrl || ""} ${
            e.tags?.join(" ") || ""
          }`.toLowerCase();
          if (!blob.includes(q)) return false;
        }
        return true;
      })
      .sort(
        (a, b) => b.date.localeCompare(a.date) || b.updatedAt - a.updatedAt
      );
  }, [entries, filter]);

  // Handlers
  const onSave = (data) => {
    if (editing) {
      setEntries((prev) =>
        prev.map((p) =>
          p.id === editing.id ? { ...p, ...data, updatedAt: Date.now() } : p
        )
      );
      setEditing(null);
    } else {
      setEntries((prev) => [
        { id: uid(), createdAt: Date.now(), updatedAt: Date.now(), ...data },
        ...prev,
      ]);
    }
    setShowForm(false);
  };

  const onDelete = (id) => {
    if (!confirm("Hapus catatan ini?")) return;
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const exportJSON = () => {
    const blob = new Blob(
      [
        JSON.stringify(
          { v: 2, entries, reasons, motivation, weeklyPlan },
          null,
          2
        ),
      ],
      { type: "application/json" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `utbk-tracker-${toDayKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importJSON = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || !Array.isArray(data.entries))
          throw new Error("Format tidak valid");
        setEntries(data.entries);
        setReasons(data.reasons || reasons);
        setMotivation(data.motivation || motivation);
        setWeeklyPlan(data.weeklyPlan || weeklyPlan);
        alert("Import berhasil");
      } catch (e) {
        alert("Gagal import: " + e.message);
      }
    };
    reader.readAsText(file);
  };

  const resetAll = () => {
    if (!confirm("Reset semua data? Ini tidak bisa dibatalkan.")) return;
    setEntries([]);
    setReasons("");
    setMotivation("");
    setWeeklyPlan([]);
    localStorage.removeItem("utbk_entries_v2");
    localStorage.removeItem("utbk_motivation_notes");
    localStorage.removeItem("utbk_reasons");
    localStorage.removeItem("utbk_weekly_plan");
  };

  const genWeeklyPlan = () => {
    const mats = [
      "Latihan Soal",
      "Pembahasan Soal",
      "Materi YouTube",
      "Baca/Rangkuman",
      "Try Out/Mini Tryout",
    ];
    const plan = SUBTESTS.map((s, i) => ({
      dayIndex: i,
      subtest: s,
      materialType: mats[i % mats.length],
      suggestion: "Fokus 45–60 menit, catat 3 poin inti",
    }));
    setWeeklyPlan(plan);
  };

  const addPlanToToday = (p) => {
    const today = toDayKey(new Date());
    setEntries((prev) => [
      {
        id: uid(),
        date: today,
        subtest: p.subtest,
        materialType: p.materialType,
        topic: `Rencana mingguan → ${p.subtest}`,
        durationMinutes: 0,
        notes: p.suggestion,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
      ...prev,
    ]);
  };

  const randomQuote = () =>
    MOTIVATION_BANK[Math.floor(Math.random() * MOTIVATION_BANK.length)];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-[Inter,sans-serif]">
      <header className="sticky top-0 z-20 backdrop-blur bg-neutral-950/70 border-b border-neutral-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-violet-400" />
            <h1 className="text-lg sm:text-xl font-bold">
              UTBK 2026 Study Tracker
            </h1>
            <span className="text-xs sm:text-sm text-neutral-400 hidden md:inline">
              Sampai {TARGET_DATE}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-2xl bg-violet-600 hover:bg-violet-500 active:scale-[0.98] px-3 py-2 text-sm font-semibold"
            >
              <Plus className="w-4 h-4" /> Catatan Hari Ini
            </button>
            <button
              onClick={exportJSON}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-sm"
            >
              <Download className="w-4 h-4" /> Export
            </button>
            <label className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-sm cursor-pointer">
              <Upload className="w-4 h-4" /> Import
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(e) =>
                  e.target.files?.[0] && importJSON(e.target.files[0])
                }
              />
            </label>
            <button
              onClick={resetAll}
              className="inline-flex items-center gap-2 rounded-2xl bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-sm"
            >
              <RefreshCw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Countdown & Progress */}
        <section className="grid md:grid-cols-3 gap-4">
          <div className="col-span-2 rounded-3xl p-5 bg-gradient-to-br from-violet-600/30 to-fuchsia-500/20 border border-violet-500/30">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                <h2 className="font-semibold">Menuju {TARGET_DATE}</h2>
              </div>
              <span className="text-sm text-neutral-200">
                {daysLeft} hari lagi
              </span>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm text-neutral-300 mb-1">
                <span>Progress Timeline</span>
                <span>{timelineProgress}%</span>
              </div>
              <div className="w-full h-3 rounded-full bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-violet-500"
                  style={{ width: `${timelineProgress}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-neutral-300">
                Konsistensi hari belajar: <b>{consistency}%</b> • Streak:{" "}
                <b>{streak}</b> hari 🔥
              </p>
            </div>
            <div className="mt-4 grid sm:grid-cols-3 gap-3 text-sm">
              <StatBadge
                icon={<Clock className="w-4 h-4" />}
                label="Total Menit"
                value={entries.reduce(
                  (a, b) => a + (b.durationMinutes || 0),
                  0
                )}
              />
              <StatBadge
                icon={<ListTodo className="w-4 h-4" />}
                label="Catatan"
                value={entries.length}
              />
              <StatBadge
                icon={<CalendarDays className="w-4 h-4" />}
                label="Hari Aktif"
                value={studiedUniqueDays.size}
              />
            </div>
          </div>

          <div className="rounded-3xl p-5 bg-neutral-900 border border-neutral-800 space-y-3">
            <h3 className="font-semibold flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-400" /> Motivasi Harian
            </h3>
            <p className="text-sm text-neutral-300">{randomQuote()}</p>
            <textarea
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              placeholder="Tuliskan afirmasi/visualisasi kamu di sini…"
              className="w-full h-24 rounded-xl bg-neutral-900 border border-neutral-700 focus:border-violet-500 outline-none p-3 text-sm"
            ></textarea>
            <label className="text-xs text-neutral-400">Alasan utama: </label>
            <input
              value={reasons}
              onChange={(e) => setReasons(e.target.value)}
              className="w-full rounded-xl bg-neutral-900 border border-neutral-700 focus:border-violet-500 outline-none p-2 text-sm"
            />
            <p className="text-xs text-neutral-400">
              Tips: 45–60 menit fokus → 5–10 menit break. Hindari multitasking.
            </p>
          </div>
        </section>

        {/* Quick Add */}
        <section className="rounded-3xl p-5 bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <NotebookPen className="w-4 h-4" /> Catatan Cepat Hari Ini
            </h3>
            <button
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-2 text-sm font-semibold"
            >
              {showForm ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              {showForm ? "Tutup" : "Tambah"}
            </button>
          </div>
          {showForm && (
            <div className="mt-4">
              <EntryForm
                subtests={SUBTESTS}
                materialTypes={MATERIAL_TYPES}
                initial={
                  editing || {
                    date: todayKey,
                    subtest: SUBTESTS[0],
                    materialType: MATERIAL_TYPES[0],
                    topic: "",
                    durationMinutes: 60,
                    resourceUrl: "",
                    notes: "",
                    score: undefined,
                    mood: "",
                  }
                }
                onCancel={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                onSave={onSave}
              />
            </div>
          )}
        </section>

        {/* Weekly Plan */}
        <section className="rounded-3xl p-5 bg-neutral-900 border border-neutral-800">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold flex items-center gap-2">
              <Settings className="w-4 h-4" /> Rencana Minggu Ini
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={genWeeklyPlan}
                className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-3 py-2 text-sm"
              >
                <Sparkles className="w-4 h-4" /> Generate
              </button>
            </div>
          </div>
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {weeklyPlan.length === 0 ? (
              <p className="text-sm text-neutral-400">
                Klik <b>Generate</b> untuk membuat rencana mingguan otomatis
                (rotasi 7 subtest).
              </p>
            ) : (
              weeklyPlan.map((p, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4"
                >
                  <div className="text-xs text-neutral-400 mb-1">
                    Hari ke-{p.dayIndex + 1}
                  </div>
                  <div className="font-semibold">{p.subtest}</div>
                  <div className="text-sm text-neutral-300">
                    {p.materialType}
                  </div>
                  <div className="text-xs text-neutral-400 mt-2">
                    {p.suggestion}
                  </div>
                  <button
                    onClick={() => addPlanToToday(p)}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-3 py-2 text-xs font-semibold"
                  >
                    <Plus className="w-4 h-4" /> Tambah ke Hari Ini
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Filter + Table */}
        <section className="rounded-3xl p-5 bg-neutral-900 border border-neutral-800">
          <div className="flex flex-col md:flex-row md:items-end gap-3 md:gap-4">
            <div className="flex-1">
              <label className="text-xs text-neutral-400">Cari</label>
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-500 absolute left-2 top-1/2 -translate-y-1/2" />
                <input
                  value={filter.q}
                  onChange={(e) => setFilter({ ...filter, q: e.target.value })}
                  placeholder="Topik, catatan, tautan…"
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none text-sm"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-neutral-400">Subtest</label>
              <select
                value={filter.subtest}
                onChange={(e) =>
                  setFilter({ ...filter, subtest: e.target.value })
                }
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
              >
                <option>All</option>
                {SUBTESTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400">Materi</label>
              <select
                value={filter.material}
                onChange={(e) =>
                  setFilter({ ...filter, material: e.target.value })
                }
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
              >
                <option>All</option>
                {MATERIAL_TYPES.map((m) => (
                  <option key={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-neutral-400">Dari</label>
              <input
                type="date"
                value={filter.from}
                onChange={(e) => setFilter({ ...filter, from: e.target.value })}
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-400">Sampai</label>
              <input
                type="date"
                value={filter.to}
                onChange={(e) => setFilter({ ...filter, to: e.target.value })}
                className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
              />
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-neutral-300">
                <tr className="border-b border-neutral-800">
                  <th className="text-left py-2 pr-2">Tanggal</th>
                  <th className="text-left py-2 pr-2">Subtest</th>
                  <th className="text-left py-2 pr-2">Materi</th>
                  <th className="text-left py-2 pr-2">Topik</th>
                  <th className="text-left py-2 pr-2">Menit</th>
                  <th className="text-left py-2 pr-2">Skor</th>
                  <th className="text-left py-2 pr-2">Tautan</th>
                  <th className="text-left py-2 pr-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="text-center py-6 text-neutral-500"
                    >
                      Belum ada catatan. Klik <b>Tambah</b> di atas untuk mulai.
                    </td>
                  </tr>
                )}
                {filteredEntries.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-neutral-900/50 hover:bg-neutral-900/60"
                  >
                    <td className="py-2 pr-2 whitespace-nowrap">{e.date}</td>
                    <td className="py-2 pr-2">{e.subtest}</td>
                    <td className="py-2 pr-2">{e.materialType}</td>
                    <td
                      className="py-2 pr-2 max-w-[20ch] truncate"
                      title={e.topic}
                    >
                      {e.topic || <span className="text-neutral-500">—</span>}
                    </td>
                    <td className="py-2 pr-2">{e.durationMinutes || 0}</td>
                    <td className="py-2 pr-2">
                      {e.score ?? <span className="text-neutral-500">—</span>}
                    </td>
                    <td className="py-2 pr-2">
                      {e.resourceUrl ? (
                        <a
                          href={e.resourceUrl}
                          target="_blank"
                          className="inline-flex items-center gap-1 underline decoration-dotted"
                        >
                          <LinkIcon className="w-3.5 h-3.5" /> Link
                        </a>
                      ) : (
                        <span className="text-neutral-600">—</span>
                      )}
                    </td>
                    <td className="py-2 pr-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditing(e);
                            setShowForm(true);
                          }}
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete(e.id)}
                          className="px-2 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Stats */}
        <section className="rounded-3xl p-5 bg-neutral-900 border border-neutral-800">
          <h3 className="font-semibold flex items-center gap-2 mb-4">
            <PieChart className="w-4 h-4" /> Statistik Belajar
          </h3>
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-neutral-800 p-3 bg-neutral-950">
              <div className="text-sm font-semibold mb-2">
                Menit per Subtest
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SUBTESTS.map((s, i) => ({
                      name: s,
                      minutes: totalsBySubtest[s],
                      fill: CHART_COLORS[i % CHART_COLORS.length],
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      angle={-10}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid #2a2a2a",
                      }}
                    />
                    <Legend />
                    <Bar dataKey="minutes" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-3 bg-neutral-950">
              <div className="text-sm font-semibold mb-2">
                Menit per Hari (tren)
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis />
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid #2a2a2a",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="minutes"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-3 bg-neutral-950">
              <div className="text-sm font-semibold mb-2">
                Proporsi Jenis Materi
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={Object.entries(totalsByMaterial).map(
                        ([name, minutes], i) => ({
                          name,
                          value: minutes,
                          fill: CHART_COLORS[i % CHART_COLORS.length],
                        })
                      )}
                      dataKey="value"
                      nameKey="name"
                      outerRadius={90}
                    >
                      {Object.keys(totalsByMaterial).map((_, i) => (
                        <Cell
                          key={i}
                          fill={CHART_COLORS[i % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid #2a2a2a",
                      }}
                    />
                    <Legend />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-neutral-800 p-3 bg-neutral-950">
              <div className="text-sm font-semibold mb-2">
                Skor Tryout (jika diisi)
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={tryoutScores}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, "dataMax + 10"]} />
                    <Tooltip
                      contentStyle={{
                        background: "#0a0a0a",
                        border: "1px solid #2a2a2a",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#22c55e"
                      strokeWidth={2}
                      dot
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-10 text-center text-xs text-neutral-500">
          Dibuat dengan ❤️ untuk persiapan UTBK 2026. Simpan di perangkatmu—data
          tersimpan di <b>LocalStorage</b> (offline).
        </footer>
      </main>
    </div>
  );
}
