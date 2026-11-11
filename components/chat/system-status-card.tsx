"use client";

export function SystemStatusCard({
  source,
  message,
  services,
}: {
  source: string;
  message: string;
  services: Array<{ id: string; name: string; status: string }>;
}) {
  return (
    <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-3 text-xs text-slate-700">
      <p className="font-medium text-slate-800">{message}</p>
      {services.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {services.map((service) => (
            <li
              key={service.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-amber-100/80 bg-white/70 px-2.5 py-1.5"
            >
              <span className="font-medium text-slate-700">{service.name}</span>
              <span className="text-[11px] uppercase tracking-wide text-slate-500">
                {service.status}
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p className="mt-2 text-[11px] text-slate-500">Fonte: {source}</p>
    </div>
  );
}
