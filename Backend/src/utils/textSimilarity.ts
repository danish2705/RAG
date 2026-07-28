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

// Damerau-Levenshtein edit distance (insert/delete/substitute/adjacent-
// transpose all cost 1). Using the transposition variant matters here
// because the most common typo pattern — swapping two adjacent letters,
// e.g. "workign" for "working" — costs 2 under plain Levenshtein but only
// 1 under Damerau-Levenshtein. That difference is exactly what keeps a
// single typo from tipping a short query out of the fuzzy-match threshold
// below.
function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const d: number[][] = Array.from({ length: al + 1 }, () =>
    new Array(bl + 1).fill(0),
  );
  for (let i = 0; i <= al; i++) d[i][0] = i;
  for (let j = 0; j <= bl; j++) d[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost, // substitution
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost); // transposition
      }
    }
  }
  return d[al][bl];
}

// How many edits apart two tokens are allowed to be and still count as
// "the same word" — scaled by length so a fuzzy match can't paper over
// genuinely different short words (e.g. "batch" vs "match").
function fuzzyThreshold(len: number): number {
  if (len <= 4) return 0; // short words: require exact match
  if (len <= 6) return 1; // one typo tolerated
  return 2; // longer words: up to two edits
}

function isFuzzyMatch(tokenA: string, tokenB: string): boolean {
  if (tokenA === tokenB) return true;
  const lenDiff = Math.abs(tokenA.length - tokenB.length);
  const threshold = fuzzyThreshold(Math.max(tokenA.length, tokenB.length));
  if (threshold === 0 || lenDiff > threshold) return false; // cheap prune
  return damerauLevenshtein(tokenA, tokenB) <= threshold;
}

// Greedy one-to-one fuzzy matching between two token sets. Exact matches
// are claimed first (deterministic, order-independent), then each
// remaining token in A is paired with its closest remaining unmatched
// token in B, if any is within the fuzzy threshold. Returns the matched
// pairs so callers can show which words lined up (including typo pairs
// like "workign" ~ "working"), not just a count.
function fuzzyMatchTokens(
  a: string[],
  b: string[],
): { matchedA: string[]; matchedB: string[] } {
  const remainingB = [...b];
  const matchedA: string[] = [];
  const matchedB: string[] = [];

  // Pass 1: exact matches
  const remainingA: string[] = [];
  for (const tokenA of a) {
    const idx = remainingB.indexOf(tokenA);
    if (idx !== -1) {
      matchedA.push(tokenA);
      matchedB.push(remainingB[idx]);
      remainingB.splice(idx, 1);
    } else {
      remainingA.push(tokenA);
    }
  }

  // Pass 2: fuzzy matches for whatever's left, closest edit distance first
  for (const tokenA of remainingA) {
    let bestIdx = -1;
    let bestDist = Infinity;
    for (let i = 0; i < remainingB.length; i++) {
      if (!isFuzzyMatch(tokenA, remainingB[i])) continue;
      const dist = damerauLevenshtein(tokenA, remainingB[i]);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = i;
      }
    }
    if (bestIdx !== -1) {
      matchedA.push(tokenA);
      matchedB.push(remainingB[bestIdx]);
      remainingB.splice(bestIdx, 1);
    }
  }

  return { matchedA, matchedB };
}

// Jaccard similarity over token sets: |intersection| / |union|, with
// typo-tolerant ("fuzzy") token matching — see fuzzyMatchTokens above.
// Two descriptions that differ only by a misspelling of one word (e.g.
// "workign" vs "working") now count that word as shared instead of as
// two unrelated tokens inflating the union.
export function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a);
  const setB = new Set(b);

  const { matchedA } = fuzzyMatchTokens([...setA], [...setB]);
  const intersection = matchedA.length;

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

  const { matchedA, matchedB } = fuzzyMatchTokens([...setA], [...setB]);

  // Exact matches display as-is ("motor"); fuzzy/typo matches display as
  // "workign~working" so the UI can show *why* it was flagged even when
  // the words aren't spelled identically.
  const matchedWords = matchedA.map((tokenA, i) =>
    tokenA === matchedB[i] ? tokenA : `${tokenA}~${matchedB[i]}`,
  );

  return {
    score: jaccardSimilarity(tokensA, tokensB),
    matchedWords,
    matchedCount: matchedWords.length,
  };
}
