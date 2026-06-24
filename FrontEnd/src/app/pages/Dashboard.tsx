import { useState } from 'react';
import { AlertTriangle, CheckCircle, TrendingUp, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { kpiData, criticalIssues } from '../lib/mockData';
import { StatusBadge } from '../components/qms/StatusBadge';
import { Badge } from '../components/ui/badge';
import { AIAssistant } from '../components/chat/ai-assistant';

export function Dashboard() {
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="p-6 space-y-6 relative min-h-screen">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleString()}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deviations</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Total number of quality events recorded</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <div className="text-3xl font-bold text-foreground">{kpiData.totalDeviations}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Cases</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Active events requiring action</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="text-3xl font-bold text-foreground">{kpiData.openCases}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Recurrence Rate</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Percentage of recurring quality issues</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-red-600" />
              <div className="text-3xl font-bold text-foreground">{kpiData.recurrenceRate}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">CAPA Effectiveness</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Success rate of corrective actions</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="text-3xl font-bold text-foreground">{kpiData.capaEffectiveness}%</div>
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
              <div key={issue.id} className="pb-4 border-b border-border last:border-0 last:pb-0">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{issue.id}</Badge>
                    <StatusBadge status={issue.severity as any} />
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground mb-1">{issue.title}</p>
                <p className="text-xs text-muted-foreground">{issue.site}</p>
                <p className="text-xs text-muted-foreground mt-1">Open for {issue.daysOpen} days</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Assistant Chatbot */}
      <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
}