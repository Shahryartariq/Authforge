"use client";

import { useMemo, useSyncExternalStore } from "react";

function subscribe(onChange: () => void) {
  window.addEventListener("popstate", onChange);
  return () => window.removeEventListener("popstate", onChange);
}

/**
 * The page's query string, without making the page client-only.
 *
 * `useSearchParams()` skips a component during prerendering, so a form that
 * uses it isn't in the HTML until JavaScript runs. This hook returns empty
 * params in the prerendered HTML and the real ones once the page hydrates.
 * Use it for values that only refine a page (a redirect target, an error
 * notice), not for content that must be right in the HTML.
 */
export function useQueryParams() {
  const search = useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
  return useMemo(() => new URLSearchParams(search), [search]);
}
