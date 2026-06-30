import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  LayoutGrid,
  AlertTriangle,
  GitBranch,
  Layers,
  RefreshCw,
  BarChart2,
  CheckCircle,
} from 'lucide-react';
import { AIAssistantPanel } from '../components/chat/ai-assistant';

const recentRecords = [
  {
    id: 'DEV-2026-0042',
    severity: 'High',
    title: 'Temperature excursion in Cold Storage Unit 3',
    status: 'Under Investigation',
  },
  {
    id: 'DEV-2026-0041',
    severity: 'Medium',
    title: 'Missing signature on batch record BX-4401',
    status: 'CAPA In Progress',
  },
  {
    id: 'CC-2026-0015',
    severity: 'Low',
    title: 'HVAC system upgrade \u2013 Building A',
    status: 'Root Cause Analysis',
  },
  {
    id: 'DEV-2026-0040',
    severity: 'High',
    title: 'Out-of-spec result for pH testing \u2013 Lot 2209',
    status: 'Root Cause Analysis',
  },
];

const severityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
  Medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-400',
  Low: 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400',
};

const statusColors: Record<string, string> = {
  'Under Investigation': 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'CAPA In Progress': 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
  'Root Cause Analysis': 'bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400',
};

// Top row: event-type breakdown
const eventTypeCards = [
  {
    label: 'Total Events',
    value: '163',
    sub: 'All quality events, year-to-date',
    icon: <LayoutGrid className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
  {
    label: 'Total Deviation',
    value: '127',
    sub: 'Deviation records year-to-date',
    icon: <AlertTriangle className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
  {
    label: 'Total Change Control',
    value: '28',
    sub: 'Change control records year-to-date',
    icon: <GitBranch className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
  {
    label: 'Total Hybrid',
    value: '8',
    sub: 'Records spanning deviation and change',
    icon: <Layers className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
];

// Bottom row: operational + quality metrics
const metricCards = [
  {
    label: 'Open Cases',
    value: '18',
    sub: 'Requiring action or review',
    icon: <RefreshCw className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
  {
    label: 'Recurrence Rate',
    value: '12.3%',
    sub: 'Repeat deviations in past 90 days',
    icon: <BarChart2 className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
  {
    label: 'CAPA Effectiveness',
    value: '87%',
    sub: 'Closed with verified effectiveness',
    icon: <CheckCircle className="h-5 w-5 text-blue-500 dark:text-blue-400" />,
  },
];

export function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative h-full w-full">
      {/* Dashboard content — padded on the right when the AI panel is open so
          content doesn't render underneath the fixed panel. */}
      <div
        className={`p-6 space-y-6 transition-[padding] duration-200 ${
          aiOpen ? 'pr-80' : ''
        }`}
      >
        {/* Page title + New Quality Event button */}
        <div className="flex justify-end">
          <button
            onClick={() => navigate('/deviation')}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            +  New Quality Event
          </button>
        </div>

        {/* Event Type KPI Cards */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
            Events by Type
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {eventTypeCards.map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight max-w-[70%]">
                    {card.label}
                  </span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">{card.icon}</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{card.value}</div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Operational + Quality Metrics */}
        <div>
          <h2 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2.5">
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {metricCards.map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none p-5"
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium leading-tight max-w-[70%]">
                    {card.label}
                  </span>
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-lg shrink-0">{card.icon}</div>
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{card.value}</div>
                <p className="text-xs text-gray-400 dark:text-gray-500 leading-snug">{card.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Records */}
        <div className="bg-white dark:bg-black rounded-xl border border-gray-100 dark:border-white/10 shadow-sm dark:shadow-none">
          <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Recent Records</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{record.id}</span>
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${severityColors[record.severity]}`}
                    >
                      {record.severity}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{record.title}</span>
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

      {/* AI Assistant Panel — fixed to the right edge of the viewport.
          `fixed` removes the panel from the document flow entirely, so it
          floats independently above the page and cannot clip, overlap, or
          interfere with the scroll container's own scrollbar track. */}
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistantPanel isOpen={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />
      </div>
    </div>
  );
} 