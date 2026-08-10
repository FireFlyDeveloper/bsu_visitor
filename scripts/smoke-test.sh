#!/usr/bin/env bash
# scripts/smoke-test.sh
#
# End-to-end API smoke test for the BSU Visitor backend.
# Stops the running backend, wipes the DB, seeds it, starts the server,
# runs endpoint tests, tears down.
#
# Usage:  npm run test:api        (from project root)
#         bash scripts/smoke-test.sh
#
# PORT takes precedence. When unset, use 8000 or the next available port.
set -u
export JWT_SECRET="${JWT_SECRET:-smoke-test-secret-with-at-least-32-characters}"
if [[ -n "${PORT+x}" ]]; then
  BACKEND_PORT="$PORT"
else
  BACKEND_PORT=$(node "$(dirname "$0")/select-port.mjs" 8000)
fi
BASE="http://localhost:$BACKEND_PORT"
JAR=/tmp/bsu-admin.jar
SECJAR=/tmp/bsu-sec.jar
STJAR=/tmp/bsu-staff.jar
PASS=0; FAIL=0
declare -a ROWS

[[ -f /tmp/tiny.png ]] || {
  printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > /tmp/tiny.png
}

T() {
  local label="$1" expect="$2" method="$3" path="$4" data="$5" jar="${6:-}"
  local args=(-s --max-time 5 -o /tmp/_body -w "%{http_code}" -X "$method" "$BASE$path")
  if [[ -n "$jar" ]]; then args+=(-b "$jar" -c "$jar"); fi
  if [[ -n "$data" ]]; then
    if [[ "$data" == @* ]]; then
      local rest="${data#@}"
      if [[ "$rest" == *NONIMAGE* ]]; then
        args+=(-F "img=@$(pwd)/README.md")
        rest="${rest%&NONIMAGE*}"
      else
        args+=(-F "img=@/tmp/tiny.png")
      fi
      if [[ -n "$rest" ]]; then
        IFS='&' read -ra PARTS <<< "$rest"
        for p in "${PARTS[@]}"; do args+=(-F "$p"); done
      fi
    else
      args+=(-H "Content-Type: application/json" -d "$data")
    fi
  fi
  local code; code=$(curl "${args[@]}")
  local body; body=$(cat /tmp/_body 2>/dev/null)
  if [[ "$code" == "$expect" ]]; then
    PASS=$((PASS+1))
    ROWS+=("| $label | $method $path | $expect | $code | ✅ |")
  else
    FAIL=$((FAIL+1))
    local b=""; [[ -n "$body" ]] && b=" — body: ${body:0:200}"
    ROWS+=("| $label | $method $path | $expect | $code | ❌$b |")
  fi
}
jget() { python3 -c "import json; d=json.load(open('$1')); print(d$2)"; }

echo "=== Phase 0: Re-seed DB for idempotency ==="
# Tests below create smoke-specific users and visitors; seeded sec1/staff1 are
# used for role coverage so the test does not collide with deterministic seed data.
# The smoke test owns the backend process it starts and never stops unrelated processes.
echo "[smoke] using backend port :$BACKEND_PORT"
node "$(dirname "$0")/seed-fresh.mjs" || { echo "FATAL: seed-fresh failed"; exit 1; }

echo "[smoke] starting backend on :$BACKEND_PORT..."
( cd "$(dirname "$0")/../backend" && PORT="$BACKEND_PORT" HOST=127.0.0.1 nohup node src/server.js > /tmp/bsu_backend_smoke.log 2>&1 & echo $! > /tmp/bsu_backend_smoke.pid )
for i in {1..10}; do
  sleep 1
  curl -s -o /dev/null --max-time 1 "http://localhost:$BACKEND_PORT/api/health" && break
  [[ $i -eq 10 ]] && { echo "FATAL: backend did not start"; cat /tmp/bsu_backend_smoke.log; exit 1; }
done
echo "[smoke] backend ready (pid $(cat /tmp/bsu_backend_smoke.pid))"

cleanup() {
  echo
  echo "[smoke] tearing down backend pid $(cat /tmp/bsu_backend_smoke.pid 2>/dev/null)"
  [[ -f /tmp/bsu_backend_smoke.pid ]] && kill "$(cat /tmp/bsu_backend_smoke.pid)" 2>/dev/null
}
trap cleanup EXIT

echo "=== Phase 1: Public + auth ==="
T "health" 200 GET /api/health "" ""
T "admin login" 200 POST /api/users/login '{"username":"admin","password":"admin123"}' "$JAR"
T "me (admin)" 200 GET /api/users/me "" "$JAR"
T "public offices" 200 GET /api/public/offices "" ""
T "admin grace settings" 200 GET /api/mvp/settings "" "$JAR"

echo
echo "=== Phase 2: Admin writes ==="
T "create smoke security user" 201 POST /api/users '{"fullname":"Test Sec","username":"smoke-sec","password":"secret123","role_id":2}' "$JAR"
T "create smoke staff user" 201 POST /api/users '{"fullname":"Test Staff","username":"smoke-staff","password":"secret123","role_id":3,"office_id":1}' "$JAR"
T "create visitor" 201 POST /api/visitors '{"fullname":"Juan","contact_number":"0917","address":"Batangas"}' "$JAR"
VID=$(jget /tmp/_body '["visitorId"]')
echo "Visitor ID = $VID"
T "public self-registration" 201 POST /api/public/office/1/register '{"fullname":"Public Juan","contact_number":"09170000001","address":"Batangas","purpose":"Inquiry"}' ""
TOKEN=$(jget /tmp/_body '["access_token"]')
T "public token lookup" 200 GET "/api/mvp/visits/$TOKEN" "" ""
T "public registration idempotency" 200 POST /api/public/office/1/register '{"fullname":"Public Juan","contact_number":"09170000001","address":"Batangas","purpose":"Inquiry"}' ""

echo
echo "=== Phase 3: Visit lifecycle (with image) ==="
T "register visit" 201 POST /api/visit-logs/register "@visitor_id=$VID&office_id=1&purpose=Test" "$JAR"
T "visit-logs/1" 200 GET /api/visit-logs/1 "" "$JAR"
T "complete visit" 200 PATCH "/api/visitor-status/1/status" '{"status":"completed"}' "$JAR"

echo
echo "=== Phase 5: Negative validations ==="
T "duplicate username" 409 POST /api/users '{"fullname":"X","username":"smoke-sec","password":"secret123","role_id":2}' "$JAR"
T "short password" 400 POST /api/users '{"fullname":"X","username":"tiny","password":"abc","role_id":2}' "$JAR"
T "staff w/o office" 400 POST /api/users '{"fullname":"X","username":"nooff","password":"secret123","role_id":3}' "$JAR"
T "non-image upload -> 400" 400 POST /api/visit-logs/register "@visitor_id=$VID&office_id=1&purpose=x&NONIMAGE" "$JAR"

echo
echo "=== Phase 6: Role enforcement ==="
T "sec1 login" 200 POST /api/users/login '{"username":"sec1","password":"secret123"}' "$SECJAR"
T "sec1 -> security/visitors/active (allowed)" 200 GET /api/security-guard/visitors/active "" "$SECJAR"
T "sec1 -> office status (allowed)" 200 PATCH /api/security-guard/office/1/status '{"status":"closed"}' "$SECJAR"
T "security push subscription abstraction" 201 POST /api/mvp/push-subscriptions '{"audience":"security","subscription":{"endpoint":"https://push.example.test/smoke","keys":{"p256dh":"x","auth":"y"}}}' "$SECJAR"
T "sec1 -> list users (forbidden)" 403 GET /api/users "" "$SECJAR"
T "sec1 -> create user (forbidden)" 403 POST /api/users '{"fullname":"X","username":"y","password":"secret123","role_id":2}' "$SECJAR"
T "staff login" 200 POST /api/users/login '{"username":"staff1","password":"secret123"}' "$STJAR"
T "staff -> list users (forbidden)" 403 GET /api/users "" "$STJAR"
T "staff -> create user (forbidden)" 403 POST /api/users '{"fullname":"X","username":"newone","password":"secret123","role_id":2}' "$STJAR"
T "staff -> security route (forbidden)" 403 GET /api/security-guard/visitors/active "" "$STJAR"
T "staff -> offices (allowed)" 200 GET /api/offices "" "$STJAR"
T "staff -> all visit-logs (forbidden)" 403 GET /api/visit-logs "" "$STJAR"

echo
echo "=== Phase 7: Kiosk + office done + guard sign-out + overdue ==="

# Kiosk register: must have photo + address + office
T "kiosk register (sec1, with photo)" 201 POST /api/security-guard/kiosk/register "@fullname=KioskTest&contact_number=09179999999&address=Test&office_id=1&purpose=Inquiry" "$SECJAR"
KID=$(jget /tmp/_body '["logId"]')
echo "Kiosk logId = $KID"

# Kiosk register missing required fields
T "kiosk register missing fields" 400 POST /api/security-guard/kiosk/register '{"contact_number":"0917"}' "$SECJAR"
T "kiosk register no photo" 400 POST /api/security-guard/kiosk/register '{"fullname":"X","contact_number":"0917","address":"X","office_id":1}' "$SECJAR"

# Kiosk forbidden for non-security
T "non-sec kiosk (forbidden)" 403 POST /api/security-guard/kiosk/register '{"fullname":"X","contact_number":"0917","address":"X","office_id":1}' "$STJAR"

# Overdue list before mark-done (visit 1 is already completed; should appear)
# NOTE: the overdue query enforces a 30-min window, so a freshly-completed
# visit won't appear. Stop the backend, back-date the row, restart, then check.
echo "[smoke] back-dating visit 1 to trigger overdue (30-min window)..."
kill "$(cat /tmp/bsu_backend_smoke.pid)" 2>/dev/null
sleep 1
( cd backend && node --input-type=module -e "import Database from 'better-sqlite3'; const db = new Database('./src/database/database.db'); db.prepare(\"UPDATE visit_logs SET time_out = datetime('now','-45 minutes'), status='completed' WHERE id=1\").run(); db.close();" )
( cd backend && PORT="$BACKEND_PORT" HOST=127.0.0.1 nohup node src/server.js > /tmp/bsu_backend_smoke.log 2>&1 & echo $! > /tmp/bsu_backend_smoke.pid )
for i in {1..10}; do
  sleep 1
  curl -s -o /dev/null --max-time 1 "http://localhost:$BACKEND_PORT/api/health" && break
done
T "overdue list contains visit 1" 200 GET /api/visit-logs/overdue '' "$SECJAR"
# Verify the JSON has at least 1 entry
OVERDUE_TOTAL=$(jget /tmp/_body '["total"]')
if [[ "$OVERDUE_TOTAL" -lt 1 ]]; then
  FAIL=$((FAIL+1))
  ROWS+=("| overdue list has rows | GET /api/visit-logs/overdue | >=1 | $OVERDUE_TOTAL | ❌ |")
else
  PASS=$((PASS+1))
  ROWS+=("| overdue list has rows | GET /api/visit-logs/overdue | >=1 | $OVERDUE_TOTAL | ✅ |")
fi

# Staff marks done (kiosk visit)
T "staff mark done (kiosk visit)" 200 PATCH "/api/visit-logs/$KID/done" '{}' "$STJAR"

# Non-staff tries to mark done
T "non-staff mark done (forbidden)" 403 PATCH "/api/visit-logs/$KID/done" '{}' "$SECJAR"

# Mark already-completed is 409
T "mark already-done (conflict)" 409 PATCH "/api/visit-logs/$KID/done" '{}' "$STJAR"

# Guard sign-out
T "guard sign out (sec1)" 200 PATCH "/api/security-guard/visit-logs/$KID/sign-out" '{}' "$SECJAR"
T "double sign-out (conflict)" 409 PATCH "/api/security-guard/visit-logs/$KID/sign-out" '{}' "$SECJAR"
T "non-sec sign-out (forbidden)" 403 PATCH "/api/security-guard/visit-logs/$KID/sign-out" '{}' "$STJAR"

# Sign out a not-completed visit (visit 1 is completed, so use a fresh kiosk registration)
T "kiosk register 2 (for sign-out test)" 201 POST /api/security-guard/kiosk/register "@fullname=PhotoVisit&contact_number=09179999998&address=Test&office_id=1&purpose=Delivery" "$SECJAR"
KID2=$(jget /tmp/_body '["logId"]')
T "sign-out before mark-done (conflict)" 409 PATCH "/api/security-guard/visit-logs/$KID2/sign-out" '{}' "$SECJAR"

echo
echo "## Results"
echo "| # | Endpoint | Expected | Got | Status |"
echo "|---|----------|----------|-----|--------|"
for r in "${ROWS[@]}"; do echo "$r"; done
echo
echo "**PASS: $PASS  FAIL: $FAIL** (of $((PASS+FAIL)))"

# Exit with failure code if any test failed, so CI / npm run fails properly
[[ $FAIL -eq 0 ]] || exit 1
