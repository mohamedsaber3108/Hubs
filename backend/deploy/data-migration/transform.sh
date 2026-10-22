#!/usr/bin/env bash
# Transform a PostgreSQL `pg_dump --column-inserts --data-only` file into
# MySQL-loadable INSERTs. Conservative + idempotent; does NOT touch bcrypt
# hashes or ENUM string values. Review the output before loading.
#
# Usage: ./transform.sh hub_data.sql > hub_data.mysql.sql
set -euo pipefail
IN="${1:?usage: transform.sh <pg_column_inserts.sql>}"

sed -E '
  # drop PG-only noise
  /^SET /d
  /^SELECT pg_catalog\.setval/d
  /^--/d
  /^$/d
  # strip schema qualifier
  s/\bpublic\.//g
  # PG boolean literals -> MySQL 1/0 (only as standalone VALUES tokens)
  s/([,([:space:]])true([,)[:space:]])/\11\2/g
  s/([,([:space:]])false([,)[:space:]])/\10\2/g
' "$IN"

# NOTE: bcrypt hashes ($2a$/$2b$...), ENUM strings (user/admin/active/local...),
# UUIDs, timestamps, and JSON are passed through unchanged — correct for MySQL.
# After loading, set AUTO_INCREMENT per table to max(id)+1 (see README Step 4).
