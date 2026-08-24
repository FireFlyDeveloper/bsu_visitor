import db from "../database/database.js";
import { recordNotification } from "../models/Mvp.js";
import { pushToAudience, pushToVisit } from "./pushService.js";

const SWEEP_INTERVAL_MS = 60_000; // every minute

/**
 * Find completed-but-not-signed-out visits past their exit deadline and
 * notify security (overstaying) plus the visitor's device (reminder).
 * Deduplicated via notification_events dedup_key so each visit only
 * triggers one overdue notification per deadline.
 */
export async function sweepOverdueStays() {
  const overdue = db
    .prepare(
      `SELECT l.id, l.office_id, l.exit_deadline,
              v.fullname AS visitor_name, o.office_name
       FROM visit_logs l
       JOIN visitors v ON v.id = l.visitor_id
       JOIN offices o ON o.id = l.office_id
       WHERE l.status = 'completed'
         AND l.left_at IS NULL
         AND l.exit_deadline IS NOT NULL
         AND datetime(l.exit_deadline) <= datetime('now')`,
    )
    .all();

  for (const visit of overdue) {
    const name = visit.visitor_name || "A visitor";
    const dedupKey = `overdue:${visit.id}:${visit.exit_deadline}`;

    // Record once; INSERT OR IGNORE + dedup key prevents repeat spam.
    recordNotification(
      "security",
      visit.office_id,
      "visit_overdue",
      {
        title: "Visitor overstaying",
        body: `${name} has passed their exit deadline at ${visit.office_name} and is not signed out.`,
        visit_log_id: visit.id,
      },
      dedupKey,
    );

    const alreadySent = db
      .prepare(`SELECT COUNT(*) AS c FROM notification_events WHERE dedup_key = ?`)
      .get(dedupKey).c;

    if (!alreadySent) continue; // another instance handled it

    await Promise.all([
      // Security audience.
      pushToAudience("security", {
        notification: {
          title: "Visitor overstaying",
          body: `${name} passed their exit deadline at ${visit.office_name}.`,
          tag: `overdue-${visit.id}`,
          requireInteraction: true,
        },
        data: { type: "overdue", visit_log_id: visit.id },
      }),
      // Visitor reminder.
      pushToVisit(visit.id, {
        title: "Please sign out",
        body: `${name}, your visit at ${visit.office_name} is over its exit deadline. Please see the guard house before leaving.`,
        tag: `overdue-${visit.id}`,
      }, { type: "overdue_reminder", visit_log_id: visit.id }),
    ]);
  }
  return overdue.length;
}

let timer = null;
export function startOverdueSweeper() {
  if (timer) return;
  timer = setInterval(() => {
    sweepOverdueStays().catch((err) =>
      console.error("overdue sweep failed:", err.message),
    );
  }, SWEEP_INTERVAL_MS);
}
