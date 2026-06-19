import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { AlertBanner } from '../components/qms/AlertBanner';
import { Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';

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

  // Decision Required state
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState('');

  const handleCorrectiveActionChange = (value: string) => {
    setCorrectiveAction(value);
    setShowWeakCapaWarning(value.length > 0 && value.length < 50);
  };

  const handleAccept = () => {
    navigate('/deviation/effectiveness-check');
  };

  const handleOverride = () => {
    if (overrideJustification.trim()) {
      setShowOverrideDialog(false);
      navigate('/deviation/effectiveness-check');
    }
  };

  const handleReject = () => {
    if (rejectJustification.trim()) {
      setShowRejectDialog(false);
      navigate('/deviation');
    }
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

        {/* Decision Required */}
        <Card>
          <CardHeader>
            <CardTitle>Decision Required</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                Accept CAPA
              </Button>
              <Button
                onClick={() => setShowOverrideDialog(true)}
                variant="outline"
                className="flex-1"
              >
                Override CAPA
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject CAPA
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail
            </p>
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
            Complete Analysis
          </Button>
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override CAPA</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the CAPA. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideJustification">Justification *</Label>
              <Textarea
                id="overrideJustification"
                placeholder="Explain why you are overriding the CAPA..."
                rows={4}
                value={overrideJustification}
                onChange={(e) => setOverrideJustification(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOverrideDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleOverride}
              disabled={!overrideJustification.trim()}
            >
              Confirm Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject CAPA</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this CAPA. You will be redirected to the deviation form. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectJustification">Reason for Rejection *</Label>
              <Textarea
                id="rejectJustification"
                placeholder="Explain why you are rejecting the CAPA..."
                rows={4}
                value={rejectJustification}
                onChange={(e) => setRejectJustification(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectJustification.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}