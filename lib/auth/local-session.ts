import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export const LOCAL_SESSION_COOKIE = "nexo_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

export type LocalSession = {
  id: string;
  name: string;
  email: string;
  role: Role;
  expiresAt: number;
};

function getSigningSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || Buffer.byteLength(secret) < 32) {
    throw new Error("SESSION_SECRET deve conter pelo menos 32 caracteres.");
  }
  return secret;
}

function sign(payload: string) {
  return createHmac("sha256", getSigningSecret())
    .update(payload)
    .digest("base64url");
}

function isLocalSession(value: unknown): value is LocalSession {
  if (typeof value !== "object" || value === null) return false;
  const session = value as Record<string, unknown>;
  return (
    typeof session.id === "string" &&
    typeof session.name === "string" &&
    typeof session.email === "string" &&
    (session.role === "EMPLOYEE" || session.role === "ANALYST") &&
    typeof session.expiresAt === "number" &&
    session.expiresAt > Math.floor(Date.now() / 1000)
  );
}

export async function setLocalSession(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
}) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = Buffer.from(
    JSON.stringify({ ...user, expiresAt } satisfies LocalSession)
  ).toString("base64url");
  const token = `${payload}.${sign(payload)}`;
  const cookieStore = await cookies();

  cookieStore.set(LOCAL_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function getLocalSession(): Promise<LocalSession | null> {
  const token = (await cookies()).get(LOCAL_SESSION_COOKIE)?.value;
  if (!token) return null;

  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra) return null;

  let expectedSignature: Buffer;
  try {
    expectedSignature = Buffer.from(sign(payload), "base64url");
  } catch (error) {
    console.error("A configuração da sessão local é inválida:", error);
    return null;
  }
  const receivedSignature = Buffer.from(signature, "base64url");
  if (
    receivedSignature.length !== expectedSignature.length ||
    !timingSafeEqual(receivedSignature, expectedSignature)
  ) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8")
    );
    return isLocalSession(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export async function clearLocalSession() {
  (await cookies()).delete(LOCAL_SESSION_COOKIE);
}
