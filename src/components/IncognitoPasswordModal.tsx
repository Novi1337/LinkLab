"use client";

import { useState, useRef, useEffect } from "react";
import { EyeOff } from "lucide-react";

interface IncognitoPasswordModalProps {
  isOpen: boolean;
  /** "setup" = Passwort zum ersten Mal festlegen, "unlock" = bestehendes Passwort abfragen */
  mode: "setup" | "unlock";
  error?: string | null;
  locale?: "de" | "en";
  onConfirm: (password: string) => void;
  onCancel: () => void;
}

export function IncognitoPasswordModal({ isOpen, mode, error, locale = "de", onConfirm, onCancel }: IncognitoPasswordModalProps) {
  const isEn = locale === "en";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPassword("");
      setConfirmPassword("");
      setLocalError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!password) return;
    if (mode === "setup") {
      if (password.length < 4) {
        setLocalError(isEn ? "Password must be at least 4 characters long." : "Das Passwort muss mindestens 4 Zeichen lang sein.");
        return;
      }
      if (password !== confirmPassword) {
        setLocalError(isEn ? "Passwords do not match." : "Die Passwörter stimmen nicht überein.");
        return;
      }
    }
    setLocalError(null);
    onConfirm(password);
  };

  const shownError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-slate-100 flex items-center gap-3">
          <span className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center shrink-0">
            <EyeOff className="w-4.5 h-4.5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-brand-dark m-0">
              {mode === "setup"
                ? (isEn ? "Set incognito password" : "Inkognito-Passwort festlegen")
                : (isEn ? "Unlock incognito mode" : "Inkognito-Modus entsperren")}
            </h3>
            <p className="m-0 text-xs text-slate-500">
              {mode === "setup"
                ? (isEn ? "Use this password to reveal your private tabs." : "Mit diesem Passwort blendest du private Reiter ein.")
                : (isEn ? "Enter your incognito password to show private tabs." : "Gib dein Inkognito-Passwort ein, um private Reiter anzuzeigen.")}
            </p>
          </div>
        </div>
        <div className="p-6 flex flex-col gap-3">
          <input
            ref={inputRef}
            type="password"
            placeholder={mode === "setup" ? (isEn ? "New password" : "Neues Passwort") : (isEn ? "Password" : "Passwort")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSubmit();
              if (e.key === "Escape") onCancel();
            }}
            className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-brand-dark"
          />
          {mode === "setup" && (
            <input
              type="password"
              placeholder={isEn ? "Repeat password" : "Passwort wiederholen"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
                if (e.key === "Escape") onCancel();
              }}
              className="w-full p-3 rounded-xl border border-slate-300 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-brand-dark"
            />
          )}
          {shownError && (
            <p className="m-0 text-sm text-danger font-medium">{shownError}</p>
          )}
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-brand-dark hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isEn ? "Cancel" : "Abbrechen"}
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2 text-sm font-bold text-white bg-primary hover:bg-primary-hover rounded-lg shadow-md transition-colors"
          >
            {mode === "setup" ? (isEn ? "Set password" : "Festlegen") : (isEn ? "Unlock" : "Entsperren")}
          </button>
        </div>
      </div>
    </div>
  );
}
