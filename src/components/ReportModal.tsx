"use client";

import { useState } from "react";
import type { ModerationReasonCode } from "@/lib/moderation";

type ReportReasonOption = {
  value: ModerationReasonCode;
  label: string;
};

interface ReportModalProps {
  isOpen: boolean;
  locale?: "de" | "en";
  targetLabel: string;
  reasonOptions: ReportReasonOption[];
  busy: boolean;
  error: string | null;
  onSubmit: (payload: { reasonCode: ModerationReasonCode; details: string }) => void;
  onCancel: () => void;
}

export function ReportModal({
  isOpen,
  locale = "de",
  targetLabel,
  reasonOptions,
  busy,
  error,
  onSubmit,
  onCancel,
}: ReportModalProps) {
  const [reasonCode, setReasonCode] = useState<ModerationReasonCode>(reasonOptions[0]?.value || "scam");
  const [details, setDetails] = useState("");

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-brand-dark m-0">
            {locale === "en" ? "Report shared content" : "Geteilten Inhalt melden"}
          </h3>
          <p className="text-xs text-slate-500 mt-1 mb-0">{targetLabel}</p>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <label className="text-xs uppercase tracking-wide font-bold text-slate-500">
            {locale === "en" ? "Reason" : "Grund"}
          </label>
          <select
            value={reasonCode}
            onChange={(e) => setReasonCode(e.target.value as ModerationReasonCode)}
            className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-brand-dark bg-white"
          >
            {reasonOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <label className="text-xs uppercase tracking-wide font-bold text-slate-500">
            {locale === "en" ? "Details (optional)" : "Details (optional)"}
          </label>
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={4}
            maxLength={1000}
            className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-brand-dark resize-y"
            placeholder={
              locale === "en"
                ? "Briefly describe what is illegal or dangerous."
                : "Beschreibe kurz, was daran illegal oder gefährlich ist."
            }
          />
          <p className="text-xs text-slate-400 m-0">{details.length}/1000</p>

          {error && <p className="text-sm text-danger m-0">{error}</p>}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-dark hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50"
          >
            {locale === "en" ? "Cancel" : "Abbrechen"}
          </button>
          <button
            onClick={() => onSubmit({ reasonCode, details })}
            disabled={busy}
            className="px-5 py-2 text-sm font-bold text-white bg-danger hover:opacity-90 rounded-lg shadow-md transition-colors disabled:opacity-50"
          >
            {busy ? (locale === "en" ? "Sending ..." : "Wird gesendet ...") : (locale === "en" ? "Send report" : "Meldung senden")}
          </button>
        </div>
      </div>
    </div>
  );
}
