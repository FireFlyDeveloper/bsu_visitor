import db from "../database/database.js";
import VisitLog from "../models/VisitLog.js";
import Visitor from "../models/Visitor.js";
import { pushToAudience } from "../services/pushService.js";
import {
  generateOpaqueToken,
  hashToken,
  generateReferenceNumber,
} from "../utils/accessToken.js";

const MAX_FULLNAME_LENGTH = 200;
const MAX_CONTACT_LENGTH = 30;
const MAX_ADDRESS_LENGTH = 300;
const MAX_PURPOSE_LENGTH = 500;

function assertFieldLengths({ fullname, contact_number, address, purpose }) {
  if (String(fullname || "").length > MAX_FULLNAME_LENGTH) {
    return "fullname is too long";
  }
  if (String(contact_number || "").length > MAX_CONTACT_LENGTH) {
    return "contact_number is too long";
  }
  if (String(address || "").length > MAX_ADDRESS_LENGTH) {
    return "address is too long";
  }
  if (String(purpose || "").length > MAX_PURPOSE_LENGTH) {
    return "purpose is too long";
  }
  return null;
}

/**
 * Public (no-auth) visitor self-registration and status endpoints.
 *
 * The public visitor flow never returns visitor PII: no names, contacts,
 * addresses, photos, purposes, or raw visit records. Registration returns
 * a one-time opaque token (only its hash is stored), a reference number,
 * and the queue position. Status lookups are keyed by the opaque token and
 * return a privacy-safe projection.
 */
class PublicController {
  // GET /api/public/office/:id — returns the office so the visitor
  // self-registration page can show "You're visiting [Office Name]".
  static getOffice(req, res) {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ error: "invalid office id" });
      }
      const office = db
        .prepare(
          `SELECT id, office_name, status, type FROM offices WHERE id = ?`,
        )
        .get(id);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }
      return res.json(office);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/public/offices — public list of offices (no auth) for the
  // destination picker on the /office QR landing page.
  static listOffices(req, res) {
    try {
      const rows = db
        .prepare(
          `SELECT id, office_name, status, type
           FROM offices
           ORDER BY office_name`,
        )
        .all();
      return res.json({ offices: rows });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/public/directory — privacy-safe campus directory with
  // anonymous queue counts. No visitor records, ever.
  static directory(req, res) {
    try {
      const rows = db
        .prepare(
          `SELECT
             o.id,
             o.office_name,
             o.status,
             o.type,
             COALESCE((
               SELECT COUNT(*)
               FROM visit_logs l
               WHERE l.office_id = o.id
                 AND l.status IN ('pending', 'processing')
                 AND l.left_at IS NULL
             ), 0) AS queue_count
           FROM offices o
           ORDER BY o.office_name`,
        )
        .all();

      // Campus-wide occupancy: everyone currently in the visiting flow who
      // has not signed out. Same criteria as the per-office queue_count, so
      // this equals the sum of the queues shown below it.
      const occupancy = db
        .prepare(
          `SELECT COUNT(*) AS active_visitors
           FROM visit_logs
           WHERE status IN ('pending', 'processing')
             AND left_at IS NULL`,
        )
        .get();

      return res.json({
        offices: rows,
        occupancy: { active_visitors: occupancy.active_visitors },
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // POST /api/public/office/:id/register
  // POST /api/public/register        (office_id in body)
  // body: { fullname, contact_number, address, purpose, office_id? }
  // Privacy-safe response: token (once), reference number, queue position.
  static register(req, res) {
    try {
      const officeId = Number(req.params.id ?? req.body?.office_id);
      if (!Number.isFinite(officeId)) {
        return res.status(400).json({ error: "office id is required" });
      }
      const office = db
        .prepare(`SELECT id, office_name FROM offices WHERE id = ?`)
        .get(officeId);
      if (!office) {
        return res.status(404).json({ error: "Office not found" });
      }

      const { fullname, contact_number, address, purpose } = req.body || {};
      if (!fullname || !contact_number || !address) {
        return res.status(400).json({
          error: "fullname, contact_number, and address are required",
        });
      }
      // Photo is required for self-registration (same policy as the kiosk).
      if (!req.file) {
        return res.status(400).json({ error: "visitor photo is required" });
      }
      const lengthError = assertFieldLengths({
        fullname,
        contact_number,
        address,
        purpose,
      });
      if (lengthError) {
        return res.status(400).json({ error: lengthError });
      }

      // Reuse the visitor by contact_number if they exist.
      const img = `uploads/${req.file.filename}`;
      let visitor = Visitor.findByContactNumber(contact_number);
      if (!visitor) {
        const newId = Visitor.create({
          fullname,
          contact_number,
          address,
          id_type: "",
          img,
        });
        visitor = Visitor.findById(newId);
      } else if (!visitor.img) {
        // Existing profile without a photo — backfill this registration's.
        Visitor.update(visitor.id, { img });
      }

      // Idempotency: a matching active visit (same visitor + office) is
      // returned as-is instead of creating a duplicate queue entry. The
      // raw token cannot be recovered from its stored hash, so an
      // already-registered response intentionally does not re-issue one.
      const existing = VisitLog.findByActiveVisitorOffice({
        visitor_id: visitor.id,
        office_id: officeId,
      });
      if (existing) {
        return res.status(200).json({
          ok: true,
          already_registered: true,
          reference_number: existing.reference_number || null,
          queue_position: VisitLog.queuePosition(officeId, existing.id),
          office: { id: office.id, office_name: office.office_name },
        });
      }

      const logId = VisitLog.create({
        visitor_id: visitor.id,
        office_id: officeId,
        purpose: purpose || "",
        logged_by: null,
        status: "pending",
        visitor_img: img,
      });

      const token = generateOpaqueToken();
      const referenceNumber = generateReferenceNumber();
      VisitLog.setAccessToken(logId, {
        accessTokenHash: hashToken(token),
        referenceNumber,
        registrationSource: "self",
      });

      const queuePosition = VisitLog.queuePosition(officeId, logId);
      const visitorName = visitor.fullname || "A visitor";

      // Fire-and-forget: alert the office's staff that a new visitor joined.
      pushToAudience("office", {
        officeId,
        notification: {
          title: "New visitor",
          body: `${visitorName} joined the ${office.office_name} queue (#${queuePosition}).`,
          tag: `new-visitor-${logId}`,
        },
        data: { type: "new_visitor", visit_log_id: logId },
      }).catch((err) => console.error("push notify failed:", err.message));

      return res.status(201).json({
        ok: true,
        already_registered: false,
        token,
        reference_number: referenceNumber,
        queue_position: queuePosition,
        office: { id: office.id, office_name: office.office_name },
      });
    } catch (err) {
      console.error("public register error:", err);
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /api/public/status/:token
  // Privacy-safe projection keyed by the opaque token. Returns only what
  // the visitor needs: reference number, office, status, queue position,
  // and the authoritative exit deadline. Never visitor PII.
  static status(req, res) {
    try {
      const { token } = req.params;
      if (
        typeof token !== "string" ||
        token.length < 16 ||
        token.length > 128
      ) {
        return res.status(404).json({ error: "Visit not found" });
      }

      const log = VisitLog.findByAccessTokenHash(hashToken(token));
      if (!log) {
        return res.status(404).json({ error: "Visit not found" });
      }

      const office = db
        .prepare(`SELECT id, office_name, status FROM offices WHERE id = ?`)
        .get(log.office_id);

      const updatedAt = [log.time_in, log.time_out, log.left_at, log.overdue_acknowledged_at]
        .filter(Boolean)
        .sort()
        .pop() || log.time_in;

      const inQueue = ["pending", "processing"].includes(log.status);

      return res.json({
        reference_number: log.reference_number || null,
        office: office
          ? { id: office.id, office_name: office.office_name }
          : null,
        status: log.status,
        queue_position: inQueue ? VisitLog.queuePosition(log.office_id, log.id) : null,
        time_in: log.time_in,
        time_out: log.time_out,
        left_at: log.left_at,
        exit_deadline: log.exit_deadline,
        overdue_acknowledged_at: log.overdue_acknowledged_at,
        updated_at: updatedAt,
      });
    } catch (err) {
      console.error("public status error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
}

export default PublicController;
