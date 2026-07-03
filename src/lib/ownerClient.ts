function parseCsvEnv(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

const OWNER_IDS = new Set([
  ...parseCsvEnv(process.env.NEXT_PUBLIC_OWNER_USER_IDS),
  ...parseCsvEnv(process.env.NEXT_PUBLIC_OWNER_USER_ID),
]);

const OWNER_EMAILS = new Set(
  [
    ...parseCsvEnv(process.env.NEXT_PUBLIC_OWNER_EMAILS),
    ...parseCsvEnv(process.env.NEXT_PUBLIC_OWNER_EMAIL),
  ].map((email) => email.toLowerCase())
);

export function isOwnerClientUser(userId?: string | null, email?: string | null): boolean {
  const normalizedEmail = (email || "").toLowerCase();
  return (userId ? OWNER_IDS.has(userId) : false) || (normalizedEmail ? OWNER_EMAILS.has(normalizedEmail) : false);
}
