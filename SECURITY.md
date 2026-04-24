# Security Policy

## Secret Scanning & API Key Protection

This repository includes comprehensive secret scanning to prevent accidental API key leaks.

### Automated Scanning

#### CI/CD Integration
- **GitHub Actions**: Secret scanning runs automatically on:
  - Every push to `main` branch
  - Every pull request to `main`
  - Every release (created/published)
  - Manual workflow dispatch

#### Tools Used
1. **TruffleHog** - Detects verified secrets in git history
2. **GitLeaks** - Comprehensive pattern-based scanning
3. **Custom Scanner** - Detects common API key patterns:
   - OpenAI API keys (`sk-*`, `sk-proj-*`)
   - Anthropic API keys (`sk-ant-*`)
   - AWS access keys (`AKIA*`)
   - Google API keys (`AIza*`)
   - Slack tokens (`xox*`)
   - GitHub tokens (`ghp_*`, `gho_*`, etc.)
   - Private keys (PEM format)

### Local Development

#### Install Git Hooks
Prevent commits with secrets by installing pre-commit hooks:

```bash
npm run security:install-hooks
```

This installs:
- **pre-commit**: Scans for secrets before every commit
- **pre-push**: Extra security check before pushing to main/release branches

#### Manual Scanning
Run secret scan manually anytime:

```bash
npm run security:scan
```

### What Gets Scanned

✅ **Scanned:**
- Source code files (`.ts`, `.js`, etc.)
- Configuration files
- Scripts
- Environment files (blocks them from being committed)
- Git commit history
- Commit messages

❌ **Excluded from scanning:**
- Documentation files (`*.md`) - but validated for obvious placeholders
- Test fixtures and mocks
- Node modules
- Build artifacts (`dist/`, `build/`)
- Test results

### Using API Keys Safely

#### Environment Variables (Recommended)
```typescript
// ✅ GOOD - Use environment variables
const apiKey = process.env.OPENAI_API_KEY;
```

```bash
# .env (gitignored)
OPENAI_API_KEY=sk-your-real-key-here
```

#### Never Hardcode
```typescript
// ❌ BAD - Never hardcode API keys
const apiKey = "sk-proj-abc123...";  // This will be detected!
```

### Documentation Examples

When documenting API keys in examples, use obvious placeholders:

```typescript
// ✅ GOOD - Clear placeholders
const apiKey = "sk-xxx-example-key-here";
const apiKey = "YOUR_API_KEY";
const apiKey = "sk-admin-xxx-secure-key-here";

// ❌ BAD - Looks like real key
const apiKey = "sk-1234567890abcdef";  // May trigger scanner
```

### Bypassing Checks (Not Recommended)

If you absolutely need to bypass the checks (e.g., for testing):

```bash
# Bypass pre-commit hook
git commit --no-verify

# Bypass pre-push hook
git push --no-verify
```

⚠️ **Warning**: Only use `--no-verify` when you're certain there are no secrets!

### What Happens on Detection

#### Local Development
- Commit/push blocked with clear error message
- Shows location of detected secret
- Provides remediation steps

#### CI/CD Pipeline
- Build fails with exit code 1
- GitHub Actions job marked as failed
- Summary shows what was detected
- Pull request cannot be merged

### False Positives

The scanners are configured to minimize false positives by:
- Excluding documentation placeholders like `xxx`, `yyy`, `example`
- Excluding test fixtures and mock data
- Only detecting high-entropy strings that look like real secrets
- Allowing `.env.example` and `.env.template` files

If you encounter a false positive:
1. Check if it's a real secret (even accidentally)
2. Ensure example keys use obvious placeholders
3. Update `.gitleaks.toml` allowlist if needed

### Configuration Files

- **`.github/workflows/secret-scan.yml`**: GitHub Actions workflow
- **`.gitleaks.toml`**: GitLeaks configuration
- **`scripts/secret-scan.sh`**: Local scanning script
- **`scripts/install-git-hooks.sh`**: Git hooks installer

### Reporting Security Issues

If you discover a security vulnerability, please email security@cwinnov.com instead of using the public issue tracker.

### Security Checklist for Contributors

Before committing:
- [ ] No API keys or secrets in code
- [ ] Environment variables used for sensitive data
- [ ] `.env` files are gitignored
- [ ] Documentation examples use placeholders
- [ ] Git hooks installed (`npm run security:install-hooks`)
- [ ] Ran `npm run security:scan` successfully

Before creating PR:
- [ ] All security checks pass in CI
- [ ] No secrets in commit messages
- [ ] No sensitive data in test fixtures

Before releasing:
- [ ] Full secret scan passes
- [ ] All dependencies scanned for vulnerabilities
- [ ] Release notes don't contain sensitive info
