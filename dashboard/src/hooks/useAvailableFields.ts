import { useState, useCallback } from "react";

const API_BASE = "https://services.leadconnectorhq.com";

export interface AvailableField {
  id: string;
  name: string;
  fieldKey: string;
  dataType?: string;
}

interface UseAvailableFieldsState {
  fields: AvailableField[];
  isLoading: boolean;
  error: string | null;
  lastFetchedAt: Date | null;
}

export function useAvailableFields() {
  const [state, setState] = useState<UseAvailableFieldsState>({
    fields: [],
    isLoading: false,
    error: null,
    lastFetchedAt: null,
  });

  const fetchFields = useCallback(async (token: string, locationId: string) => {
    const cleanToken = (token || "").trim();
    const cleanLoc = (locationId || "").trim();
    if (!cleanToken || !cleanLoc) {
      setState({
        fields: [],
        isLoading: false,
        error:
          "Enter both a Bearer token and Location ID to sync custom fields.",
        lastFetchedAt: null,
      });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const collected: AvailableField[] = [];

      // Try fetching custom fields from location endpoint first
      let url = `${API_BASE}/locations/${cleanLoc}/customFields`;
      let resp = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Version: "2021-07-28",
          Authorization: `Bearer ${cleanToken}`,
        },
      });

      // Fallback: If query params cause 422 or location endpoint fails, try GET /custom-fields or harvesting from contacts
      if (!resp.ok) {
        resp = await fetch(
          `${API_BASE}/custom-fields/?locationId=${cleanLoc}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Version: "2021-07-28",
              Authorization: `Bearer ${cleanToken}`,
            },
          },
        );
      }

      if (resp.ok) {
        const data = await resp.json();
        const raw: any[] =
          data.customFields || data.fields || data.data || data.items || [];

        for (const f of raw) {
          const id = String(f.id ?? f._id ?? "").trim();
          const name = String(f.name ?? f.label ?? "").trim();
          const fieldKey = String(
            f.fieldKey ??
              f.key ??
              name.toLowerCase().replace(/\s+/g, "_") ??
              "",
          ).trim();
          if (id || fieldKey) {
            collected.push({
              id: id || fieldKey,
              name: name || fieldKey,
              fieldKey: fieldKey || id,
              dataType: f.dataType ?? f.type,
            });
          }
        }
      }

      // Method 2 fallback: Harvest custom field keys directly from contact records if endpoint fails or returned no fields
      if (collected.length === 0) {
        const searchResp = await fetch(`${API_BASE}/contacts/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Version: "2021-07-28",
            Authorization: `Bearer ${cleanToken}`,
          },
          body: JSON.stringify({
            pageLimit: 50,
            locationId: cleanLoc,
          }),
        });

        if (searchResp.ok) {
          const searchData = await searchResp.json();
          const contacts: any[] = searchData.contacts || searchData.data || [];
          const foundKeys = new Set<string>();

          for (const c of contacts) {
            if (Array.isArray(c.customFields)) {
              for (const cf of c.customFields) {
                const k = String(cf.fieldKey || cf.key || cf.id || "").trim();
                if (k) foundKeys.add(k);
              }
            } else if (c.customFields && typeof c.customFields === "object") {
              for (const k of Object.keys(c.customFields)) {
                if (k) foundKeys.add(k);
              }
            }
          }

          for (const key of foundKeys) {
            collected.push({
              id: key,
              name: key
                .replace(/^(?:contact|custom_field)\./i, "")
                .replace(/_/g, " "),
              fieldKey: key,
            });
          }
        }
      }

      const fields = collected.sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      );

      if (fields.length === 0) {
        setState({
          fields: [],
          isLoading: false,
          error:
            "No custom fields found in this subaccount. You can type field keys manually below.",
          lastFetchedAt: new Date(),
        });
        return;
      }

      setState({
        fields,
        isLoading: false,
        error: null,
        lastFetchedAt: new Date(),
      });
    } catch (err: any) {
      console.error("Failed to sync custom fields:", err);
      setState({
        fields: [],
        isLoading: false,
        error:
          err.message ||
          "Could not sync custom fields. Verify your token and Location ID, then try again.",
        lastFetchedAt: null,
      });
    }
  }, []);

  const clearFields = useCallback(() => {
    setState({
      fields: [],
      isLoading: false,
      error: null,
      lastFetchedAt: null,
    });
  }, []);

  return { ...state, fetchFields, clearFields };
}
