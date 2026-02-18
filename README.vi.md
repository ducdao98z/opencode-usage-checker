# opencode-mystatus

[![npm version](https://img.shields.io/npm/v/opencode-mystatus.svg)](https://www.npmjs.com/package/opencode-mystatus)
[![npm downloads](https://img.shields.io/npm/dt/opencode-mystatus)](https://www.npmjs.com/package/opencode-mystatus)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Plugin [OpenCode](https://opencode.ai) để truy vấn hạn mức sử dụng tài khoản nhiều nền tảng AI.

[English](./README.md)

![Check AI Quota in One Click](./assets/mystatus-banner-vi.jpeg)

## Các nền tảng được hỗ trợ

| Nền tảng       | Loại tài khoản        | Nguồn dữ liệu                       |
| -------------- | --------------------- | ----------------------------------- |
| OpenAI         | Plus / Team / Pro     | `~/.local/share/opencode/auth.json` |
| MiniMax        | Coding Plan           | `~/.local/share/opencode/auth.json` |
| Anthropic      | Claude Pro            | `~/.local/share/opencode/auth.json` |
| GitHub Copilot | Individual / Business | `~/.local/share/opencode/auth.json` |

## Cài đặt

### Để AI cài đặt cho bạn

Dán nội dung này vào bất kỳ tác nhân AI nào (Claude Code, OpenCode, Cursor, v.v.):

```
Install the opencode-mystatus plugin by following: https://raw.githubusercontent.com/vbgate/opencode-mystatus/main/README.md
```

<details>
<summary><b>Hướng dẫn cho tác nhân AI</b></summary>

Để cài đặt plugin này, thực hiện các bước sau:

1. Thêm `"opencode-mystatus"` vào mảng `plugin` trong `~/.config/opencode/opencode.json`

2. Thêm lệnh slash vào đối tượng `command` trong cùng file đó:

```json
{
    "plugin": ["opencode-mystatus"],
    "command": {
        "mystatus": {
            "description": "Truy vấn hạn mức sử dụng cho tất cả tài khoản AI",
            "template": "Use the mystatus tool to query quota usage. Return the result as-is without modification."
        }
    }
}
```

3. Yêu cầu người dùng khởi động lại OpenCode.

</details>

### Cài đặt thủ công

1. Thêm plugin và lệnh slash vào `~/.config/opencode/opencode.json`:

```json
{
    "plugin": ["opencode-mystatus"],
    "command": {
        "mystatus": {
            "description": "Truy vấn hạn mức sử dụng cho tất cả tài khoản AI",
            "template": "Use the mystatus tool to query quota usage. Return the result as-is without modification."
        }
    }
}
```

2. Khởi động lại OpenCode

### Từ file cục bộ

Sao chép các file plugin vào thư mục cấu hình OpenCode:

1. Sao chép `plugin/mystatus.ts` và `plugin/lib/` vào `~/.config/opencode/plugin/`
2. Sao chép `command/mystatus.md` vào `~/.config/opencode/command/`
3. Khởi động lại OpenCode

## Cách sử dụng

### Tùy chọn 1: Lệnh Slash

Sử dụng lệnh `/mystatus` để lấy thông tin hạn mức đầy đủ:

```
/mystatus
```

### Tùy chọn 2: Ngôn ngữ tự nhiên

Chỉ cần hỏi bằng ngôn ngữ tự nhiên, ví dụ:

- "Kiểm tra hạn mức OpenAI của tôi"
- "Tôi còn bao nhiêu hạn mức?"
- "Hiển thị trạng thái tài khoản AI"

OpenCode sẽ tự động sử dụng công cụ mystatus để trả lời câu hỏi của bạn.

## Ví dụ kết xuất

```
## Hạn mức tài khoản OpenAI

Tài khoản:        user@example.com (team)

Giới hạn 3 giờ
███████████████████████████████ Còn lại 85%
Reset sau: 2h 30m

## Hạn mức tài khoản MiniMax

Tài khoản:        MiniMax (abc1****xyz9)

Giới hạn prompt 5 giờ
███████████████████████████████ Còn lại 80%
Đã dùng: 1,000 / 5,000 prompts
Reset sau: 4h 51m (lúc 11:20:10 19/02/2026)

## Hạn mức tài khoản Anthropic

Tài khoản:        Claude.ai (abc1****xyz9)

Cửa sổ 5 giờ (Session)
███████████████████████████████ Còn lại 75%
Đã dùng: 75%
Reset sau: 3h 20m (lúc 15:30:45 19/02/2026)

Cửa sổ 7 ngày (Weekly)
███████████████████████████████ Còn lại 60%
Đã dùng: 40%

## Hạn mức tài khoản GitHub Copilot

Tài khoản:        GitHub Copilot (individual)

Premium        ████░░░░░░░░░░░░░░░░ 24% (229/300)

Hạn mức reset: 19d 0h (2026-02-01)
```

## Tính năng

- Truy vấn hạn mức sử dụng trên nhiều nền tảng AI bằng một lệnh
- Thanh tiến trình trực quan hiển thị hạn mức còn lại
- Đếm ngược thời gian reset với ngày giờ chính xác
- Hỗ trợ đa ngôn ngữ (Tiếng Anh / Tiếng Việt)
- Ẩn API key để bảo mật

## Cấu hình

Không cần cấu hình thêm. Plugin tự động đọc thông tin xác thực từ:

- **OpenAI, MiniMax, Anthropic & GitHub Copilot**: `~/.local/share/opencode/auth.json`

### Thiết lập MiniMax

Để truy vấn hạn mức MiniMax Coding Plan, bạn cần lấy API key từ nền tảng MiniMax.

### Thiết lập Anthropic

Để truy vấn hạn mức Anthropic (Claude), bạn cần thông tin xác thực OAuth. Plugin sử dụng API OAuth Anthropic với hỗ trợ refresh token.

## Bảo mật

Plugin này an toàn để sử dụng:

**Các file cục bộ được truy cập (chỉ đọc):**

- `~/.local/share/opencode/auth.json` - Kho lưu trữ auth chính thức của OpenCode

**Các API Endpoint (tất cả đều chính thức):**

- `https://chatgpt.com/backend-api/wham/usage` - API hạn mức chính thức của OpenAI
- `https://www.minimax.io/v1/api/openplatform/coding_plan/remains` - API chính thức của MiniMax
- `https://api.anthropic.com/api/oauth/usage` - API chính thức của Anthropic
- `https://api.github.com/copilot_internal/user` - API chính thức của GitHub Copilot

**Quyền riêng tư:**

- Plugin không lưu trữ, tải lên hoặc cache bất kỳ dữ liệu người dùng nào
- Thông tin nhạy cảm (API key) được tự động ẩn trong kết xuất
- Mã nguồn hoàn toàn mở để kiểm tra

## Phát triển

```bash
# Sử dụng npm
npm install
npm run typecheck
npm run build

# Hoặc sử dụng Bun
bun install
bun run typecheck
bun run build
```

## Giấy phép

MIT
