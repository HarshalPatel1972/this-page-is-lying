import type { Handle } from "@sveltejs/kit";
import { generateCSPHeader } from "$lib/security/csp";

export const handle: Handle = async ({ event, resolve }) => {
  const response = await resolve(event);

  // ---------- Security headers ----------

  // Prevent the page from being embedded in frames (click-jacking protection).
  response.headers.set("X-Frame-Options", "DENY");

  // Stop browsers from MIME-sniffing the content type.
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control how much referrer information is sent with requests.
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict access to powerful browser features.
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // Content Security Policy.
  response.headers.set("Content-Security-Policy", generateCSPHeader());

  // ---------- CORS ----------
  // For same-origin SvelteKit apps CORS headers are not strictly required.
  // If a public API surface is added later, configure allowed origins here.

  return response;
};
