import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { auditTrailData } from '../mocks/mockData';
import { Bot, User } from 'lucide-react';
import { AIAssistant } from '../components/chat/ai-assistant'; 
import { useState } from 'react';

export function AuditTrail() {
  const [chatOpen, setChatOpen] = useState(false);
  return (
    <div className="relative h-full w-full">
      <div className={`h-full p-6 overflow-y-auto transition-[margin] duration-200 ${chatOpen ? 'mr-80' : ''}`}>

      <div className="space-y-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Input type="date" placeholder="Start Date" />
              </div>
              <div>
                <Input type="date" placeholder="End Date" />
              </div>
              <div>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="User Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="human">Human Only</SelectItem>
                    <SelectItem value="ai">AI Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Input placeholder="Search actions..." />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Audit Trail Table */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-48">Timestamp</TableHead>
                  <TableHead className="w-48">User/System</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="w-32">Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditTrailData.map((entry, index) => (
                  <TableRow key={index} className={entry.type === 'ai' ? 'bg-blue-50 dark:bg-blue-900/40 border-l-2 border-l-blue-500 dark:border-l-blue-400' : ''}>
                    <TableCell className="text-sm font-mono">{entry.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.type === 'ai' ? (
                          <Bot className="h-4 w-4 text-blue-600" />
                        ) : (
                          <User className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="text-sm font-medium">{entry.user}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.action}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={entry.type === 'ai' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'}
                      >
                        {entry.type === 'ai' ? 'AI' : 'Human'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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