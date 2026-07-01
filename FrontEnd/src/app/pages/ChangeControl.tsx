import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { changeTypeOptions, lifecyclePhaseOptions, siteOptions } from '../lib/mockData';
import { Sparkles } from 'lucide-react';

export function ChangeControl() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    changeType: '',
    description: '',
    lifecyclePhase: '',
    site: '',
    impactedSystems: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/change-control/decision');
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">New Change Control</h1>
        <p className="text-sm text-gray-500 mt-1">Initiate a new change control request</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Change Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Change Title *</Label>
                <Input
                  id="title"
                  placeholder="Brief description of the proposed change"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="changeType">Change Type *</Label>
                  <Select value={formData.changeType} onValueChange={(value) => setFormData({ ...formData, changeType: value })}>
                    <SelectTrigger id="changeType">
                      <SelectValue placeholder="Select change type" />
                    </SelectTrigger>
                    <SelectContent>
                      {changeTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lifecyclePhase">Lifecycle Phase *</Label>
                  <Select value={formData.lifecyclePhase} onValueChange={(value) => setFormData({ ...formData, lifecyclePhase: value })}>
                    <SelectTrigger id="lifecyclePhase">
                      <SelectValue placeholder="Select lifecycle phase" />
                    </SelectTrigger>
                    <SelectContent>
                      {lifecyclePhaseOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Provide comprehensive details about the proposed change, including rationale and expected benefits..."
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Impacts Scope */}
          <Card>
            <CardHeader>
              <CardTitle>Impact Scope</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="site">Impacted Site *</Label>
                <Select value={formData.site} onValueChange={(value) => setFormData({ ...formData, site: value })}>
                  <SelectTrigger id="site">
                    <SelectValue placeholder="Select site" />
                  </SelectTrigger>
                  <SelectContent>
                    {siteOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="impactedSystems">Impacted Systems/Processes *</Label>
                <Textarea
                  id="impactedSystems"
                  placeholder="List all systems, processes, equipment, or documentation that will be affected by this change..."
                  rows={4}
                  value={formData.impactedSystems}
                  onChange={(e) => setFormData({ ...formData, impactedSystems: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="bg-blue-600 hover:bg-blue-700"
              disabled={!formData.title || !formData.changeType || !formData.description || !formData.lifecyclePhase || !formData.site}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze with AI
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
