import { useCallback, useEffect, useState } from "react";
import {
  fetchCaseComments,
  addCaseComment,
  type CaseComment,
  type CaseType,
} from "../services/commentsApi";

// ---------------------------------------------------------------------------
// Local-storage fallback.
//
// The real comments API (GET/POST /api/records/:id/comments) may not exist
// on the backend yet. Rather than let "Comments" be dead-on-arrival while
// that's being built, this hook tries the real API first and, only if that
// call fails (network error, 404 route not found, etc.), falls back to
// reading/writing the same shape of data in the browser's localStorage.
//
// This means: comments you add now work immediately and persist across
// refreshes, and the moment the backend route exists, this hook goes back
// to using it automatically — no code change needed on this end.
// ---------------------------------------------------------------------------

const storageKey = (caseId: string | number, caseType: CaseType) =>
  `case_comments:${caseType}:${caseId}`;

function readLocalComments(
  caseId: string | number,
  caseType: CaseType,
): CaseComment[] {
  try {
    const raw = localStorage.getItem(storageKey(caseId, caseType));
    return raw ? (JSON.parse(raw) as CaseComment[]) : [];
  } catch {
    return [];
  }
}

function writeLocalComments(
  caseId: string | number,
  caseType: CaseType,
  comments: CaseComment[],
) {
  try {
    localStorage.setItem(
      storageKey(caseId, caseType),
      JSON.stringify(comments),
    );
  } catch {
    // Storage full or unavailable (e.g. private browsing) — comments just
    // won't persist across a refresh in that case, nothing else to do.
  }
}

function addLocalComment(
  caseId: string | number,
  caseType: CaseType,
  section: string,
  comment: string,
  createdBy: string,
): CaseComment {
  const created: CaseComment = {
    // Negative id marks this as a local-only comment (real DB ids are
    // positive/serial), which is harmless since it's never sent back to
    // an API — it just needs to be unique for the React `key` prop.
    id: -Date.now(),
    case_id: String(caseId),
    case_type: caseType,
    section,
    comment,
    created_by: createdBy,
    created_at: new Date().toISOString(),
  };
  const existing = readLocalComments(caseId, caseType);
  writeLocalComments(caseId, caseType, [...existing, created]);
  return created;
}

// Loads every comment saved against a case (all sections) once, then hands
// back a per-section slice + an `addComment` that appends optimistically.
// One fetch per open modal instead of one per "Comments" button.
export function useCaseComments(caseId: string | number, caseType: CaseType) {
  const [comments, setComments] = useState<CaseComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingLocalFallback, setUsingLocalFallback] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCaseComments(caseId, caseType)
      .then((data) => {
        if (cancelled) return;
        setComments(data);
        setUsingLocalFallback(false);
      })
      .catch(() => {
        // No backend route yet (or it's unreachable) — fall back to
        // whatever's saved locally for this case so the feature is still
        // usable end to end.
        if (cancelled) return;
        setComments(readLocalComments(caseId, caseType));
        setUsingLocalFallback(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [caseId, caseType]);

  const addComment = useCallback(
    async (section: string, text: string, createdBy: string) => {
      if (usingLocalFallback) {
        const created = addLocalComment(
          caseId,
          caseType,
          section,
          text,
          createdBy,
        );
        setComments((prev) => [...prev, created]);
        return created;
      }
      try {
        const created = await addCaseComment(
          caseId,
          caseType,
          section,
          text,
          createdBy,
        );
        setComments((prev) => [...prev, created]);
        return created;
      } catch {
        // The API call failed on this attempt too (route still missing) —
        // switch to local storage from here on for this case.
        setUsingLocalFallback(true);
        const created = addLocalComment(
          caseId,
          caseType,
          section,
          text,
          createdBy,
        );
        setComments((prev) => [...prev, created]);
        return created;
      }
    },
    [caseId, caseType, usingLocalFallback],
  );

  const forSection = useCallback(
    (section: string) => comments.filter((c) => c.section === section),
    [comments],
  );

  return { comments, loading, addComment, forSection, usingLocalFallback };
}