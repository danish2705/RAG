import { useState } from 'react';
import { useNavigate } from 'react-router';
import { AlertTriangle, RefreshCw, BarChart2, CheckCircle } from 'lucide-react';
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
    status: 'Pending Approval',
  },
  {
    id: 'DEV-2026-0040',
    severity: 'High',
    title: 'Out-of-spec result for pH testing \u2013 Lot 2209',
    status: 'Root Cause Analysis',
  },
];

const severityColors: Record<string, string> = {
  High: 'bg-red-100 text-red-600',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
};

const statusColors: Record<string, string> = {
  'Under Investigation': 'bg-blue-50 text-blue-700',
  'CAPA In Progress': 'bg-blue-50 text-blue-700',
  'Pending Approval': 'bg-blue-50 text-blue-700',
  'Root Cause Analysis': 'bg-blue-50 text-blue-700',
};

const kpiCards = [
  {
    label: 'Total Deviations',
    value: '127',
    sub: 'Year-to-date across all sites',
    icon: <AlertTriangle className="h-5 w-5 text-blue-500" />,
  },
  {
    label: 'Open Cases',
    value: '18',
    sub: 'Requiring action or review',
    icon: <RefreshCw className="h-5 w-5 text-blue-500" />,
  },
  {
    label: 'Recurrence Rate',
    value: '12.3%',
    sub: 'Repeat deviations in past 90 days',
    icon: <BarChart2 className="h-5 w-5 text-blue-500" />,
  },
  {
    label: 'CAPA Effectiveness',
    value: '87%',
    sub: 'Closed with verified effectiveness',
    icon: <CheckCircle className="h-5 w-5 text-blue-500" />,
  },
];

export function Dashboard() {
  const [aiOpen, setAiOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative h-full w-full">
      <div
        className={`h-full p-6 space-y-6 overflow-y-auto transition-[margin] duration-200 ${
          aiOpen ? 'mr-80' : ''
        }`}
      >
        {/* Page title + New Quality Event button */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">Quality Management System Overview</p>
          </div>
          <button
            onClick={() => navigate('/deviation')}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm transition-colors"
          >
            New Quality Event
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card) => (
            <div key={card.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <div className="flex items-start justify-between mb-3">
                <span className="text-sm text-gray-500 font-medium leading-tight max-w-[70%]">{card.label}</span>
                <div className="p-2 bg-blue-50 rounded-lg shrink-0">{card.icon}</div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{card.value}</div>
              <p className="text-xs text-gray-400 leading-snug">{card.sub}</p>
            </div>
          ))}
        </div>

        {/* Recent Records */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">Recent Records</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {recentRecords.map((record) => (
              <div
                key={record.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">{record.id}</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${severityColors[record.severity]}`}>
                      {record.severity}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-800">{record.title}</span>
                </div>
                <span className={`text-xs font-medium px-3 py-1 rounded-full whitespace-nowrap ml-4 ${statusColors[record.status]}`}>
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