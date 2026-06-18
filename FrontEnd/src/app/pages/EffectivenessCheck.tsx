import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { AlertBanner } from '../components/qms/AlertBanner';
import { Sparkles } from 'lucide-react';

// AI-generated effectiveness check data (in production, this would come from an API)
const aiEffectivenessData = {
  isRequired: true,
  duration: '90',
  metric: 'Zero temperature excursions exceeding ±2°C from setpoint for 90 consecutive days following sensor replacement and system upgrade',
  dataSource: 'Environmental Monitoring System (EMS) - Cold Storage Unit 3 temperature logs, reviewed daily by QA and compiled in monthly trend reports',
  responsible: 'qa-manager',
};

export function EffectivenessCheck() {
  const navigate = useNavigate();

  // Pre-fill fields with AI suggestions
  const [isRequired] = useState(aiEffectivenessData.isRequired);
  const [duration, setDuration] = useState(aiEffectivenessData.duration);
  const [metric, setMetric] = useState(aiEffectivenessData.metric);
  const [dataSource, setDataSource] = useState(aiEffectivenessData.dataSource);
  const [responsible, setResponsible] = useState(aiEffectivenessData.responsible);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Effectiveness Check</h1>
        <p className="text-sm text-gray-500 mt-1">AI-generated effectiveness verification plan</p>
      </div>

      <div className="space-y-6">
        {/* AI Auto-fill Banner */}
        <AlertBanner
          type="info"
          title="AI Suggested – Please review and edit if required"
          message="All fields below have been automatically populated by AI based on the severity and CAPA requirements. Review each section and make any necessary adjustments before proceeding."
        />

        {/* Effectiveness Check Required */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Effectiveness Check Requirement
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base">Effectiveness Check Required</Label>
                <p className="text-sm text-gray-500 mt-1">
                  AI determined this is required for Major deviations
                </p>
              </div>
              <Badge className="bg-green-100 text-green-800 border-green-200">
                Yes - Required
              </Badge>
            </div>
          </CardContent>
        </Card>

        {isRequired && (
          <>
            {/* Check Duration */}
            <Card>
              <CardHeader>
                <CardTitle>Check Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (Days) *</Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="60">60 days</SelectItem>
                      <SelectItem value="90">90 days (Recommended)</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">365 days</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500">
                    Time period after CAPA implementation to verify effectiveness
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dueDate">Scheduled Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={new Date(Date.now() + parseInt(duration) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    readOnly
                    className="bg-gray-50"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Success Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="metric">Measurable Metric *</Label>
                  <Textarea
                    id="metric"
                    placeholder="e.g., Zero temperature excursions > 2°C for 90 consecutive days"
                    rows={3}
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                  />
                  <p className="text-xs text-gray-500">
                    Define specific, measurable criteria for CAPA success
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dataSource">Data Source</Label>
                  <Textarea
                    id="dataSource"
                    placeholder="e.g., Environmental Monitoring System reports"
                    rows={2}
                    value={dataSource}
                    onChange={(e) => setDataSource(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="responsible">Responsible Person</Label>
                  <Select value={responsible} onValueChange={setResponsible}>
                    <SelectTrigger id="responsible">
                      <SelectValue placeholder="Select responsible person" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="qa-manager">QA Manager</SelectItem>
                      <SelectItem value="site-manager">Site Manager</SelectItem>
                      <SelectItem value="validation-lead">Validation Lead</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Status Indicator */}
            <Card>
              <CardHeader>
                <CardTitle>Current Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Effectiveness Check Status</p>
                    <p className="text-sm text-gray-500 mt-1">Will be initiated upon CAPA completion</p>
                  </div>
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                    Pending
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/deviation/root-cause')}>
            Back
          </Button>
          <Button 
            onClick={() => navigate('/')} 
            className="bg-green-600 hover:bg-green-700"
            disabled={isRequired && !metric}
          >
            Complete Deviation
          </Button>
        </div>
      </div>
    </div>
  );
}