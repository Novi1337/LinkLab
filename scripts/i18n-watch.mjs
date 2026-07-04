#!/usr/bin/env node

import { watch } from "node:fs";
import path from "node:path";
import { spawn } from "node:child_process";

const root = process.cwd();
const dePath = path.join(root, "messages", "de.json");

let running = false;
let queued = false;

function runSync() {
  if (running) {
    queued = true;
    return;
  }

  running = true;
  const child = spawn(process.execPath, [path.join(root, "scripts", "i18n-sync.mjs")], {
    stdio: "inherit",
  });

  child.on("exit", () => {
    running = false;
    if (queued) {
      queued = false;
      runSync();
    }
  });
}

console.log("[i18n:watch] Watching messages/de.json ...");
runSync();

watch(dePath, { persistent: true }, (eventType) => {
  if (eventType === "change") {
    console.log("[i18n:watch] Change detected, syncing ...");
    runSync();
  }
});
