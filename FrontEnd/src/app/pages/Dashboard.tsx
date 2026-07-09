import { useState } from "react";
import { useNavigate } from "react-router";
import { AIAssistantPanel } from "../components/chat/ai-assistant";
import { KpiCardGrid } from "../components/dashboard/KpiCard";
import { RecentRecordsList } from "../components/dashboard/RecentRecordsList";
import {
  eventTypeCards,
  metricCards,
  recentRecords,
  severityColors,
  statusColors,
} from "../mocks/mockDashboard";

export function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 space-y-6 overflow-y-auto transition-[margin] duration-200 ${
          aiOpen ? "mr-80" : ""
        }`}
      >
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/deviation")}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            + New Quality Event
          </button>
        </div>

        <KpiCardGrid title="Events by Type" cards={eventTypeCards} />
        <KpiCardGrid title="Performance Metrics" cards={metricCards} />

        <RecentRecordsList
          records={recentRecords}
          severityColors={severityColors}
          statusColors={statusColors}
        />
      </div>

      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistantPanel isOpen={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />
      </div>
    </div>
  );
}