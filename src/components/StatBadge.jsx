import React from "react";
export default function StatBadge({ icon, label, value }) {
  return (
    <div className="rounded-2xl bg-neutral-950 border border-neutral-800 p-3">
      <div className="text-xs text-neutral-400">{label}</div>
      <div className="flex items-center gap-2 mt-1">
        {icon}
        <div className="text-lg font-semibold">{value}</div>
      </div>
    </div>
  );
}
