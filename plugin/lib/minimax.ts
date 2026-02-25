/**
 * MiniMax Coding Plan Quota Query Module
 *
 * [Input]: API key from auth.json
 * [Output]: Formatted quota usage information
 * [Location]: Called by mystatus.ts, handles MiniMax Coding Plan accounts
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type MiniMaxAuthData,
  type TableRowData,
  HIGH_USAGE_THRESHOLD,
} from "./types";
import {
  formatResetTime,
  createProgressBar,
  calcRemainPercent,
  maskString,
} from "./utils";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================================================
// Type Definitions
// ============================================================================

interface MiniMaxModelRemain {
  start_time: number;
  end_time: number;
  remains_time: number;
  current_interval_total_count: number;
  current_interval_usage_count: number;
  model_name: string;
}

interface MiniMaxRemainsResponse {
  base_resp: {
    status_code: number;
    status_msg: string;
  };
  model_remains?: MiniMaxModelRemain[];
  data?: {
    plan_name?: string;
    total_prompts: number;
    used_prompts: number;
    remaining_prompts: number;
    next_reset_time: number;
    usage_percentage: number;
  };
}

// ============================================================================
// Configuration
// ============================================================================

const MINIMAX_QUOTA_URL =
  "https://api.minimax.io/v1/api/openplatform/coding_plan/remains";

// ============================================================================
// API Calls - use curl subprocess to avoid Cloudflare blocking
// ============================================================================

async function fetchWithCurl(apiKey: string): Promise<MiniMaxRemainsResponse> {
  const cmd = `curl -s -X GET "${MINIMAX_QUOTA_URL}" \
    -H "Authorization: Bearer ${apiKey}" \
    -H "Content-Type: application/json" \
    -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
    -H "Accept: application/json"`;

  let stdout = "";
  try {
    const result = await execAsync(cmd, { timeout: 30000 });
    stdout = result.stdout;
    const stderr = result.stderr;

    if (stderr && !stderr.includes("curl:")) {
      console.error("curl stderr:", stderr);
    }

    const data = JSON.parse(stdout) as MiniMaxRemainsResponse;

    if (data.base_resp.status_code !== 0) {
      throw new Error(
        t.minimaxApiError(
          data.base_resp.status_code,
          data.base_resp.status_msg || "Unknown error",
        ),
      );
    }

    return data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(t.minimaxApiError(0, stdout || "Invalid response"));
    }
    throw err;
  }
}

// ============================================================================
// Output Formatting
// ============================================================================

function formatMiniMaxUsage(
  resp: MiniMaxRemainsResponse,
  apiKey: string,
): string {
  const lines: string[] = [];

  const modelRemains = resp.model_remains?.[0];
  const d = resp.data;

  const maskedKey = maskString(apiKey, 8);

  if (modelRemains) {
    const total = modelRemains.current_interval_total_count;
    const used = modelRemains.current_interval_usage_count;
    const usagePercent = total > 0 ? (used / total) * 100 : 0;
    const remainPercent = calcRemainPercent(usagePercent);
    const progressBar = createProgressBar(remainPercent);

    lines.push(
      `**${t.account}** MiniMax (${maskedKey}) - ${modelRemains.model_name}`,
    );
    lines.push("");
    lines.push(`🔄 ${t.minimaxPromptLimit}`);
    lines.push(`${progressBar} ${t.remaining(remainPercent)}`);
    lines.push(`${t.used}: ${used} / ${total} prompts`);

    if (modelRemains.end_time) {
      if (modelRemains.end_time > Date.now()) {
        lines.push(`${t.resetIn(formatResetTime(modelRemains.end_time))}`);
      }
    }

    if (usagePercent >= HIGH_USAGE_THRESHOLD) {
      lines.push("");
      lines.push(t.limitReached);
    }
  } else if (d) {
    const planLabel = d?.plan_name
      ? `Coding Plan - ${d.plan_name}`
      : "Coding Plan";
    lines.push(`${t.account}        ${maskedKey} (${planLabel})`);
    lines.push("");

    if (!d || (d.total_prompts == null && d.remaining_prompts == null)) {
      lines.push(t.noQuotaData);
      return lines.join("\n");
    }

    const total = d.total_prompts ?? 0;
    const used = d.used_prompts ?? total - (d.remaining_prompts ?? total);
    const usagePercent =
      d.usage_percentage ?? (total > 0 ? (used / total) * 100 : 0);
    const remainPercent = calcRemainPercent(usagePercent);

    const progressBar = createProgressBar(remainPercent);
    lines.push(t.minimaxPromptLimit);
    lines.push(`${progressBar} ${t.remaining(remainPercent)}`);
    lines.push(`${t.used}: ${used} / ${total} prompts`);

    if (d.next_reset_time) {
      if (d.next_reset_time > Date.now()) {
        lines.push(t.resetIn(formatResetTime(d.next_reset_time)));
      }
    }

    if (usagePercent >= HIGH_USAGE_THRESHOLD) {
      lines.push("");
      lines.push(t.limitReached);
    }
  } else {
    lines.push(`${t.account} MiniMax (${maskedKey})`);
    lines.push("");
    lines.push(t.noQuotaData);
  }

  return lines.join("\n");
}

// ============================================================================
// Export Interface
// ============================================================================

/**
 * Extract table row data from MiniMax usage
 */
function extractTableRow(
  resp: MiniMaxRemainsResponse,
  apiKey: string,
): TableRowData | undefined {
  const maskedKey = maskString(apiKey, 4);
  const modelRemains = resp.model_remains?.[0];
  const d = resp.data;

  let used = "-";
  let remaining = "-";
  let resetIn = "-";
  let resetDate = "-";

  if (modelRemains) {
    const totalPrompts = modelRemains.current_interval_total_count;
    const usedPrompts = modelRemains.current_interval_usage_count;
    const remainingPrompts = totalPrompts - usedPrompts;
    const usagePercent =
      totalPrompts > 0 ? (usedPrompts / totalPrompts) * 100 : 0;

    used = `${Math.round(100 - usagePercent)}%`;
    remaining = `${Math.round(usagePercent)}%`;
    if (modelRemains.end_time && modelRemains.end_time > Date.now()) {
      resetDate = formatResetTime(modelRemains.end_time, true);
      resetIn = formatResetTime(modelRemains.end_time);
      resetIn = extractCountdown(resetIn);
    }
  } else if (d) {
    const totalPrompts = d.total_prompts ?? 0;
    const usedPrompts = d.used_prompts ?? 0;
    const usagePercent =
      totalPrompts > 0 ? (usedPrompts / totalPrompts) * 100 : 0;

    used = `${Math.round(100 - usagePercent)}%`;
    remaining = `${Math.round(usagePercent)}%`;
    if (d.next_reset_time && d.next_reset_time > Date.now()) {
      resetDate = formatResetTime(d.next_reset_time, true);
      resetIn = formatResetTime(d.next_reset_time);
      resetIn = extractCountdown(resetIn);
    }
  }

  const planLabel = d?.plan_name
    ? `Coding Plan - ${d.plan_name}`
    : "Coding Plan";

  return {
    provider: "MiniMax",
    account: maskedKey,
    plan: planLabel,
    used,
    remaining,
    resetIn,
    resetDate,
  };
}

/**
 * Extract countdown from full reset time string
 * E.g., "Resets in: 4h 51m (at 11:20:10 19/02/2026)" -> "4h 51m"
 */
function extractCountdown(fullString: string): string {
  const match = fullString.match(/Resets in:\s*(.+?)\s*\(/);
  return match ? match[1].trim() : fullString;
}

export async function queryMiniMaxUsage(
  authData: MiniMaxAuthData | undefined,
): Promise<QueryResult | null> {
  if (!authData?.key) {
    return {
      success: false,
      error: t.minimaxNeedLogin,
    };
  }

  try {
    const usage = await fetchWithCurl(authData.key);
    const tableRow = extractTableRow(usage, authData.key);
    return {
      success: true,
      output: formatMiniMaxUsage(usage, authData.key),
      tableRows: tableRow ? [tableRow] : [],
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
