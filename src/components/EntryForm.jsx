import React, { useEffect, useState } from "react";
import { Save, X } from "lucide-react";

export default function EntryForm({
  initial,
  onSave,
  onCancel,
  subtests,
  materialTypes,
}) {
  const [f, setF] = useState(initial);
  useEffect(() => setF(initial), [initial]);
  const onSubmit = (e) => {
    e.preventDefault();
    const data = {
      ...f,
      durationMinutes: Number(f.durationMinutes) || 0,
      score:
        f.score === undefined || f.score === "" ? undefined : Number(f.score),
    };
    onSave(data);
  };
  return (
    <form onSubmit={onSubmit} className="grid md:grid-cols-3 gap-3">
      <div>
        <label className="text-xs text-neutral-400">Tanggal</label>
        <input
          type="date"
          value={f.date}
          onChange={(e) => setF({ ...f, date: e.target.value })}
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-neutral-400">Subtest</label>
        <select
          value={f.subtest}
          onChange={(e) => setF({ ...f, subtest: e.target.value })}
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        >
          {subtests.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="text-xs text-neutral-400">Jenis Materi</label>
        <select
          value={f.materialType}
          onChange={(e) => setF({ ...f, materialType: e.target.value })}
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        >
          {materialTypes.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-xs text-neutral-400">Topik / Judul</label>
        <input
          value={f.topic}
          onChange={(e) => setF({ ...f, topic: e.target.value })}
          placeholder="Misal: Logika Proposisi, Teori Peluang, Reading Comprehension, dll"
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-neutral-400">Durasi (menit)</label>
        <input
          type="number"
          min={0}
          value={f.durationMinutes}
          onChange={(e) => setF({ ...f, durationMinutes: e.target.value })}
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        />
      </div>
      <div>
        <label className="text-xs text-neutral-400">Skor (jika Tryout)</label>
        <input
          type="number"
          min={0}
          value={f.score ?? ""}
          onChange={(e) => setF({ ...f, score: e.target.value })}
          placeholder="Opsional"
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        />
      </div>
      <div className="md:col-span-3">
        <label className="text-xs text-neutral-400">
          Tautan Sumber (YouTube/Docs)
        </label>
        <input
          value={f.resourceUrl}
          onChange={(e) => setF({ ...f, resourceUrl: e.target.value })}
          placeholder="https://…"
          className="w-full rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        />
      </div>
      <div className="md:col-span-3">
        <label className="text-xs text-neutral-400">Catatan</label>
        <textarea
          value={f.notes}
          onChange={(e) => setF({ ...f, notes: e.target.value })}
          placeholder="Ringkasan, rumus penting, kesalahan umum yang perlu dihindari, dsb."
          className="w-full h-24 rounded-xl bg-neutral-950 border border-neutral-800 focus:border-violet-500 outline-none p-2 text-sm"
        />
      </div>
      <div className="md:col-span-3 flex items-center gap-2">
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-sm font-semibold"
        >
          <Save className="w-4 h-4" /> Simpan
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 px-4 py-2 text-sm"
        >
          <X className="w-4 h-4" /> Batal
        </button>
      </div>
    </form>
  );
}
