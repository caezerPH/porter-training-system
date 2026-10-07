import React, { useState } from "react";
import { useApiSettings } from "../context/ApiSettingsContext";
import { CustomFieldsSection } from "./CustomFieldsSection";
import { useAvailableTags } from "../hooks/useAvailableTags";
import {
  Key,
  Building2,
  Tag,
  RefreshCw,
  CheckCircle2,
  ShieldAlert,
  X,
  Plus,
  Trash2,
  Plug,
  Lock,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ApiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// No custom field keys are hardcoded — they are synced from the connected
// subaccount (or typed manually) via the Sync Fields button below.

export const ApiSettingsModal: React.FC<ApiSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefresh,
}) => {
  const {
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
    clearConfig,
  } = useApiSettings();
  const {
    tags: availableTags,
    isLoading: tagsLoading,
    error: tagsError,
    fetchTags,
    clearTags,
  } = useAvailableTags();
  const safeTags = Array.isArray(additionalTags) ? additionalTags : [];
  const safeFields = Array.isArray(customFieldKeys) ? customFieldKeys : [];
  const [tempToken, setTempToken] = useState(token ?? "");
  const [tempLoc, setTempLoc] = useState(locationId ?? "");
  const [tempTag, setTempTag] = useState(tagFilter ?? "");
  const [tempExtraTags, setTempExtraTags] = useState<string[]>(safeTags);
  const [newTag, setNewTag] = useState("");
  const [tempFieldKeys, setTempFieldKeys] = useState<string[]>(safeFields);
  const [tempNpnFieldId, setTempNpnFieldId] = useState(npnFieldId ?? "");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);

  // PIN lock for save action
  const PIN = "delmarva1234";
  const [showPinPrompt, setShowPinPrompt] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Sync available tags from the connected subaccount using the current
  // token + location ID values the user has typed in the modal.
  const handleSyncTags = () => {
    void fetchTags(tempToken, tempLoc);
  };

  const selectPrimaryTag = (name: string) => {
    setTempTag(name);
    setShowTagPicker(false);
  };

  const toggleExtraTag = (name: string) => {
    const lower = name.toLowerCase();
    if (
      tempExtraTags.some((t) => t.toLowerCase() === lower) ||
      tempTag.toLowerCase() === lower
    )
      return;
    setTempExtraTags([...tempExtraTags, name]);
  };

  if (!isOpen) return null;

  const handleSave = () => {
    setToken(tempToken);
    setLocationId(tempLoc);
    setTagFilter(tempTag);
    setAdditionalTags(tempExtraTags);
    setCustomFieldKeys(tempFieldKeys);
    setNpnFieldId(tempNpnFieldId);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
    onRefresh();
    onClose();
  };

  const requestSave = () => {
    setPinInput("");
    setPinError(false);
    setShowPinPrompt(true);
  };

  const confirmPin = () => {
    if (pinInput === PIN) {
      setShowPinPrompt(false);
      setPinInput("");
      setPinError(false);
      handleSave();
    } else {
      setPinError(true);
    }
  };

  const addTag = () => {
    const t = newTag.trim();
    if (!t) return;
    if (
      !tempExtraTags.includes(t) &&
      t.toLowerCase() !== tempTag.toLowerCase()
    ) {
      setTempExtraTags([...tempExtraTags, t]);
    }
    setNewTag("");
  };

  const removeTag = (t: string) =>
    setTempExtraTags(tempExtraTags.filter((x) => x !== t));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
              <Plug className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Connectivity</h2>
              <p className="text-xs text-slate-500">
                Connection data sources & parsed fields
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 py-4">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800 flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              Tokens stay strictly stored in your local browser session and are
              never sent to external third parties.
            </span>
          </div>

          {/* Connection credentials */}
          <div>
            <Label className="text-xs font-semibold text-slate-700">
              Private API Key / Bearer Token
            </Label>
            <div className="relative mt-1">
              <Input
                type="password"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                placeholder="pit-xxxx-xxxx-xxxx"
                className="font-mono text-xs pr-10"
              />
              <Key className="absolute right-3 top-2.5 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Subaccount / Location ID
              </Label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  value={tempLoc}
                  onChange={(e) => setTempLoc(e.target.value)}
                  placeholder="GHL location ID"
                  className="font-mono text-xs pr-8"
                />
                <Building2 className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700">
                Primary Contact Tag
              </Label>
              <div className="relative mt-1">
                <Input
                  type="text"
                  value={tempTag}
                  onChange={(e) => setTempTag(e.target.value)}
                  placeholder="Select or type a tag"
                  className="text-xs pr-8"
                />
                <Tag className="absolute right-2.5 top-2.5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Sync tags from the connected subaccount */}
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-brand-600" />
                <p className="text-xs font-bold text-slate-800">
                  Sync & Pick Tags From Subaccount
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSyncTags}
                disabled={tagsLoading || !tempToken || !tempLoc}
                className="shrink-0 text-xs flex items-center gap-1"
                title={
                  !tempToken || !tempLoc
                    ? "Enter a Bearer token and Location ID first"
                    : "Fetch available tags from the connected subaccount"
                }
              >
                {tagsLoading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5" />
                )}
                Sync Tags
              </Button>
            </div>
            <p className="text-[11px] text-slate-500 mb-2">
              Enter your token + Location ID above, then click Sync Tags to load
              the tags available in this subaccount. Pick a primary tag and any
              additional tags instead of typing them manually.
            </p>

            {tagsError && (
              <p className="text-[11px] text-rose-600 font-medium mb-2">
                {tagsError}
              </p>
            )}

            {availableTags.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-slate-700">
                    Discovered {availableTags.length} tag
                    {availableTags.length === 1 ? "" : "s"}:
                  </span>
                  <span className="text-slate-400 text-[10px]">
                    Click primary or toggle additional tags
                  </span>
                </div>

                {/* Primary tag picker */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTagPicker((v) => !v)}
                    className="w-full flex items-center justify-between rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <span className="truncate">
                      {tempTag ? (
                        <>
                          <span className="text-slate-500 font-normal">
                            Primary Tag:{" "}
                          </span>
                          <span className="font-semibold text-brand-700">
                            {tempTag}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-400">
                          Select primary tag…
                        </span>
                      )}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 text-slate-400 shrink-0 transition-transform ${showTagPicker ? "rotate-180" : ""}`}
                    />
                  </button>
                  {showTagPicker && (
                    <div className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-lg py-1 divide-y divide-slate-100">
                      {availableTags.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => selectPrimaryTag(t.name)}
                          className={`flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors ${
                            t.name.toLowerCase() === tempTag.toLowerCase()
                              ? "bg-brand-50 text-brand-800 font-semibold"
                              : "text-slate-700 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{t.name}</span>
                          {t.name.toLowerCase() === tempTag.toLowerCase() && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-brand-600 shrink-0 ml-2" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Additional tags multi-select */}
                <div className="flex flex-wrap gap-1.5">
                  {availableTags
                    .filter(
                      (t) => t.name.toLowerCase() !== tempTag.toLowerCase(),
                    )
                    .map((t) => {
                      const active = tempExtraTags.some(
                        (x) => x.toLowerCase() === t.name.toLowerCase(),
                      );
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() =>
                            active ? removeTag(t.name) : toggleExtraTag(t.name)
                          }
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold border transition-colors ${
                            active
                              ? "bg-brand-600 text-white border-brand-600"
                              : "bg-brand-50 text-brand-800 border-brand-200 hover:bg-brand-100"
                          }`}
                        >
                          {active && <CheckCircle2 className="h-3 w-3" />}
                          {t.name}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Manual entry fallback (always available) */}
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 mb-2">
                Or add additional tags manually:
              </p>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addTag()}
                  placeholder="e.g. Training Complete"
                  className="text-xs h-9"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTag}
                  className="shrink-0 text-xs flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" /> Add
                </Button>
              </div>
              {tempExtraTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {tempExtraTags.map((t) => (
                    <span
                      key={t}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-50 border border-brand-200 px-2 py-0.5 text-[11px] font-semibold text-brand-800"
                    >
                      {t}
                      <button
                        onClick={() => removeTag(t)}
                        className="text-brand-500 hover:text-brand-700"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Custom fields — synced from the connected subaccount */}
          <CustomFieldsSection
            token={tempToken}
            locationId={tempLoc}
            selectedKeys={tempFieldKeys}
            onAddKey={(k) => setTempFieldKeys([...tempFieldKeys, k])}
            onRemoveKey={(f) =>
              setTempFieldKeys(tempFieldKeys.filter((x) => x !== f))
            }
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              clearConfig();
              clearTags();
              setTempToken("");
              setTempLoc("");
              setTempTag("");
              setTempExtraTags([]);
              setTempFieldKeys([]);
              setTempNpnFieldId("");
            }}
            className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
          >
            Clear Credentials
          </Button>

          <div className="flex gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={requestSave}
              className="bg-brand-600 hover:bg-brand-700 text-white flex items-center gap-1.5"
            >
              {savedSuccess ? (
                <>
                  <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Saved!
                </>
              ) : (
                <>
                  <Lock className="h-3.5 w-3.5" /> Save & Sync Data
                </>
              )}
            </Button>
          </div>
        </div>

        {/* PIN Lock Prompt */}
        {showPinPrompt && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-xl">
            <div className="w-full max-w-xs rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
              <div className="flex items-center gap-2 mb-3">
                <div className="rounded-lg bg-brand-50 p-2 text-brand-600">
                  <Lock className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    PIN Required
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Enter the security PIN to save changes
                  </p>
                </div>
              </div>
              <Input
                type="password"
                autoFocus
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && confirmPin()}
                placeholder="••••••••"
                className={`font-mono text-sm ${pinError ? "border-rose-400 focus:border-rose-500" : ""}`}
              />
              {pinError && (
                <p className="text-[11px] text-rose-600 mt-1.5 font-semibold">
                  Incorrect PIN. Please try again.
                </p>
              )}
              <div className="flex gap-2 mt-4 justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setShowPinPrompt(false);
                    setPinInput("");
                    setPinError(false);
                  }}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={confirmPin}
                  className="bg-brand-600 hover:bg-brand-700 text-white text-xs"
                >
                  Unlock & Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
