import { useState } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Pencil, Save } from "lucide-react";
import { impactAssessments } from "../lib/mockData";

export function ImpactAssessment() {
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);

  const [assessments, setAssessments] = useState(
    impactAssessments.map((item) => ({
      ...item,
    })),
  );

  const [summary, setSummary] = useState(
    "Based on the assessment, this deviation has High regulatory impact and requires immediate notification to Quality Assurance and regulatory affairs teams.",
  );

  const [recommendation, setRecommendation] = useState(
    "Initiate detailed investigation and prepare regulatory notification within 24 hours in accordance with local and international reporting requirements.",
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
      case "high":
        return "bg-red-100 text-red-700 border border-red-200";

      case "medium":
        return "bg-yellow-100 text-yellow-700 border border-yellow-200";

      case "low":
        return "bg-green-100 text-green-700 border border-green-200";

      default:
        return "bg-gray-100 text-gray-700 border border-gray-200";
    }
  };

  const updateAssessment = (index: number, field: string, value: string) => {
    const updated = [...assessments];

    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    setAssessments(updated);
  };

  const handleSave = () => {
    console.log("Assessments:", assessments);
    console.log("Summary:", summary);
    console.log("Recommendation:", recommendation);

    // TODO:
    // Call API here

    setIsEditing(false);

    alert("Impact Assessment saved successfully");
  };

  return (
    <div className="p-6 w-full">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Impact Assessment
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Evaluate the impact across critical quality areas
          </p>
        </div>

        <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
          <Pencil className="h-4 w-4 mr-2" />
          {isEditing ? "Cancel Edit" : "Edit Assessment"}
        </Button>
      </div>

      <div className="space-y-6">
        {/* Impact Assessment Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessments.map((assessment, index) => (
            <Card key={assessment.category} className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">{assessment.category}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Impact Level
                      </label>

                      <Select
                        value={assessment.status}
                        onValueChange={(value) =>
                          updateAssessment(index, "status", value)
                        }
                      >
                        <SelectTrigger
                          className={getStatusBadgeClass(assessment.status)}
                        >
                          <SelectValue />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value="High">🔴 High</SelectItem>

                          <SelectItem value="Medium">🟡 Medium</SelectItem>

                          <SelectItem value="Low">🟢 Low</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">
                        Description
                      </label>

                      <Textarea
                        rows={5}
                        value={assessment.description}
                        onChange={(e) =>
                          updateAssessment(index, "description", e.target.value)
                        }
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(
                        assessment.status,
                      )}`}
                    >
                      {assessment.status}
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                      {assessment.description}
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Summary */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>Overall Impact Summary</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Summary
                  </label>

                  <Textarea
                    rows={5}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Recommendation
                  </label>

                  <Textarea
                    rows={5}
                    value={recommendation}
                    onChange={(e) => setRecommendation(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {summary}
                </p>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-900">
                    <strong>Recommendation:</strong> {recommendation}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Footer Buttons */}
        <div className="flex justify-between items-center pt-2">
          <Button
            variant="outline"
            onClick={() => navigate("/deviation/ai-recommendation")}
          >
            Back
          </Button>

          <div className="flex gap-3">
            {isEditing && (
              <Button onClick={handleSave} variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
            )}

            <Button
              onClick={() => navigate("/deviation/root-cause")}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Continue to Root Cause Analysis
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
