import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertBanner } from '../components/qms/AlertBanner';
import { rootCauseOptions } from '../lib/mockData';
import { Sparkles, ArrowRight, AlertTriangle } from 'lucide-react';
import { Badge } from '../components/ui/badge';

// AI-generated suggestions (in production, this would come from an API)
const aiSuggestions = {
  rootCause: 'Equipment Failure',
  rootCauseDetail: 'Faulty temperature sensor and inadequate preventive maintenance schedule. The sensor had been in operation for 4 years beyond its recommended service life, and quarterly calibration checks failed to detect the gradual drift in accuracy. Root cause analysis using 5 Whys methodology identified lack of proactive sensor replacement program as the underlying systemic issue.',
  correction: 'Affected product batches (Batch #2024-Q1-047, #2024-Q1-048, #2024-Q1-049) immediately moved to validated backup cold storage unit. Temperature logs reviewed for the past 30 days to identify full extent of excursion. Impacted materials quarantined pending stability testing results.',
  correctiveAction: 'Replace all temperature sensors in Cold Storage Unit 3. Calibrate new sensors per SOP-QA-022. Implement enhanced monitoring with dual sensors and automated alert system. Conduct stability testing on affected batches before disposition decision. Update preventive maintenance schedule to include sensor replacement every 3 years instead of 5 years.',
  preventiveAction: 'Implement predictive maintenance program for all cold storage units using IoT sensors. Reduce sensor replacement interval from 5 years to 3 years across all facilities. Install redundant temperature monitoring with real-time SMS/email alerts. Conduct FMEA on all critical storage equipment. Upgrade to Industry 4.0 monitoring platform with machine learning anomaly detection.',
};

export function RootCauseCapa() {
  const navigate = useNavigate();

  // Pre-fill fields with AI suggestions
  const [rootCause, setRootCause] = useState(aiSuggestions.rootCause);
  const [rootCauseDetail, setRootCauseDetail] = useState(aiSuggestions.rootCauseDetail);
  const [correction, setCorrection] = useState(aiSuggestions.correction);
  const [correctiveAction, setCorrectiveAction] = useState(aiSuggestions.correctiveAction);
  const [preventiveAction, setPreventiveAction] = useState(aiSuggestions.preventiveAction);
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);

  // AI determines if Change Control is required based on corrective action
  const [requiresChangeControl] = useState(true); // In production, this would be determined by AI based on corrective action content

  const handleCorrectiveActionChange = (value: string) => {
    setCorrectiveAction(value);
    // Simple validation - show warning if action is too short or generic
    if (value.length > 0 && value.length < 50) {
      setShowWeakCapaWarning(true);
    } else {
      setShowWeakCapaWarning(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Root Cause & CAPA</h1>
        <p className="text-sm text-gray-500 mt-1">AI-generated root cause analysis and corrective actions</p>
      </div>

      <div className="space-y-6">
        {/* AI Auto-fill Banner */}
        <AlertBanner
          type="info"
          title="AI Suggested – Please review and edit if required"
          message="All fields below have been automatically populated by AI based on the deviation details and historical patterns. Review each section and make any necessary adjustments before proceeding."
        />

        {/* Root Cause Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Root Cause Analysis
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rootCause">Root Cause Category</Label>
              <Select value={rootCause} onValueChange={setRootCause}>
                <SelectTrigger id="rootCause">
                  <SelectValue placeholder="Select root cause category" />
                </SelectTrigger>
                <SelectContent>
                  {rootCauseOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-selected based on event analysis
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rootCauseDetail">Detailed Root Cause Description</Label>
              <Textarea
                id="rootCauseDetail"
                placeholder="Provide detailed analysis of the root cause using appropriate tools (5 Whys, Fishbone, etc.)..."
                rows={5}
                value={rootCauseDetail}
                onChange={(e) => setRootCauseDetail(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated root cause analysis - edit as needed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* CAPA - Three Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Correction
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="correction">Immediate Correction (What was done to fix the immediate problem?)</Label>
              <Textarea
                id="correction"
                placeholder="Describe the immediate action taken to address this specific deviation..."
                rows={4}
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated from immediate actions taken - edit as needed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Corrective Action (CAPA)
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="correctiveAction">Corrective Action (What will prevent THIS deviation from recurring?)</Label>
              <Textarea
                id="correctiveAction"
                placeholder="Define specific actions to eliminate the root cause and prevent recurrence..."
                rows={5}
                value={correctiveAction}
                onChange={(e) => handleCorrectiveActionChange(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated corrective actions - edit as needed
              </p>
            </div>
          </CardContent>
        </Card>

        {showWeakCapaWarning && (
          <AlertBanner
            type="warning"
            title="CAPA May Be Insufficient"
            message="The corrective action appears to be too brief or generic. Consider providing more specific, measurable actions that directly address the root cause."
          />
        )}

        {/* Change Control Requirement - shown only when corrective action requires system/process change */}
        {requiresChangeControl && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-orange-600 shrink-0 mt-1" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-orange-900">Change Control Required</h3>
                    <Badge className="bg-orange-100 text-orange-800 border-orange-300">Action Required</Badge>
                  </div>
                  <p className="text-sm text-orange-800 mb-4">
                    The corrective action requires modifications to validated systems, processes, or procedures.
                    A formal Change Control record must be created to ensure proper validation and approval.
                  </p>
                  <Button
                    onClick={() => navigate('/change-control')}
                    className="bg-orange-600 hover:bg-orange-700"
                    size="sm"
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Create Change Control Record
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preventive Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="preventiveAction">Preventive Action (What will prevent SIMILAR deviations?)</Label>
              <Textarea
                id="preventiveAction"
                placeholder="Define actions to prevent similar issues in other areas or systems..."
                rows={5}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated preventive actions based on historical patterns - edit as needed
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/deviation/historical-analysis')}>
            Back
          </Button>
          <Button
            onClick={() => navigate('/deviation/effectiveness-check')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue to Effectiveness Check
          </Button>
        </div>
      </div>
    </div>
  );
}
