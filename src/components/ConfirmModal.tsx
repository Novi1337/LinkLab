"use client";

import { useEffect, useRef } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  locale?: "de" | "en";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({ isOpen, title, message, confirmLabel, locale = "de", onConfirm, onCancel }: ConfirmModalProps) {
  const defaultConfirm = confirmLabel ?? (locale === "en" ? "Delete" : "Löschen");
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmButtonRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm();
        if (e.key === "Escape") onCancel();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-brand-dark m-0">{title}</h3>
        </div>
        {message && (
          <div className="px-6 py-5 text-sm text-slate-600">{message}</div>
        )}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-dark hover:bg-slate-200 rounded-lg transition-colors"
          >
            {locale === "en" ? "Cancel" : "Abbrechen"}
          </button>
          <button
            ref={confirmButtonRef}
            onClick={onConfirm}
            className="px-5 py-2 text-sm font-bold text-white bg-danger hover:opacity-90 rounded-lg shadow-md transition-colors"
          >
            {defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
