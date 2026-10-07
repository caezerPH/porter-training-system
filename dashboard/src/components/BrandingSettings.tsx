import React, { useState } from "react";
import { useSettings, BRAND_PRESETS } from "../context/SettingsContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, CheckCircle2, Upload, Sun, Moon, Palette } from "lucide-react";

const SWATCH: Record<string, string> = {
  blue: "#2563eb",
  emerald: "#059669",
  violet: "#7c3aed",
  amber: "#d97706",
  rose: "#e11d48",
  slate: "#475569",
};

// Live-preview the palette as the admin clicks (persists on Save).
const previewBrand = (b: string) => document.documentElement.setAttribute("data-brand", b);

export const BrandingSettings: React.FC = () => {
  const { resolved, settings, save, uploadImage } = useSettings();

  const [name, setName] = useState(settings?.client_name ?? "");
  const [tagline, setTagline] = useState(settings?.client_tagline ?? "");
  const [brand, setBrand] = useState(resolved.brand);
  const [defaultTheme, setDefaultTheme] = useState<"light" | "dark">(resolved.defaultTheme);
  const [headline, setHeadline] = useState(settings?.login_headline ?? "");
  const [subtext, setSubtext] = useState(settings?.login_subtext ?? "");
  const [loginBg, setLoginBg] = useState(settings?.login_bg_url ?? "");
  const [logo, setLogo] = useState(settings?.logo_url ?? "");
  const [favicon, setFavicon] = useState(settings?.favicon_url ?? "");
  const [trainingUrl, setTrainingUrl] = useState(settings?.training_ai_url ?? "");

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onUpload = async (file: File | undefined, kind: string, setter: (u: string) => void) => {
    if (!file) return;
    setErr(null);
    setUploading(kind);
    try {
      const url = await uploadImage(file, kind);
      setter(url);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  };

  const onSave = async () => {
    setErr(null);
    setMsg(null);
    setSaving(true);
    try {
      await save({
        client_name: name || null,
        client_tagline: tagline || null,
        brand,
        default_theme: defaultTheme,
        login_headline: headline || null,
        login_subtext: subtext || null,
        login_bg_url: loginBg || null,
        logo_url: logo || null,
        favicon_url: favicon || null,
        training_ai_url: trainingUrl || null,
      });
      setMsg("Saved. Changes are live for everyone.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const card = "rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800";
  const labelCls = "text-xs font-semibold text-slate-700 dark:text-slate-200";

  const imageRow = (
    title: string,
    kind: string,
    value: string,
    setter: (u: string) => void,
    hint: string,
  ) => (
    <div className="space-y-1.5">
      <Label className={labelCls}>{title}</Label>
      <div className="flex items-center gap-3">
        {value ? (
          <img src={value} alt={title} className="h-12 w-12 rounded-lg border border-slate-200 object-cover dark:border-slate-700" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-slate-300 text-slate-300 dark:border-slate-600">
            <Upload className="h-4 w-4" />
          </div>
        )}
        <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700">
          {uploading === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : "Upload"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => onUpload(e.target.files?.[0], kind, setter)}
          />
        </label>
        {value && (
          <button onClick={() => setter("")} className="text-xs text-slate-400 hover:text-rose-500">
            Remove
          </button>
        )}
      </div>
      <Input value={value} onChange={(e) => setter(e.target.value)} placeholder={hint} className="font-mono text-[11px]" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-6">
      <div className="grid items-start gap-6 lg:grid-cols-2">
      {/* Identity */}
      <div className={card}>
        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Identity</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className={labelCls}>Client name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={resolved.clientName} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Tagline</Label>
            <Input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Training Analyst" />
          </div>
        </div>
        <div className="mt-3">{imageRow("Logo", "logo", logo, setLogo, "https://… or upload")}</div>
        <div className="mt-3">{imageRow("Favicon", "favicon", favicon, setFavicon, "https://… or upload")}</div>
      </div>

      {/* Appearance */}
      <div className={card}>
        <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          <Palette className="h-4 w-4 text-brand-600 dark:text-brand-400" /> Appearance
        </h3>
        <Label className={labelCls}>Brand palette</Label>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {BRAND_PRESETS.map((b) => (
            <button
              key={b}
              onClick={() => { setBrand(b); previewBrand(b); }}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                brand === b
                  ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-slate-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              <span className="h-3.5 w-3.5 rounded-full" style={{ background: SWATCH[b] }} />
              {b}
            </button>
          ))}
        </div>

        <Label className={`${labelCls} mt-4 block`}>Default theme (for new viewers)</Label>
        <div className="mt-1.5 flex gap-2">
          {(["light", "dark"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setDefaultTheme(t)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                defaultTheme === t
                  ? "border-brand-600 bg-brand-50 text-brand-700 dark:border-brand-500 dark:bg-brand-900/30 dark:text-brand-300"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {t === "light" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />} {t}
            </button>
          ))}
        </div>
      </div>

      {/* Login portal */}
      <div className={card}>
        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Login portal</h3>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className={labelCls}>Headline</Label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder={resolved.clientName} />
          </div>
          <div className="space-y-1.5">
            <Label className={labelCls}>Subtext</Label>
            <Input value={subtext} onChange={(e) => setSubtext(e.target.value)} placeholder="Training Analyst Dashboard" />
          </div>
          {imageRow("Background image", "login-bg", loginBg, setLoginBg, "https://… or upload")}
        </div>
      </div>

      {/* Integrations */}
      <div className={card}>
        <h3 className="mb-3 text-sm font-bold text-slate-900 dark:text-slate-100">Training AI</h3>
        <div className="space-y-1.5">
          <Label className={labelCls}>Training call link (shown to users)</Label>
          <Input value={trainingUrl} onChange={(e) => setTrainingUrl(e.target.value)} placeholder="https://…" />
        </div>
      </div>
      </div>

      {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-700">{err}</p>}
      {msg && (
        <p className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          <CheckCircle2 className="h-3.5 w-3.5" /> {msg}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={saving} className="bg-slate-900 hover:bg-slate-800 dark:bg-brand-600 dark:hover:bg-brand-500">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}
        </Button>
        <span className="text-[11px] text-slate-400">Applies to the login portal and every user.</span>
      </div>
    </div>
  );
};
