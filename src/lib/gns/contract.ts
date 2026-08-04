import { readView, writeMethod, isConfigured } from "@/lib/genlayer/client";
import { normaliseName } from "@/lib/utils";
import type {
  GnsName,
  GnsRecords,
  GnsReport,
  ContractWriteResult,
  SearchResult,
  AiReview,
  AiResult,
  AiSuggestion,
} from "@/lib/types";

// ---------------------------------------------------------------------------
// JSON helpers – the contract returns JSON-encoded strings for every response
// ---------------------------------------------------------------------------

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === "object") return raw as T;
  if (typeof raw === "string") {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  return fallback;
}

/**
 * The contract wraps booleans as JSON strings: `"true"` / `"false"`.
 * JavaScript `Boolean("false")` is TRUE (non-empty string),
 * so we must parse properly.
 */
function parseBool(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "string") {
    const s = raw.trim().toLowerCase();
    // handle JSON-encoded boolean: "true" / "false"
    if (s === "true") return true;
    if (s === "false") return false;
    // handle raw JSON like '"true"' (double-quoted inside)
    try {
      const parsed = JSON.parse(s);
      return Boolean(parsed);
    } catch {
      return Boolean(s);
    }
  }
  return Boolean(raw);
}

function asWriteResult(raw: unknown): ContractWriteResult {
  const parsed = parseJson<Record<string, unknown>>(raw, { success: true, message: "OK" });
  return {
    success: Boolean(parsed.success ?? true),
    message: String(parsed.message ?? "OK"),
    data: parsed.data,
  };
}

export { isConfigured };

// ---------------------------------------------------------------------------
// READ: availability & resolution
// ---------------------------------------------------------------------------

export async function isAvailable(name: string): Promise<boolean> {
  const v = await readView<unknown>("is_available", [normaliseName(name)]);
  return parseBool(v);
}

export async function resolveName(name: string): Promise<GnsName | null> {
  const raw = await readView<unknown>("resolve", [normaliseName(name)]);
  const parsed = parseJson<Record<string, unknown>>(raw, {} as Record<string, unknown>);

  // Contract returns {"full_name":"x.gen","status":"not_found"} for missing names.
  // We must treat that as null so the UI knows the name is available.
  if (!parsed) return null;
  if (!(parsed as GnsName).full_name) return null;
  if ((parsed as GnsName).status === "not_found") return null;

  return parsed as GnsName;
}

export async function searchName(query: string): Promise<SearchResult> {
  const fullName = normaliseName(query);
  if (!fullName) return { query, fullName, available: false, name: null };

  const name = await resolveName(fullName);
  if (name) {
    return { query, fullName, available: false, name };
  }
  return { query, fullName, available: true, name: null };
}

export async function resolveAddress(name: string): Promise<string> {
  const v = await readView<unknown>("resolve_address", [normaliseName(name)]);
  return String(v || "");
}

export async function reverseLookup(address: string): Promise<string> {
  const v = await readView<unknown>("reverse_lookup", [address.toLowerCase()]);
  return String(v || "");
}

export async function getNamesByOwner(owner: string): Promise<string[]> {
  const raw = await readView<unknown>("get_names_by_owner", [owner.toLowerCase()]);
  return parseJson<string[]>(raw, []);
}

export async function getSubnames(parentName: string): Promise<string[]> {
  const raw = await readView<unknown>("get_subnames", [normaliseName(parentName)]);
  return parseJson<string[]>(raw, []);
}

export async function getRecords(name: string): Promise<GnsRecords> {
  const raw = await readView<unknown>("get_records", [normaliseName(name)]);
  return parseJson<GnsRecords>(raw, {});
}

export async function getTotalNames(): Promise<number> {
  try {
    const v = await readView<unknown>("get_total_names", []);
    return Number(v) || 0;
  } catch {
    return 0;
  }
}

export async function getTotalReports(): Promise<number> {
  try {
    const v = await readView<unknown>("get_total_reports", []);
    return Number(v) || 0;
  } catch {
    return 0;
  }
}

export async function getReport(id: string): Promise<GnsReport | null> {
  const raw = await readView<unknown>("get_report", [id]);
  const parsed = parseJson<Record<string, unknown>>(raw, {} as Record<string, unknown>);
  if (!parsed || !(parsed as GnsReport).id) return null;
  if ((parsed as Record<string, unknown>).status === "not_found") return null;
  return parsed as GnsReport;
}

// ---------------------------------------------------------------------------
// Pricing – contract methods accept years as STRING
// ---------------------------------------------------------------------------

export const GEN_DECIMALS = 18n;
export const ONE_GEN_WEI = 10n ** GEN_DECIMALS;

function toBigInt(v: unknown): bigint {
  if (typeof v === "bigint") return v;
  if (typeof v === "number") return BigInt(Math.floor(v));
  if (typeof v === "string") {
    const trimmed = v.trim();
    if (!trimmed) return 0n;
    try {
      return BigInt(trimmed);
    } catch {
      return 0n;
    }
  }
  return 0n;
}

export function weiToGen(wei: bigint): string {
  if (wei === 0n) return "0";
  const whole = wei / ONE_GEN_WEI;
  const remainder = wei % ONE_GEN_WEI;
  if (remainder === 0n) return whole.toString();
  const frac = remainder.toString().padStart(18, "0").replace(/0+$/, "").slice(0, 4);
  return frac ? `${whole}.${frac}` : whole.toString();
}

export function genToWei(amount: string | number): bigint {
  const s = String(amount).trim();
  if (!s) return 0n;
  const [whole, frac = ""] = s.split(".");
  const fracPadded = (frac + "0".repeat(18)).slice(0, 18);
  return BigInt(whole || "0") * ONE_GEN_WEI + BigInt(fracPadded || "0");
}

export async function getPricePerYear(): Promise<bigint> {
  const v = await readView<unknown>("get_price_per_year", []);
  return toBigInt(v);
}

// Contract expects years as STRING, not number
export async function quoteRegistration(years: number): Promise<bigint> {
  try {
    const v = await readView<unknown>("quote_registration", [String(years)]);
    return toBigInt(v);
  } catch {
    const ppy = await getPricePerYear();
    return ppy * BigInt(years);
  }
}

export async function quoteRenewal(years: number): Promise<bigint> {
  try {
    const v = await readView<unknown>("quote_renewal", [String(years)]);
    return toBigInt(v);
  } catch {
    const ppy = await getPricePerYear();
    return ppy * BigInt(years);
  }
}

export async function getTreasury(): Promise<string> {
  try {
    const v = await readView<unknown>("get_treasury", []);
    return String(v || "");
  } catch {
    return "";
  }
}

export async function getAdmin(): Promise<string> {
  try {
    const v = await readView<unknown>("get_admin", []);
    return String(v || "");
  } catch {
    return "";
  }
}

export async function getContractBalance(): Promise<bigint> {
  try {
    const v = await readView<unknown>("get_contract_balance", []);
    return toBigInt(v);
  } catch {
    return 0n;
  }
}

export async function getTotalProtocolRevenue(): Promise<bigint> {
  try {
    const v = await readView<unknown>("get_total_protocol_revenue", []);
    return toBigInt(v);
  } catch {
    return 0n;
  }
}

export async function getTotalWithdrawn(): Promise<bigint> {
  try {
    const v = await readView<unknown>("get_total_withdrawn", []);
    return toBigInt(v);
  } catch {
    return 0n;
  }
}

// ---------------------------------------------------------------------------
// WRITE: register, renew, transfer, records, subnames, reports
// Contract register() and renew() accept years as STRING
// ---------------------------------------------------------------------------

export async function registerName(
  name: string,
  years: number,
  primaryAddress: string
): Promise<ContractWriteResult> {
  const label = normaliseName(name).replace(/\.gen$/, "");
  const value = await quoteRegistration(years);
  const raw = await writeMethod("register", [label, String(years), primaryAddress], value);
  return asWriteResult(raw);
}

export async function renewName(name: string, years: number): Promise<ContractWriteResult> {
  const value = await quoteRenewal(years);
  const raw = await writeMethod("renew", [normaliseName(name), String(years)], value);
  return asWriteResult(raw);
}

export async function adminWithdraw(amountWei: bigint): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_withdraw", [amountWei.toString()]);
  return asWriteResult(raw);
}

export async function adminSetPricePerYear(newPriceWei: bigint): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_set_price_per_year", [newPriceWei.toString()]);
  return asWriteResult(raw);
}

export async function adminSetTreasury(newTreasury: string): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_set_treasury", [newTreasury]);
  return asWriteResult(raw);
}

export async function transferName(
  name: string,
  newOwner: string
): Promise<ContractWriteResult> {
  const raw = await writeMethod("transfer", [normaliseName(name), newOwner]);
  return asWriteResult(raw);
}

export async function setRecords(
  name: string,
  records: GnsRecords
): Promise<ContractWriteResult> {
  const raw = await writeMethod("set_records", [normaliseName(name), JSON.stringify(records)]);
  return asWriteResult(raw);
}

export async function setPrimaryAddress(
  name: string,
  address: string
): Promise<ContractWriteResult> {
  const raw = await writeMethod("set_primary_address", [normaliseName(name), address]);
  return asWriteResult(raw);
}

export async function setPrimaryName(name: string): Promise<ContractWriteResult> {
  const raw = await writeMethod("set_primary_name", [normaliseName(name)]);
  return asWriteResult(raw);
}

export async function createSubname(
  parent: string,
  subLabel: string,
  primaryAddress: string
): Promise<ContractWriteResult> {
  const raw = await writeMethod("create_subname", [
    normaliseName(parent),
    subLabel,
    primaryAddress,
  ]);
  return asWriteResult(raw);
}

export async function reportName(
  name: string,
  reason: string,
  evidenceUrl: string,
  comment: string
): Promise<ContractWriteResult> {
  const raw = await writeMethod("report_name", [
    normaliseName(name),
    reason,
    evidenceUrl,
    comment,
  ]);
  return asWriteResult(raw);
}

// ---------------------------------------------------------------------------
// AI layer
// ---------------------------------------------------------------------------

export async function getTotalReviews(): Promise<number> {
  try {
    const v = await readView<unknown>("get_total_reviews", []);
    return Number(v) || 0;
  } catch {
    return 0;
  }
}

export async function getAiReview(reviewId: string): Promise<AiReview | null> {
  if (!reviewId) return null;
  const raw = await readView<unknown>("get_ai_review", [reviewId]);
  const parsed = parseJson<Record<string, unknown>>(raw, {} as Record<string, unknown>);
  if (!parsed || !(parsed as AiReview).id) return null;
  if ((parsed as AiReview).id === reviewId && (parsed as Record<string, unknown>).status === "not_found") return null;
  return parsed as AiReview;
}

export async function getAiStatus(
  name: string
): Promise<{ risk: string; verified: boolean; last_review_id: string } | null> {
  try {
    const raw = await readView<unknown>("get_ai_status", [normaliseName(name)]);
    const parsed = parseJson<Record<string, unknown>>(raw, {} as Record<string, unknown>);
    if (!parsed || !("risk" in parsed)) return null;
    return parsed as { risk: string; verified: boolean; last_review_id: string };
  } catch {
    return null;
  }
}

async function fetchLatestReview(): Promise<AiReview | null> {
  const total = await getTotalReviews();
  if (!total) return null;
  return getAiReview(String(total));
}

export async function aiReviewName(
  name: string,
  claim: string,
  evidenceUrl: string,
  extraContext: string
): Promise<AiReview | null> {
  await writeMethod("ai_review_name", [normaliseName(name), claim, evidenceUrl, extraContext]);
  const status = await getAiStatus(name);
  if (status?.last_review_id) {
    const review = await getAiReview(status.last_review_id);
    if (review) return review;
  }
  return fetchLatestReview();
}

export async function aiReviewReport(reportId: string): Promise<AiReview | null> {
  await writeMethod("ai_review_report", [reportId]);
  const report = await getReport(reportId);
  if (report?.ai_review_id) {
    const review = await getAiReview(report.ai_review_id);
    if (review) return review;
  }
  return fetchLatestReview();
}

export async function aiVerifyProjectClaim(
  name: string,
  projectName: string,
  officialWebsite: string,
  officialX: string,
  officialGithub: string,
  explanation: string
): Promise<AiReview | null> {
  await writeMethod("ai_verify_project_claim", [
    normaliseName(name),
    projectName,
    officialWebsite,
    officialX,
    officialGithub,
    explanation,
  ]);
  const status = await getAiStatus(name);
  if (status?.last_review_id) {
    const review = await getAiReview(status.last_review_id);
    if (review) return review;
  }
  return fetchLatestReview();
}

export async function aiSuggestNames(
  baseLabel: string,
  purpose: string
): Promise<AiSuggestion[]> {
  await writeMethod("ai_suggest_names", [baseLabel, purpose]);
  const review = await fetchLatestReview();
  const result = review?.result as unknown as { suggestions?: AiSuggestion[] } | undefined;
  if (result?.suggestions && Array.isArray(result.suggestions)) {
    return result.suggestions;
  }
  return [];
}

export function extractResult(review: AiReview | null): AiResult | null {
  if (!review) return null;
  return review.result || null;
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function adminFlagName(name: string, reason: string): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_flag_name", [normaliseName(name), reason]);
  return asWriteResult(raw);
}

export async function adminUnflagName(name: string): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_unflag_name", [normaliseName(name)]);
  return asWriteResult(raw);
}

export async function adminSetReportStatus(
  reportId: string,
  status: string
): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_set_report_status", [reportId, status]);
  return asWriteResult(raw);
}

export async function adminTransferAdmin(newAdmin: string): Promise<ContractWriteResult> {
  const raw = await writeMethod("admin_transfer_admin", [newAdmin]);
  return asWriteResult(raw);
}
