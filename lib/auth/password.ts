import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, storedPassword: string) {
  const [algorithm, salt, expectedHash] = storedPassword.split("$");
  if (algorithm !== "scrypt" || !salt || !expectedHash) {
    return {
      valid: storedPassword === password,
      needsRehash: storedPassword === password,
    };
  }

  const expected = Buffer.from(expectedHash, "hex");
  const actual = scryptSync(password, salt, KEY_LENGTH);
  return {
    valid:
      expected.length === actual.length && timingSafeEqual(expected, actual),
    needsRehash: false,
  };
}
