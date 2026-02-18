/**
 * OpenCode Quota Status Query Plugin
 *
 * [Input]: Auth info from ~/.local/share/opencode/auth.json
 * [Output]: Quota usage display with progress bars
 * [Location]: Queries account quotas via mystatus tool
 * [Sync]: lib/openai.ts, lib/minimax.ts, lib/anthropic.ts, lib/copilot.ts, lib/types.ts, lib/i18n.ts
 */

import { type Plugin, tool } from "@opencode-ai/plugin";
import { readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

import { t } from "./lib/i18n";
import {
  type AuthData,
  type QueryResult,
  type TableRowData,
} from "./lib/types";
import { queryOpenAIUsage } from "./lib/openai";
import { queryMiniMaxUsage } from "./lib/minimax";
import { queryCopilotUsage } from "./lib/copilot";
import { queryAnthropicUsage } from "./lib/anthropic";

// ============================================================================
// Plugin Export (single export to avoid other functions being loaded as plugin)
// ============================================================================

const TABLE_COLUMNS = [
  "provider",
  "account",
  "plan",
  "used",
  "total",
  "remaining",
  "resetTime",
] as const;

export const MyStatusPlugin: Plugin = async () => {
  return {
    tool: {
      mystatus: tool({
        description:
          "Query account quota usage for all configured AI platforms. Returns remaining quota percentages, usage stats, and reset countdowns with visual progress bars. Currently supports OpenAI (ChatGPT/Codex), MiniMax, Anthropic (Claude), and GitHub Copilot.",
        args: {},
        async execute() {
          // 1. Read auth.json
          const authPath = join(homedir(), ".local/share/opencode/auth.json");
          let authData: AuthData;

          try {
            const content = await readFile(authPath, "utf-8");
            authData = JSON.parse(content);
          } catch (err) {
            return t.authError(
              authPath,
              err instanceof Error ? err.message : String(err),
            );
          }

          // 2. Build query tasks - only query configured providers
          const queries: {
            key: string;
            result: Promise<QueryResult | null>;
            title: string;
          }[] = [];

          // OpenAI
          if (authData.openai) {
            queries.push({
              key: "openai",
              result: queryOpenAIUsage(authData.openai),
              title: t.openaiTitle,
            });
          }

          // MiniMax
          if (authData["minimax-coding-plan"] || authData.minimax) {
            queries.push({
              key: "minimax",
              result: queryMiniMaxUsage(
                authData["minimax-coding-plan"] ?? authData.minimax,
              ),
              title: t.minimaxTitle,
            });
          }

          // GitHub Copilot
          if (authData["github-copilot"]) {
            queries.push({
              key: "copilot",
              result: queryCopilotUsage(authData["github-copilot"]),
              title: t.copilotTitle,
            });
          }

          // Anthropic (Claude.ai)
          if (authData["anthropic"]) {
            queries.push({
              key: "anthropic",
              result: queryAnthropicUsage(authData["anthropic"]),
              title: t.anthropicTitle,
            });
          }

          // 3. Query all configured providers in parallel
          const queryResults = await Promise.all(queries.map((q) => q.result));

          // 4. Collect results - both output (backward compatibility) and tableRow data
          const results: string[] = [];
          const tableRows: TableRowData[] = [];
          const errors: string[] = [];

          for (let i = 0; i < queries.length; i++) {
            collectResult(
              queryResults[i],
              queries[i].title,
              results,
              errors,
              tableRows,
            );
          }

          // 5. Aggregate output
          if (results.length === 0 && errors.length === 0) {
            return t.noAccounts;
          }

          let output = "";

          // Render unified table if we have tableRow data
          if (tableRows.length > 0) {
            output = renderTable(tableRows);
          } else if (results.length > 0) {
            // Fallback to legacy block format
            output = results.join("\n");
          }

          if (errors.length > 0) {
            if (output) output += "\n\n";
            output += t.queryFailed + errors.join("\n");
          }

          return output;
        },
      }),
    },
  };
};

/**
 * Render table from tableRow data
 */
function renderTable(rows: TableRowData[]): string {
  const headers = t.tableHeader;
  const colWidths = {
    provider: Math.max(
      headers.provider.length,
      ...rows.map((r) => r.provider.length),
    ),
    account: Math.max(
      headers.account.length,
      ...rows.map((r) => r.account.length),
    ),
    plan: Math.max(headers.plan.length, ...rows.map((r) => r.plan.length)),
    used: Math.max(headers.used.length, ...rows.map((r) => r.used.length)),
    remaining: Math.max(
      headers.remaining.length,
      ...rows.map((r) => r.remaining.length),
    ),
    resetIn: Math.max(
      headers.resetIn.length,
      ...rows.map((r) => r.resetIn.length),
    ),
    resetDate: Math.max(
      headers.resetDate.length,
      ...rows.map((r) => r.resetDate.length),
    ),
  };

  const pad = (s: string, w: number) => s.padEnd(w, " ");

  const headerRow =
    "|" +
    pad(headers.provider, colWidths.provider) +
    "|" +
    pad(headers.account, colWidths.account) +
    "|" +
    pad(headers.plan, colWidths.plan) +
    "|" +
    pad(headers.used, colWidths.used) +
    "|" +
    pad(headers.remaining, colWidths.remaining) +
    "|" +
    pad(headers.resetIn, colWidths.resetIn) +
    "|" +
    pad(headers.resetDate, colWidths.resetDate) +
    "|";

  const separator =
    "|" +
    "-".repeat(colWidths.provider + 1) +
    "|-" +
    "-".repeat(colWidths.account + 1) +
    "|-" +
    "-".repeat(colWidths.plan + 1) +
    "|-" +
    "-".repeat(colWidths.used + 1) +
    "|-" +
    "-".repeat(colWidths.remaining + 1) +
    "|-" +
    "-".repeat(colWidths.resetIn + 1) +
    "|-" +
    "-".repeat(colWidths.resetDate + 1) +
    "|";

  const dataRows = rows.map((row) => {
    return (
      "|" +
      pad(row.provider, colWidths.provider) +
      "|" +
      pad(row.account, colWidths.account) +
      "|" +
      pad(row.plan, colWidths.plan) +
      "|" +
      pad(row.used, colWidths.used) +
      "|" +
      pad(row.remaining, colWidths.remaining) +
      "|" +
      pad(row.resetIn, colWidths.resetIn) +
      "|" +
      pad(row.resetDate, colWidths.resetDate) +
      "|"
    );
  });

  return (
    t.tableTitle +
    "\n\n" +
    headerRow +
    "\n" +
    separator +
    "\n" +
    dataRows.join("\n")
  );
}

/**
 * Collect query results into results and errors arrays
 * Note: This is an internal function, not exported to avoid being loaded as a plugin by OpenCode
 */
function collectResult(
  result: QueryResult | null,
  title: string,
  results: string[],
  errors: string[],
  tableRows: TableRowData[],
): void {
  if (!result) return;

  if (result.success) {
    // Keep legacy output format for backward compatibility
    if (result.output) {
      if (results.length > 0) results.push(""); // Separator
      results.push(title);
      results.push("");
      results.push(result.output);
    }

    // Collect table row data for unified table display
    if (result.tableRows && result.tableRows.length > 0) {
      tableRows.push(...result.tableRows);
    }
  } else if (result.error) {
    errors.push(result.error);
  }
}
