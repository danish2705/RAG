import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Upload, X, AlertCircle } from "lucide-react";
import {
  siteOptions,
  eventTypeOptions,
  sourceSystemOptions,
} from "../../mocks/mockInputQuery";
import type { FormState, FormErrors } from "../../types/InputQuery";

export function SubmitErrorBanner({ message }: { message: string }) {
  return (
    <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-500/10 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <div>
        <p className="font-medium">Couldn&apos;t submit this event</p>
        <p className="mt-1">{message}</p>
      </div>
    </div>
  );
}

export function BasicInformationCard({
  formData,
  errors,
  updateField,
}: {
  formData: FormState;
  errors: FormErrors;
  updateField: (field: keyof FormState, value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="site">
              Site <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.site}
              onValueChange={(value) => updateField("site", value)}
            >
              <SelectTrigger id="site" aria-invalid={!!errors.site}>
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
            {errors.site && (
              <p className="text-xs text-red-500">{errors.site}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="datetime">
              Date/Time Detected <span className="text-red-500">*</span>
            </Label>
            <Input
              id="datetime"
              type="datetime-local"
              value={formData.dateTimeDetected}
              onChange={(e) => updateField("dateTimeDetected", e.target.value)}
              aria-invalid={!!errors.dateTimeDetected}
            />
            {errors.dateTimeDetected && (
              <p className="text-xs text-red-500">
                {errors.dateTimeDetected}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sourceSystem">
              Source System <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.sourceSystem}
              onValueChange={(value) => updateField("sourceSystem", value)}
            >
              <SelectTrigger
                id="sourceSystem"
                aria-invalid={!!errors.sourceSystem}
              >
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
            {errors.sourceSystem && (
              <p className="text-xs text-red-500">{errors.sourceSystem}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="eventType">
              Event Type <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) => updateField("eventType", value)}
            >
              <SelectTrigger id="eventType" aria-invalid={!!errors.eventType}>
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
            {errors.eventType && (
              <p className="text-xs text-red-500">{errors.eventType}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function DescriptionCard({
  formData,
  errors,
  updateField,
}: {
  formData: FormState;
  errors: FormErrors;
  updateField: (field: keyof FormState, value: string) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Description</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="description">
            Detailed Description <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="description"
            rows={6}
            placeholder="Provide a detailed description of the deviation..."
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            aria-invalid={!!errors.description}
          />
          {errors.description && (
            <p className="text-xs text-red-500">{errors.description}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="batch">Impacted Batch/Lot</Label>
            <Input
              id="batch"
              placeholder="e.g., LOT-2024-0412"
              value={formData.batch}
              onChange={(e) => updateField("batch", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="system">Impacted System</Label>
            <Input
              id="system"
              placeholder="e.g., Cold Storage Unit 3"
              value={formData.system}
              onChange={(e) => updateField("system", e.target.value)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ImmediateActionsCard({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
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
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function AttachmentsCard({
  fileInputRef,
  attachments,
  rejectedFiles,
  onFileUpload,
  onDrop,
  onDragOver,
  onRemove,
}: {
  fileInputRef: React.RefObject<HTMLInputElement>;
  attachments: File[];
  rejectedFiles: string[];
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onRemove: (index: number) => void;
}) {
  return (
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
            onChange={onFileUpload}
          />

          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-muted-foreground transition-colors cursor-pointer"
          >
            <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-1">
              <span className="text-blue-500 font-medium">
                Click to upload
              </span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-muted-foreground">
              PDF, PNG, JPG up to 10MB
            </p>
          </div>

          {rejectedFiles.length > 0 && (
            <div className="rounded-lg border border-amber-300 bg-amber-500/10 dark:border-amber-700 p-3 text-xs text-amber-700 dark:text-amber-400">
              <p className="font-medium mb-1">
                The following file(s) were not added:
              </p>
              <ul className="list-disc list-inside space-y-0.5">
                {rejectedFiles.map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">
                Uploaded Files ({attachments.length})
              </h4>
              {attachments.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemove(index)}
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
  );
}