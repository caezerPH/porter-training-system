import React, { useState } from "react";
import { useAvailableFields } from "../hooks/useAvailableFields";
import {
  Database,
  RefreshCw,
  CheckCircle2,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CustomFieldsSectionProps {
  token: string;
  locationId: string;
  selectedKeys: string[];
  onAddKey: (key: string) => void;
  onRemoveKey: (key: string) => void;
}

export const CustomFieldsSection: React.FC<CustomFieldsSectionProps> = ({
  token,
  locationId,
  selectedKeys,
  onAddKey,
  onRemoveKey,
}) => {
  const {
    fields: availableFields,
    isLoading: fieldsLoading,
    error: fieldsError,
    fetchFields,
  } = useAvailableFields();

  const [newField, setNewField] = useState("");

  const handleSyncFields = () => {
    void fetchFields(token, locationId);
  };

  const addField = () => {
    // Accept raw keys, "Field Name" labels, or merge-field syntax like
    // {{contact.training_manager_report}} / {{custom_field.xxx}} — strip the
    // wrapper so we store the clean key the parser expects.
    let f = newField.trim();
    f = f.replace(
      /^\{\{\s*(?:contact|custom_field|customField)\.|\}\}\s*$/gi,
      "",
    );
    f = f.replace(/^\{\{|\}\}$/g, "");
    f = f.replace(/^(?:contact|custom_field|customField)\./i, "");
    f = f.trim().toLowerCase().replace(/\s+/g, "_");
    if (!f) return;
    if (!selectedKeys.includes(f)) {
      onAddKey(f);
    }
    setNewField("");
  };

  const ready = Boolean(token && locationId);

  return (
    <>
      {/* Custom fields to parse */}
      <div className="rounded-lg border border-slate-200 p-3">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-brand-600" />
            <p className="text-xs font-bold text-slate-800">
              Custom Fields to Parse
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSyncFields}
            disabled={fieldsLoading || !ready}
            className="shrink-0 text-xs flex items-center gap-1"
            title={
              !ready
                ? "Enter a Bearer token and Location ID first"
                : "Fetch custom fields from the connected subaccount"
            }
          >
            {fieldsLoading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5" />
            )}
            Sync Fields
          </Button>
        </div>
        <p className="text-[11px] text-slate-500 mb-2">
          Click Sync Fields to load the custom fields available in this
          subaccount, then toggle the ones to parse from each contact record. Or
          add field keys manually below.
        </p>

        {fieldsError && (
          <p className="text-[11px] text-rose-600 font-medium mb-2">
            {fieldsError}
          </p>
        )}

        {availableFields.length > 0 && (
          <div className="space-y-2 mb-3">
            <p className="text-[11px] font-semibold text-slate-700">
              Discovered {availableFields.length} custom field
              {availableFields.length === 1 ? "" : "s"} — click to include in
              parsing:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {availableFields.map((f) => {
                const active = selectedKeys.some((k) => k === f.fieldKey);
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      active ? onRemoveKey(f.fieldKey) : onAddKey(f.fieldKey)
                    }
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-mono border transition-colors ${
                      active
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                    }`}
                  >
                    {active && <CheckCircle2 className="h-3 w-3" />}
                    {f.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Manual entry fallback */}
        <div className="pt-3 border-t border-slate-100">
          <p className="text-[11px] text-slate-500 mb-2">
            Or add field keys manually:
          </p>
          <div className="flex gap-2">
            <Input
              type="text"
              value={newField}
              onChange={(e) => setNewField(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addField()}
              placeholder="e.g. training_score, region"
              className="text-xs h-9 font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addField}
              className="shrink-0 text-xs flex items-center gap-1"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
          {selectedKeys.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {selectedKeys.map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-mono text-emerald-800"
                >
                  {f}
                  <button
                    onClick={() => onRemoveKey(f)}
                    className="text-emerald-500 hover:text-emerald-700"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
