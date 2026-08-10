import multer from "multer";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const uploadDir = path.resolve("uploads");
fs.mkdirSync(uploadDir, { recursive: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, fields: 20, parts: 25 },
  fileFilter: (req, file, cb) => {
    if (/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) return cb(null, true);
    cb(new Error("Only JPEG, PNG, GIF, or WebP images are allowed"));
  },
});

function detectImage(buffer) {
  if (buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) return "png";
  if (buffer.subarray(0, 3).equals(Buffer.from("ffd8ff", "hex"))) return "jpg";
  if (buffer.subarray(0, 6).toString("ascii") === "GIF87a" || buffer.subarray(0, 6).toString("ascii") === "GIF89a") return "gif";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  return null;
}

export function persistImage(req, res, next) {
  if (!req.file) return next();
  const extension = detectImage(req.file.buffer);
  if (!extension) return res.status(400).json({ error: "Uploaded file is not a supported image" });
  const filename = `${crypto.randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(uploadDir, filename), req.file.buffer, { flag: "wx" });
  req.file.filename = filename;
  next();
}

export { detectImage };
export default upload;
