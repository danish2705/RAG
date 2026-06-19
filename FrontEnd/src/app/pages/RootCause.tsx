import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { AlertBanner } from '../components/qms/AlertBanner';
import { rootCauseOptions } from '../lib/mockData';
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
  rootCause: 'Equipment Failure',
  rootCauseDetail:
    'Faulty temperature sensor and inadequate preventive maintenance schedule. The sensor had been in operation for 4 years beyond its recommended service life, and quarterly calibration checks failed to detect the gradual drift in accuracy. Root cause analysis using 5 Whys methodology identified lack of proactive sensor replacement program as the underlying systemic issue.',
};

export function RootCause() {
  const navigate = useNavigate();
  const [rootCause, setRootCause] = useState(aiSuggestions.rootCause);
  const [rootCauseDetail, setRootCauseDetail] = useState(aiSuggestions.rootCauseDetail);

  // Decision Required state
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectJustification, setRejectJustification] = useState('');

  const handleAccept = () => {
    navigate('/deviation/capa');
  };

  const handleOverride = () => {
    if (overrideJustification.trim()) {
      setShowOverrideDialog(false);
      navigate('/deviation/capa');
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
        <h1 className="text-2xl font-semibold text-gray-900">Root Cause Analysis</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-generated root cause analysis — review and edit as needed
        </p>
      </div>

      <div className="space-y-6">
        <AlertBanner
          type="info"
          title="AI Suggested – Please review and edit if required"
          message="Fields below have been automatically populated by AI based on the deviation details and historical patterns. Review each section and make any necessary adjustments before proceeding."
        />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Root Cause Analysis
              <Sparkles className="h-5 w-5 text-blue-600" />
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
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
                rows={6}
                value={rootCauseDetail}
                onChange={(e) => setRootCauseDetail(e.target.value)}
              />
              <p className="text-xs text-gray-500 flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-blue-600" />
                AI-generated root cause analysis — edit as needed
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
                Accept Root Cause
              </Button>
              <Button
                onClick={() => setShowOverrideDialog(true)}
                variant="outline"
                className="flex-1"
              >
                Override Root Cause
              </Button>
              <Button
                onClick={() => setShowRejectDialog(true)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Reject Root Cause
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Your decision will be logged in the audit trail
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/deviation/impact-assessment')}>
            Back
          </Button>
        </div>
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Root Cause</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the root cause analysis. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="overrideJustification">Justification *</Label>
              <Textarea
                id="overrideJustification"
                placeholder="Explain why you are overriding the root cause analysis..."
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
            <DialogTitle>Reject Root Cause</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this root cause analysis. You will be redirected to the deviation form. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rejectJustification">Reason for Rejection *</Label>
              <Textarea
                id="rejectJustification"
                placeholder="Explain why you are rejecting the root cause analysis..."
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