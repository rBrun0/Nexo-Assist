"use client";

export function getChatDayKey(isoDate: string) {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "invalid";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatChatDayLabel(isoDate: string, now = new Date()) {
  const date = new Date(isoDate);
  if (!Number.isFinite(date.getTime())) return "";

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.round(
    (startOfToday.getTime() - startOfMessageDay.getTime()) / 86_400_000,
  );

  if (diffDays === 0) return "Hoje";
  if (diffDays === 1) return "Ontem";

  if (diffDays > 1 && diffDays < 7) {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export function ChatDaySeparator({ label }: { label: string }) {
  if (!label) return null;

  return (
    <div className="flex items-center justify-center py-2" role="separator">
      <span className="rounded-full bg-white px-3 py-1 text-[10px] font-medium text-slate-600 shadow-xs">
        {label}
      </span>
    </div>
  );
}
