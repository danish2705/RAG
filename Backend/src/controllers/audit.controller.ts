import type { Request, Response } from "express";
import {
  listAuditEntries,
  type ListAuditParams,
} from "../repository/auditRepository.js";

function parseParams(req: Request): ListAuditParams {
  const q = req.query;
  return {
    page: q.page ? Number(q.page) : undefined,
    pageSize: q.pageSize ? Number(q.pageSize) : undefined,
    startDate: typeof q.startDate === "string" ? q.startDate : undefined,
    endDate: typeof q.endDate === "string" ? q.endDate : undefined,
    source:
      q.source === "ai" || q.source === "human" || q.source === "system"
        ? q.source
        : "all",
    action: typeof q.action === "string" ? (q.action as any) : "all",
    entityId: typeof q.entityId === "string" ? q.entityId : undefined,
    search: typeof q.search === "string" ? q.search : undefined,
  };
}

// GET /api/audit — list audit log entries for the Audit Trail page.
export async function listAudit(req: Request, res: Response): Promise<void> {
  const result = await listAuditEntries(parseParams(req));
  res.json(result);
}
