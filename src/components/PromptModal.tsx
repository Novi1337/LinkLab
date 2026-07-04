"use client";

import { useState, useRef, useEffect } from "react";

interface PromptModalProps {
  isOpen: boolean;
  title: string;
  initialValue?: string;
  locale?: "de" | "en";
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

export function PromptModal({ isOpen, title, initialValue = "", locale = "de", onConfirm, onCancel }: PromptModalProps) {
  const [value, setValue] = useState(initialValue);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync value when initialValue changes without causing a cascading render in an effect
  if (isOpen && value === "" && initialValue !== "" && value !== initialValue) {
      setValue(initialValue);
  }

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setValue(""); // reset when closed
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-brand-dark m-0">{title}</h3>
        </div>
        <div className="p-6">
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirm(value);
              if (e.key === "Escape") onCancel();
            }}
            className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-brand-dark"
          />
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-dark hover:bg-slate-200 rounded-lg transition-colors"
          >
            {locale === "en" ? "Cancel" : "Abbrechen"}
          </button>
          <button 
            onClick={() => onConfirm(value)}
            className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md transition-colors"
          >
            {locale === "en" ? "Save" : "Speichern"}
          </button>
        </div>
      </div>
    </div>
  );
}
