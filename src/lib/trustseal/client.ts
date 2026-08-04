/**
 * TrustSeal read-only client for GNS profile pages.
 *
 * Calls get_identity on the deployed TrustSeal contract to show
 * proof-health badges on .gen name profiles. Does NOT call any
 * write methods — the full TrustSeal dashboard lives at
 * https://github.com/lobinni/TrustSeal
 */

import { getReadClient } from "@/lib/genlayer/client";
import type {
  GnsRecords,
  TrustSealIdentity,
  TrustSealLinkedAccount,
  TrustSealMatch,
  TrustSealPlatform,
} from "@/lib/types";

export const TRUSTSEAL_CONTRACT_ADDRESS = "0x11937A11f341Fc956c397A81D42d2F3Bff1a379c";
export const TRUSTSEAL_APP_URL = "https://github.com/lobinni/TrustSeal";

export function isTrustSealConfigured(): boolean {
  return TRUSTSEAL_CONTRACT_ADDRESS.length > 0;
}

/**
 * Read identity from the deployed TrustSeal contract.
 * Contract method: get_identity(address: str) -> dict
 * Returns {found: bool, owner, linked_accounts[], ...}
 */
export async function getTrustSealIdentity(address: string): Promise<TrustSealIdentity | null> {
  if (!isTrustSealConfigured() || !address) return null;
  const client = await getReadClient();
  if (!client) return null;

  try {
    const raw = await client.readContract({
      address: TRUSTSEAL_CONTRACT_ADDRESS,
      functionName: "get_identity",
      args: [address.toLowerCase()],
      stateStatus: "accepted",
    });

    // Contract returns dict directly (not JSON string)
    const identity = (typeof raw === "string" ? JSON.parse(raw) : raw) as Record<string, unknown> | null;
    if (!identity || !identity.found) return null;

    const accounts = Array.isArray(identity.linked_accounts) ? identity.linked_accounts : [];

    return {
      found: true,
      owner: String(identity.owner || address).toLowerCase(),
      linked_accounts: accounts.map((a: Record<string, unknown>) => ({
        platform: String(a.platform || ""),
        username: String(a.username || ""),
        profile_url: String(a.profile_url || ""),
        verified_at: Number(a.verified_at || 0),
        confidence_score: Number(a.confidence_score || 0),
        bot_score: Number(a.bot_score || 0),
        reasoning: String(a.reasoning || ""),
        proof_status: String(a.proof_status || ""),
        proof_strength: String(a.proof_strength || ""),
        risk_band: String(a.risk_band || ""),
      })) as TrustSealLinkedAccount[],
      reputation_score: Number(identity.reputation_score || 0),
      is_flagged: Boolean(identity.is_flagged),
      flag_reason: String(identity.flag_reason || ""),
      verification_count: Number(identity.verification_count || 0),
    };
  } catch {
    return null;
  }
}

// ── matching helpers for GNS profile page ───────────────────────────────────

function normalizeUsername(value?: string): string {
  if (!value) return "";
  const trimmed = value.trim();
  if (!trimmed) return "";
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split("/").filter(Boolean);
    return (parts[0] || "").replace(/^@/, "").toLowerCase();
  } catch {
    return trimmed.replace(/^@/, "").toLowerCase();
  }
}

function findAccount(
  identity: TrustSealIdentity | null,
  platform: TrustSealPlatform,
  expected: string
): TrustSealLinkedAccount | undefined {
  return identity?.linked_accounts.find((a) =>
    a.platform === platform &&
    normalizeUsername(a.username || a.profile_url) === expected
  );
}

function buildMatch(
  identity: TrustSealIdentity | null,
  platform: TrustSealPlatform,
  label: string,
  expected: string,
): TrustSealMatch {
  if (!isTrustSealConfigured()) {
    return { platform, label, expected, matched: false, status: "unconfigured", message: "TrustSeal not configured." };
  }
  const account = findAccount(identity, platform, expected);
  if (!identity?.found || !account) {
    return { platform, label, expected, matched: false, status: "missing", message: "Not linked on TrustSeal." };
  }
  if (identity.is_flagged) {
    return { platform, label, expected, account, matched: false, status: "flagged", message: identity.flag_reason || "Identity flagged." };
  }
  const st = String(account.proof_status || "").toUpperCase();
  if (st !== "ACTIVE") {
    return { platform, label, expected, account, matched: false, status: "inactive", message: `Proof is ${st || "inactive"}.` };
  }
  return { platform, label, expected, account, matched: true, status: "verified", message: "Verified by TrustSeal." };
}

export function buildTrustSealMatches(
  identity: TrustSealIdentity | null,
  records: GnsRecords,
): TrustSealMatch[] {
  const checks: Array<[TrustSealPlatform, string, string]> = [
    ["twitter", "X", normalizeUsername(records.x)],
    ["github", "GitHub", normalizeUsername(records.github)],
    ["discord", "Discord", normalizeUsername(records.discord)],
  ];
  return checks
    .filter(([, , expected]) => expected.length > 0)
    .map(([platform, label, expected]) => buildMatch(identity, platform, label, expected));
}
