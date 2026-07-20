import type { Request, Response } from "express";
import {
  createLlmRetryEntry,
  listLlmRetryEntries,
  getLlmRetryEntryById,
  updateLlmRetryStatus,
  type LlmRetryEntityType,
  type LlmRetryStage,
  type LlmRetryStatus,
  type ListLlmRetryParams,
} from "../repository/llmRetryRepository.js";
import { recordAuditEntry } from "../repository/auditRepository.js";

const VALID_ENTITY_TYPES: LlmRetryEntityType[] = [
  "Deviation",
  "Change Control",
];
const VALID_STAGES: LlmRetryStage[] = [
  "classification",
  "impact_assessment",
  "rca",
  "capa",
  "change_impact_assessment",
  "risk_criticality",
  "validation_testing",
  "implementation_control",
  "final_summary",
];
const VALID_STATUSES: LlmRetryStatus[] = ["pending", "not_executed"];

interface CreateLlmRetryBody {
  full_name?: unknown;
  entity_type?: unknown;
  pipeline_stage?: unknown;
  query_text?: unknown;
  error_message?: unknown;
  pipeline_context?: unknown;
}

// POST /api/llm-retry-queue — called from the "AI is unavailable, save and
// try again later" popup on any query/submit page.
export async function createEntry(req: Request, res: Response): Promise<void> {
  const body = (req.body ?? {}) as CreateLlmRetryBody;

  const fullName =
    typeof body.full_name === "string" ? body.full_name.trim() : "";
  if (!fullName) {
    res.status(400).json({ error: "Please enter your name." });
    return;
  }

  const entityType = body.entity_type as LlmRetryEntityType;
  if (!VALID_ENTITY_TYPES.includes(entityType)) {
    res.status(400).json({
      error: `entity_type must be one of: ${VALID_ENTITY_TYPES.join(", ")}`,
    });
    return;
  }

  const pipelineStage = body.pipeline_stage as LlmRetryStage;
  if (!VALID_STAGES.includes(pipelineStage)) {
    res.status(400).json({
      error: `pipeline_stage must be one of: ${VALID_STAGES.join(", ")}`,
    });
    return;
  }

  const queryText = typeof body.query_text === "string" ? body.query_text : "";

  const errorMessage =
    typeof body.error_message === "string" ? body.error_message : null;

  const entry = await createLlmRetryEntry({
    full_name: fullName,
    entity_type: entityType,
    pipeline_stage: pipelineStage,
    query_text: queryText,
    error_message: errorMessage,
    pipeline_context:
      body.pipeline_context !== undefined ? body.pipeline_context : null,
  });

  // Mirror this into the audit trail too, so the AI-unavailable event shows
  // up on the Audit Logs page alongside everything else.
  await recordAuditEntry({
    entity_type: entityType,
    entity_id: entry.reference_code,
    action: "llm_unavailable",
    source: "system",
    performed_by: fullName,
    field_name: pipelineStage,
    reason: `AI service was unavailable during "${pipelineStage}" — saved for retry under reference code ${entry.reference_code}.${
      errorMessage ? ` (${errorMessage})` : ""
    }`,
  });

  res.status(201).json(entry);
}

function parseListParams(req: Request): ListLlmRetryParams {
  const q = req.query;
  return {
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    status:
      q.status === "pending" || q.status === "not_executed" ? q.status : "all",
    entityType:
      q.entityType === "Deviation" || q.entityType === "Change Control"
        ? q.entityType
        : "all",
    search: typeof q.search === "string" ? q.search : undefined,
  };
}

// GET /api/llm-retry-queue — powers the "Pending AI Reviews" page.
export async function listEntries(req: Request, res: Response): Promise<void> {
  const result = await listLlmRetryEntries(parseListParams(req));
  res.json(result);
}

// GET /api/llm-retry-queue/:id — fetches one entry including its full
// pipeline_context, used by the "Resume" button (kept out of the list
// endpoint above so paging the table stays light).
export async function getEntry(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const entry = await getLlmRetryEntryById(id);
  if (!entry) {
    res.status(404).json({ error: "Entry not found." });
    return;
  }
  res.json(entry);
}

// PATCH /api/llm-retry-queue/:id/status — toggles Pending / Not Executed.
export async function updateStatus(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const status = req.body?.status as LlmRetryStatus;

  if (!VALID_STATUSES.includes(status)) {
    res.status(400).json({
      error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
    return;
  }

  const updated = await updateLlmRetryStatus(id, status);
  if (!updated) {
    res.status(404).json({ error: "Entry not found." });
    return;
  }

  res.json(updated);
}
