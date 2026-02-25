import { prisma } from "@/lib/prisma";
import { createHash, randomBytes } from "crypto";
import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ROLE_COOKIE, SESSION_COOKIE } from "@/lib/auth-constants";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days
const API_TOKEN_TTL_MS = 1000 * 60 * 60; // 1 hour

type CookieSameSite = "lax" | "strict" | "none";

function getPepper() {
  return process.env.PASSWORD_PEPPER ?? "dev_pepper_change_me";
}

function isIPv4(value: string) {
  return /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(
    value
  );
}

function normalizeCookieDomain(raw?: string) {
  if (!raw) return undefined;
  let value = raw.trim().toLowerCase();
  if (!value) return undefined;

  // allow users to pass full URL by mistake; keep only host part
  value = value.replace(/^https?:\/\//, "").split("/")[0] ?? value;
  value = value.split(":")[0] ?? value;

  // domain attribute should not be set for localhost/IP host setups
  if (value === "localhost" || isIPv4(value)) return undefined;

  // basic safety gate to avoid invalid cookie domain exceptions
  if (!/^[a-z0-9.-]+$/.test(value) || !value.includes(".")) return undefined;

  return value.startsWith(".") ? value : `.${value}`;
}

function getCookieOptions(expiresAt: Date) {
  const secureDefault = process.env.NODE_ENV === "production";
  const secure =
    process.env.COOKIE_SECURE === "true"
      ? true
      : process.env.COOKIE_SECURE === "false"
        ? false
        : secureDefault;

  const sameSiteRaw = (process.env.COOKIE_SAME_SITE ?? "lax").toLowerCase();
  const sameSite: CookieSameSite =
    sameSiteRaw === "none" || sameSiteRaw === "strict" || sameSiteRaw === "lax"
      ? sameSiteRaw
      : "lax";

  const domain = normalizeCookieDomain(process.env.COOKIE_DOMAIN);

  return {
    httpOnly: true,
    sameSite,
    secure,
    expires: expiresAt,
    path: "/",
    ...(domain ? { domain } : {}),
  } as const;
}

function md5(value: string) {
  return createHash("md5").update(value).digest("hex");
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function hashPasswordWithSaltPepper(password: string, salt: string) {
  // Required scheme: MD5 with salt + pepper.
  return md5(`${salt}:${password}:${getPepper()}`);
}

export function createPasswordSalt() {
  return randomBytes(16).toString("hex");
}

function hashSessionToken(token: string) {
  return sha256(`${token}:${getPepper()}`);
}

async function createSessionToken(userId: string, ttlMs: number) {
  const token = randomBytes(32).toString("hex");
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function validateUserCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (!user || !user.isActive) throw new Error("INVALID_CREDENTIALS");

  const computedHash = hashPasswordWithSaltPepper(password, user.passwordSalt);
  if (computedHash !== user.passwordHash) throw new Error("INVALID_CREDENTIALS");

  return user;
}

async function createUserAccountInternal(data: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}) {
  const email = data.email.trim().toLowerCase();
  const name = data.name.trim();
  const password = data.password;
  if (!email || !name || !password) throw new Error("INVALID_INPUT");

  const salt = createPasswordSalt();
  const passwordHash = hashPasswordWithSaltPepper(password, salt);

  return prisma.user.create({
    data: {
      email,
      name,
      passwordHash,
      passwordSalt: salt,
      role: data.role,
    },
  });
}

export async function createViewerSignupAccount(data: {
  email: string;
  name: string;
  password: string;
}) {
  return createUserAccountInternal({
    ...data,
    role: UserRole.VIEWER,
  });
}

export async function createUserByAdmin(data: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}) {
  await requireRole([UserRole.ADMIN]);
  return createUserAccountInternal(data);
}

export async function updateUserRoleByAdmin(userId: string, role: UserRole) {
  await requireRole([UserRole.ADMIN]);
  return prisma.user.update({
    where: { id: userId },
    data: { role },
  });
}

export async function loginWithPassword(email: string, password: string) {
  const user = await validateUserCredentials(email, password);
  const { token, expiresAt } = await createSessionToken(user.id, SESSION_TTL_MS);
  const cookieOptions = getCookieOptions(expiresAt);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    ...cookieOptions,
    httpOnly: true,
  });
  cookieStore.set(ROLE_COOKIE, user.role, {
    ...cookieOptions,
    httpOnly: false,
  });

  return user;
}

export async function loginForApi(email: string, password: string) {
  const user = await validateUserCredentials(email, password);
  const { token, expiresAt } = await createSessionToken(user.id, API_TOKEN_TTL_MS);

  return {
    token,
    expiresAt,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
  };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    const tokenHash = hashSessionToken(token);
    await prisma.session.deleteMany({
      where: { tokenHash },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ROLE_COOKIE);
}

export async function logoutByToken(token: string) {
  const tokenHash = hashSessionToken(token);
  await prisma.session.deleteMany({
    where: { tokenHash },
  });
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.user.isActive) return null;

  return session.user;
}

export async function getUserByAccessToken(token: string) {
  const tokenHash = hashSessionToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } });
    return null;
  }
  if (!session.user.isActive) return null;
  return session.user;
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function requireRole(allowed: UserRole[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/unauthorized");
  }
  return user;
}
