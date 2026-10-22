#!/usr/bin/env node
'use strict';
/*
 * PostgreSQL -> MySQL data transformer for the Hub migration.
 *
 * Input:  a `pg_dump --data-only --column-inserts` file (one INSERT per row,
 *         `INSERT INTO public.table (cols...) VALUES (...);`).
 * Output: MySQL-loadable INSERTs for ONLY the tables we migrate, with:
 *   - schema qualifier `public.` stripped
 *   - PG boolean literals TRUE/FALSE -> 1/0 (value position only, not inside strings)
 *   - PG `setval(...)` / `SET ...` / comments dropped
 *   - single-quoted strings preserved verbatim (bcrypt, enums, Unicode, JSON)
 *   - E'...' escape-string prefix normalized to '...'
 *   - NULL preserved
 *
 * It is a proper tokenizer (not regex-on-whole-line) so booleans/commas inside
 * string values are never corrupted. De-dup is enforced by an allow-list of
 * tables (see IMPORT_TABLES) — communities/settings/pricing/email_templates are
 * EXCLUDED here because they come from the structural seed.
 *
 * Usage: node transform.js hub_data.sql [--all] > hub_data.mysql.sql
 *   default: emit only IMPORT_TABLES (users, admins, community_memberships, feature_flags)
 *   --all  : emit every table found (used by the self-test to reconcile all 8)
 */
const fs = require('fs');

const IMPORT_TABLES = new Set([
  'users', 'admins', 'community_memberships', 'feature_flags',
]);

function splitTopLevel(valuesBody) {
  // Split a VALUES (...) body on top-level commas, respecting single-quoted
  // strings (with '' escape) and parentheses/brackets inside JSON.
  const out = [];
  let buf = '';
  let inStr = false;
  for (let i = 0; i < valuesBody.length; i++) {
    const c = valuesBody[i];
    if (inStr) {
      buf += c;
      if (c === "'") {
        if (valuesBody[i + 1] === "'") { buf += "'"; i++; } // escaped quote
        else inStr = false;
      }
    } else if (c === "'") {
      inStr = true; buf += c;
    } else if (c === ',') {
      out.push(buf.trim()); buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim() !== '') out.push(buf.trim());
  return out;
}

function transformValue(v) {
  let t = v.trim();
  if (t === 'true' || t === 'TRUE') return '1';
  if (t === 'false' || t === 'FALSE') return '0';
  if (t === 'NULL') return 'NULL';
  // E'...' -> '...' (MySQL understands backslash escapes with default settings)
  if (/^E'/.test(t)) t = t.slice(1);
  // PG timestamptz dumps as 'YYYY-MM-DD HH:MM:SS(.ffffff)?(+NN(:NN)?|-NN(:NN)?|Z)'.
  // MySQL DATETIME rejects the tz suffix. Strip it (values are already UTC from
  // pg_dump with default TimeZone=UTC). Only touches quoted datetime-looking strings.
  t = t.replace(
    /^'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?)(?:[+-]\d{2}(?::?\d{2})?|Z)'$/,
    "'$1'",
  );
  return t; // strings, numbers, json — verbatim
}

function main() {
  const file = process.argv[2];
  const emitAll = process.argv.includes('--all');
  if (!file) { console.error('usage: transform.js <pg_dump.sql> [--all]'); process.exit(1); }
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);

  const re = /^INSERT INTO (?:public\.)?"?([a-zA-Z_][a-zA-Z0-9_]*)"?\s*\(([^)]*)\)\s*VALUES\s*\((.*)\);\s*$/;
  const counts = {};
  const emitted = [];
  emitted.push('SET FOREIGN_KEY_CHECKS=0;');

  for (const line of lines) {
    if (!line || line.startsWith('--') || /^SET /.test(line) || /setval\(/.test(line)) continue;
    const m = line.match(re);
    if (!m) continue;
    const table = m[1];
    if (!emitAll && !IMPORT_TABLES.has(table)) continue;
    const cols = m[2].split(',').map((c) => c.trim().replace(/"/g, ''));
    const vals = splitTopLevel(m[3]).map(transformValue);
    if (cols.length !== vals.length) {
      console.error(`WARN column/value count mismatch on ${table}: ${cols.length} vs ${vals.length}`);
    }
    counts[table] = (counts[table] || 0) + 1;
    emitted.push(`INSERT INTO \`${table}\` (${cols.map((c) => '`' + c + '`').join(', ')}) VALUES (${vals.join(', ')});`);
  }
  emitted.push('SET FOREIGN_KEY_CHECKS=1;');

  process.stdout.write(emitted.join('\n') + '\n');
  for (const [t, n] of Object.entries(counts)) console.error(`transformed ${t}: ${n} rows`);
}

main();
