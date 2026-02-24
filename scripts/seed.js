#!/usr/bin/env node

/**
 * Seed script: reads all YAML change files from the ai-provider-monitor repo
 * and builds data/changes.json.
 *
 * Usage:
 *   node scripts/seed.js <path-to-ai-provider-monitor>
 *
 * Example:
 *   node scripts/seed.js ../ai-provider-monitor
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join, relative, basename, dirname } from "path";
import yaml from "js-yaml";

const monitorRepoPath = process.argv[2];

if (!monitorRepoPath) {
  console.error("Usage: node scripts/seed.js <path-to-ai-provider-monitor>");
  process.exit(1);
}

const changesDir = join(monitorRepoPath, "changes");

function walkYamlFiles(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkYamlFiles(fullPath));
    } else if (entry.endsWith(".yml")) {
      results.push(fullPath);
    }
  }
  return results;
}

const allChanges = [];
const yamlFiles = walkYamlFiles(changesDir);

for (const filePath of yamlFiles) {
  const rel = relative(changesDir, filePath);
  // rel looks like: openai/chat/completions/post.yml
  const parts = rel.split("/");
  const provider = parts[0];
  const method = basename(filePath, ".yml"); // post, get, delete, etc.
  const route = parts.slice(1, -1).join("/"); // chat/completions

  const content = readFileSync(filePath, "utf-8");
  const entries = yaml.load(content);

  if (!Array.isArray(entries)) continue;

  for (const entry of entries) {
    allChanges.push({
      provider,
      route,
      method: method.toUpperCase(),
      change: entry.change,
      target: entry.target,
      breaking: entry.breaking || false,
      deprecated: entry.deprecated || false,
      doc_only: entry.doc_only || false,
      note: entry.note,
      date: entry.date,
    });
  }
}

// Sort by date descending (newest first)
allChanges.sort((a, b) => b.date.localeCompare(a.date));

writeFileSync(
  join(import.meta.dirname, "..", "data", "changes.json"),
  JSON.stringify(allChanges, null, 2) + "\n"
);

console.log(`Wrote ${allChanges.length} changes to data/changes.json`);
