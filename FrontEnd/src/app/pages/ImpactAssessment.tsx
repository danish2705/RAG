import { useNavigate } from 'react-router';
import { Card, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ImpactCard } from '../components/qms/ImpactCard';
import { impactAssessments } from '../lib/mockData';

export function ImpactAssessment() {
  const navigate = useNavigate();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Impact Assessment</h1>
        <p className="text-sm text-gray-500 mt-1">Evaluate the impact across critical quality areas</p>
      </div>

      <div className="space-y-6">
        {/* Impact Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {impactAssessments.map((assessment) => (
            <ImpactCard
              key={assessment.category}
              category={assessment.category}
              status={assessment.status as any}
              description={assessment.description}
            />
          ))}
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Impact Summary</CardTitle>
          </CardHeader>
          <div className="px-6 pb-6">
            <p className="text-sm text-gray-600 mb-4">
              Based on the assessment, this deviation has <strong>High regulatory impact</strong> and 
              requires immediate notification to Quality Assurance and regulatory affairs teams.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">
                <strong>Recommendation:</strong> Initiate detailed investigation and prepare regulatory notification 
                within 24 hours in accordance with local and international reporting requirements.
              </p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => navigate('/deviation/immediate-correction')}>
            Back
          </Button>
          <Button onClick={() => navigate('/deviation/historical-analysis')} className="bg-blue-600 hover:bg-blue-700">
            Continue to Historical Analysis
          </Button>
        </div>
      </div>
    </div>
  );
}
