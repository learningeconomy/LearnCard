# Secret Detection Setup for LearnCard

This document explains the secret detection setup for the LearnCard repository to prevent accidental commits of credentials, API keys, and other sensitive information.

## Overview

We use [gitleaks](https://github.com/gitleaks/gitleaks) to detect secrets in commits. Gitleaks is integrated into:
1. **Pre-commit hooks** - Prevents commits with secrets locally
2. **CI/CD pipeline** - Scans all commits in GitHub Actions

## Installation

### For Developers

The pre-commit hook is automatically configured when you clone the repository. However, you need to install gitleaks:

#### Option 1: Install via Homebrew (macOS/Linux)
```bash
brew install gitleaks
```

#### Option 2: Install via package managers

**macOS/Linux with wget:**
```bash
sudo wget -O /usr/local/bin/gitleaks https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz
sudo chmod +x /usr/local/bin/gitleaks
```

**Linux (manual download):**
```bash
curl -sL https://github.com/gitleaks/gitleaks/releases/download/v8.21.2/gitleaks_8.21.2_linux_x64.tar.gz | tar -xz
sudo mv gitleaks /usr/local/bin/
```

#### Option 3: Use the bundled binary
A gitleaks binary is included in the repository root for convenience.

### Verify Installation

```bash
gitleaks version
```

## Usage

### Pre-commit Hook

The pre-commit hook runs automatically when you run `git commit`. It scans staged files for secrets and blocks the commit if any are found.

#### Manual Scan

To scan all commits in the repository:
```bash
gitleaks detect --verbose --source .
```

To scan only staged files:
```bash
gitleaks protect --verbose --staged --config .gitleaks.toml
```

### What Gets Scanned?

Gitleaks detects:
- API keys (AWS, Google, Stripe, etc.)
- Database connection strings
- Passwords and tokens
- Private keys (RSA, SSH, etc.)
- OAuth credentials
- JWT tokens
- And more...

See [.gitleaks.toml](./.gitleaks.toml) for the full configuration.

## Handling False Positives

If gitleaks reports a false positive:

1. **For test/mock data**: Add the file pattern to the `paths` allowlist in `.gitleaks.toml`
2. **For specific lines**: Add the `gitleaks:allow` comment on the line:
   ```javascript
   const apiKey = "test-key-123" // gitleaks:allow
   ```
3. **For entire files**: Add to `.gitleaks.toml` paths allowlist

### Example Allowlist Patterns

```toml
[allowlist]
paths = [
    # Test files
    '''_test\.go$''',
    '''\.test\.(ts|tsx|js|jsx)$''',
    '''__tests__/.*''',
    
    # Example files
    '''example.*\.json$''',
    '''\.env\.example$''',
]
```

## Bypassing (Emergency Only)

⚠️ **WARNING**: Only bypass if you are 100% certain the detection is a false positive.

```bash
git commit --no-verify
```

**Note**: Bypassing the pre-commit hook will not prevent the CI/CD scan from failing.

## CI/CD Integration

GitHub Actions runs gitleaks on every push and pull request. See `.github/workflows/security-scan.yml`.

### What Happens in CI?

1. Gitleaks scans the entire repository history
2. If secrets are found, the build fails
3. Results are posted as a security alert

## Configuration Files

- **`.gitleaks.toml`** - Gitleaks configuration rules and allowlists
- **`.git/hooks/pre-commit`** - Pre-commit hook script
- **`.github/workflows/security-scan.yml`** - CI/CD workflow

## Best Practices

1. **Never commit credentials** - Use environment variables or secret management
2. **Use .env files** - Add them to `.gitignore`
3. **Rotate exposed secrets immediately** - If a secret is accidentally committed
4. **Review allowlists** - Keep false positive exceptions minimal
5. **Run scans before pushing** - `gitleaks detect --verbose`

## Troubleshooting

### "gitleaks not found" error

Install gitleaks using one of the methods above, or use the bundled binary in the repo root.

### Hook not running

Ensure the hook is executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Too many false positives

1. Check `.gitleaks.toml` for proper allowlist configuration
2. Use `gitleaks:allow` comments for specific lines
3. Consider if the file should be in version control

## Resources

- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [Pre-commit Hooks Guide](https://git-scm.com/book/en/v2/Customizing-Git-Git-Hooks)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

## Support

If you encounter issues with the secret detection setup:
1. Check this documentation first
2. Review the gitleaks output carefully
3. Ask in the team Slack channel #security
4. Contact the DevOps team

---

**Last Updated**: March 2026
**Maintained by**: DevOps Team
