const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET.length < 32) {
  throw new Error("JWT_SECRET must be configured with at least 32 characters");
}

export { JWT_SECRET };
export const JWT_EXPIRY = process.env.JWT_EXPIRY || "24h";
