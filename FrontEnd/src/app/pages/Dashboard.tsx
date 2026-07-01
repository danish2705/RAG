import { useState } from "react";
import { useNavigate } from "react-router";
import { AIAssistantPanel } from "../components/chat/ai-assistant";
import {
  recentRecords,
  severityColors,
  statusColors,
  eventTypeCards,
  metricCards,
} from "../lib/mockDashboard";

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
        {/* Page title + New Quality Event button */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/deviation")}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            + New Quality Event
          </button>
        </div>

        {/* Event Type KPI Card */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
            Events by Type
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {eventTypeCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5 cursor-pointer transition-transform duration-200 ease-out hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight max-w-[70%]">
                      {card.label}
                    </span>
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {card.value}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">
                    {card.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Operational + Quality Metrics */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
            Performance Metrics
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metricCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.label}
                  className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5 cursor-pointer transition-transform duration-200 ease-out hover:scale-105"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight max-w-[70%]">
                      {card.label}
                    </span>

                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">
                      <Icon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                    </div>
                  </div>

                  <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {card.value}
                  </div>

                  <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">
                    {card.sub}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
              Recent Records
            </h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {recentRecords.map((record) => (
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
        </div>
      </div>

      {/* AI Assistant Panel — docked to the right edge of the viewport, below the header */}
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistantPanel isOpen={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />
      </div>
    </div>
  );
}