# End-to-end data-migration self-test (Windows/pwsh + Docker).
# Proves transform.js on a realistic PG fixture -> isolated MySQL built from THIS
# repo's real migrations. No production system is touched. Throwaway containers.
#
#   Run from repo root:  pwsh backend/deploy/data-migration/test/run-test.ps1
$ErrorActionPreference = 'Stop'
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$dmDir  = Split-Path -Parent $here
$beDir  = 'm:\HUb_comunites\backend\backend'
$pgName = 'hub-mig-test-pg'
$myName = 'hub-mig-test-mysql'
$work   = Join-Path $env:TEMP 'hub-mig-test'
New-Item -Force -ItemType Directory $work | Out-Null

function Cleanup {
  docker rm -f $pgName $myName 2>$null | Out-Null
}
Cleanup

try {
  Write-Host "== 1/7 start throwaway Postgres 16 ==" -ForegroundColor Cyan
  docker run -d --name $pgName -e POSTGRES_PASSWORD=testpg -e POSTGRES_DB=hub_db -p 55499:5432 postgres:16-alpine | Out-Null
  Write-Host "== 2/7 start throwaway MySQL 8 ==" -ForegroundColor Cyan
  docker run -d --name $myName -e MYSQL_ROOT_PASSWORD=testmy -e MYSQL_DATABASE=hub_scratch -p 33099:3306 mysql:8.0 | Out-Null

  Write-Host "== wait for DBs ==" -ForegroundColor Cyan
  foreach ($i in 1..40) { docker exec $pgName pg_isready -U postgres 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 1 }
  foreach ($i in 1..60) { docker exec $myName mysqladmin ping -uroot -ptestmy --silent 2>$null | Out-Null; if ($LASTEXITCODE -eq 0) { break }; Start-Sleep 1 }
  Start-Sleep 3

  Write-Host "== 3/7 load PG fixture ==" -ForegroundColor Cyan
  Get-Content (Join-Path $here 'pg_fixture.sql') -Raw | docker exec -i $pgName psql -U postgres -d hub_db -v ON_ERROR_STOP=1 | Out-Null

  Write-Host "== PG source row counts ==" -ForegroundColor Cyan
  docker exec $pgName psql -U postgres -d hub_db -t -c "SELECT 'users',count(*) FROM users UNION ALL SELECT 'admins',count(*) FROM admins UNION ALL SELECT 'communities',count(*) FROM communities UNION ALL SELECT 'community_memberships',count(*) FROM community_memberships UNION ALL SELECT 'settings',count(*) FROM settings UNION ALL SELECT 'feature_flags',count(*) FROM feature_flags UNION ALL SELECT 'email_templates',count(*) FROM email_templates UNION ALL SELECT 'pricing_plans',count(*) FROM pricing_plans;"

  Write-Host "== 4/7 pg_dump --column-inserts ==" -ForegroundColor Cyan
  docker exec $pgName pg_dump -U postgres -d hub_db --data-only --inserts --column-inserts `
    -t users -t admins -t communities -t community_memberships -t settings -t feature_flags -t email_templates -t pricing_plans `
    | Out-File -Encoding utf8 (Join-Path $work 'pg_data.sql')

  Write-Host "== 5/7 transform (ALL tables, for full reconciliation) ==" -ForegroundColor Cyan
  node (Join-Path $dmDir 'transform.js') (Join-Path $work 'pg_data.sql') --all `
    | Out-File -Encoding utf8 (Join-Path $work 'my_data.sql')

  Write-Host "== 6/7 build scratch MySQL schema from THIS repo's migrations ==" -ForegroundColor Cyan
  # minimal env for sequelize-cli pointed at the scratch MySQL
  $env:NODE_ENV='development'; $env:DB_HOST='127.0.0.1'; $env:DB_PORT='33099'
  $env:DB_USER='root'; $env:DB_PASSWORD='testmy'; $env:DB_NAME='hub_scratch'
  Push-Location $beDir
  npx sequelize-cli db:migrate 2>&1 | Select-Object -Last 3
  Pop-Location

  Write-Host "== load transformed data into scratch MySQL ==" -ForegroundColor Cyan
  Get-Content (Join-Path $work 'my_data.sql') -Raw | docker exec -i $myName mysql -uroot -ptestmy --default-character-set=utf8mb4 hub_scratch

  Write-Host "== 7/7 RECONCILE (MySQL counts must equal PG) ==" -ForegroundColor Green
  docker exec $myName mysql -uroot -ptestmy -N -e "USE hub_scratch; SELECT 'users',COUNT(*) FROM users UNION ALL SELECT 'admins',COUNT(*) FROM admins UNION ALL SELECT 'communities',COUNT(*) FROM communities UNION ALL SELECT 'community_memberships',COUNT(*) FROM community_memberships UNION ALL SELECT 'settings',COUNT(*) FROM settings UNION ALL SELECT 'feature_flags',COUNT(*) FROM feature_flags UNION ALL SELECT 'email_templates',COUNT(*) FROM email_templates UNION ALL SELECT 'pricing_plans',COUNT(*) FROM pricing_plans;"

  Write-Host "== spot-checks: Unicode, NULL, bool, enum, bcrypt, FK integrity ==" -ForegroundColor Green
  # Each check as its own -e to avoid nested backtick/quote mangling. `key` is a
  # reserved word -> wrap the whole query in single quotes and backtick the column.
  $checks = @(
    "SELECT CONCAT('arabic_user=', first_name) FROM users WHERE username='laila'",
    "SELECT CONCAT('null_hash_ok=', IF(password_hash IS NULL,'YES','NO')) FROM users WHERE username='omarf'",
    "SELECT CONCAT('bool_softdeleted=', is_deleted) FROM users WHERE username='deleted1'",
    "SELECT CONCAT('enum_status=', status) FROM users WHERE username='nour'",
    "SELECT CONCAT('bcrypt_prefix_ok=', IF(password_hash LIKE '\$2b\$%','YES','NO')) FROM users WHERE username='melwazeer'",
    "SELECT CONCAT('prodmod_members=', members_count) FROM communities WHERE slug='launchpad'",
    "SELECT CONCAT('prodonly_setting=', value) FROM settings WHERE ``key``='custom_prod_key'",
    "SELECT CONCAT('ar_email_tpl=', subject) FROM email_templates WHERE name='ar_welcome'",
    "SELECT CONCAT('json_setting_ok=', IF(value LIKE '%comma%','YES','NO')) FROM settings WHERE ``key``='json_setting'",
    "SELECT CONCAT('orphan_memberships=', COUNT(*)) FROM community_memberships m LEFT JOIN users u ON u.id=m.user_id LEFT JOIN communities c ON c.id=m.community_id WHERE u.id IS NULL OR c.id IS NULL"
  )
  foreach ($q in $checks) {
    docker exec $myName mysql -uroot -ptestmy -N --default-character-set=utf8mb4 -e "USE hub_scratch; $q" 2>$null
  }
  Write-Host "== Unicode byte-level proof (HEX of Arabic first_name 'laila') ==" -ForegroundColor Green
  # Expect D984D98AD984D989 = 'ليلى' in UTF-8. Proves bytes survived, independent of console code page.
  docker exec $myName mysql -uroot -ptestmy -N --default-character-set=utf8mb4 -e "USE hub_scratch; SELECT CONCAT('arabic_hex=', HEX(first_name)) FROM users WHERE username='laila';" 2>$null

  Write-Host "`nSELF-TEST COMPLETE. Compare the two count blocks above (must match)." -ForegroundColor Yellow
}
finally {
  Write-Host "== cleanup throwaway containers ==" -ForegroundColor DarkGray
  Cleanup
}
