import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

/**
 * Reactively determines whether the app is currently being rendered in
 * view-only embed mode (i.e. the active URL contains `?embed=true`).
 *
 * Using `useLocation` (instead of reading `window.location` once on mount)
 * means embed mode is re-evaluated after every client-side navigation, so
 * returning to the dashboard from another route keeps the Connectivity /
 * sync controls hidden as long as the `embed=true` query param is present.
 */
export function useIsEmbedded(): boolean {
  const location = useLocation();
  return new URLSearchParams(location.search).get("embed") === "true";
}

/**
 * Wraps `useNavigate` so that internal navigations automatically preserve
 * the `embed=true` query param when the app is currently embedded. This
 * prevents view-only viewers from landing on a full-permission URL after
 * moving between routes (e.g. dashboard -> AI agent -> back to dashboard).
 */
export function useEmbedNavigate() {
  const navigate = useNavigate();
  const isEmbedded = useIsEmbedded();

  return useCallback(
    (path: string) => {
      const alreadyHasEmbed = path.includes("embed=true");
      const target =
        isEmbedded && !alreadyHasEmbed
          ? `${path}${path.includes("?") ? "&" : "?"}embed=true`
          : path;
      navigate(target);
    },
    [navigate, isEmbedded],
  );
}
