import type { FormState } from "../../types/InputQuery";

export function buildQueryFromForm(formData: FormState): string {
  const lines = [
    `Site: ${formData.site}`,
    `Date/Time Detected: ${formData.dateTimeDetected}`,
    `Source System: ${formData.sourceSystem}`,
    `Event Type: ${formData.eventType}`,
    formData.batch ? `Impacted Batch/Lot: ${formData.batch}` : null,
    formData.system ? `Impacted System: ${formData.system}` : null,
    "",
    "Description:",
    formData.description,
  ];

  if (formData.immediateActions.trim()) {
    lines.push("", "Immediate Actions Taken:", formData.immediateActions);
  }

  return lines.filter((line) => line !== null).join("\n");
}