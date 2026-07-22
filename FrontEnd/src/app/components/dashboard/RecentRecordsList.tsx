import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import type {
  RecentRecord,
  SeverityColors,
  StatusColors,
} from "../../types/dashboard";

export function RecentRecordsList({
  records,
  severityColors,
  statusColors,
}: {
  records: RecentRecord[];
  severityColors: SeverityColors;
  statusColors: StatusColors;
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none flex flex-col">
      <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          Recent Records
        </h2>
      </div>
      <div className="divide-y divide-gray-100 dark:divide-white/10">
        {records.map((record) => (
          <div
            key={record.id}
            className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  {record.id}
                </span>
                <span
                  className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${severityColors[record.severity]}`}
                >
                  {record.severity}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                {record.title}
              </span>
            </div>
            <span
              className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-4 ${statusColors[record.status]}`}
            >
              {record.status}
            </span>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 border-t border-gray-100 dark:border-white/10 flex justify-end">
        <button
          onClick={() => navigate("/records")}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/15 hover:bg-blue-100 dark:hover:bg-blue-500/25 border border-blue-300 dark:border-blue-500/40 rounded-lg px-4 py-1.5 transition-colors"
        >
          View All Records
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}