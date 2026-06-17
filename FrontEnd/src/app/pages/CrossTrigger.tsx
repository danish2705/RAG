import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertBanner } from '../components/qms/AlertBanner';
import { GitBranch, FileText, AlertTriangle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

export function CrossTrigger() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Cross-Module Integration</h1>
        <p className="text-sm text-gray-500 mt-1">Related quality events and actions</p>
      </div>

      <div className="space-y-6">
        {/* Cross-Trigger Alert */}
        <AlertBanner
          type="warning"
          title="Additional Quality Record Required"
          message="This change impacts validated systems and may trigger additional quality processes."
        />

        {/* Deviation Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Related Deviation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 mb-2">
                  This change is related to Deviation DEV-2024-089
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Temperature excursion in cold storage - Corrective action requires system modification
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Status:</span>
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700">In Progress</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="font-medium">Severity:</span>
                    <Badge variant="outline" className="bg-red-50 text-red-700">High</Badge>
                  </div>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                View Deviation
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Change Control Trigger */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <GitBranch className="h-5 w-5" />
              Change Control Required
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-blue-900 mb-4">
              The CAPA implementation requires modification to a validated system. A formal Change Control record must be created.
            </p>
            <div className="bg-white border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm font-medium text-gray-900 mb-2">Proposed Change:</p>
              <p className="text-sm text-gray-600 mb-3">
                Install redundant temperature monitoring system with real-time alerting capability in Cold Storage Unit 3
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">Equipment Change</Badge>
                <Badge variant="outline">Software Change</Badge>
                <Badge variant="outline">Validation Required</Badge>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <GitBranch className="h-4 w-4 mr-2" />
              Create Change Control Record
            </Button>
          </CardContent>
        </Card>

        {/* Impact Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Cross-Module Impact Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Deviation Records Linked</span>
                <Badge variant="outline">1</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Change Controls Required</span>
                <Badge variant="outline">1</Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <span className="text-sm text-gray-600">Training Records to Update</span>
                <Badge variant="outline">12</Badge>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-gray-600">Validation Activities</span>
                <Badge variant="outline">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/change-control/action-plan')}>
            Back
          </Button>
          <Button onClick={() => navigate('/')} className="bg-green-600 hover:bg-green-700">
            Complete Change Control
          </Button>
        </div>
      </div>
    </div>
  );
}
