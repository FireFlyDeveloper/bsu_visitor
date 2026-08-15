#!/usr/bin/env bash
# scripts/integration-test.sh
#
# Full integration test: drives a real visitor lifecycle through the API the
# same way the Vue frontend does, including the previously-untested overdue
# path (forces a visit to be overdue by directly back-dating time_out in the DB).
#
# Usage:  bash scripts/integration-test.sh
# Assumes: backend is running on $BASE, DB freshly seeded.

set -u
BASE="${BASE:-http://localhost:8765}"
JAR=/tmp/bsu-admin.jar
SECJAR=/tmp/bsu-sec.jar
STJAR=/tmp/bsu-staff.jar
PASS=0; FAIL=0
declare -a ROWS
DB="/root/tmp/bsu_visitor/backend/src/database/database.db"

# ck LABEL EXPECTED METHOD PATH [JAR] [JSON_DATA]
# JAR is required for auth; pass "" for public endpoints.
# JSON_DATA is optional; pass "" or omit.
ck() {
  local label="$1" exp="$2" method="$3" path="$4"
  local jar="${5-}" data="${6-}"
  local args=(-s --max-time 5 -o /tmp/_body -w "%{http_code}" -X "$method" "$BASE$path")
  [[ -n "$jar"  ]] && args+=(-b "$jar" -c "$jar")
  [[ -n "$data" ]] && args+=(-H "Content-Type: application/json" -d "$data")
  local got; got=$(curl "${args[@]}")
  if [[ "$exp" == "$got" ]]; then
    PASS=$((PASS+1))
    ROWS+=("| $label | $exp | $got | ✅ |")
  else
    FAIL=$((FAIL+1))
    local b=""; [[ -s /tmp/_body ]] && b=" — body: $(head -c 200 /tmp/_body)"
    ROWS+=("| $label | $exp | $got | ❌$b |")
  fi
}
# Multipart ck — manually handles -F fields via $@ after label/expected/path
multipart_ck() {
  local label="$1" exp="$2" path="$3" jar="$4"; shift 4
  local args=(-s --max-time 5 -o /tmp/_body -w "%{http_code}" -X POST "$BASE$path")
  [[ -n "$jar" ]] && args+=(-b "$jar" -c "$jar")
  # remaining args are -F field specs
  local got; got=$(curl "${args[@]}" "$@")
  if [[ "$exp" == "$got" ]]; then
    PASS=$((PASS+1))
    ROWS+=("| $label | $exp | $got | ✅ |")
  else
    FAIL=$((FAIL+1))
    local b=""; [[ -s /tmp/_body ]] && b=" — body: $(head -c 200 /tmp/_body)"
    ROWS+=("| $label | $exp | $got | ❌$b |")
  fi
}
jget() { python3 -c "import json; d=json.load(open('$1')); print(d$2)"; }

# 1×1 PNG
[[ -f /tmp/tiny.png ]] || printf '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89\x00\x00\x00\rIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82' > /tmp/tiny.png

rm -f "$JAR" "$SECJAR" "$STJAR"

# Re-seed the DB so sec1/staff1 don't already exist. This requires the
# backend to release the SQLite file handle — we kill any running instance,
# wipe, then bring the backend back up before continuing.
echo "[integration] stopping any running backend..."
pkill -f "node src/server.js" 2>/dev/null
sleep 1
node "$(dirname "$0")/seed-fresh.mjs" 2>&1 | tail -1 || { echo "FATAL: seed-fresh failed"; exit 1; }

echo "[integration] starting backend on :${PORT:-8765}..."
( cd "$(dirname "$0")/../backend" && nohup node src/server.js > /tmp/bsu_backend_int.log 2>&1 & echo $! > /tmp/bsu_backend_int.pid )
for i in {1..10}; do
  sleep 1
  curl -s -o /dev/null --max-time 1 "http://localhost:${PORT:-8765}/api/health" && break
  [[ $i -eq 10 ]] && { echo "FATAL: backend did not start"; cat /tmp/bsu_backend_int.log; exit 1; }
done
echo "[integration] backend ready (pid $(cat /tmp/bsu_backend_int.pid))"

echo "=== Frontend-realistic flow: every API the Vue client touches ==="
echo

# --- Public bootstrap (no-auth, served by publicHomeRoutes.js) ---
ck "health"                       200 GET  /api/health "" ""
ck "GET /api/public-home/offices"   200 GET  /api/public-home/offices "" ""
ck "GET /api/public-home/visitors/active" 200 GET /api/public-home/visitors/active "" ""

# --- Admin session ---
ck "admin login"                  200 POST /api/users/login "$JAR" '{"username":"admin","password":"admin123"}'
ck "GET /api/users/me (admin)"    200 GET  /api/users/me "$JAR"
ck "GET /api/users"               200 GET  /api/users "$JAR"
ck "GET /api/roles"               200 GET  /api/roles "$JAR"
ck "POST /api/users sec1"         201 POST /api/users "$JAR" '{"fullname":"Test Sec","username":"sec1","password":"secret123","role_id":2}'
ck "POST /api/users staff1"       201 POST /api/users "$JAR" '{"fullname":"Test Staff","username":"staff1","password":"secret123","role_id":3,"office_id":1}'
ck "GET /api/users (with sec1+staff1)" 200 GET /api/users "$JAR"
ck "PUT /api/users/2 (edit sec1)" 200 PUT  /api/users/2 "$JAR" '{"fullname":"Edited Sec"}'

# --- Staff session ---
ck "staff login"                  200 POST /api/users/login "$STJAR" '{"username":"staff1","password":"secret123"}'
ck "GET /api/users/me (staff)"    200 GET  /api/users/me "$STJAR"
ck "GET /api/visit-logs (staff)"  200 GET  /api/visit-logs "$STJAR"
ck "GET /api/visitors (staff)"    200 GET  /api/visitors "$STJAR"

# --- Security session ---
ck "sec1 login"                   200 POST /api/users/login "$SECJAR" '{"username":"sec1","password":"secret123"}'
ck "GET /api/users/me (sec1)"     200 GET  /api/users/me "$SECJAR"

# Multipart upload (kiosk)
multipart_ck "kiosk register (multipart w/ photo)" 201 "/api/security-guard/kiosk/register" "$SECJAR" \
  -F "fullname=IntegrationVisitor" -F "contact_number=09170000001" \
  -F "address=BSU Main" -F "office_id=1" -F "purpose=Test" \
  -F "img=@/tmp/tiny.png"
LOG_ID=$(jget /tmp/_body '["logId"]')
echo "  → log_id = $LOG_ID"

# Re-register the same visitor (same contact_number) — this hits the
# create-or-find path's UPDATE branch. Regression test for the
# `NOT NULL constraint failed: visitors.fullname` bug where Visitor.update
# was setting all 5 columns to NULL except the supplied field.
multipart_ck "kiosk re-register (same contact_number, hits Visitor.update)" 201 "/api/security-guard/kiosk/register" "$SECJAR" \
  -F "fullname=IntegrationVisitor" -F "contact_number=09170000001" \
  -F "address=BSU Main" -F "office_id=1" -F "purpose=Repeat" \
  -F "img=@/tmp/tiny.png"
LOG_ID_REPEAT=$(jget /tmp/_body '["logId"]')
echo "  → repeat log_id = $LOG_ID_REPEAT (visitor row unchanged, new log row)"

# Kiosk negative cases
ck "kiosk register (missing fields, 400)" 400 POST /api/security-guard/kiosk/register "$SECJAR" '{}'
# Kiosk as staff (forbidden)
multipart_ck "kiosk register (staff forbidden, 403)" 403 "/api/security-guard/kiosk/register" "$STJAR" \
  -F "fullname=X" -F "contact_number=1" -F "address=X" -F "office_id=1" -F "purpose=X" -F "img=@/tmp/tiny.png"

# Staff marks visit done
ck "PATCH /api/visit-logs/$LOG_ID/done (staff)"   200 PATCH "/api/visit-logs/$LOG_ID/done" "$STJAR" '{}'
ck "PATCH /api/visit-logs/$LOG_ID/done (sec1 forbidden)" 403 PATCH "/api/visit-logs/$LOG_ID/done" "$SECJAR" '{}'
ck "PATCH /api/visit-logs/$LOG_ID/done (idempotent 409)" 409 PATCH "/api/visit-logs/$LOG_ID/done" "$STJAR" '{}'

# Force overdue: back-date time_out to 45 min ago via the API path.
# We have to stop the backend first because sqlite3 CLI cannot grab the
# file handle while better-sqlite3 is holding it (SQLITE_BUSY).
echo "[integration] stopping backend to back-date time_out for overdue test..."
pkill -f "node src/server.js" 2>/dev/null
sleep 1
sqlite3 "$DB" "UPDATE visit_logs SET time_out = datetime('now','-45 minutes'), exit_deadline = datetime('now','-45 minutes'), status='completed' WHERE id=$LOG_ID;"
echo "[integration] restarting backend..."
( cd "$(dirname "$0")/../backend" && nohup node src/server.js > /tmp/bsu_backend_int.log 2>&1 & echo $! > /tmp/bsu_backend_int.pid )
for i in {1..10}; do
  sleep 1
  curl -s -o /dev/null --max-time 1 "http://localhost:${PORT:-8765}/api/health" && break
  [[ $i -eq 10 ]] && { echo "FATAL: backend did not start"; cat /tmp/bsu_backend_int.log; exit 1; }
done
echo "[integration] backend back up"
ck "GET /api/visit-logs/overdue"   200 GET  /api/visit-logs/overdue "$SECJAR"
OT=$(jget /tmp/_body '["total"]')
if [[ "$OT" == "1" ]]; then PASS=$((PASS+1)); ROWS+=("| overdue list has 1 row | 1 | $OT | ✅ |")
else FAIL=$((FAIL+1)); ROWS+=("| overdue list has 1 row | 1 | $OT | ❌ body: $(head -c 200 /tmp/_body) |"); fi
HAS=$(python3 -c "import json; d=json.load(open('/tmp/_body')); print(1 if any(v['id']==$LOG_ID for v in d['overdue']) else 0)")
if [[ "$HAS" == "1" ]]; then PASS=$((PASS+1)); ROWS+=("| overdue list contains log $LOG_ID | 1 | $HAS | ✅ |")
else FAIL=$((FAIL+1)); ROWS+=("| overdue list contains log $LOG_ID | 1 | $HAS | ❌ |"); fi

# Sign out the overdue visit
ck "PATCH sign-out (sec1)"                     200 PATCH "/api/security-guard/visit-logs/$LOG_ID/sign-out" "$SECJAR" '{}'
ck "PATCH sign-out (idempotent 409)"           409 PATCH "/api/security-guard/visit-logs/$LOG_ID/sign-out" "$SECJAR" '{}'
ck "PATCH sign-out (staff forbidden)"          403 PATCH "/api/security-guard/visit-logs/$LOG_ID/sign-out" "$STJAR" '{}'

# After sign-out, overdue list should be 0
ck "GET /api/visit-logs/overdue (after sign-out)" 200 GET /api/visit-logs/overdue "$SECJAR"
OT2=$(jget /tmp/_body '["total"]')
if [[ "$OT2" == "0" ]]; then PASS=$((PASS+1)); ROWS+=("| overdue list empty after sign-out | 0 | $OT2 | ✅ |")
else FAIL=$((FAIL+1)); ROWS+=("| overdue list empty after sign-out | 0 | $OT2 | ❌ |"); fi

# Pending sign-out queue: register a new visitor, leave active
multipart_ck "kiosk register #2 (for pending queue)" 201 "/api/security-guard/kiosk/register" "$SECJAR" \
  -F "fullname=PendingSignOut" -F "contact_number=09170000002" \
  -F "address=BSU Main" -F "office_id=1" -F "purpose=Inquiry" \
  -F "img=@/tmp/tiny.png"
LOG2=$(jget /tmp/_body '["logId"]')
ck "GET /api/public-home/visitors/active" 200 GET /api/public-home/visitors/active "$SECJAR"
HAS2=$(python3 -c "import json; d=json.load(open('/tmp/_body')); print(1 if any(v['office_id']==1 and v['total'] >= 1 for v in d['offices']) else 0)")
if [[ "$HAS2" == "1" ]]; then PASS=$((PASS+1)); ROWS+=("| active aggregate includes office 1 | 1 | $HAS2 | ✅ |")
else FAIL=$((FAIL+1)); ROWS+=("| active aggregate includes office 1 | 1 | $HAS2 | ❌ |"); fi

# Office availability toggle
ck "PATCH /api/security-guard/office/1/status busy" 200 PATCH "/api/security-guard/office/1/status" "$SECJAR" '{"status":"busy"}'
ck "GET /api/offices" 200 GET /api/offices "$JAR"
OST=$(python3 -c "import json; d=json.load(open('/tmp/_body')); print([o['status'] for o in d if o['id']==1][0])")
if [[ "$OST" == "busy" ]]; then PASS=$((PASS+1)); ROWS+=("| office 1 status reads as 'busy' | busy | $OST | ✅ |")
else FAIL=$((FAIL+1)); ROWS+=("| office 1 status reads as 'busy' | busy | $OST | ❌ |"); fi
ck "PATCH /api/security-guard/office/1/status available" 200 PATCH "/api/security-guard/office/1/status" "$SECJAR" '{"status":"available"}'

# Role enforcement
ck "GET /api/users (sec1 denied)"              403 GET  /api/users "$SECJAR"
ck "GET /api/users (staff denied)"             403 GET  /api/users "$STJAR"
ck "GET /api/security-guard/visitors/active (staff denied)" 403 GET /api/security-guard/visitors/active "$STJAR"

# Logout
ck "POST /api/users/logout"                    200 POST /api/users/logout "$JAR" ""
ck "GET /api/users/me (after logout)"          401 GET  /api/users/me "$JAR"

# Static assets
ck "GET /api/uploads/missing.png (404)"        404 GET  /api/uploads/does-not-exist.png ""

echo
echo "## Results"
echo "| Test | Expected | Got | Status |"
echo "|------|----------|-----|--------|"
for r in "${ROWS[@]}"; do echo "$r"; done
echo
echo "**PASS: $PASS  FAIL: $FAIL** (of $((PASS+FAIL)))"
[[ $FAIL -eq 0 ]] || exit 1
