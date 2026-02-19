# opencode-usage-checker

Base on: [opencode-usage-checker](https://github.com/vbgate/opencode-usage-checker)

[![npm](https://img.shields.io/npm/v/opencode-usage-checker)](https://www.npmjs.com/package/opencode-usage-checker)

An [OpenCode](https://opencode.ai) plugin to query account quota usage for multiple AI platforms.

[Tiếng Việt](./README.vi.md)

## Supported Platforms

| Platform       | Account Type          | Data Source                         |
| -------------- | --------------------- | ----------------------------------- |
| OpenAI         | Plus / Team / Pro     | `~/.local/share/opencode/auth.json` |
| MiniMax        | Coding Plan           | `~/.local/share/opencode/auth.json` |
| Anthropic      | Claude Pro            | `~/.local/share/opencode/auth.json` |
| GitHub Copilot | Individual / Business | `~/.local/share/opencode/auth.json` |

## Installation

### Let an LLM do it

Paste this into any LLM agent (Claude Code, OpenCode, Cursor, etc.):

```
Install the opencode-usage-checker plugin by following: https://raw.githubusercontent.com/vbgate/opencode-usage-checker/main/README.md
```

<details>
<summary><b>Instructions for LLM agents</b></summary>

To install this plugin, perform these steps:

1. Add `"opencode-usage-checker"` to the `plugin` array in `~/.config/opencode/opencode.json`

2. Add the slash command to the `command` object in the same file:

```json
{
    "plugin": ["opencode-usage-checker"],
    "command": {
        "mystatus": {
            "description": "Query quota usage for all AI accounts",
            "template": "Use the mystatus tool to query quota usage. Return the result as-is without modification."
        }
    }
}
```

3. Tell the user to restart OpenCode.

</details>

### Manual Installation

1. Add the plugin and slash command to your `~/.config/opencode/opencode.json`:

```json
{
    "plugin": ["opencode-usage-checker"],
    "command": {
        "mystatus": {
            "description": "Query quota usage for all AI accounts",
            "template": "Use the mystatus tool to query quota usage. Return the result as-is without modification."
        }
    }
}
```

2. Restart OpenCode

### From Local Files

Copy the plugin files to your OpenCode config directory:

1. Copy `plugin/mystatus.ts` and `plugin/lib/` to `~/.config/opencode/plugin/`
2. Copy `command/mystatus.md` to `~/.config/opencode/command/`
3. Restart OpenCode

## Usage

### Option 1: Slash Command

Use the `/mystatus` command to get complete quota information:

```
/mystatus
```

### Option 2: Natural Language

Simply ask in natural language, for example:

- "Check my OpenAI quota"
- "How much quota do I have left?"
- "Show my AI account status"

OpenCode will automatically use the mystatus tool to answer your question.

## Output Example

```
## AI Provider Quota Status

| Provider       | Account             | Plan                  | Used   | Remaining | Reset In  | Reset Date        |
|---------------|--------------------|-----------------------|--------|-----------|-----------|-------------------|
| OpenAI        | user@example.com   | Team                  | 15%    | 85%       | 2h 30m    | 19/02/2026 11:20 |
| MiniMax       | abc1****xyz9       | Coding Plan - Pro     | 20%    | 80%       | 4h 51m    | 19/02/2026 11:20 |
| Anthropic     | abc1****xyz9       | Claude Pro (5h)      | 25%    | 75%       | 3h 20m    | 19/02/2026 15:30 |
| Anthropic     | abc1****xyz9       | Claude Pro (7d)      | 40%    | 60%       | 6d 2h     | 25/02/2026 09:00 |
| GitHub Copilot| @individual        | pro                   | 24%    | 76%       | 19d 0h   | 01/03/2026 00:00 |
```

> **Note:** For MiniMax, the Used column shows remaining tokens (decreases over time), and Remaining shows used tokens.

## Features

- Query quota usage across multiple AI platforms in one command
- Visual progress bars showing remaining quota
- Reset time countdown with exact datetime
- Multi-language support (English / Vietnamese)
- API key masking for security

## Configuration

No additional configuration required. The plugin automatically reads credentials from:

- **OpenAI, MiniMax, Anthropic & GitHub Copilot**: `~/.local/share/opencode/auth.json`

### MiniMax Setup

To query MiniMax Coding Plan quota, you need to obtain an API key from the MiniMax platform.

### Anthropic Setup

To query Anthropic (Claude) quota, you need OAuth credentials. The plugin uses the Anthropic OAuth API with refresh token support.

## Security

This plugin is safe to use:

**Local Files Accessed (read-only):**

- `~/.local/share/opencode/auth.json` - OpenCode's official auth storage

**API Endpoints (all official):**

- `https://chatgpt.com/backend-api/wham/usage` - OpenAI official quota API
- `https://www.minimax.io/v1/api/openplatform/coding_plan/remains` - MiniMax official API
- `https://api.anthropic.com/api/oauth/usage` - Anthropic official API
- `https://api.github.com/copilot_internal/user` - GitHub Copilot official API

**Privacy:**

- No data is stored, uploaded, or cached by this plugin
- Sensitive information (API keys) is automatically masked in output
- Source code is fully open for review

## Development

```bash
# Using npm
npm install
npm run typecheck
npm run build

# Or using Bun
bun install
bun run typecheck
bun run build
```

## License

MIT
