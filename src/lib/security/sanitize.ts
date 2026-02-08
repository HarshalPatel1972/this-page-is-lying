/**
 * Input sanitization utilities.
 *
 * All user-supplied data should pass through the appropriate sanitizer
 * before being rendered or persisted.
 */

/**
 * Strip every HTML tag from the supplied string.
 *
 * This is a defence-in-depth measure -- Svelte already escapes
 * interpolated values, but any string destined for `{@html ...}` or
 * external APIs should still be sanitized.
 *
 * @param input - Raw user input.
 * @returns The input with all HTML tags removed.
 */
export function sanitizeHTML(input: string): string {
  return input.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize a display name so it contains only alphanumeric characters
 * and spaces, truncated to a maximum of 20 characters.
 *
 * @param name - Raw display name.
 * @returns A safe, truncated display name.
 */
export function sanitizeDisplayName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .trim()
    .slice(0, 20);
}

/**
 * Validate that a puzzle answer is a non-empty string within the
 * allowed length.
 *
 * @param answer - The value to validate (unknown at the boundary).
 * @returns `true` when the answer passes all checks.
 */
export function validatePuzzleAnswer(answer: unknown): boolean {
  if (typeof answer !== "string") {
    return false;
  }
  if (answer.length === 0 || answer.length > 1000) {
    return false;
  }
  return true;
}
