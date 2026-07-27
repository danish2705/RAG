const STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "was",
  "were",
  "with",
  "from",
  "that",
  "this",
  "have",
  "has",
  "had",
  "are",
  "not",
  "but",
  "been",
  "being",
  "into",
  "onto",
  "during",
  "after",
  "before",
  "while",
  "which",
  "when",
  "where",
  "there",
  "here",
  "then",
  "than",
  "them",
  "they",
  "their",
  "its",
  "our",
  "your",
  "you",
  "all",
  "any",
  "some",
  "each",
  "over",
  "under",
  "again",
  "also",
  "due",
  "out",
  "off",
  "per",
  "via",
  "found",
  "noted",
  "observed",
]);

export function tokenize(text: string): string[] {
  if (typeof text !== "string" || !text.trim()) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOPWORDS.has(token));
}

// Jaccard similarity over token sets: |intersection| / |union|. Simple,
// symmetric, and robust enough for short free-text descriptions.
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  let intersection = 0;
  for (const token of setA) {
    if (setB.has(token)) intersection++;
  }

  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export function textSimilarity(a: string, b: string): number {
  return jaccardSimilarity(tokenize(a), tokenize(b));
}

export interface SimilarityDetail {
  score: number;
  matchedWords: string[];
  matchedCount: number;
}

// Same comparison as textSimilarity(), but also returns which words
// actually overlapped and how many — used so the "similar query" prompt
// can show the person exactly why two descriptions were flagged as similar
// (e.g. "3 matching words: batch, contaminated, particulate") instead of
// just a bare percentage.
export function textSimilarityDetail(a: string, b: string): SimilarityDetail {
  const tokensA = tokenize(a);
  const tokensB = tokenize(b);

  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  const matchedWords: string[] = [];
  for (const token of setA) {
    if (setB.has(token)) matchedWords.push(token);
  }

  return {
    score: jaccardSimilarity(tokensA, tokensB),
    matchedWords,
    matchedCount: matchedWords.length,
  };
}
