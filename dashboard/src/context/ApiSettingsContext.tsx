import React, { createContext, useContext, useState } from "react";

interface ApiSettingsContextType {
  token: string;
  setToken: (token: string) => void;
  locationId: string;
  setLocationId: (id: string) => void;
  tagFilter: string;
  setTagFilter: (tag: string) => void;
  additionalTags: string[];
  setAdditionalTags: (tags: string[]) => void;
  customFieldKeys: string[];
  setCustomFieldKeys: (keys: string[]) => void;
  npnFieldId: string;
  setNpnFieldId: (id: string) => void;
  isConfigured: boolean;
  clearConfig: () => void;
}

const STORAGE_KEY_TOKEN = "dbg_api_token";
const STORAGE_KEY_LOC = "dbg_location_id";
const STORAGE_KEY_TAG = "dbg_tag_filter";
const STORAGE_KEY_TAGS = "dbg_additional_tags";
const STORAGE_KEY_FIELDS = "dbg_custom_field_keys";
const STORAGE_KEY_NPN = "dbg_npn_field_id";

// Sensitive credentials (API token + location ID) are intentionally NOT
// hardcoded here — any value in client source ships in the public JS bundle.
// They must be entered by the user via the Connectivity modal and are then
// persisted only in their browser's localStorage. No defaults are provided.
const DEFAULT_TOKEN = "";
const DEFAULT_LOCATION_ID = "";
const DEFAULT_TAG = "";
// The NPN field ID is NOT hardcoded here — it is selected from the synced
// custom fields in the Connectivity modal (or typed manually). Leave blank
// to disable NPN extraction.
const DEFAULT_NPN_FIELD_ID = "";

const parseStringArray = (raw: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((s) => typeof s === "string")
      : [];
  } catch {
    return [];
  }
};

const ApiSettingsContext = createContext<ApiSettingsContextType | undefined>(
  undefined,
);

export const ApiSettingsProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [token, setTokenState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TOKEN) || DEFAULT_TOKEN;
  });

  const [locationId, setLocationIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_LOC) || DEFAULT_LOCATION_ID;
  });

  const [tagFilter, setTagFilterState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_TAG) || DEFAULT_TAG;
  });

  const [additionalTags, setAdditionalTagsState] = useState<string[]>(() => {
    return parseStringArray(localStorage.getItem(STORAGE_KEY_TAGS)) ?? [];
  });

  const [customFieldKeys, setCustomFieldKeysState] = useState<string[]>(() => {
    return parseStringArray(localStorage.getItem(STORAGE_KEY_FIELDS)) ?? [];
  });

  const [npnFieldId, setNpnFieldIdState] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_NPN) || DEFAULT_NPN_FIELD_ID;
  });

  const setToken = (newToken: string) => {
    setTokenState(newToken);
    localStorage.setItem(STORAGE_KEY_TOKEN, newToken);
  };

  const setLocationId = (newLoc: string) => {
    setLocationIdState(newLoc);
    localStorage.setItem(STORAGE_KEY_LOC, newLoc);
  };

  const setTagFilter = (newTag: string) => {
    setTagFilterState(newTag);
    localStorage.setItem(STORAGE_KEY_TAG, newTag);
  };

  const setAdditionalTags = (tags: string[]) => {
    const cleaned = tags.map((t) => t.trim()).filter(Boolean);
    setAdditionalTagsState(cleaned);
    localStorage.setItem(STORAGE_KEY_TAGS, JSON.stringify(cleaned));
  };

  const setCustomFieldKeys = (keys: string[]) => {
    const cleaned = keys.map((k) => k.trim()).filter(Boolean);
    setCustomFieldKeysState(cleaned);
    localStorage.setItem(STORAGE_KEY_FIELDS, JSON.stringify(cleaned));
  };

  const setNpnFieldId = (id: string) => {
    const cleaned = id.trim();
    setNpnFieldIdState(cleaned);
    localStorage.setItem(STORAGE_KEY_NPN, cleaned);
  };

  const clearConfig = () => {
    setTokenState("");
    setLocationIdState("");
    setAdditionalTagsState([]);
    setCustomFieldKeysState([]);
    setNpnFieldIdState(DEFAULT_NPN_FIELD_ID);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_LOC);
    localStorage.removeItem(STORAGE_KEY_TAGS);
    localStorage.removeItem(STORAGE_KEY_FIELDS);
    localStorage.removeItem(STORAGE_KEY_NPN);
  };

  const isConfigured = Boolean(token && token.trim().length > 0);

  return (
    <ApiSettingsContext.Provider
      value={{
        token,
        setToken,
        locationId,
        setLocationId,
        tagFilter,
        setTagFilter,
        additionalTags,
        setAdditionalTags,
        customFieldKeys,
        setCustomFieldKeys,
        npnFieldId,
        setNpnFieldId,
        isConfigured,
        clearConfig,
      }}
    >
      {children}
    </ApiSettingsContext.Provider>
  );
};

export const useApiSettings = () => {
  const context = useContext(ApiSettingsContext);
  if (!context) {
    throw new Error(
      "useApiSettings must be used within an ApiSettingsProvider",
    );
  }
  return context;
};
