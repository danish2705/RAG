import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Button } from "../components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Upload, Sparkles, X } from "lucide-react";
import {
  siteOptions,
  eventTypeOptions,
  sourceSystemOptions,
} from "../lib/mockData";

export function NewDeviation() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    site: "",
    eventType: "",
    sourceSystem: "",
    description: "",
    batch: "",
    immediateActions: "",
  });

  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    setAttachments((prev) => [...prev, ...files]);

    // Reset input so same file can be selected again
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();

    const files = Array.from(e.dataTransfer.files);

    setAttachments((prev) => [...prev, ...files]);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();

    payload.append("site", formData.site);
    payload.append("eventType", formData.eventType);
    payload.append("sourceSystem", formData.sourceSystem);
    payload.append("description", formData.description);
    payload.append("batch", formData.batch);
    payload.append("immediateActions", formData.immediateActions);

    attachments.forEach((file) => {
      payload.append("attachments", file);
    });

    console.log("Form Data:", formData);
    console.log("Attachments:", attachments);

    // TODO: API call
    // await fetch("/api/deviation", {
    //   method: "POST",
    //   body: payload,
    // });

    navigate("/deviation/ai-recommendation");
  };

  return (
    <div className="p-6 w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Quality Event Intake
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          AI will classify and route your quality event automatically
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="site">Site *</Label>

                  <Select
                    value={formData.site}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        site: value,
                      })
                    }
                  >
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
                  <Label htmlFor="datetime">Date/Time Detected *</Label>

                  <Input
                    id="datetime"
                    type="datetime-local"
                    defaultValue={new Date().toISOString().slice(0, 16)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sourceSystem">Source System *</Label>

                  <Select
                    value={formData.sourceSystem}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        sourceSystem: value,
                      })
                    }
                  >
                    <SelectTrigger id="sourceSystem">
                      <SelectValue placeholder="Select source system" />
                    </SelectTrigger>

                    <SelectContent>
                      {sourceSystemOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="eventType">Event Type *</Label>

                  <Select
                    value={formData.eventType}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        eventType: value,
                      })
                    }
                  >
                    <SelectTrigger id="eventType">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>

                    <SelectContent>
                      {eventTypeOptions.map((option) => (
                        <SelectItem key={option} value={option}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Detailed Description *</Label>

                <Textarea
                  id="description"
                  rows={6}
                  placeholder="Provide a detailed description of the deviation..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="batch">Impacted Batch/Lot</Label>

                  <Input
                    id="batch"
                    placeholder="e.g., LOT-2024-0412"
                    value={formData.batch}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        batch: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system">Impacted System</Label>

                  <Input id="system" placeholder="e.g., Cold Storage Unit 3" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Immediate Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Immediate Actions Taken</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="immediateActions">Actions Taken</Label>

                <Textarea
                  id="immediateActions"
                  rows={4}
                  placeholder="Describe any immediate containment or corrective actions..."
                  value={formData.immediateActions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      immediateActions: e.target.value,
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Attachments */}
          <Card>
            <CardHeader>
              <CardTitle>Attachments</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                >
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />

                  <p className="text-sm text-gray-600 mb-1">
                    <span className="text-blue-600 font-medium">
                      Click to upload
                    </span>{" "}
                    or drag and drop
                  </p>

                  <p className="text-xs text-gray-500">
                    PDF, PNG, JPG up to 10MB
                  </p>
                </div>

                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Uploaded Files ({attachments.length})
                    </h4>

                    {attachments.map((file, index) => (
                      <div
                        key={`${file.name}-${index}`}
                        className="flex items-center justify-between p-3 border rounded-lg bg-gray-50"
                      >
                        <div>
                          <p className="text-sm font-medium">{file.name}</p>

                          <p className="text-xs text-gray-500">
                            {(file.size / 1024).toFixed(2)} KB
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/")}
            >
              Cancel
            </Button>

            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze with AI
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
