/**
 * OpenAI Quota Query Module
 *
 * [Input]: OAuth access token
 * [Output]: Formatted quota usage information
 * [Location]: Called by mystatus.ts, handles OpenAI accounts
 * [Sync]: mystatus.ts, types.ts, utils.ts, i18n.ts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type OpenAIAuthData,
  type TableRowData,
} from "./types";
import {
  formatDuration,
  formatResetTime,
  createProgressBar,
  calcRemainPercent,
  fetchWithTimeout,
} from "./utils";

// ============================================================================
// Type Definitions
// ============================================================================

interface RateLimitWindow {
  used_percent: number;
  limit_window_seconds: number;
  reset_after_seconds: number;
}

interface OpenAIUsageResponse {
  plan_type: string;
  rate_limit: {
    limit_reached: boolean;
    primary_window: RateLimitWindow;
    secondary_window: RateLimitWindow | null;
  } | null;
}

// ============================================================================
// JWT Parsing
// ============================================================================

interface JwtPayload {
  "https://api.openai.com/profile"?: {
    email?: string;
  };
  "https://api.openai.com/auth"?: {
    chatgpt_account_id?: string;
  };
}

/**
 * Base64URL decode
 */
function base64UrlDecode(input: string): string {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const padded = base64 + "=".repeat(padLen);
  return Buffer.from(padded, "base64").toString("utf8");
}

/**
 * Parse JWT token and extract payload
 */
function parseJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payloadJson = base64UrlDecode(parts[1]);
    return JSON.parse(payloadJson) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Extract user email from JWT
 */
function getEmailFromJwt(token: string): string | null {
  const payload = parseJwt(token);
  return payload?.["https://api.openai.com/profile"]?.email ?? null;
}

/**
 * Extract ChatGPT account ID from JWT (for team/organization accounts)
 */
function getAccountIdFromJwt(token: string): string | null {
  const payload = parseJwt(token);
  return payload?.["https://api.openai.com/auth"]?.chatgpt_account_id ?? null;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert window duration (seconds) to readable window name
 */
function formatWindowName(seconds: number): string {
  const days = Math.round(seconds / 86400);

  if (days >= 1) {
    return t.dayLimit(days);
  }
  return t.hourLimit(Math.round(seconds / 3600));
}

/**
 * Format usage for a single window
 */
function formatWindow(window: RateLimitWindow): string[] {
  const windowName = formatWindowName(window.limit_window_seconds);
  const remainPercent = calcRemainPercent(window.used_percent);
  const progressBar = createProgressBar(remainPercent);
  const resetTime = formatDuration(window.reset_after_seconds);

  return [
    windowName,
    `${progressBar} ${t.remaining(remainPercent)}`,
    t.resetIn(resetTime),
  ];
}

// ============================================================================
// API Calls
// ============================================================================

const OPENAI_USAGE_URL = "https://chatgpt.com/backend-api/wham/usage";

/**
 * Fetch OpenAI usage data
 */
async function fetchOpenAIUsage(
  accessToken: string,
): Promise<OpenAIUsageResponse> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "OpenCode-Status-Plugin/1.0",
  };

  const accountId = getAccountIdFromJwt(accessToken);
  if (accountId) {
    headers["ChatGPT-Account-Id"] = accountId;
  }

  const response = await fetchWithTimeout(OPENAI_USAGE_URL, {
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(t.apiError(response.status, errorText));
  }

  return response.json() as Promise<OpenAIUsageResponse>;
}

// ============================================================================
// Output Formatting
// ============================================================================

/**
 * Format OpenAI usage information
 */
function formatOpenAIUsage(
  data: OpenAIUsageResponse,
  email: string | null,
): string {
  const { plan_type, rate_limit } = data;
  const lines: string[] = [];

  // Header line: Account: email (plan)
  const accountDisplay = email || t.unknown;
  lines.push(`${t.account}        ${accountDisplay} (${plan_type})`);
  lines.push("");

  // Primary window
  if (rate_limit?.primary_window) {
    lines.push(...formatWindow(rate_limit.primary_window));
  }

  // Secondary window (if exists)
  if (rate_limit?.secondary_window) {
    lines.push("");
    lines.push(...formatWindow(rate_limit.secondary_window));
  }

  // Limit status message
  if (rate_limit?.limit_reached) {
    lines.push("");
    lines.push(t.limitReached);
  }

  return lines.join("\n");
}

/**
 * Extract table row data from OpenAI usage
 */
function extractTableRow(
  data: OpenAIUsageResponse,
  email: string | null,
): TableRowData | undefined {
  const { plan_type, rate_limit } = data;
  const primary = rate_limit?.primary_window;

  if (!primary) return undefined;

  const usedPercent = primary.used_percent;
  const remainPercent = calcRemainPercent(usedPercent);
  const resetAfter = primary.reset_after_seconds;

  const now = Date.now();
  const resetDate = resetAfter > 0 ? new Date(now + resetAfter * 1000) : null;
  const resetDateStr =
    resetDate && resetDate.getTime() > now
      ? formatResetTime(resetDate.getTime(), true)
      : "-";
  const resetIn = resetAfter > 0 ? formatDuration(resetAfter) : "-";

  return {
    provider: "OpenAI",
    account: email || t.unknown,
    plan: plan_type,
    used: `${usedPercent}%`,
    remaining: `${remainPercent}%`,
    resetIn,
    resetDate: resetDateStr,
  };
}

// ============================================================================
// Export Interface
// ============================================================================

export type { OpenAIAuthData };

/**
 * Query OpenAI account quota
 * @param authData OpenAI auth data
 * @returns Query result, or null if account doesn't exist or is invalid
 */
export async function queryOpenAIUsage(
  authData: OpenAIAuthData | undefined,
): Promise<QueryResult | null> {
  // Check if account exists and is valid
  if (!authData || authData.type !== "oauth" || !authData.access) {
    return null;
  }

  // Check if OAuth token is expired
  if (authData.expires && authData.expires < Date.now()) {
    return {
      success: false,
      error: t.tokenExpired,
    };
  }

  try {
    const email = getEmailFromJwt(authData.access);
    const usage = await fetchOpenAIUsage(authData.access);
    const tableRow = extractTableRow(usage, email);
    return {
      success: true,
      output: formatOpenAIUsage(usage, email),
      tableRows: tableRow ? [tableRow] : [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
