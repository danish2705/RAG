import type { LucideIcon } from "lucide-react";

export interface KpiCardData {
  label: string;
  value: string;
  sub: string;
  icon: LucideIcon;
}

export function KpiCard({ label, value, sub, icon: Icon }: KpiCardData) {
  return (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5 cursor-pointer transition-transform duration-200 ease-out hover:scale-105">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight max-w-[70%]">
          {label}
        </span>
        <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
          <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
        {value}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">
        {sub}
      </p>
    </div>
  );
}

export function KpiCardGrid({
  title,
  cards,
}: {
  title: string;
  cards: KpiCardData[];
}) {
  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
        {title}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((card) => (
          <KpiCard key={card.label} {...card} />
        ))}
      </div>
    </div>
  );
}