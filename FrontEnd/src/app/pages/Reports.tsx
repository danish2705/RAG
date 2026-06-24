import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { BarChart3, FileText, Download, Search } from 'lucide-react';
import { AIAssistant } from '../components/chat/ai-assistant';

export function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

  const reports = [
    {
      name: 'Root Cause Analysis Report',
      description: 'Aggregated root cause data and trends across all quality events',
    },
    {
      name: 'CAPA Effectiveness Report',
      description: 'CAPA completion rates and effectiveness metrics over time',
    },
    {
      name: 'Pending Changes Report',
      description: 'Outstanding change control items requiring attention',
    },
    {
      name: 'Change Impact Analysis',
      description: 'Impact assessment trends and risk distribution',
    },
  ];

  const filteredReports = reports.filter(
    (report) =>
      report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6">
      <div className="space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search for deviations or change control reports..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Available Reports */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Available Reports
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {filteredReports.map((report) => (
                <div
                  key={report.name}
                  className="flex items-center justify-between py-3 border-b border-border last:border-0"
                >
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{report.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{report.description}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </div>
              ))}
              {filteredReports.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No reports found matching your search
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Custom Report Builder */}
        <Card className="border-blue-500/30 bg-blue-500/10 dark:bg-blue-500/10 dark:border-blue-500/30">
          <CardHeader>
            <CardTitle className="text-blue-700 dark:text-blue-400">
              Custom Build Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-700/80 dark:text-blue-400/80 mb-4">
              Create custom reports with specific date ranges, filters, and data points
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <BarChart3 className="h-4 w-4 mr-2" />
              Build Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>

      <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
    </div>
  );
}