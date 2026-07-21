/**
 * The frontend already tracks, per field, whether a value is straight from
 * the AI or was edited by a human — see frontend `types/dataProvenance.ts`:
 *
 *   { value, source: "ai" | "modified", originalValue?, modifiedAt? }
 *
 * It has been sending this whole `provenance` object to the save endpoints
 * all along; it just wasn't being read. This walks that object and turns
 * every human-edited field into an audit_log-ready entry.
 */

import type { AuditLogInput } from "../repository/auditRepository.js";

interface DataFieldLike {
  value: unknown;
  source?: string;
  originalValue?: unknown;
  modifiedAt?: string;
}

function isDataField(node: unknown): node is DataFieldLike {
  return (
    typeof node === "object" &&
    node !== null &&
    "value" in node &&
    "source" in node
  );
}

// Turns e.g. ["impact_assessment", "product_impact", "severity"] into
// "Impact Assessment > Product Impact > Severity".
function humanizePath(path: string[]): string {
  return path
    .map((segment) =>
      segment
        .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase -> camel Case
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
    )
    .join(" > ");
}

export interface ExtractedFieldEdit {
  field_name: string;
  old_value: unknown;
  new_value: unknown;
  modified_at: string | null;
}

/**
 * Recursively walk a stage-provenance object (or the whole
 * `{ classification, impactAssessment, rca, ... }` provenance map) and
 * collect every field where source === "modified".
 */
export function extractFieldEdits(
  node: unknown,
  path: string[] = [],
): ExtractedFieldEdit[] {
  if (node === null || node === undefined || typeof node !== "object") {
    return [];
  }

  if (isDataField(node)) {
    if (node.source === "modified") {
      return [
        {
          field_name: humanizePath(path),
          old_value: node.originalValue ?? null,
          new_value: node.value,
          modified_at: node.modifiedAt ?? null,
        },
      ];
    }
    // AI-sourced leaf field, nothing to record here.
    return [];
  }

  const edits: ExtractedFieldEdit[] = [];
  if (Array.isArray(node)) {
    node.forEach((item, i) =>
      edits.push(...extractFieldEdits(item, [...path, String(i)])),
    );
  } else {
    for (const [key, value] of Object.entries(
      node as Record<string, unknown>,
    )) {
      if (key === "confidence_score") continue; // not a user-editable field
      edits.push(...extractFieldEdits(value, [...path, key]));
    }
  }
  return edits;
}

/**
 * Build ready-to-insert audit_log entries for every human-edited field in
 * a saved case's provenance, plus one "created" entry for the save itself.
 */
export function buildAuditEntriesForSave(params: {
  entityType: "Deviation" | "Change Control";
  entityId: string;
  savedBy: string;
  provenance: unknown;
}): AuditLogInput[] {
  const { entityType, entityId, savedBy, provenance } = params;

  const entries: AuditLogInput[] = [
    {
      entity_type: entityType,
      entity_id: entityId,
      action: "created",
      source: "human",
      performed_by: savedBy,
      reason: `${entityType} case saved`,
    },
  ];

  const fieldEdits = extractFieldEdits(provenance);
  for (const edit of fieldEdits) {
    entries.push({
      entity_type: entityType,
      entity_id: entityId,
      action: "field_edited",
      source: "human",
      performed_by: savedBy,
      field_name: edit.field_name,
      old_value: edit.old_value,
      new_value: edit.new_value,
      created_at: edit.modified_at,
    });
  }

  return entries;
}
