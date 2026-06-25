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
      description: 'Aggregated root cause data and trends across all quality events'
    },
    {
      name: 'CAPA Effectiveness Report',
      description: 'CAPA completion rates and effectiveness metrics over time'
    },
    {
      name: 'Pending Changes Report',
      description: 'Outstanding change control items requiring attention'
    },
    {
      name: 'Change Impact Analysis',
      description: 'Impact assessment trends and risk distribution'
    },
  ];

  const filteredReports = reports.filter(report =>
    report.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    report.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative h-full w-full">
      <div className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? 'mr-80' : ''}`}>
      <div className="space-y-6">
        {/* Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <div key={report.name} className="flex items-center justify-between py-3 border-b last:border-0">
                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
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
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20">
          <CardHeader>
            <CardTitle className="text-blue-900 dark:text-blue-300">Custom Build Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Create custom reports with specific date ranges, filters, and data points
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Build Custom Report
            </Button>
          </CardContent>
        </Card>
      </div>
      </div>
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </div>
    
  );
}