/**
 * Internationalization Module (English & Vietnamese)
 *
 * [Input]: System locale
 * [Output]: Translation function and current language
 * [Location]: Shared by all platform modules
 * [Sync]: openai.ts, minimax.ts, anthropic.ts, copilot.ts, mystatus.ts, utils.ts
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type Language = "en" | "vi";

// ============================================================================
// Language Detection
// ============================================================================

/**
 * Detect user system language
 * Prioritizes Intl API, falls back to environment variables, defaults to English
 */
function detectLanguage(): Language {
  // 1. Prioritize Intl API (more reliable)
  try {
    const intlLocale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (intlLocale.startsWith("vi")) return "vi";
  } catch {
    // Intl API not available, continue with environment variables
  }

  // 2. Fallback to environment variables
  const lang =
    process.env.LANG || process.env.LC_ALL || process.env.LANGUAGE || "";
  if (lang.startsWith("vi")) return "vi";

  // 3. Default to English
  return "en";
}

// ============================================================================
// Translation Definitions (English & Vietnamese)
// ============================================================================

const translations = {
  en: {
    // Time units
    days: (n: number) => `${n}d`,
    hours: (n: number) => `${n}h`,
    minutes: (n: number) => `${n}m`,

    // Quota related
    hourLimit: (h: number) => `${h}-hour limit`,
    dayLimit: (d: number) => `${d}-day limit`,
    remaining: (p: number) => `${p}% remaining`,
    resetIn: (t: string) => `${t}`,
    limitReached: "⚠️ Rate limit reached!",

    // Common
    account: "Account:",
    unknown: "unknown",
    used: "Used",

    // Error messages
    authError: (path: string, err: string) =>
      `❌ Failed to read auth file: ${path}\nError: ${err}`,
    apiError: (status: number, text: string) =>
      `OpenAI API request failed (${status}): ${text}`,
    timeoutError: (seconds: number) => `Request timeout (${seconds}s)`,
    tokenExpired:
      "⚠️ OAuth token expired. Please use an OpenAI model in OpenCode to refresh authorization.",
    noAccounts:
      "No configured accounts found.\n\nSupported account types:\n- OpenAI (Plus/Team/Pro subscribers)\n- MiniMax (Coding Plan)\n- Anthropic (Claude API)\n- GitHub Copilot",
    queryFailed: "❌ Failed to query accounts:\n",
    noQuotaData: "No quota data available",

    // Platform titles
    openaiTitle: "## OpenAI Account Quota",

    // MiniMax related
    minimaxTitle: "## MiniMax Account Quota",
    minimaxApiError: (status: number, text: string) =>
      `MiniMax API request failed (${status}): ${text}`,
    minimaxPromptLimit: "5-hour prompt limit",
    minimaxConfigRequired:
      "⚠️ MiniMax requires session cookie configuration.\n" +
      "Create ~/.config/opencode/minimax-session.json:\n" +
      '  {"session": "HERTZ-SESSION_VALUE"}\n\n' +
      "How to get:\n" +
      "1. Login to https://platform.minimaxi.io\n" +
      "2. Open DevTools (F12) → Network\n" +
      "3. Visit /coding_plan/remains\n" +
      "4. Copy Cookie from Request Headers",
    minimaxNeedLogin:
      "⚠️ MiniMax session expired or not logged in.\n" +
      "Browser will open automatically for you to login.\n" +
      "After login, close the browser and session will be saved automatically.",

    // Anthropic related
    anthropicTitle: "## Anthropic Account Quota",
    anthropicApiError: (status: number, text: string) =>
      `Anthropic API request failed (${status}): ${text}`,
    anthropic24hUsage: "24-hour usage",
    anthropic1mUsage: "This month",
    anthropicMonthlyLimit: "Monthly limit",
    anthropic5HourUsage: "5-hour window (Session)",
    anthropic7DayUsage: "7-day window (Weekly)",

    // GitHub Copilot related
    copilotTitle: "## GitHub Copilot Account Quota",
    copilotApiError: (status: number, text: string) =>
      `GitHub Copilot API request failed (${status}): ${text}`,
    premiumRequests: "Premium",
    chatQuota: "Chat",
    completionsQuota: "Completions",
    overage: "Overage",
    overageRequests: "requests",
    quotaResets: "Quota resets",
    resetsSoon: "Resets soon",
    modelBreakdown: "Model breakdown:",
    billingPeriod: "Period",
    copilotQuotaUnavailable:
      "⚠️ GitHub Copilot quota query unavailable.\n" +
      "OpenCode's new OAuth integration doesn't support quota API access.",
    copilotQuotaWorkaround:
      "Solution:\n" +
      "1. Create a fine-grained PAT (visit https://github.com/settings/tokens?type=beta)\n" +
      "2. Under 'Account permissions', set 'Plan' to 'Read-only'\n" +
      "3. Create config file ~/.config/opencode/copilot-quota-token.json:\n" +
      '   {"token": "github_pat_xxx...", "username": "YourUsername"}\n\n' +
      "Alternatives:\n" +
      "• Click the Copilot icon in VS Code status bar to view quota\n" +
      "• Visit https://github.com/settings/billing for usage info",

    // Table display
    tableTitle: "## AI Provider Quota Status",
    tableHeader: {
      provider: "Provider",
      account: "Account",
      plan: "Plan",
      used: "Used",
      remaining: "Remaining",
      resetIn: "Reset In",
      resetDate: "Reset Date",
    },
  },

  vi: {
    // Time units
    days: (n: number) => `${n}ngày`,
    hours: (n: number) => `${n}giờ`,
    minutes: (n: number) => `${n}phút`,

    // Quota related
    hourLimit: (h: number) => `Giới hạn ${h} giờ`,
    dayLimit: (d: number) => `Giới hạn ${d} ngày`,
    remaining: (p: number) => `Còn lại ${p}%`,
    resetIn: (t: string) => `${t}`,
    limitReached: "⚠️ Đã đạt Giới hạn!",

    // Common
    account: "Tài khoản:",
    unknown: "Không xác định",
    used: "Đã dùng",

    // Error messages
    authError: (path: string, err: string) =>
      `❌ Không đọc được file auth: ${path}\nLỗi: ${err}`,
    apiError: (status: number, text: string) =>
      `Yêu cầu OpenAI API thất bại (${status}): ${text}`,
    timeoutError: (seconds: number) => `Hết thời gian chờ (${seconds} giây)`,
    tokenExpired:
      "⚠️ Token OAuth đã hết hạn. Vui lòng sử dụng một mô hình OpenAI trong OpenCode để làm mới quyền truy cập.",
    noAccounts:
      "Không tìm thấy tài khoản nào đã cấu hình.\n\nCác loại tài khoản được hỗ trợ:\n- OpenAI (Plus/Team/Pro)\n- MiniMax (Coding Plan)\n- Anthropic (Claude API)\n- GitHub Copilot",
    queryFailed: "❌ Các tài khoản truy vấn thất bại:\n",
    noQuotaData: "Không có dữ liệu hạn mức",

    // Platform titles
    openaiTitle: "## Hạn mức tài khoản OpenAI",

    // MiniMax related
    minimaxTitle: "## Hạn mức tài khoản MiniMax",
    minimaxApiError: (status: number, text: string) =>
      `Yêu cầu MiniMax API thất bại (${status}): ${text}`,
    minimaxPromptLimit: "Giới hạn prompt 5 giờ",
    minimaxConfigRequired:
      "⚠️ MiniMax yêu cầu cấu hình session cookie.\n" +
      "Tạo ~/.config/opencode/minimax-session.json:\n" +
      '  {"session": "HERTZ-SESSION_VALUE"}\n\n' +
      "Cách lấy:\n" +
      "1. Đăng nhập https://platform.minimaxi.io\n" +
      "2. Mở DevTools (F12) → Network\n" +
      "3. Truy cập /coding_plan/remains\n" +
      "4. Sao chép Cookie từ Request Headers",
    minimaxNeedLogin:
      "⚠️ Session MiniMax đã hết hạn hoặc chưa đăng nhập.\n" +
      "Trình duyệt sẽ tự động mở để bạn đăng nhập.\n" +
      "Sau khi đăng nhập, đóng trình duyệt và session sẽ được lưu tự động.",

    // Anthropic related
    anthropicTitle: "## Hạn mức tài khoản Anthropic",
    anthropicApiError: (status: number, text: string) =>
      `Yêu cầu Anthropic API thất bại (${status}): ${text}`,
    anthropic24hUsage: "Sử dụng 24 giờ",
    anthropic1mUsage: "Tháng này",
    anthropicMonthlyLimit: "Hạn mức hàng tháng",
    anthropic5HourUsage: "Cửa sổ 5 giờ (Session)",
    anthropic7DayUsage: "Cửa sổ 7 ngày (Weekly)",

    // GitHub Copilot related
    copilotTitle: "## Hạn mức tài khoản GitHub Copilot",
    copilotApiError: (status: number, text: string) =>
      `Yêu cầu GitHub Copilot API thất bại (${status}): ${text}`,
    premiumRequests: "Premium",
    chatQuota: "Chat",
    completionsQuota: "Completions",
    overage: "Vượt quá",
    overageRequests: "yêu cầu",
    quotaResets: "Hạn mức reset",
    resetsSoon: "Sắp reset",
    modelBreakdown: "Chi tiết theo model:",
    billingPeriod: "Kỳ thanh toán",
    copilotQuotaUnavailable:
      "⚠️ Truy vấn hạn mức GitHub Copilot không khả dụng.\n" +
      "Tích hợp OAuth mới của OpenCode không hỗ trợ truy cập API hạn mức.",
    copilotQuotaWorkaround:
      "Giải pháp:\n" +
      "1. Tạo fine-grained PAT (truy cập https://github.com/settings/tokens?type=beta)\n" +
      "2. Trong 'Account permissions', đặt 'Plan' thành 'Read-only'\n" +
      "3. Tạo file cấu hình ~/.config/opencode/copilot-quota-token.json:\n" +
      '   {"token": "github_pat_xxx...", "username": "TenNguoiDung"}\n\n' +
      "Các cách khác:\n" +
      "• Nhấ vào biểpu tượng Copilot trong thanh trạng thái VS Code để xem hạn mức\n" +
      "• Truy cập https://github.com/settings/billing để xem thông tin sử dụng",

    // Table display
    tableTitle: "## Trạng thái hạn mức nhà cung cấp AI",
    tableHeader: {
      provider: "Nhà cung cấp",
      account: "Tài khoản",
      plan: "Gói",
      used: "Đã dùng",
      remaining: "Còn lại",
      resetIn: "Thời gian reset",
      resetDate: "Ngày reset",
    },
  },
} as const;

// ============================================================================
// Exports
// ============================================================================

/** Current language (detected once at module load) */
export const currentLang = detectLanguage();

/** Translation function */
export const t = translations[currentLang];
