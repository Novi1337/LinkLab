#!/usr/bin/env node

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const messagesDir = path.join(root, "messages");
const dePath = path.join(messagesDir, "de.json");
const enPath = path.join(messagesDir, "en.json");
const statePath = path.join(messagesDir, ".translation-state.json");
const reviewPath = path.join(messagesDir, "en.review.json");

const args = new Set(process.argv.slice(2));
const isCheck = args.has("--check");
const isQuiet = args.has("--quiet");

function log(...parts) {
  if (!isQuiet) console.log(...parts);
}

function sha1(value) {
  return createHash("sha1").update(String(value)).digest("hex");
}

function readJson(filePath, fallback = {}) {
  if (!existsSync(filePath)) return fallback;
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Invalid JSON in ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
  }
}

function writeJson(filePath, data) {
  writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
}

function ensureFiles() {
  if (!existsSync(messagesDir)) mkdirSync(messagesDir, { recursive: true });
  if (!existsSync(dePath)) writeJson(dePath, {});
  if (!existsSync(enPath)) writeJson(enPath, {});
  if (!existsSync(statePath)) writeJson(statePath, {});
}

function flatten(input, prefix = "", out = {}) {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    for (const [k, v] of Object.entries(input)) {
      const key = prefix ? `${prefix}.${k}` : k;
      flatten(v, key, out);
    }
    return out;
  }
  out[prefix] = input;
  return out;
}

function unflatten(flat) {
  const rootObj = {};
  for (const [flatKey, value] of Object.entries(flat)) {
    const keys = flatKey.split(".");
    let ref = rootObj;
    for (let i = 0; i < keys.length - 1; i += 1) {
      const key = keys[i];
      if (!ref[key] || typeof ref[key] !== "object" || Array.isArray(ref[key])) {
        ref[key] = {};
      }
      ref = ref[key];
    }
    ref[keys[keys.length - 1]] = value;
  }
  return rootObj;
}

function resolveProvider() {
  if (process.env.DEEPL_API_KEY) return "deepl";
  if (process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

async function translateWithDeepL(text) {
  const authKey = process.env.DEEPL_API_KEY;
  const endpoint = authKey?.endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";

  const body = new URLSearchParams({
    auth_key: authKey,
    text,
    source_lang: "DE",
    target_lang: "EN-US",
    preserve_formatting: "1",
  });

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`DeepL failed (${res.status}): ${details}`);
  }

  const data = await res.json();
  return data?.translations?.[0]?.text?.trim() || "";
}

async function translateWithOpenAI(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content:
            "You are a professional software localization translator. Translate German UI copy into natural, concise US English. Keep placeholders, markdown, punctuation, line breaks, and product names exactly where possible.",
        },
        {
          role: "user",
          content: text,
        },
      ],
    }),
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`OpenAI failed (${res.status}): ${details}`);
  }

  const data = await res.json();
  const output = (data.output_text || "").trim();
  if (!output) throw new Error("OpenAI returned empty translation");
  return output;
}

async function autoTranslate(text, provider) {
  if (provider === "deepl") return translateWithDeepL(text);
  if (provider === "openai") return translateWithOpenAI(text);
  return `[AUTO_UNTRANSLATED] ${text}`;
}

async function main() {
  ensureFiles();

  const provider = resolveProvider();
  const de = readJson(dePath, {});
  const en = readJson(enPath, {});
  const state = readJson(statePath, {});

  const deFlat = flatten(de);
  const enFlat = flatten(en);

  const nextEnFlat = { ...enFlat };
  const nextState = { ...state };
  const review = {};

  let translatedCount = 0;
  let removedCount = 0;
  let needsReviewCount = 0;

  for (const key of Object.keys(nextEnFlat)) {
    if (!(key in deFlat)) {
      delete nextEnFlat[key];
      delete nextState[key];
      removedCount += 1;
    }
  }

  for (const [key, deValue] of Object.entries(deFlat)) {
    const isString = typeof deValue === "string";
    if (!isString) {
      nextEnFlat[key] = deValue;
      continue;
    }

    const deHash = sha1(deValue);
    const currentEnValue = nextEnFlat[key];
    const entry = nextState[key] || {};

    const currentEnHash = currentEnValue === undefined ? "" : sha1(currentEnValue);
    const generatedHash = entry.generatedHash || "";
    const wasAutoManaged = entry.autoManaged === true;
    const manualOverride = wasAutoManaged && currentEnValue !== undefined && generatedHash && currentEnHash !== generatedHash;

    if (manualOverride) {
      entry.autoManaged = false;
      entry.reviewStatus = "reviewed-manual";
    }

    const sourceChanged = entry.sourceHash !== deHash;
    const missing = currentEnValue === undefined || currentEnValue === null || currentEnValue === "";
    const shouldAutoUpdate = missing || (sourceChanged && entry.autoManaged === true);

    if (shouldAutoUpdate) {
      const translated = await autoTranslate(deValue, provider);
      nextEnFlat[key] = translated;
      translatedCount += 1;

      const translatedHash = sha1(translated);
      nextState[key] = {
        ...entry,
        sourceHash: deHash,
        generatedHash: translatedHash,
        autoManaged: true,
        provider,
        reviewStatus: "needs-review",
        updatedAt: new Date().toISOString(),
      };
    } else {
      nextState[key] = {
        ...entry,
        sourceHash: deHash,
        generatedHash: entry.autoManaged ? currentEnHash : entry.generatedHash,
        provider: entry.provider || provider,
        updatedAt: entry.updatedAt || new Date().toISOString(),
      };

      if (!nextState[key].reviewStatus) {
        nextState[key].reviewStatus = "reviewed-manual";
      }
    }

    const finalEntry = nextState[key];
    if (finalEntry.reviewStatus === "needs-review") {
      review[key] = {
        status: "needs-review",
        provider: finalEntry.provider,
        sourceHash: finalEntry.sourceHash,
        updatedAt: finalEntry.updatedAt,
      };
      needsReviewCount += 1;
    }
  }

  const nextEn = unflatten(nextEnFlat);

  const changedEn = JSON.stringify(en) !== JSON.stringify(nextEn);
  const changedState = JSON.stringify(state) !== JSON.stringify(nextState);

  if (isCheck) {
    const issues = [];
    if (translatedCount > 0) issues.push(`missing or outdated keys: ${translatedCount}`);
    if (needsReviewCount > 0) issues.push(`keys still marked for review: ${needsReviewCount}`);

    if (issues.length > 0) {
      console.error(`[i18n:check] Failed: ${issues.join(", ")}`);
      process.exit(1);
    }

    log("[i18n:check] OK");
    return;
  }

  if (changedEn) writeJson(enPath, nextEn);
  if (changedState) writeJson(statePath, nextState);
  writeJson(reviewPath, review);

  log(`[i18n:sync] Provider: ${provider}`);
  log(`[i18n:sync] Translated: ${translatedCount}`);
  log(`[i18n:sync] Removed: ${removedCount}`);
  log(`[i18n:sync] Needs review: ${needsReviewCount}`);

  if (provider === "none" && translatedCount > 0) {
    log("[i18n:sync] Tip: set DEEPL_API_KEY or OPENAI_API_KEY for high-quality automatic translations.");
  }
}

main().catch((err) => {
  console.error("[i18n:sync] Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
