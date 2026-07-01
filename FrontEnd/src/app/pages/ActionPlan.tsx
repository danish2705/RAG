import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { actionPlanData } from '../lib/mockData';
export function ActionPlan() {
  const navigate = useNavigate();
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Action Plan</h1>
        <p className="text-sm text-gray-500 mt-1">Define and assign required actions</p>
      </div>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Required Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-2/5">Action</TableHead>
                  <TableHead className="w-1/4">Owner</TableHead>
                  <TableHead className="w-1/6">Due Date</TableHead>
                  <TableHead className="w-1/6">Mandatory</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actionPlanData.map((action, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{action.action}</TableCell>
                    <TableCell>
                      <Select defaultValue={action.owner}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unassigned">Unassigned</SelectItem>
                          <SelectItem value="QA Manager">QA Manager</SelectItem>
                          <SelectItem value="Site Manager">Site Manager</SelectItem>
                          <SelectItem value="Validation Lead">Validation Lead</SelectItem>
                          <SelectItem value="IT Manager">IT Manager</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <input
                        type="date"
                        className="border rounded px-2 py-1 text-sm w-full"
                        defaultValue={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={action.mandatory === 'Yes' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}
                      >
                        {action.mandatory}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="mt-4">
              <Button variant="outline" size="sm">
                + Add Custom Action
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Timeline */}
        <Card>
          <CardHeader>
            <CardTitle>Timeline & Milestones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-32 text-sm text-gray-600">Day 1-7</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Risk assessment and impact analysis</p>
                  <p className="text-xs text-gray-500 mt-1">Complete preliminary assessment</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-32 text-sm text-gray-600">Day 8-21</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Validation protocol development</p>
                  <p className="text-xs text-gray-500 mt-1">If required based on impact assessment</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-32 text-sm text-gray-600">Day 22-45</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Implementation and testing</p>
                  <p className="text-xs text-gray-500 mt-1">Execute change in controlled environment</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-32 text-sm text-gray-600">Day 46-60</div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Validation execution and closure</p>
                  <p className="text-xs text-gray-500 mt-1">Complete validation activities and documentation</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/change-control/decision')}>
            Back
          </Button>
          <Button onClick={() => navigate('/change-control/cross-trigger')} className="bg-blue-600 hover:bg-blue-700">
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
}
