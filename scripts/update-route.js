#!/usr/bin/env node

/**
 * Updates a single route in data/changes.json from dispatch payload data.
 *
 * Usage:
 *   node scripts/update-route.js <provider> <route> <changes-json>
 *
 * Arguments:
 *   provider     - e.g. "openai"
 *   route        - e.g. "POST /v1/chat/completions"
 *   changes-json - JSON array of change objects
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const provider = process.argv[2];
const routeArg = process.argv[3];
const changesJson = process.argv[4];

if (!provider || !routeArg || !changesJson) {
  console.error(
    "Usage: node scripts/update-route.js <provider> <route> <changes-json>"
  );
  process.exit(1);
}

// Parse route like "POST /v1/chat/completions"
const spaceIndex = routeArg.indexOf(" ");
if (spaceIndex === -1) {
  console.error(`Invalid route format: "${routeArg}" (expected "METHOD /path")`);
  process.exit(1);
}
const method = routeArg.slice(0, spaceIndex).toUpperCase();
const route = routeArg.slice(spaceIndex + 1);

// Parse the changes JSON
const entries = JSON.parse(changesJson);

if (!Array.isArray(entries) || entries.length === 0) {
  console.log("No entries in changes payload");
  process.exit(0);
}

// Load existing database
const dbPath = join(import.meta.dirname, "..", "data", "changes.json");
const db = JSON.parse(readFileSync(dbPath, "utf-8"));

// Remove existing entries for this provider+route+method
const filtered = db.filter(
  (c) => !(c.provider === provider && c.route === route && c.method === method)
);

// Add all entries from the changes payload
for (const entry of entries) {
  filtered.push({
    provider,
    route,
    method,
    change: entry.change,
    target: entry.target,
    breaking: entry.breaking || false,
    deprecated: entry.deprecated || false,
    doc_only: entry.doc_only || false,
    note: entry.note,
    date: entry.date,
    ...(entry.diff_url && { diff_url: entry.diff_url }),
  });
}

// Sort by date descending
filtered.sort((a, b) => b.date.localeCompare(a.date));

writeFileSync(dbPath, JSON.stringify(filtered, null, 2) + "\n");
console.log(`Updated database: ${filtered.length} total entries`);
