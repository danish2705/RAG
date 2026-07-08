export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
];

export const siteOptions = [
  "Manufacturing Plant A",
  "Manufacturing Plant B",
  "Quality Lab",
  "Distribution Center",
];

export const eventTypeOptions = [
  // Existing — unplanned-leaning, kept as-is
  "Temperature Excursion",
  "Equipment Malfunction",
  "Data Integrity Issue",
  "Documentation Error",
  "Process Deviation",
  "Material Discrepancy",
  // General-purpose — could describe either a Deviation or a Change
  // Control depending on what the Description says. Deliberately neutral;
  // the Description decides the direction, not the label itself.
  "Material Change",
  "Process/Equipment Change",
  "System/Documentation Change",
];

export const sourceSystemOptions = [
  "Environmental Monitoring",
  "Equipment System",
  "LIMS",
  "Manual Entry",
  "MES",
];
