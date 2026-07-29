import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Upload, X, AlertCircle, CalendarDays } from "lucide-react";
import {
  siteOptions,
  eventTypeOptions,
  sourceSystemOptions,
} from "../mocks/mockInputQuery";
import type { FormState, FormErrors } from "../types/InputQuery";

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
    <Card className="rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-200">      <CardHeader className="border-b bg-slate-50/60 dark:bg-slate-900/40 px-6 py-5">
      <CardTitle className="text-[15px] font-semibold tracking-tight">
        Basic Information
      </CardTitle>

      <p className="text-sm text-muted-foreground mt-1">
        Enter the essential details about the quality event.
      </p>
    </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label
              htmlFor="site"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Site
              <span className="ml-1 text-red-500">*</span>
            </Label>

            <Select
              value={formData.site}
              onValueChange={(value) => updateField("site", value)}
            >
              <SelectTrigger
                id="site"
                aria-invalid={!!errors.site}
                className="
        h-10
        rounded-lg
        border-slate-200
        bg-white
        text-sm
        transition-all
        duration-200
        focus:ring-2
        focus:ring-blue-500/10
        focus:border-blue-500
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                <SelectValue placeholder="Select site" />
              </SelectTrigger>

              <SelectContent
                className="
        w-[--radix-select-trigger-width]
        rounded-lg
        border
        border-slate-200
        bg-white
        p-1
        shadow-lg
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                {siteOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="
            rounded-md
            text-sm
            cursor-pointer
            focus:bg-blue-50
            focus:text-blue-700
            dark:focus:bg-blue-950/30
            dark:focus:text-blue-300
          "
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.site && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.site}
              </p>
            )}
          </div>


          <div className="space-y-2">
            <Label
              htmlFor="datetime"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Date/Time Detected
              <span className="ml-1 text-red-500">*</span>
            </Label>

            <div className="relative">
              <Input
                id="datetime"
                type="datetime-local"
                value={formData.dateTimeDetected}
                onChange={(e) => updateField("dateTimeDetected", e.target.value)}
                aria-invalid={!!errors.dateTimeDetected}
                className="
  h-10
  rounded-lg
  border-slate-200
  bg-white
  pr-3
  text-sm
  shadow-sm
  focus-visible:border-blue-500
  focus-visible:ring-2
  focus-visible:ring-blue-500/10
"
              />
            </div>

            {errors.dateTimeDetected && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.dateTimeDetected}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="sourceSystem"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Source System
              <span className="ml-1 text-red-500">*</span>
            </Label>

            <Select
              value={formData.sourceSystem}
              onValueChange={(value) => updateField("sourceSystem", value)}
            >
              <SelectTrigger
                id="sourceSystem"
                aria-invalid={!!errors.sourceSystem}
                className="
        h-10
        rounded-lg
        border-slate-200
        bg-white
        text-sm
        transition-all
        duration-200
        focus:ring-2
        focus:ring-blue-500/10
        focus:border-blue-500
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                <SelectValue placeholder="Select source system" />
              </SelectTrigger>

              <SelectContent
                className="
        w-[--radix-select-trigger-width]
        rounded-lg
        border
        border-slate-200
        bg-white
        p-1
        shadow-lg
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                {sourceSystemOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="
            rounded-md
            text-sm
            cursor-pointer
            focus:bg-blue-50
            focus:text-blue-700
            dark:focus:bg-blue-950/30
            dark:focus:text-blue-300
          "
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.sourceSystem && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.sourceSystem}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="eventType"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Event Type
              <span className="ml-1 text-red-500">*</span>
            </Label>

            <Select
              value={formData.eventType}
              onValueChange={(value) => updateField("eventType", value)}
            >
              <SelectTrigger
                id="eventType"
                aria-invalid={!!errors.eventType}
                className="
        h-10
        rounded-lg
        border-slate-200
        bg-white
        text-sm
        transition-all
        duration-200
        focus:ring-2
        focus:ring-blue-500/10
        focus:border-blue-500
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>

              <SelectContent
                className="
        w-[--radix-select-trigger-width]
        rounded-lg
        border
        border-slate-200
        bg-white
        p-1
        shadow-lg
        dark:border-slate-700
        dark:bg-slate-900
      "
              >
                {eventTypeOptions.map((option) => (
                  <SelectItem
                    key={option}
                    value={option}
                    className="
            rounded-md
            text-sm
            cursor-pointer
            focus:bg-blue-50
            focus:text-blue-700
            dark:focus:bg-blue-950/30
            dark:focus:text-blue-300
          "
                  >
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {errors.eventType && (
              <p className="mt-1 text-xs font-medium text-red-600">
                {errors.eventType}
              </p>
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
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 px-6 py-5">
        <CardTitle className="text-[15px] font-semibold">
          Description
        </CardTitle>

        <p className="mt-1 text-sm text-muted-foreground">
          Explain the event clearly, including the affected process, equipment, or material.
        </p>
      </CardHeader>

      <CardContent className="space-y-5 px-4 py-0">
        <div className="space-y-2">
          <Label
            htmlFor="description"
            className="text-sm font-medium text-slate-700 dark:text-slate-300"
          >
            Detailed Description
            <span className="ml-1 text-red-500">*</span>
          </Label>

          <Textarea
            id="description"
            rows={6}
            placeholder="Provide a detailed description of the deviation..."
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            aria-invalid={!!errors.description}
            className="
      min-h-[100px]
      resize-y
      rounded-lg
      border-slate-200
      bg-white
      px-3
      py-2.5
      text-sm
      leading-6
      placeholder:text-slate-400
      transition-all
      duration-200
      focus-visible:border-blue-500
      focus-visible:ring-2
      focus-visible:ring-blue-500/10
      dark:border-slate-700
      dark:bg-slate-900
      dark:placeholder:text-slate-500
    "
          />

          {errors.description && (
            <p className="mt-1 text-xs font-medium text-red-600">
              {errors.description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label
              htmlFor="batch"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Impacted Batch/Lot
            </Label>

            <Input
              id="batch"
              placeholder="e.g., LOT-2024-0412"
              value={formData.batch}
              onChange={(e) => updateField("batch", e.target.value)}
              className="
        h-10
        rounded-lg
        border-slate-200
        bg-white
        text-sm
        transition-all
        duration-200
        focus-visible:border-blue-500
        focus-visible:ring-2
        focus-visible:ring-blue-500/10
        dark:border-slate-700
        dark:bg-slate-900
      "
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="system"
              className="text-sm font-medium text-slate-700 dark:text-slate-300"
            >
              Impacted System
            </Label>

            <Input
              id="system"
              placeholder="e.g., Cold Storage Unit 3"
              value={formData.system}
              onChange={(e) => updateField("system", e.target.value)}
              className="
        h-10
        rounded-lg
        border-slate-200
        bg-white
        text-sm
        transition-all
        duration-200
        focus-visible:border-blue-500
        focus-visible:ring-2
        focus-visible:ring-blue-500/10
        dark:border-slate-700
        dark:bg-slate-900
      "
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
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 px-6 py-5">
        <CardTitle className="text-[15px] font-semibold">
          Immediate Actions Taken
        </CardTitle>

        <p className="mt-1 text-sm text-muted-foreground">
          Record any immediate containment or corrective actions already performed.
        </p>
      </CardHeader>

      <CardContent className="px-5 py-0">
        <div className="space-y-2">
          <Label htmlFor="immediateActions">Actions Taken</Label>
          <Textarea
            id="immediateActions"
            rows={8}
            placeholder="Describe any immediate containment or corrective actions..."
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="
    min-h-[100px]
    resize-y
    rounded-lg
    border-slate-200
    bg-white
    px-3
    py-2.5
    text-sm
    leading-6
    placeholder:text-slate-400
    transition-all
    duration-200
    focus-visible:border-blue-500
    focus-visible:ring-2
    focus-visible:ring-blue-500/10
    dark:border-slate-700
    dark:bg-slate-900
    dark:placeholder:text-slate-500
  "
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
    <Card className="rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      <CardHeader className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/30 px-6 py-5">
        <CardTitle className="text-[15px] font-semibold">
          Attachments
        </CardTitle>

        <p className="mt-1 text-sm text-muted-foreground">
          Upload supporting documents, images, or reports related to this event.
        </p>
      </CardHeader>

      <CardContent className="px-4 py-0">
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
            className="
rounded-xl
border-2
border-dashed
border-slate-300
dark:border-slate-700
bg-slate-50/60
dark:bg-slate-900/20
p-10
text-center
cursor-pointer
transition-all
duration-200
hover:border-blue-400
hover:bg-blue-50/50
dark:hover:bg-blue-950/20
"          >
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
                  className="
flex
items-center
justify-between
rounded-lg
border
border-slate-200
dark:border-slate-700
bg-white
dark:bg-slate-900/40
px-4
py-3
shadow-sm
"                >
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