import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";
import { config } from "../config";

export interface AppSettings {
  id: string;
  client_name: string | null;
  client_tagline: string | null;
  brand: string | null;
  default_theme: string | null;
  login_headline: string | null;
  login_subtext: string | null;
  login_bg_url: string | null;
  logo_url: string | null;
  favicon_url: string | null;
  training_ai_url: string | null;
}

export interface ResolvedBranding {
  clientName: string;
  clientShort: string;
  clientTagline: string;
  brand: string;
  defaultTheme: "light" | "dark";
  loginHeadline: string;
  loginSubtext: string;
  loginBgUrl: string;
  logoUrl: string;
  faviconUrl: string;
  trainingAiUrl: string;
}

export const BRAND_PRESETS = ["blue", "emerald", "violet", "amber", "rose", "slate"] as const;

interface SettingsCtx {
  settings: AppSettings | null;
  resolved: ResolvedBranding;
  loading: boolean;
  refetch: () => Promise<void>;
  save: (patch: Partial<AppSettings>) => Promise<void>;
  uploadImage: (file: File, kind: string) => Promise<string>;
}

const SettingsContext = createContext<SettingsCtx | null>(null);
export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
};

function resolve(s: AppSettings | null): ResolvedBranding {
  return {
    clientName: s?.client_name || config.clientName,
    clientShort: config.clientShort,
    clientTagline: s?.client_tagline || "Training Analyst",
    brand: s?.brand || "blue",
    defaultTheme: s?.default_theme === "dark" ? "dark" : "light",
    loginHeadline: s?.login_headline || s?.client_name || config.clientName,
    loginSubtext: s?.login_subtext || "Training Analyst Dashboard",
    loginBgUrl: s?.login_bg_url || "",
    logoUrl: s?.logo_url || "",
    faviconUrl: s?.favicon_url || "",
    trainingAiUrl: s?.training_ai_url || config.trainingAiUrl,
  };
}

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const resolved = resolve(settings);

  const refetch = useCallback(async () => {
    const { data } = await supabase.from("app_settings").select("*").eq("id", "default").maybeSingle();
    setSettings((data as AppSettings) ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Apply brand palette.
  useEffect(() => {
    document.documentElement.setAttribute("data-brand", resolved.brand);
  }, [resolved.brand]);

  // Apply favicon.
  useEffect(() => {
    if (!resolved.faviconUrl) return;
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.href = resolved.faviconUrl;
  }, [resolved.faviconUrl]);

  const save = async (patch: Partial<AppSettings>) => {
    const { error } = await supabase
      .from("app_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", "default");
    if (error) throw new Error(error.message);
    await refetch();
  };

  const uploadImage = async (file: File, kind: string): Promise<string> => {
    const ext = file.name.split(".").pop() || "png";
    const path = `${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("branding").upload(path, file, { upsert: true });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from("branding").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <SettingsContext.Provider value={{ settings, resolved, loading, refetch, save, uploadImage }}>
      {children}
    </SettingsContext.Provider>
  );
};
