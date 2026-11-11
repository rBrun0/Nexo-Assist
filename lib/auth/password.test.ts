import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("local password authentication", () => {
  it("verifies passwords stored with scrypt without plaintext", () => {
    const storedPassword = hashPassword("123456");

    expect(storedPassword).not.toContain("123456");
    expect(verifyPassword("123456", storedPassword)).toEqual({
      valid: true,
      needsRehash: false,
    });
    expect(verifyPassword("wrong-password", storedPassword).valid).toBe(false);
  });

  it("accepts a legacy plaintext password once so it can be rehashed", () => {
    expect(verifyPassword("legacy-password", "legacy-password")).toEqual({
      valid: true,
      needsRehash: true,
    });
    expect(verifyPassword("wrong-password", "legacy-password").valid).toBe(
      false
    );
  });
});
