#!/usr/bin/env node

/**
 * Updates a single route in data/changes.json from a YAML file.
 *
 * Usage:
 *   node scripts/update-route.js <provider> <relativePath> <yaml-file>
 *
 * Arguments:
 *   provider     - e.g. "openai"
 *   relativePath - e.g. "v1/chat/completions/post.json"
 *   yaml-file    - path to the downloaded YAML change file
 */

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";
import yaml from "js-yaml";

const provider = process.argv[2];
const relativePath = process.argv[3];
const yamlFile = process.argv[4];

if (!provider || !relativePath || !yamlFile) {
  console.error(
    "Usage: node scripts/update-route.js <provider> <relativePath> <yaml-file>"
  );
  process.exit(1);
}

// Derive route and method from relativePath like "v1/chat/completions/post.json"
const parts = relativePath.replace(/\.json$/, "").split("/");
const method = parts.pop().toUpperCase();
const route = parts.join("/");

// Parse the YAML
const yamlContent = readFileSync(yamlFile, "utf-8");
const entries = yaml.load(yamlContent);

if (!Array.isArray(entries) || entries.length === 0) {
  console.log("No entries in YAML file");
  process.exit(0);
}

// Load existing database
const dbPath = join(import.meta.dirname, "..", "data", "changes.json");
const db = JSON.parse(readFileSync(dbPath, "utf-8"));

// Remove existing entries for this provider+route+method
const filtered = db.filter(
  (c) => !(c.provider === provider && c.route === route && c.method === method)
);

// Add all entries from the YAML file
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
  });
}

// Sort by date descending
filtered.sort((a, b) => b.date.localeCompare(a.date));

writeFileSync(dbPath, JSON.stringify(filtered, null, 2) + "\n");
console.log(`Updated database: ${filtered.length} total entries`);
