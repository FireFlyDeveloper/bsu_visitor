import crypto from "crypto";

/**
 * Visitor access-token helpers.
 *
 * The public visitor flow issues a high-entropy opaque token that the
 * browser stores and uses to look up status. Only the SHA-256 hash of
 * the token is ever persisted, so a database leak cannot reveal usable
 * tokens and there is no way to recover a token from the hash.
 */

const TOKEN_BYTES = 32; // 256 bits of entropy
const REFERENCE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateOpaqueToken() {
  return crypto.randomBytes(TOKEN_BYTES).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

export function generateReferenceNumber() {
  const now = new Date();
  const ymd = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const bytes = crypto.randomBytes(3);
  let suffix = "";
  for (const byte of bytes) {
    suffix += REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length];
  }
  return `BSU-${ymd}-${suffix}`;
}
