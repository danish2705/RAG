import { AlertTriangle, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { kpiData, criticalIssues } from '../lib/mockData';
import { StatusBadge } from '../components/qms/StatusBadge';
import { Badge } from '../components/ui/badge';

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Quality management system overview</p>
        </div>
        <div className="text-sm text-gray-500">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* KPI Cards - Simple version */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deviations</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Total number of quality events recorded</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold text-gray-900">{kpiData.totalDeviations}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Open Cases</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Active events requiring action</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="text-3xl font-bold text-gray-900">{kpiData.openCases}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Recurrence Rate</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Percentage of recurring quality issues</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-gray-900">{kpiData.recurrenceRate}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">CAPA Effectiveness</CardTitle>
            <p className="text-xs text-gray-500 mt-1">Success rate of corrective actions</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-gray-900">{kpiData.capaEffectiveness}%</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Issues */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Critical Issues
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {criticalIssues.map((issue) => (
              <div key={issue.id} className="pb-4 border-b last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{issue.id}</Badge>
                    <StatusBadge status={issue.severity as any} />
                  </div>
                </div>
                <p className="text-sm font-medium text-gray-900 mb-1">{issue.title}</p>
                <p className="text-xs text-gray-500">{issue.site}</p>
                <p className="text-xs text-gray-500 mt-1">Open for {issue.daysOpen} days</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
