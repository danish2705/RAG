import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { auditTrailData } from '../lib/mockData';
import { Bot, User } from 'lucide-react';

export function AuditTrail() {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Audit Trail</h1>
        <p className="text-sm text-gray-500 mt-1">Complete activity log with AI and human actions</p>
      </div>

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
                  <TableRow key={index} className={entry.type === 'ai' ? 'bg-blue-50' : ''}>
                    <TableCell className="text-sm font-mono">{entry.timestamp}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {entry.type === 'ai' ? (
                          <Bot className="h-4 w-4 text-blue-600" />
                        ) : (
                          <User className="h-4 w-4 text-gray-600" />
                        )}
                        <span className="text-sm font-medium">{entry.user}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{entry.action}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={entry.type === 'ai' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}
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

        {/* Legend */}
        <Card>
          <CardHeader>
            <CardTitle>Legend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-blue-50 border border-blue-200"></div>
                <span className="text-gray-600">AI-generated action (requires human review)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 bg-white border border-gray-200"></div>
                <span className="text-gray-600">Human decision (final authority)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
