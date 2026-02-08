/**
 * Content Security Policy (CSP) configuration.
 *
 * Generates a strict CSP header string tailored for a SvelteKit app
 * deployed on Vercel that uses Firebase services and Google Fonts.
 */

interface CSPDirectives {
  [directive: string]: string[];
}

const directives: CSPDirectives = {
  "default-src": ["'self'"],

  "script-src": [
    "'self'",
    "'unsafe-inline'", // Required for Svelte hydration and component execution
    "'unsafe-eval'", // Required for some browser extensions and runtime evaluation
    "https://*.firebaseapp.com",
    "https://*.googleapis.com",
  ],

  "style-src": [
    "'self'",
    "'unsafe-inline'", // Required for Svelte scoped styles and horror effects
    "https://fonts.googleapis.com",
  ],

  "font-src": ["'self'", "https://fonts.gstatic.com"],

  "img-src": [
    "'self'",
    "data:",
    "blob:",
    "https://*.googleapis.com",
    "https://*.firebaseapp.com",
  ],

  "media-src": ["'self'", "blob:", "data:"],

  "connect-src": [
    "'self'",
    "https://*.firebaseapp.com",
    "https://*.googleapis.com",
    "https://*.firebaseio.com",
    "wss://*.firebaseio.com",
  ],

  "object-src": ["'none'"],

  "base-uri": ["'self'"],

  "frame-ancestors": ["'none'"],

  "form-action": ["'self'"],

  "upgrade-insecure-requests": [],
};

/**
 * Generates a fully-formatted Content-Security-Policy header value.
 *
 * @returns The CSP header string ready to be set on a response.
 */
export function generateCSPHeader(): string {
  return Object.entries(directives)
    .map(([directive, values]) => {
      if (values.length === 0) {
        return directive;
      }
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");
}
