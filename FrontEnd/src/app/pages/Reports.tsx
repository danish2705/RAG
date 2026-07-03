import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { FileText, Download, Search } from 'lucide-react';
import { AIAssistant } from '../components/chat/ai-assistant';
import { reports } from '../mocks/mockReports';

export function Reports() {
  const [searchQuery, setSearchQuery] = useState('');
  const [chatOpen, setChatOpen] = useState(false);

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
      </div>
      </div>
      <div className="fixed top-16 right-0 bottom-0 z-40">
        <AIAssistant isOpen={chatOpen} onToggle={() => setChatOpen(!chatOpen)} />
      </div>
    </div>
  );
}