import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const SECRET_PREFIX = "enc:v1:";

function getEncryptionKey() {
  const raw = process.env.CHANNEL_SECRET_KEY;
  if (!raw) {
    return null;
  }
  return createHash("sha256").update(raw).digest();
}

export function encryptSecret(value?: string) {
  if (!value) return null;
  const key = getEncryptionKey();
  if (!key) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${SECRET_PREFIX}${iv.toString("base64")}:${encrypted.toString(
    "base64"
  )}:${tag.toString("base64")}`;
}

export function decryptSecret(value?: string | null) {
  if (!value) return "";
  const key = getEncryptionKey();
  if (!key) return value;
  if (!value.startsWith(SECRET_PREFIX)) return value;

  const [ivBase64, encryptedBase64, tagBase64] = value
    .slice(SECRET_PREFIX.length)
    .split(":");

  if (!ivBase64 || !encryptedBase64 || !tagBase64) return value;

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(ivBase64, "base64"));
  decipher.setAuthTag(Buffer.from(tagBase64, "base64"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedBase64, "base64")),
    decipher.final(),
  ]);
  return decrypted.toString("utf8");
}
