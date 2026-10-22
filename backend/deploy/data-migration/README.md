# Hub data migration — PostgreSQL (agent-ai) → RDS MySQL

> Preserves the real Hub data from the agent-ai Postgres fork into the clean
> RDS MySQL schema. Tiny dataset (verified live): 8 populated tables,
> ~42 rows total. All other tables empty. Base migrations 1–16 are IDENTICAL
> between the PG fork and this MySQL repo, so the 8 tables map 1:1 column-for-column.
> Migrations 17–19 only ADD new (empty) tables — no conflict.

## Populated tables (approx rows, from live `pg_stat_user_tables`)
users=5, admins=3, communities=4, community_memberships=6,
settings=10, feature_flags=7, email_templates=4, pricing_plans=3.
(Everything else = 0 rows.)

## Transform rules (PG → MySQL)
| Concern | Rule |
|---|---|
| booleans | PG `t/f` → MySQL `1/0` (email_verified, is_active, is_deleted, etc.) |
| users.uuid | PG uuid → MySQL CHAR(36) string, verbatim |
| ENUMs (role/status/provider/membership role) | identical string values, verbatim |
| timestamps | ISO 8601 → MySQL DATETIME (accepted as-is) |
| password_hash (bcrypt) | **verbatim** — engine-agnostic; logins must keep working |
| PG sequences | ignored; reset MySQL AUTO_INCREMENT past max(id) after load |
| SequelizeMeta | **NOT imported** — fresh `db:migrate` on RDS writes 19 rows |

## Procedure (every write step is [APPROVAL]-gated)

### Step 1 — [APPROVAL] Backup on agent-ai (read-only to E-USAM; scoped to hub_db ONLY)
Pre-proven: hub_db (owner hub_user) is a DISTINCT database from eusam_db (owner eusam_user);
E-USAM backend uses the eusam-db Docker container, not host hub_db. Confirm again right before:
```bash
sudo -u postgres psql -c "\l" | grep -iE 'hub_db|eusam'
```
Dump hub_db ONLY (two formats; copy OFF the box afterwards):
```bash
pg_dump -U hub_user -h 127.0.0.1 -d hub_db --no-owner --no-privileges -Fc -f ~/hub_db_$(date +%F).dump
pg_dump -U hub_user -h 127.0.0.1 -d hub_db --no-owner --no-privileges \
  --data-only --inserts --column-inserts \
  -t users -t admins -t communities -t community_memberships \
  -t settings -t feature_flags -t email_templates -t pricing_plans \
  -f ~/hub_data.sql
sha256sum ~/hub_db_*.dump ~/hub_data.sql
```
NOTE: `--column-inserts` emits `INSERT INTO table (cols...) VALUES (...)` which is the
most portable form to transform to MySQL.

### Step 2 — Build the clean MySQL schema on RDS (this repo, 19 migrations)
On the Hub EC2, with `.env` pointing at RDS:
```bash
cd /var/www/usam-hub/backend/backend
NODE_ENV=production npx sequelize-cli db:migrate      # creates 19-table MySQL schema
NODE_ENV=production npx sequelize-cli db:seed:all      # structural seed (admin/demo self-skip in prod)
```
### De-dup matrix (VERIFIED against seeders/ + prod row counts)
| Table | Seeded by db:seed:all in prod? | Import from PG dump? | Why |
|---|---|---|---|
| communities (4) | YES (seed-communities: same 4 slugs) | **NO** | would collide on unique `slug` |
| settings (10) | YES (seed-settings) | NO (unless prod has extra keys — diff first) | structural |
| pricing_plans (3) | YES | NO | structural |
| email_templates (4) | YES | NO | structural |
| admins (3) | NO (seed-admins self-skips in prod) | **YES** (or re-provision) | real admin accounts; bcrypt hashes migrate verbatim |
| users (5) | NO | **YES** | real user accounts — the whole point |
| community_memberships (6) | NO | **YES** | real membership edges (FK users+communities) |
| feature_flags (7) | NO seeder present | **YES** | real flags |

So the PG import is scoped to: **users, admins, community_memberships, feature_flags** (+ any
settings keys that exist in prod but not in the seeder — diff before importing).
IMPORTANT ordering: load `users` and `communities` BEFORE `community_memberships` (FK).
`communities` come from the seed (ids 1–4); confirm the PG community ids line up with seed ids
1–4 by slug, and remap membership.community_id if the ids differ.

### Step 3 — Transform the PG INSERTs to MySQL (isolated scratch DB FIRST)
Use `transform.sh` (same folder). It rewrites PG `--column-inserts` to MySQL:
- `true`→`1`, `false`→`0`
- strips any `SELECT pg_catalog.setval(...)` lines
- removes schema-qualified `public.` prefixes
- leaves bcrypt hashes + ENUM strings untouched
Load into a LOCAL scratch MySQL (NOT RDS), verify, then apply to RDS.

### Step 4 — Validate (scratch, then RDS)
```sql
SELECT 'users' t, COUNT(*) FROM users UNION ALL
SELECT 'admins', COUNT(*) FROM admins UNION ALL
SELECT 'communities', COUNT(*) FROM communities UNION ALL
SELECT 'community_memberships', COUNT(*) FROM community_memberships;
-- expect 5 / 3 / 4 / 6 (minus any also produced by the structural seed)
```
Then a REAL login test against the API using one migrated user's known credentials
(or a password reset) — proves bcrypt hashes survived.
Reset AUTO_INCREMENT:
```sql
ALTER TABLE users AUTO_INCREMENT = 6;  -- = max(id)+1, per table
```

### Rollback
RDS is the new system; the PG hub_db on agent-ai stays intact + the dump files are kept.
If anything is wrong, drop/recreate the RDS schema and re-run — no production impact
(DNS still points at agent-ai until Phase 6 cutover).
