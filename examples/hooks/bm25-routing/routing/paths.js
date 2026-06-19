'use strict';

/**
 * Path resolution for BM25 routing.
 *
 * Customize via environment variables:
 *   BM25_SKILLS_ROOT  — directory containing skill subdirectories with evals/scenarios.json
 *                       Default: <project>/.claude/skills
 *                       Example: /my-project/skills or /my-project/.agents/skills
 *
 *   BM25_DATA_DIR     — where index.json, thresholds.json, manifest.json are written
 *                       Default: <projectRoot>/.claude/hooks/routing/data
 *
 *   CLAUDE_PROJECT_DIR — project root (set automatically by Claude Code)
 *                        Falls back to 4 levels above this file's location
 */

const fs = require('fs');
const path = require('path');

function projectRoot() {
  if (process.env.CLAUDE_PROJECT_DIR) return process.env.CLAUDE_PROJECT_DIR;
  // When installed at <project>/.claude/hooks/bm25-routing/routing/paths.js, 4 levels up = project root.
  // Adjust if you install the routing/ module at a different depth.
  return path.resolve(__dirname, '..', '..', '..', '..');
}

function skillsRoot() {
  if (process.env.BM25_SKILLS_ROOT) return process.env.BM25_SKILLS_ROOT;
  // Default: .claude/skills — a common convention for project-local skills.
  // Change this to match wherever your skills/agents live (e.g. .agents/skills).
  return path.join(projectRoot(), '.claude', 'skills');
}

function dataDir() {
  if (process.env.BM25_DATA_DIR) return process.env.BM25_DATA_DIR;
  return path.join(projectRoot(), '.claude', 'hooks', 'routing', 'data');
}

function findScenariosFiles(root) {
  const files = [];
  function walk(dir, depth) {
    if (depth > 8) return;
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const sub = path.join(dir, e.name);
      if (e.name === 'evals') {
        const sf = path.join(sub, 'scenarios.json');
        if (fs.existsSync(sf)) files.push(sf);
      } else {
        walk(sub, depth + 1);
      }
    }
  }
  walk(root || skillsRoot(), 0);
  return files;
}

module.exports = { projectRoot, skillsRoot, dataDir, findScenariosFiles };
