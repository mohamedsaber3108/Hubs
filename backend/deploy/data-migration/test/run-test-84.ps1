# MySQL 8.4 LTS compatibility + migration self-test (Windows/pwsh + Docker).
# Proves, in an ISOLATED throwaway MySQL 8.4 container, that THIS repo's:
#   (1) 19 Sequelize migrations apply cleanly on 8.4,
#   (2) structural seeders run on 8.4,
#   (3) transform.js output (PG fixture) loads into the 8.4 schema,
#   (4) Arabic UTF-8 survives at the BYTE level, FK integrity holds, and
#       booleans/enums/NULL/JSON/bcrypt are preserved.
# No AWS, no production system touched. Container is removed at the end.
#
#   Run from repo root:  pwsh backend/deploy/data-migration/test/run-test-84.ps1
$ErrorActionPreference = 'Stop'
# BYTE-SAFETY: pg_dump/mysql emit/consume raw UTF-8 bytes. A non-UTF-8 console
# code page (e.g. CP437/CP1252) makes PowerShell mangle multibyte chars (Arabic)
# when native-process output flows through a pipe. Force UTF-8 end-to-end AND
# avoid byte-through-pipe by redirecting docker output straight to files.
# Byte-safety strategy: we do NOT pipe native-process (pg_dump/mysql) bytes through
# the PowerShell pipeline at all. All DB I/O uses `docker cp` of files + in-container
# redirection (see stages 5/6), so the Windows console code page is irrelevant to the
# Arabic bytes. We only set .NET stream encoding (no chcp — chcp corrupts the host).
$OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8NoBOM'
$here  = Split-Path -Parent $MyInvocation.MyCommand.Path
$dmDir = Split-Path -Parent $here
$beDir = Join-Path (Resolve-Path (Join-Path $here '..\..\..\..')) 'backend\backend'
$pgName = 'hub-mig84-pg'
$myName = 'hub-mig84-mysql'
$work   = Join-Path $env:TEMP 'hub-mig84'
New-Item -Force -ItemType Directory $work | Out-Null

$script:FAILED = $false
function Check($label, $cond) {
  if ($cond) { Write-Host "  [PASS] $label" -ForegroundColor Green }
  else { Write-Host "  [FAIL] $label" -ForegroundColor Red; $script:FAILED = $true }
}
function Cleanup { docker rm -f $pgName $myName 2>$null | Out-Null }
Cleanup

try {
  Write-Host "== 1/8 start throwaway Postgres 16 (migration source) ==" -ForegroundColor Cyan
  docker run -d --name $pgName -e POSTGRES_PASSWORD=testpg -e POSTGRES_DB=hub_db -p 55599:5432 postgres:16-alpine | Out-Null

  Write-Host "== 2/8 start throwaway MySQL 8.4 LTS (migration target) ==" -ForegroundColor Cyan
  docker run -d --name $myName -e MYSQL_ROOT_PASSWORD=testmy -e MYSQL_DATABASE=usam_hub_test -p 33199:3306 mysql:8.4 | Out-Null

  Write-Host "== wait for both DBs ==" -ForegroundColor Cyan
  foreach ($i in 1..60) { docker exec $pgName pg_isready -U postgres 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 1 }
  # Wait until MySQL actually answers a real query (ping can succeed before the server accepts auth).
  $mysqlVer = ''
  foreach ($i in 1..120) {
    $v = (docker exec $myName mysql -uroot -ptestmy -N -e "SELECT VERSION();" 2>$null | Out-String).Trim()
    if ($v -match '^\d+\.\d+') { $mysqlVer = $v; break }
    Start-Sleep 2
  }
  Write-Host "  MySQL engine reports: $mysqlVer"
  Check "MySQL engine is 8.4.x" ($mysqlVer -like '8.4.*')

  Write-Host "== 3/8 run REAL 19 Sequelize migrations against MySQL 8.4 ==" -ForegroundColor Cyan
  $env:NODE_ENV='test'; $env:DB_HOST='127.0.0.1'; $env:DB_PORT='33199'
  $env:DB_USER='root'; $env:DB_PASSWORD='testmy'; $env:DB_NAME_TEST='usam_hub_test'
  Push-Location $beDir
  $mig = npx sequelize-cli db:migrate 2>&1
  $migText = $mig -join "`n"
  Write-Host ($mig | Select-Object -Last 4)
  Check "migrations applied with no error" ($LASTEXITCODE -eq 0 -and $migText -notmatch 'ERROR')
  $tableCount = (docker exec $myName mysql -uroot -ptestmy -N -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='usam_hub_test';" 2>$null).Trim()
  Write-Host "  tables created: $tableCount"
  Check "schema has tables (>=15)" ([int]$tableCount -ge 15)

  Write-Host "== 4/8 run structural seeders against MySQL 8.4 ==" -ForegroundColor Cyan
  $seed = npx sequelize-cli db:seed:all 2>&1
  $seedText = $seed -join "`n"
  Write-Host ($seed | Select-Object -Last 4)
  Check "seeders ran with no error" ($LASTEXITCODE -eq 0 -and $seedText -notmatch 'ERROR')
  Pop-Location

  Write-Host "== 5/8 load PG fixture, dump, transform (--all) ==" -ForegroundColor Cyan
  # Byte-safe: copy fixture INTO the container and run psql there (no stdin pipe of bytes).
  docker cp (Join-Path $here 'pg_fixture.sql') "${pgName}:/tmp/pg_fixture.sql" | Out-Null
  docker exec $pgName psql -U postgres -d hub_db -v ON_ERROR_STOP=1 -f /tmp/pg_fixture.sql | Out-Null
  # Byte-safe: dump to a file INSIDE the container, then docker cp out (bytes never touch the PS pipe).
  docker exec $pgName sh -c "pg_dump -U postgres -d hub_db --data-only --inserts --column-inserts -t users -t admins -t communities -t community_memberships -t settings -t feature_flags -t email_templates -t pricing_plans > /tmp/pg_data.sql" | Out-Null
  docker cp "${pgName}:/tmp/pg_data.sql" (Join-Path $work 'pg_data.sql') | Out-Null
  # transform.js writes the file ITSELF via Node fs (real UTF-8 bytes) using --out,
  # so Arabic never passes through the PowerShell/stdout pipe.
  node (Join-Path $dmDir 'transform.js') (Join-Path $work 'pg_data.sql') --all --out (Join-Path $work 'my_data.sql')
  Check "transform produced output" (Test-Path (Join-Path $work 'my_data.sql'))

  Write-Host "== 6/8 TRUNCATE seeded rows, load transformed PG data into REAL schema ==" -ForegroundColor Cyan
  # The migration-imported tables are loaded fresh from PG; truncate seeded rows first so
  # the fixture's production rows land in the real migrated schema without PK collisions.
  $truncate = @"
SET FOREIGN_KEY_CHECKS=0;
TRUNCATE users; TRUNCATE admins; TRUNCATE communities; TRUNCATE community_memberships;
TRUNCATE settings; TRUNCATE feature_flags; TRUNCATE email_templates; TRUNCATE pricing_plans;
SET FOREIGN_KEY_CHECKS=1;
"@
  [System.IO.File]::WriteAllText((Join-Path $work 'truncate.sql'), $truncate, [System.Text.UTF8Encoding]::new($false))
  # Byte-safe load: copy files INTO the container and source them with mysql (no byte pipe).
  docker cp (Join-Path $work 'truncate.sql') "${myName}:/tmp/truncate.sql" | Out-Null
  docker cp (Join-Path $work 'my_data.sql') "${myName}:/tmp/my_data.sql" | Out-Null
  docker exec $myName sh -c "mysql -uroot -ptestmy --default-character-set=utf8mb4 usam_hub_test < /tmp/truncate.sql" 2>$null
  docker exec $myName sh -c "mysql -uroot -ptestmy --default-character-set=utf8mb4 usam_hub_test < /tmp/my_data.sql" 2>&1 | Out-Null

  Write-Host "== 7/8 RECONCILE row counts (PG source vs MySQL 8.4 target) ==" -ForegroundColor Cyan
  $tables = 'users','admins','communities','community_memberships','settings','feature_flags','email_templates','pricing_plans'
  foreach ($t in $tables) {
    $pg = ((docker exec $pgName psql -U postgres -d hub_db -t -c "SELECT COUNT(*) FROM $t;" 2>$null) | Out-String).Trim()
    $my = ((docker exec $myName mysql -uroot -ptestmy -N -e "SELECT COUNT(*) FROM usam_hub_test.$t;" 2>$null) | Out-String).Trim()
    Check "reconcile ${t}: PG=$pg MySQL=$my" ($pg -eq $my -and $pg -ne '')
  }

  Write-Host "== 8/8 data-fidelity spot checks on MySQL 8.4 ==" -ForegroundColor Cyan
  function MyQ($q) { ((docker exec $myName mysql -uroot -ptestmy -N --default-character-set=utf8mb4 -e "USE usam_hub_test; $q" 2>$null) | Out-String).Trim() }
  $arabicHex = MyQ "SELECT HEX(first_name) FROM users WHERE username='laila';"
  Write-Host "  arabic_hex(laila.first_name) = $arabicHex  (expect D984D98AD984D989 = U+0644 U+064A U+0644 U+0649)"
  Check "Arabic UTF-8 preserved at byte level" ($arabicHex -eq 'D984D98AD984D989')
  $nullHash = MyQ "SELECT IF(password_hash IS NULL,'YES','NO') FROM users WHERE username='omarf';"
  Check "NULL password_hash preserved" ($nullHash -eq 'YES')
  $bcrypt = MyQ "SELECT IF(password_hash LIKE '\$2b\$%','YES','NO') FROM users WHERE username='melwazeer';"
  Check "bcrypt hash intact (\$2b\$ prefix)" ($bcrypt -eq 'YES')
  $enum = MyQ "SELECT status FROM users WHERE username='nour';"
  Check "enum value preserved (suspended)" ($enum -eq 'suspended')
  $bool = MyQ "SELECT is_deleted FROM users WHERE username='deleted1';"
  Check "boolean TRUE -> 1 preserved" ($bool -eq '1')
  $prodMembers = MyQ "SELECT members_count FROM communities WHERE slug='launchpad';"
  Check "production-modified value preserved (members_count=15999)" ($prodMembers -eq '15999')
  $jsonComma = MyQ "SELECT IF(value LIKE '%comma%','YES','NO') FROM settings WHERE ``key``='json_setting';"
  Check "JSON with embedded comma preserved" ($jsonComma -eq 'YES')
  $orphans = MyQ "SELECT COUNT(*) FROM community_memberships m LEFT JOIN users u ON u.id=m.user_id LEFT JOIN communities c ON c.id=m.community_id WHERE u.id IS NULL OR c.id IS NULL;"
  Check "FK integrity: 0 orphan memberships" ($orphans -eq '0')
  $charset = MyQ "SELECT CCSA.character_set_name FROM information_schema.``TABLES`` T JOIN information_schema.``COLLATION_CHARACTER_SET_APPLICABILITY`` CCSA ON CCSA.collation_name=T.table_collation WHERE T.table_schema='usam_hub_test' AND T.table_name='users';"
  Write-Host "  users table charset = $charset"
  Check "users table is utf8mb4" ($charset -eq 'utf8mb4')

  Write-Host ""
  if ($script:FAILED) { Write-Host "RESULT: FAIL — MySQL 8.4 compatibility NOT proven. See [FAIL] lines." -ForegroundColor Red }
  else { Write-Host "RESULT: PASS — migrations, seeders, transform, Arabic UTF-8, and FK integrity all verified on MySQL 8.4." -ForegroundColor Green }
}
finally {
  Write-Host "== cleanup throwaway containers ==" -ForegroundColor DarkGray
  Cleanup
}
