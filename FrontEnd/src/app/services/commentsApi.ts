import { apiFetch } from "../utils/api";

export type CaseType = "Deviation" | "Change Control";

export interface CaseComment {
  id: number;
  case_id: string;
  case_type: CaseType;
  section: string;
  comment: string;
  created_by: string;
  created_at: string;
}

export const fetchCaseComments = async (
  caseId: string | number,
  caseType: CaseType,
): Promise<CaseComment[]> => {
  const res = await apiFetch<{ data: CaseComment[] }>(
    `/api/records/${encodeURIComponent(String(caseId))}/comments?case_type=${encodeURIComponent(caseType)}`,
  );
  return res.data;
};

export const addCaseComment = async (
  caseId: string | number,
  caseType: CaseType,
  section: string,
  comment: string,
  createdBy: string,
): Promise<CaseComment> => {
  const res = await apiFetch<{ data: CaseComment }>(
    `/api/records/${encodeURIComponent(String(caseId))}/comments`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        case_type: caseType,
        section,
        comment,
        created_by: createdBy,
      }),
    },
  );
  return res.data;
};