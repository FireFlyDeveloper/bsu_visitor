# BSU Visitor Queue / Photo / Time Fix Plan

> Model: Examine → Plan → Execute

## Examine findings

1. **Queue count**
   - `backend/src/models/Office.js` counts only `status = 'pending'`.
   - Staff queue flow also has `processing`; those visitors are still in-office queue until completed/left.

2. **Visitor photo per log**
   - `KioskController.register()` updates `visitors.img` for repeat visitors.
   - Log lists read `v.img AS visitor_img`, so old logs display the latest profile photo instead of the photo captured for that log.
   - `visit_logs` has no snapshot image column.

3. **Security dashboard Time on site**
   - `VisitorStatus.vue` loads all visit logs with `fetchVisitLogs()` and filters only `status !== 'left'`.
   - Completed historical rows can appear as active.
   - Duration uses `time_out` as the end time, but active “time on site” should be `time_in → now` until `left_at` exists.
   - Backend `findActiveVisits()` uses `time_out IS NULL`, which excludes completed visitors waiting for security sign-out.

4. **Incorrect log time**
   - SQLite `CURRENT_TIMESTAMP` stores UTC as `YYYY-MM-DD HH:mm:ss` without timezone.
   - Browser `new Date('YYYY-MM-DD HH:mm:ss')` treats it as local time, causing wrong displayed time.

## Execute plan

1. Add `visit_logs.visitor_img` with an idempotent migration and fresh-table schema update.
2. Store the captured photo path on every visit log (`visitor_img`) while still allowing visitor profile photo updates.
3. Read log photo snapshots with `COALESCE(l.visitor_img, v.img)` for legacy rows.
4. Change queue counts to active queued statuses: `pending` + `processing`, not signed out.
5. Change active visitor backend query to `left_at IS NULL`, including completed visitors pending security sign-out.
6. Fix “left” status updates to set `left_at` and `time_out` when needed.
7. Add frontend date utilities that parse SQLite timestamps as UTC.
8. Update security dashboard to fetch active visitors and compute Time on site from `time_in` to now.
9. Run syntax checks and `npm run build`.
