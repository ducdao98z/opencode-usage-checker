/**
 * Shared Type Definitions
 *
 * [Location]: Shared types used by all platform modules
 * [Sync]: openai.ts, minimax.ts, anthropic.ts, copilot.ts, mystatus.ts
 */

// ============================================================================
// Query Result Types
// ============================================================================

/**
 * Platform query result
 */
export interface QueryResult {
  success: boolean;
  output?: string;
  error?: string;
  tableRows?: TableRowData[];
}

/**
 * Table row data for unified table display
 */
export interface TableRowData {
  provider: string;
  account: string;
  plan: string;
  used: string;
  remaining: string;
  resetIn: string;
  resetDate: string;
}

// ============================================================================
// Auth Data Types
// ============================================================================

/**
 * OpenAI OAuth auth data
 */
export interface OpenAIAuthData {
  type: string;
  access?: string;
  refresh?: string;
  expires?: number;
}

/**
 * MiniMax Coding Plan API auth data
 * Auth keys in auth.json: "minimax-coding-plan" and/or "minimax"
 */
export interface MiniMaxAuthData {
  type: string;
  key?: string;
}

/**
 * Anthropic API auth data
 * Auth key in auth.json: "anthropic"
 */
export interface AnthropicAuthData {
  type: string;
  access?: string;
  refresh?: string;
  expires?: number;
}

/**
 * GitHub Copilot auth data
 */
export interface CopilotAuthData {
  type: string;
  refresh?: string;
  access?: string;
  expires?: number;
}

/**
 * Copilot subscription tier
 * See: https://docs.github.com/en/copilot/about-github-copilot/subscription-plans-for-github-copilot
 */
export type CopilotTier = "free" | "pro" | "pro+" | "business" | "enterprise";

/**
 * Copilot quota token configuration
 * Stored in ~/.config/opencode/copilot-quota-token.json
 *
 * Users can create a fine-grained PAT with "Plan" read permission
 * to enable quota checking via the public GitHub REST API.
 */
export interface CopilotQuotaConfig {
  /** Fine-grained PAT with "Plan" read permission */
  token: string;
  /** GitHub username (for API calls) */
  username: string;
  /** Copilot subscription tier (determines monthly quota limit) */
  tier: CopilotTier;
}

/**
 * Complete auth data structure
 */
export interface AuthData {
  openai?: OpenAIAuthData;
  "github-copilot"?: CopilotAuthData;
  "minimax-coding-plan"?: MiniMaxAuthData;
  minimax?: MiniMaxAuthData;
  anthropic?: AnthropicAuthData;
}

// ============================================================================
// Constants Configuration
// ============================================================================

/** High usage warning threshold (percentage) */
export const HIGH_USAGE_THRESHOLD = 80;

/** API request timeout (milliseconds) */
export const REQUEST_TIMEOUT_MS = 10000;
