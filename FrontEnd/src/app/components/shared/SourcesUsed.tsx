import React from "react";

/**
 * Flattens and deduplicates an array of per-item source lists (e.g. one
 * entry per bullet point) into a single ordered list of unique source
 * names — for cards that show several AI-generated bullets together under
 * one shared citation rather than one per bullet.
 */
export function flattenSources(perItemSources?: (string[] | undefined)[]): string[] {
  if (!perItemSources) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const list of perItemSources) {
    for (const s of list ?? []) {
      if (!seen.has(s)) {
        seen.add(s);
        out.push(s);
      }
    }
  }
  return out;
}

interface SourcesUsedProps {
  /** Deduped list of KB document names retrieved for this stage. */
  sources?: string[];
  className?: string;
}

/**
 * Stage-level citation: shows which knowledge-base documents the AI drew on
 * for this stage's output. This is not a per-field citation — it's a single
 * "sources used" list for the whole card. Renders nothing if there are no
 * sources (e.g. stages that don't query the KB, or none were retrieved).
 *
 * Styled to match the plain-text "Sources used" line on the AI
 * Classification page (no border/box/icon) so the citation looks the same
 * everywhere it appears.
 */
export const SourcesUsed: React.FC<SourcesUsedProps> = ({
  sources,
  className = "",
}) => {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <p className={`text-xs text-muted-foreground ${className}`}>
      <span className="font-medium text-foreground">Sources used: </span>
      {sources.join(", ")}
    </p>
  );
};