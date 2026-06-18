import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { AlertBanner } from '../components/qms/AlertBanner';
import { Sparkles } from 'lucide-react';

const aiSuggestions = {
  correction:
    'Affected product batches (Batch #2024-Q1-047, #2024-Q1-048, #2024-Q1-049) immediately moved to validated backup cold storage unit. Temperature logs reviewed for the past 30 days to identify full extent of excursion. Impacted materials quarantined pending stability testing results.',
  correctiveAction:
    'Replace all temperature sensors in Cold Storage Unit 3. Calibrate new sensors per SOP-QA-022. Implement enhanced monitoring with dual sensors and automated alert system. Conduct stability testing on affected batches before disposition decision. Update preventive maintenance schedule to include sensor replacement every 3 years instead of 5 years.',
  preventiveAction:
    'Implement predictive maintenance program for all cold storage units using IoT sensors. Reduce sensor replacement interval from 5 years to 3 years across all facilities. Install redundant temperature monitoring with real-time SMS/email alerts. Conduct FMEA on all critical storage equipment. Upgrade to Industry 4.0 monitoring platform with machine learning anomaly detection.',
};

export function Capa() {
  const navigate = useNavigate();
  const [correction, setCorrection] = useState(aiSuggestions.correction);
  const [correctiveAction, setCorrectiveAction] = useState(aiSuggestions.correctiveAction);
  const [preventiveAction, setPreventiveAction] = useState(aiSuggestions.preventiveAction);
  const [showWeakCapaWarning, setShowWeakCapaWarning] = useState(false);

  const handleCorrectiveActionChange = (value: string) => {
    setCorrectiveAction(value);
    setShowWeakCapaWarning(value.length > 0 && value.length < 50);
  };

  return (
 <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">CAPA</h1>
        <p className="text-sm text-gray-500 mt-1">
          Corrective and Preventive Actions — review and edit as needed
        </p>
      </div>

      <div className="space-y-6">
        <AlertBanner
          type="info"
          title="AI Suggested – Please review and edit if required"
          message="All fields below have been automatically populated by AI based on the root cause findings and historical patterns."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Correction
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="correction">
                Immediate Correction (What was done to fix the immediate problem?)
              </Label>
              <Textarea
                id="correction"
                placeholder="Describe the immediate action taken to address this specific deviation..."
                rows={4}
                value={correction}
                onChange={(e) => setCorrection(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated from immediate actions taken — edit as needed
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Corrective Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="correctiveAction">
                Corrective Action (What will prevent THIS deviation from recurring?)
              </Label>
              <Textarea
                id="correctiveAction"
                placeholder="Define specific actions to eliminate the root cause and prevent recurrence..."
                rows={5}
                value={correctiveAction}
                onChange={(e) => handleCorrectiveActionChange(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated corrective actions — edit as needed
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preventive Action
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="preventiveAction">
                Preventive Action (What will prevent SIMILAR deviations?)
              </Label>
              <Textarea
                id="preventiveAction"
                placeholder="Define actions to prevent similar issues in other areas or systems..."
                rows={5}
                value={preventiveAction}
                onChange={(e) => setPreventiveAction(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated preventive actions based on historical patterns — edit as needed
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/deviation/root-cause')}>
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