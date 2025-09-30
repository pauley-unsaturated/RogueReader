/**
 * Fuzzy matching utilities for word comparison
 *
 * Handles near-matches, common misspellings, and pronunciation variations
 */

/**
 * Calculate Levenshtein distance between two strings
 * (minimum number of single-character edits needed to change one word into another)
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  // Create 2D array for dynamic programming
  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  // Initialize first row and column
  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  // Fill in the rest of the matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;

      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio between two strings (0-1 scale)
 * 1.0 = exact match, 0.0 = completely different
 */
export function similarityRatio(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1.0 - distance / maxLen;
}

/**
 * Check if two words are a fuzzy match
 * @param target The correct word
 * @param spoken What the user said
 * @param threshold Minimum similarity required (default: 0.75 = 75% similar)
 * @returns true if words match closely enough
 */
export function fuzzyMatch(target: string, spoken: string, threshold: number = 0.75): boolean {
  // Normalize inputs
  const normalizedTarget = target.toLowerCase().trim();
  const normalizedSpoken = spoken.toLowerCase().trim();

  // Exact match
  if (normalizedTarget === normalizedSpoken) {
    return true;
  }

  // Calculate similarity
  const similarity = similarityRatio(normalizedTarget, normalizedSpoken);

  console.log(`   Fuzzy match: "${target}" vs "${spoken}" = ${(similarity * 100).toFixed(1)}%`);

  return similarity >= threshold;
}

/**
 * Advanced fuzzy match with phonetic consideration
 * Handles common pronunciation confusions (b/p, d/t, etc.)
 */
export function phoneticFuzzyMatch(target: string, spoken: string, threshold: number = 0.75): boolean {
  // First try normal fuzzy match
  if (fuzzyMatch(target, spoken, threshold)) {
    return true;
  }

  // Apply phonetic normalization
  const phoneticTarget = normalizePhonetic(target);
  const phoneticSpoken = normalizePhonetic(spoken);

  // Try again with phonetic normalization
  const similarity = similarityRatio(phoneticTarget, phoneticSpoken);

  console.log(`   Phonetic fuzzy match: "${target}" vs "${spoken}" = ${(similarity * 100).toFixed(1)}%`);

  return similarity >= threshold;
}

/**
 * Normalize phonetic variations (group similar-sounding letters)
 */
function normalizePhonetic(word: string): string {
  let normalized = word.toLowerCase();

  // Group similar-sounding consonants
  normalized = normalized.replace(/[bp]/g, '1'); // b/p confusion
  normalized = normalized.replace(/[dt]/g, '2'); // d/t confusion
  normalized = normalized.replace(/[kg]/g, '3'); // k/g confusion
  normalized = normalized.replace(/[fv]/g, '4'); // f/v confusion
  normalized = normalized.replace(/[sz]/g, '5'); // s/z confusion

  // Group similar vowels
  normalized = normalized.replace(/[aeAE]/g, 'a'); // a/e confusion
  normalized = normalized.replace(/[ioIO]/g, 'i'); // i/o confusion

  return normalized;
}

/**
 * Get match quality description
 */
export function getMatchQuality(target: string, spoken: string): {
  similarity: number;
  isMatch: boolean;
  quality: 'exact' | 'excellent' | 'good' | 'fair' | 'poor';
} {
  const normalizedTarget = target.toLowerCase().trim();
  const normalizedSpoken = spoken.toLowerCase().trim();

  const isExact = normalizedTarget === normalizedSpoken;
  const similarity = isExact ? 1.0 : similarityRatio(normalizedTarget, normalizedSpoken);

  let quality: 'exact' | 'excellent' | 'good' | 'fair' | 'poor';
  if (isExact) quality = 'exact';
  else if (similarity >= 0.9) quality = 'excellent';
  else if (similarity >= 0.75) quality = 'good';
  else if (similarity >= 0.5) quality = 'fair';
  else quality = 'poor';

  return {
    similarity,
    isMatch: similarity >= 0.75,
    quality
  };
}

/**
 * Find the closest match from a list of candidates
 */
export function findClosestMatch(target: string, candidates: string[]): {
  word: string;
  similarity: number;
} | null {
  if (candidates.length === 0) return null;

  let bestMatch = candidates[0];
  let bestSimilarity = similarityRatio(target, candidates[0]);

  for (let i = 1; i < candidates.length; i++) {
    const similarity = similarityRatio(target, candidates[i]);
    if (similarity > bestSimilarity) {
      bestMatch = candidates[i];
      bestSimilarity = similarity;
    }
  }

  return {
    word: bestMatch,
    similarity: bestSimilarity
  };
}