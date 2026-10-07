import { useState, useCallback } from "react";

const API_BASE = "https://services.leadconnectorhq.com";

export interface AvailableTag {
  id: string;
  name: string;
}

interface UseAvailableTagsState {
  tags: AvailableTag[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
}

export function useAvailableTags() {
  const [state, setState] = useState<UseAvailableTagsState>({
    tags: [],
    isLoading: false,
    error: null,
    lastFetchedAt: null,
  });

  const fetchTags = useCallback(async (token: string, locationId: string) => {
    const cleanToken = (token || "").trim();
    const cleanLoc = (locationId || "").trim();
    if (!cleanToken || !cleanLoc) {
      setState({
        tags: [],
        isLoading: false,
        error: "Enter both a Bearer token and Location ID to sync tags.",
        lastFetchedAt: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const distinctTags = new Map<string, string>(); // lower -> original casing

      // Method 1: Try location-level tags endpoint first
      let locationEndpointWorked = false;
      try {
        const locResponse = await fetch(
          `${API_BASE}/locations/${cleanLoc}/tags`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Version: "2021-07-28",
              Authorization: `Bearer ${cleanToken}`,
            },
          },
        );

        if (locResponse.ok) {
          const resData = await locResponse.json();
          const raw: any[] =
            resData.tags || resData.data || resData.items || [];
          for (const item of raw) {
            const tagName = String(item.name ?? item.tag ?? item ?? "").trim();
            if (tagName && !distinctTags.has(tagName.toLowerCase())) {
              distinctTags.set(tagName.toLowerCase(), tagName);
            }
          }
          if (distinctTags.size > 0) {
            locationEndpointWorked = true;
          }
        }
      } catch {
        // Location endpoint may be blocked or restricted by scope; fallback to contact tags
      }

      // Method 2: If location endpoint was not authorized or empty,
      // harvest all unique tags from contacts via POST /contacts/search
      if (!locationEndpointWorked) {
        let cursor: any[] | undefined = undefined;
        const maxPages = 5; // inspect up to 500 contacts to discover active tags

        for (let page = 0; page < maxPages; page++) {
          const body: any = {
            pageLimit: 100,
            locationId: cleanLoc,
          };
          if (cursor) body.searchAfter = cursor;

          const searchResp = await fetch(`${API_BASE}/contacts/search`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
              Version: "2021-07-28",
              Authorization: `Bearer ${cleanToken}`,
            },
            body: JSON.stringify(body),
          });

          if (!searchResp.ok) {
            // If search returned an error on first page, try GET /contacts fallback
            if (page === 0) {
              const getResp = await fetch(
                `${API_BASE}/contacts/?locationId=${encodeURIComponent(cleanLoc)}&limit=100`,
                {
                  method: "GET",
                  headers: {
                    Accept: "application/json",
                    Version: "2021-07-28",
                    Authorization: `Bearer ${cleanToken}`,
                  },
                },
              );
              if (getResp.ok) {
                const getData = await getResp.json();
                const contacts: any[] =
                  getData.contacts || getData.data || getData.items || [];
                for (const c of contacts) {
                  const cTags: string[] = Array.isArray(c.tags) ? c.tags : [];
                  for (const t of cTags) {
                    const clean = String(t || "").trim();
                    if (clean && !distinctTags.has(clean.toLowerCase())) {
                      distinctTags.set(clean.toLowerCase(), clean);
                    }
                  }
                }
              } else {
                throw new Error(
                  `Could not sync tags (HTTP ${searchResp.status}). Check that your Bearer token and Location ID are valid.`,
                );
              }
            }
            break;
          }

          const searchData = await searchResp.json();
          const contacts: any[] =
            searchData.contacts || searchData.data || searchData.items || [];
          if (contacts.length === 0) break;

          for (const c of contacts) {
            const cTags: string[] = Array.isArray(c.tags) ? c.tags : [];
            for (const t of cTags) {
              const clean = String(t || "").trim();
              if (clean && !distinctTags.has(clean.toLowerCase())) {
                distinctTags.set(clean.toLowerCase(), clean);
              }
            }
          }

          const lastContact = contacts[contacts.length - 1];
          cursor =
            lastContact && Array.isArray(lastContact.searchAfter)
              ? lastContact.searchAfter
              : undefined;

          if (contacts.length < 100 || !cursor) break;
        }
      }

      const tags: AvailableTag[] = Array.from(distinctTags.values())
        .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
        .map((name, index) => ({
          id: `tag-${index}-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          name,
        }));

      if (tags.length === 0) {
        setState({
          tags: [],
          isLoading: false,
          error:
            "No tags found on contacts in this subaccount. You can type tags manually below.",
          lastFetchedAt: new Date(),
        });
        return;
      }

      setState({
        tags,
        isLoading: false,
        error: null,
        lastFetchedAt: new Date(),
      });
    } catch (err: any) {
      console.error("Failed to sync tags:", err);
      setState({
        tags: [],
        isLoading: false,
        error:
          err.message ||
          "Could not sync tags. Verify your token and Location ID, then try again.",
        lastFetchedAt: null,
      });
    }
  }, []);

  const clearTags = useCallback(() => {
    setState({
      tags: [],
      isLoading: false,
      error: null,
      lastFetchedAt: null,
    });
  }, []);

  return { ...state, fetchTags, clearTags };
}
