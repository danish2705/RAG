import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertBanner } from '../components/qms/AlertBanner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { StatusBadge } from '../components/qms/StatusBadge';
import { historicalMatches } from '../lib/mockData';
import { AlertTriangle } from 'lucide-react';

export function HistoricalMatches() {
  const navigate = useNavigate();

  return (
   <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Historical Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">Similar events detected in the system</p>
      </div>

      <div className="space-y-6">
        {/* Context Banner */}
        <AlertBanner
          type="info"
          title="Historical Context for Recurrence Analysis"
          message="This section helps identify recurrence patterns and similar past events. It is for context only and does not influence the classification or decision-making for this current event."
        />

        {/* Systemic Issue Alert */}
        <AlertBanner
          type="warning"
          title="Systemic Issue Detected"
          message="This deviation matches 3 similar historical events. A recurring pattern has been identified that may indicate a systemic quality issue requiring investigation."
        />

        {/* Historical Matches Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Similar Historical Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deviation ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Root Cause</TableHead>
                  <TableHead>CAPA Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {historicalMatches.map((match) => (
                  <TableRow key={match.id} className="hover:bg-gray-50">
                    <TableCell>
                      <Badge variant="outline">{match.id}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">{match.date}</TableCell>
                    <TableCell className="text-sm max-w-xs">{match.description}</TableCell>
                    <TableCell>
                      <StatusBadge status={match.severity as any} />
                    </TableCell>
                    <TableCell className="text-sm">{match.rootCause}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={match.capaStatus === 'Completed' ? 'bg-green-50 text-green-700' : 'bg-yellow-50 text-yellow-700'}
                      >
                        {match.capaStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          </CardContent>
        </Card>

        {/* Pattern Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Pattern Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">Common Factors:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                  <li>All events occurred in cold storage facilities</li>
                  <li>Two events related to temperature sensor failures</li>
                  <li>Average time between occurrences: 4.2 months</li>
                  <li>Similar corrective actions implemented but recurrence continues</li>
                </ul>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-900">
                  <strong>Recommendation:</strong> Consider a comprehensive review of the cold storage 
                  maintenance program and preventive maintenance schedule. Previous CAPAs may not have 
                  addressed the root cause adequately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/deviation/impact-assessment')}>
            Back
          </Button>
          <Button onClick={() => navigate('/deviation/root-cause')} className="bg-blue-600 hover:bg-blue-700">
            Continue to Root Cause Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}