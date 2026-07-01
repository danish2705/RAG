// Default values — used to detect changes
export const DEFAULTS = {
  aiEnabled: true,
  aiAutoAccept: false,
  confidenceThreshold: "70",
  emailNotif: true,
  systemNotif: true,
  capaReminders: true,
  defaultSite: "plant-a",
  crossTrigger: true,
  detailedAudit: true,
  dataRetention: "7",
};

export const LABELS: Record<string, string> = {
  aiEnabled: "Enable AI Recommendations",
  aiAutoAccept: "Auto-Accept High Confidence AI Decisions",
  confidenceThreshold: "Minimum Confidence Threshold",
  emailNotif: "Email Notifications",
  systemNotif: "System Notifications",
  capaReminders: "CAPA Due Date Reminders",
  defaultSite: "Default Site",
  crossTrigger: "Enable Cross-Module Triggers",
  detailedAudit: "Detailed Audit Trail",
  dataRetention: "Data Retention Period",
};

export const OPTION_LABELS: Record<string, Record<string, string>> = {
  confidenceThreshold: { "70": "70%", "80": "80%", "90": "90%" },
  defaultSite: {
    "plant-a": "Manufacturing Plant A",
    "plant-b": "Manufacturing Plant B",
    "lab": "Quality Lab",
    "dist": "Distribution Center",
  },
  dataRetention: {
    "5": "5 years",
    "7": "7 years (Recommended)",
    "10": "10 years",
    "permanent": "Permanent",
  },
};