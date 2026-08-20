/**
 * Single source of truth for the app's public identity.
 *
 * `VITE_APP_URL` is the canonical production origin (set it per environment —
 * e.g. your custom domain in production, the deployment URL in preview, and
 * nothing at all locally, where we fall back to the current origin).
 */
const CONFIGURED_URL = (import.meta.env['VITE_APP_URL'] as string | undefined)?.trim();

export const SITE_NAME = "Heirloom";
export const SITE_TAGLINE = "Discover, build and preserve your family history.";

function stripTrailingSlash(url: string) {
  return url.replace(/\/+$/, "");
}

/** Canonical origin. Empty string only when unconfigured during SSR. */
export const siteOrigin: string = CONFIGURED_URL
  ? stripTrailingSlash(CONFIGURED_URL)
  : typeof window !== "undefined"
    ? stripTrailingSlash(window.location.origin)
    : "";

/** Absolute URL for a same-origin path, used for canonical/OG/share links. */
export function absoluteUrl(path = "/"): string {
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return siteOrigin ? `${siteOrigin}${suffix}` : suffix;
}

/**
 * Origin to hand to auth redirects (email verification, OAuth, password reset).
 * Prefers the configured canonical origin, but never leaves the current origin
 * in the browser, so previews and local dev keep working.
 */
export function authRedirectOrigin(): string {
  if (typeof window !== "undefined") {
    // Only use the configured origin when we are actually served from it,
    // otherwise the provider would bounce the user to a different deployment.
    if (siteOrigin && siteOrigin === stripTrailingSlash(window.location.origin)) return siteOrigin;
    return stripTrailingSlash(window.location.origin);
  }
  return siteOrigin;
}

export const OG_IMAGE = absoluteUrl("/og-image.jpg");

type SeoInput = {
  title: string;
  description: string;
  /** Same-origin path this page is canonical for. Omit for private pages. */
  path?: string;
  /** Set false for private/app pages that should stay out of search results. */
  indexable?: boolean;
};

/** Shared head() payload: title, description, OG/Twitter cards, canonical. */
export function seo({ title, description, path, indexable = true }: SeoInput) {
  const url = path ? absoluteUrl(path) : undefined;
  const meta = [
    { title },
    { name: "description", content: description },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:type", content: "website" as const },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    ...(siteOrigin
      ? [
          { property: "og:image", content: OG_IMAGE },
          { name: "twitter:image", content: OG_IMAGE },
        ]
      : []),
    ...(url && siteOrigin ? [{ property: "og:url", content: url }] : []),
    ...(indexable ? [] : [{ name: "robots", content: "noindex, nofollow" }]),
  ];
  const links = url && siteOrigin ? [{ rel: "canonical", href: url }] : [];
  return { meta, links };
}
