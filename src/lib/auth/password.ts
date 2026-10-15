import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
const options = { N: 32768, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };
function derive(password: string, salt: string) {
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, options, (error, key) =>
      error ? reject(error) : resolve(key),
    ),
  );
}
export async function hashPassword(password: string) {
  if (password.length < 12 || password.length > 128)
    throw new Error("Use a password of 12–128 characters.");
  const salt = randomBytes(16).toString("hex");
  return `scrypt$32768$8$3$${salt}$${(await derive(password, salt)).toString("hex")}`;
}
export async function verifyPassword(password: string, hash: string) {
  const parts = hash.split("$");
  if (
    parts.length !== 6 ||
    parts.slice(0, 4).join("$") !== "scrypt$32768$8$3" ||
    !/^[a-f0-9]{32}$/.test(parts[4]) ||
    !/^[a-f0-9]{128}$/.test(parts[5])
  )
    return false;
  return timingSafeEqual(
    await derive(password, parts[4]),
    Buffer.from(parts[5], "hex"),
  );
}
