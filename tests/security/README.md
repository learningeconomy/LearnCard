# AI Sessions Security Test Harness

Standalone test harness that probes the LearnCard AI Sessions WebSocket endpoint for security vulnerabilities including prompt injection, auth bypass, data exfiltration, and input abuse.

## Prerequisites

- Node.js 18+
- A valid DID (from a LearnCard account) — find yours in browser DevTools: `localStorage.getItem("did")`
- `ws` package (already in the monorepo)

## Usage

```bash
# Basic run (from repo root)
DID="did:web:your-did-here" npx tsx tests/security/ai-sessions-security-harness.ts

# Target a staging endpoint
AI_WS_URL="wss://staging.api.learncloud.ai" AI_HTTP_URL="https://staging.api.learncloud.ai" DID="..." npx tsx tests/security/ai-sessions-security-harness.ts

# JSON output for CI or further analysis
DID="..." npx tsx tests/security/ai-sessions-security-harness.ts --json > results.json

# Verbose mode (show response content)
DID="..." npx tsx tests/security/ai-sessions-security-harness.ts --verbose

# Skip abuse tests (oversized messages, rapid-fire) to avoid rate limit issues
DID="..." npx tsx tests/security/ai-sessions-security-harness.ts --skip-abuse
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DID` | (required) | Your LearnCard DID for authentication |
| `SECOND_DID` | `did:web:attacker-test-account` | A second DID for cross-account tests |
| `AI_WS_URL` | `wss://api.learncloud.ai` | WebSocket endpoint |
| `AI_HTTP_URL` | `https://api.learncloud.ai` | REST API endpoint |
| `TIMEOUT_MS` | `15000` | Response timeout per test (ms) |

## Test Categories

### Prompt Injection (7 tests)
- Direct system prompt extraction
- Base64-encoded extraction
- Roleplay-based extraction
- Role hijacking (DAN jailbreak)
- Delimiter injection (fake SYSTEM messages)
- ChatML token injection
- Instruction override via fake developer messages

### Indirect Injection (3 tests)
- Injection via topic name field
- Injection via selectedQuestion field
- Injection via message role (sending role="system")

### Auth & Access (4 tests)
- Connect with empty DID
- Connect with fabricated DID
- Access other users' threads via REST
- Thread ID enumeration

### Data Exfiltration (3 tests)
- Extract other user data
- Extract backend configuration/secrets
- Extract raw credential data and private keys

### Input Abuse (4 tests)
- Oversized message (100k characters)
- Rapid-fire messages (20 in 1 second)
- Unicode, null bytes, XSS, template injection
- Malformed JSON

### Session Manipulation (3 tests)
- Spoofed action field
- Cross-thread message injection
- DID spoofing in payload (connect as A, act as B)

## Reading Results

| Status | Meaning |
|--------|---------|
| PASS | Server correctly defended against the attack |
| FAIL | Vulnerability detected — needs immediate attention |
| WARN | Ambiguous result — manual review recommended |
| ERROR | Test could not run (connection issue, etc.) |
| SKIP | Test was skipped (e.g., via --skip-abuse) |

## Exit Codes

- `0` — All tests passed (PASS/WARN/SKIP only)
- `1` — One or more FAIL results
- `2` — Fatal harness error
