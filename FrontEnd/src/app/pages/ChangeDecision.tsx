import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AlertBanner } from '../components/qms/AlertBanner';
import { Badge } from '../components/ui/badge';
import { ChevronDown, ChevronUp, Sparkles, ArrowRight } from 'lucide-react';
import { StatusBadge } from '../components/qms/StatusBadge';
import { AIResponse, impactLevelToStatus } from '../types/aiResponse';
import { ImpactCard } from '../components/qms/ImpactCard';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { exampleMajorChange } from '../lib/mockAIResponses';

export function ChangeDecision() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showOverrideDialog, setShowOverrideDialog] = useState(false);
  const [overrideJustification, setOverrideJustification] = useState('');
  // In production, this would come from an API call
  const [aiResponse] = useState<AIResponse>(exampleMajorChange);

  const handleAccept = () => {
    navigate('/change-control/action-plan');
  };

  const handleOverride = () => {
    if (overrideJustification.trim()) {
      setShowOverrideDialog(false);
      navigate('/change-control/action-plan');
    }
  };

  const handleCreateDeviationRecord = () => {
    navigate('/deviation/new');
  };

  const getSeverityBadgeClass = (severity: string): string => {
    const normalized = severity.toLowerCase();
    if (normalized === 'critical' || normalized === 'high') return 'bg-red-100 text-red-800 border-red-200';
    if (normalized === 'major' || normalized === 'medium') return 'bg-orange-100 text-orange-800 border-orange-200';
    if (normalized === 'minor' || normalized === 'low') return 'bg-green-100 text-green-800 border-green-200';
    return 'bg-gray-100 text-gray-600 border-gray-200';
  };

  const getClassificationDisplay = (classification: string): string => {
    if (classification === 'major_change') return 'Major Change';
    if (classification === 'minor_change') return 'Minor Change';
    if (classification === 'critical_change') return 'Critical Change';
    return classification;
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Change Controls Decision</h1>
        <p className="text-sm text-gray-500 mt-1">AI assessment of change control requirements</p>
      </div>

      <div className="space-y-6">
        <AlertBanner
          type="info"
          title="AI Suggestion – Requires Human Decision"
          message="The AI has analyzed the proposed change and determined whether formal change control is required based on regulatory requirements and risk factors."
        />

        {/* Redirect Banner - show if redirect is needed */}
        {aiResponse.redirect_to === 'Deviation' && (
          <div className="flex items-center gap-4 p-4 border border-orange-200 bg-orange-50 rounded-lg">
            <AlertBanner
              type="warning"
              title="Deviation Management Recommended"
              message="This event should be handled under Deviation Management"
              className="flex-1 border-0"
            />
            <Button
              onClick={handleCreateDeviationRecord}
              className="bg-orange-600 hover:bg-orange-700 shrink-0"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Create Deviation Record
            </Button>
          </div>
        )}
        {aiResponse.redirect_to === 'Change Control' && (
          <AlertBanner
            type="warning"
            title="Change Control Required"
            message="This requires Change Control"
          />
        )}

        {/* AI Decision Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Change Control Assessment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Classification */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">Classification:</span>
                <Badge className={getSeverityBadgeClass(aiResponse.severity)}>
                  {getClassificationDisplay(aiResponse.classification)}
                </Badge>
              </div>
            </div>

            {/* Severity */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-600">Severity Level:</span>
                <StatusBadge status={aiResponse.severity as any} />
              </div>
            </div>

            {/* Confidence Scores */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-600">AI Confidence Score</span>
                <span className="text-sm font-semibold text-gray-900">{aiResponse.confidence_score}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${aiResponse.confidence_score}%` }}
                ></div>
              </div>
            </div>

            {/* Expandable Rationale */}
            <div className="border-t pt-4">
              <button
                onClick={() => setExpanded(!expanded)}
                className="flex items-center justify-between w-full text-sm font-medium text-gray-900"
              >
                <span>AI Rationale</span>
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {expanded && (
                <div className="mt-3 space-y-2 text-sm text-gray-600 whitespace-pre-line">
                  {aiResponse.rationale}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Change Control Decision Section */}
        <Card>
          <CardHeader>
            <CardTitle>Change Control Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Change Control Required:</span>
              {aiResponse.requires_change_control ? (
                <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                  Change Control Required
                </Badge>
              ) : (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  Change Control Not Required
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              {aiResponse.requires_change_control
                ? 'This change has been identified as requiring formal change control procedures with impact assessment and validation activities.'
                : 'This change can proceed without formal change control requirements.'}
            </p>
          </CardContent>
        </Card>

        {/* Impact Assessment */}
        <Card>
          <CardHeader>
            <CardTitle>Impact Assessment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <ImpactCard
                category="Patient Safety"
                status={impactLevelToStatus(aiResponse.impact_assessment.patient_safety)}
                description={`Impact level: ${aiResponse.impact_assessment.patient_safety}`}
              />
              <ImpactCard
                category="Product Quality"
                status={impactLevelToStatus(aiResponse.impact_assessment.product_quality)}
                description={`Impact level: ${aiResponse.impact_assessment.product_quality}`}
              />
              <ImpactCard
                category="Data Integrity"
                status={impactLevelToStatus(aiResponse.impact_assessment.data_integrity)}
                description={`Impact level: ${aiResponse.impact_assessment.data_integrity}`}
              />
              <ImpactCard
                category="Regulatory Compliance"
                status={impactLevelToStatus(aiResponse.impact_assessment.regulatory)}
                description={`Impact level: ${aiResponse.impact_assessment.regulatory}`}
              />
              <ImpactCard
                category="Validated State"
                status={impactLevelToStatus(aiResponse.impact_assessment.validated_state)}
                description={`Impact level: ${aiResponse.impact_assessment.validated_state}`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Recommended Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Recommended Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {aiResponse.recommended_actions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-blue-600 font-semibold shrink-0">{index + 1}.</span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons - only show if human confirmation is required */}
        {aiResponse.requires_human_confirmation && (
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
                  Accept Assessment
                </Button>
                <Button
                  onClick={() => setShowOverrideDialog(true)}
                  variant="outline"
                  className="flex-1"
                >
                  Override Assessment
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                Your decision will be logged in the audit trail
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Override Dialog */}
      <Dialog open={showOverrideDialog} onOpenChange={setShowOverrideDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override AI Assessment</DialogTitle>
            <DialogDescription>
              Please provide a justification for overriding the AI recommendation. This will be recorded in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="justification">Justification *</Label>
              <Textarea
                id="justification"
                placeholder="Explain why you are overriding the AI assessment..."
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
    </div>
  );
}
