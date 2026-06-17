import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { AlertBanner } from '../components/qms/AlertBanner';

export function ImmediateCorrection() {
  const navigate = useNavigate();

  // AI-suggested immediate corrections
  const aiSuggestions = {
    actionTaken: 'Affected product batches (Batch #2024-Q1-047, #2024-Q1-048, #2024-Q1-049) immediately moved to quarantine pending temperature validation. Cold Storage Unit 3 temporarily taken offline. Product Quality team notified for stability assessment.',
    immediateRisk: 'Product potentially exposed to temperatures outside validated range (2-8°C). Risk of reduced stability and efficacy if exposure exceeded 30 minutes.',
    containment: 'All batches in affected storage unit quarantined. Adjacent storage units (Units 1, 2, 4) verified as unaffected. Environmental monitoring data secured for investigation.',
  };

  const [actionTaken, setActionTaken] = useState(aiSuggestions.actionTaken);
  const [immediateRisk, setImmediateRisk] = useState(aiSuggestions.immediateRisk);
  const [containment, setContainment] = useState(aiSuggestions.containment);

  const handleNext = () => {
    navigate('/deviation/impact-assessment');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-blue-600" />
          Immediate Correction
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI-generated immediate actions taken to contain the issue
        </p>
      </div>

      <AlertBanner
        type="info"
        title="AI Suggested – Please review and edit if required"
        message="This shows what needs to be fixed NOW, before deep analysis."
      />

      <div className="space-y-6 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Immediate Action Taken
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="actionTaken">What action was taken immediately?</Label>
              <Textarea
                id="actionTaken"
                value={actionTaken}
                onChange={(e) => setActionTaken(e.target.value)}
                rows={4}
                placeholder="Describe the immediate action taken to address the issue"
              />
              <p className="text-xs text-gray-500">
                Document what was done immediately upon discovery of the deviation
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="immediateRisk">Immediate Risk Assessment</Label>
              <Textarea
                id="immediateRisk"
                value={immediateRisk}
                onChange={(e) => setImmediateRisk(e.target.value)}
                rows={3}
                placeholder="Assess the immediate risk to product, patient, or process"
              />
              <p className="text-xs text-gray-500">
                Initial assessment of potential impact before detailed analysis
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="containment">Containment Measures</Label>
              <Textarea
                id="containment"
                value={containment}
                onChange={(e) => setContainment(e.target.value)}
                rows={3}
                placeholder="Describe containment measures to prevent spread or recurrence"
              />
              <p className="text-xs text-gray-500">
                Actions taken to prevent the issue from affecting other products, batches, or systems
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/deviation/ai-recommendation')}>
          Back
        </Button>
        <Button onClick={handleNext}>
          Continue to Impact Assessment
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
