/**
 * Client-side rate limiting using a token bucket algorithm.
 *
 * Tokens are consumed on each request attempt. The bucket refills at a
 * fixed rate. When the bucket is empty further attempts are rejected
 * until tokens have been replenished.
 */

export interface RateLimiter {
  /** Attempt to consume one token. Returns `true` if the request is allowed. */
  tryConsume(): boolean;
  /** Returns the number of tokens currently available. */
  getRemainingTokens(): number;
}

/**
 * Creates a token-bucket rate limiter.
 *
 * @param maxTokens   - Maximum (and initial) number of tokens in the bucket.
 * @param refillRate  - Number of tokens added per second.
 * @returns A {@link RateLimiter} instance.
 */
export function createRateLimiter(
  maxTokens: number,
  refillRate: number,
): RateLimiter {
  let tokens = maxTokens;
  let lastRefill = Date.now();

  function refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - lastRefill) / 1000;
    tokens = Math.min(maxTokens, tokens + elapsedSeconds * refillRate);
    lastRefill = now;
  }

  return {
    tryConsume(): boolean {
      refill();
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },

    getRemainingTokens(): number {
      refill();
      return Math.floor(tokens);
    },
  };
}

/**
 * Pre-configured rate limiter for puzzle answer submissions.
 *
 * Allows a burst of 10 requests and refills at roughly 10 tokens per
 * minute (~0.167 tokens/second).
 */
export function createPuzzleSubmitLimiter(): RateLimiter {
  return createRateLimiter(10, 10 / 60);
}
