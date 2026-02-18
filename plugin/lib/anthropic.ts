/**
 * Anthropic Quota Query Module
 *
 * [Input]: OAuth token from auth.json
 * [Output]: Formatted quota usage information
 * [Location]: Called by mystatus.ts, handles Claude.ai accounts
 * [Sync]: mystatus.ts, types.ts, utils.ts, i18n.ts
 *
 * Reference: https://github.com/nguyenngothuong/opencode-claude-quota
 */

import { t } from "./i18n";
import {
  type QueryResult,
  type AnthropicAuthData,
  type TableRowData,
  HIGH_USAGE_THRESHOLD,
} from "./types";
import {
  formatResetTime,
  createProgressBar,
  calcRemainPercent,
  maskString,
  fetchWithTimeout,
} from "./utils";

interface ClaudeUsageResponse {
  five_hour?: {
    utilization: number;
    resets_at: string;
  };
  seven_day?: {
    utilization: number;
    resets_at: string;
  };
  seven_day_sonnet?: {
    utilization: number;
  };
}

const CLAUDE_USAGE_URL = "https://api.anthropic.com/api/oauth/usage";
const CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

async function refreshAccessToken(
  refreshToken: string,
): Promise<string | null> {
  try {
    const response = await fetchWithTimeout(
      "https://console.anthropic.com/v1/oauth/token",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: CLIENT_ID,
        }),
      },
    );

    if (!response.ok) {
      return null;
    }

    const json = (await response.json()) as { access_token?: string };
    return json.access_token || null;
  } catch {
    return null;
  }
}

async function fetchClaudeUsage(
  accessToken: string,
): Promise<ClaudeUsageResponse | null> {
  try {
    const response = await fetchWithTimeout(CLAUDE_USAGE_URL, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "oauth-2025-04-20",
      },
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as ClaudeUsageResponse;
  } catch {
    return null;
  }
}

function formatClaudeUsage(
  data: ClaudeUsageResponse | null,
  accessToken: string,
): string {
  const lines: string[] = [];
  const maskedToken = maskString(accessToken, 8);

  lines.push(`**${t.account}** Claude.ai (${maskedToken})`);
  lines.push("");

  if (!data) {
    lines.push(t.noQuotaData);
    return lines.join("\n");
  }

  const fiveHour = data.five_hour;
  const sevenDay = data.seven_day;

  if (fiveHour) {
    const sessionUsed = Math.round(fiveHour.utilization || 0);
    const remainPercent = calcRemainPercent(sessionUsed);
    const progressBar = createProgressBar(remainPercent);

    lines.push(`🔄 ${t.anthropic5HourUsage}`);
    lines.push(`${progressBar} ${t.remaining(remainPercent)}`);
    lines.push(`${t.used}: ${sessionUsed}%`);

    if (fiveHour.resets_at) {
      const reset = new Date(fiveHour.resets_at);
      if (reset.getTime() > Date.now()) {
        lines.push(`${t.resetIn(formatResetTime(reset.getTime()))}`);
      }
    }

    if (sessionUsed >= HIGH_USAGE_THRESHOLD) {
      lines.push(t.limitReached);
    }
  }

  if (sevenDay) {
    const weeklyUsed = Math.round(sevenDay.utilization || 0);
    const remainPercent = calcRemainPercent(weeklyUsed);
    const progressBar = createProgressBar(remainPercent);

    if (lines.length > 2) lines.push("");
    lines.push(`📅 ${t.anthropic7DayUsage}`);
    lines.push(`${progressBar} ${t.remaining(remainPercent)}`);
    lines.push(`${t.used}: ${weeklyUsed}%`);

    if (sevenDay.resets_at) {
      const reset = new Date(sevenDay.resets_at);
      if (reset.getTime() > Date.now()) {
        lines.push(`${t.resetIn(formatResetTime(reset.getTime()))}`);
      }
    }

    if (weeklyUsed >= HIGH_USAGE_THRESHOLD) {
      lines.push(t.limitReached);
    }
  }

  return lines.join("\n");
}

/**
 * Extract table row data from Anthropic usage
 */
function extractTableRows(
  data: ClaudeUsageResponse | null,
  accessToken: string,
): TableRowData[] {
  if (!data) return [];

  const maskedToken = maskString(accessToken, 4);
  const fiveHour = data.five_hour;
  const sevenDay = data.seven_day;
  const rows: TableRowData[] = [];

  if (fiveHour) {
    const usedPercent = Math.round(fiveHour.utilization || 0);
    let resetIn = "-";
    let resetDate = "-";

    if (fiveHour.resets_at) {
      const reset = new Date(fiveHour.resets_at);
      if (reset.getTime() > Date.now()) {
        resetDate = formatResetTime(reset.getTime(), true);
        const fullReset = formatResetTime(reset.getTime());
        resetIn = extractCountdown(fullReset);
      }
    }

    rows.push({
      provider: "Anthropic",
      account: maskedToken,
      plan: "Claude Pro (5h)",
      used: `${usedPercent}%`,
      remaining: `${calcRemainPercent(usedPercent)}%`,
      resetIn,
      resetDate,
    });
  }

  if (sevenDay) {
    const usedPercent = Math.round(sevenDay.utilization || 0);
    let resetIn = "-";
    let resetDate = "-";

    if (sevenDay.resets_at) {
      const reset = new Date(sevenDay.resets_at);
      if (reset.getTime() > Date.now()) {
        resetDate = formatResetTime(reset.getTime(), true);
        const fullReset = formatResetTime(reset.getTime());
        resetIn = extractCountdown(fullReset);
      }
    }

    rows.push({
      provider: "Anthropic",
      account: maskedToken,
      plan: "Claude Pro (7d)",
      used: `${usedPercent}%`,
      remaining: `${calcRemainPercent(usedPercent)}%`,
      resetIn,
      resetDate,
    });
  }

  return rows;
}

/**
 * Extract countdown from full reset time string
 * E.g., "Resets in: 4h 51m (at 11:20:10 19/02/2026)" -> "4h 51m"
 */
function extractCountdown(fullString: string): string {
  const match = fullString.match(/Resets in:\s*(.+?)\s*\(/);
  return match ? match[1].trim() : fullString;
}

export async function queryAnthropicUsage(
  authData: AnthropicAuthData | undefined,
): Promise<QueryResult | null> {
  if (!authData?.access) {
    return null;
  }

  let accessToken = authData.access;

  if (authData.refresh && authData.expires && authData.expires < Date.now()) {
    const newToken = await refreshAccessToken(authData.refresh);
    if (newToken) {
      accessToken = newToken;
    }
  }

  try {
    const usage = await fetchClaudeUsage(accessToken);
    if (!usage) {
      return {
        success: false,
        error: "Anthropic: Failed to fetch usage data",
      };
    }

    const tableRows = extractTableRows(usage, accessToken);
    return {
      success: true,
      output: formatClaudeUsage(usage, accessToken),
      tableRows,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
