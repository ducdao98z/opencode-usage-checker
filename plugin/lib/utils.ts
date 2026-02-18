/**
 * Shared Utility Functions
 *
 * [Location]: Shared utility functions used by all platform modules
 * [Sync]: openai.ts, zhipu.ts, google.ts
 */

import { t, currentLang } from "./i18n";
import { REQUEST_TIMEOUT_MS } from "./types";

// ============================================================================
// Time Formatting
// ============================================================================

/**
 * Convert seconds to human-readable time format
 */
export function formatDuration(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts: string[] = [];
  if (days > 0) parts.push(t.days(days));
  if (hours > 0) parts.push(t.hours(hours));
  if (minutes > 0 || parts.length === 0) parts.push(t.minutes(minutes));

  return parts.join(currentLang === "en" ? " " : "");
}

/**
 * Format reset time with two formats:
 * 1. Relative time + exact time: "Resets in: 4h 51m (at 11:20:10 19/02/2026)"
 * 2. Exact time only: "19/02/2026 11:20:10"
 * 3. Compact countdown: "10d 12h 33m"
 * 4. Display format: "12:12 - 12/02/2025"
 */
export function formatResetTime(
  resetTimestamp: number,
  dateOnly?: boolean,
): string {
  const now = Date.now();
  const diffMs = resetTimestamp - now;

  if (diffMs <= 0) {
    return "Resets now";
  }

  const diffSeconds = Math.floor(diffMs / 1000);

  const exactDate = new Date(resetTimestamp);
  const day = exactDate.getDate().toString().padStart(2, "0");
  const month = (exactDate.getMonth() + 1).toString().padStart(2, "0");
  const year = exactDate.getFullYear();
  const hours = exactDate.getHours().toString().padStart(2, "0");
  const minutes = exactDate.getMinutes().toString().padStart(2, "0");
  const seconds = exactDate.getSeconds().toString().padStart(2, "0");

  if (dateOnly) {
    return `${hours}:${minutes} - ${day}/${month}/${year}`;
  }

  const exactTime = `at ${hours}:${minutes}:${seconds} ${day}/${month}/${year}`;
  const relativeTime = formatDuration(diffSeconds);

  return `Resets in: ${relativeTime} (${exactTime})`;
}

// ============================================================================
// Progress Bar
// ============================================================================

/**
 * Generate progress bar (filled represents remaining quota)
 * @param remainPercent Remaining percentage (0-100)
 * @param width Progress bar width (number of characters)
 */
export function createProgressBar(
  remainPercent: number,
  width: number = 30,
): string {
  // Ensure percentage is in valid range
  const safePercent = Math.max(0, Math.min(100, remainPercent));
  const filled = Math.round((safePercent / 100) * width);
  const empty = width - filled;

  const filledChar = "█";
  const emptyChar = "░";

  return filledChar.repeat(filled) + emptyChar.repeat(empty);
}

// ============================================================================
// Number Formatting
// ============================================================================

/**
 * Calculate remaining percentage and round
 * @param usedPercent Used percentage
 */
export function calcRemainPercent(usedPercent: number): number {
  return Math.round(100 - usedPercent);
}

/**
 * Format token count (in millions)
 */
export function formatTokens(tokens: number): string {
  return (tokens / 1000000).toFixed(1) + "M";
}

// ============================================================================
// Network Requests
// ============================================================================

/**
 * Fetch request with timeout
 * @param url Request URL
 * @param options Fetch options
 * @param timeoutMs Timeout in milliseconds, defaults to global config
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(t.timeoutError(Math.round(timeoutMs / 1000)));
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================================
// Safe Calculations
// ============================================================================

/**
 * Safely get max value of array, returns 0 for empty array
 */
export function safeMax(arr: number[]): number {
  if (arr.length === 0) return 0;
  return Math.max(...arr);
}

// ============================================================================
// String Processing
// ============================================================================

/**
 * Mask sensitive string for display
 * Shows first N and last N characters, middle replaced with ****
 * @param str Original string
 * @param showChars Number of chars to show at start/end, default 4
 */
export function maskString(str: string, showChars: number = 4): string {
  if (str.length <= showChars * 2) {
    return str;
  }
  return `${str.slice(0, showChars)}****${str.slice(-showChars)}`;
}
