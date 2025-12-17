# 🔒 Security Guide: LavaMoat Integration

This project includes **LavaMoat** to protect against JavaScript supply chain attacks — a critical security measure for Solana dApps, especially after the December 2024 attack on `@solana/web3.js`.

## What is LavaMoat?

LavaMoat is a suite of security tools developed by MetaMask that protects JavaScript applications against supply chain attacks. These attacks occur when malicious code is injected into dependencies, potentially stealing private keys, credentials, or funds.

### Why It Matters for Solana dApps

In December 2024, the official `@solana/web3.js` library was compromised via a supply chain attack:
- Versions 1.95.6 and 1.95.7 contained malicious code
- The attack stole private keys from dApps
- It was active for ~5 hours before detection

**LavaMoat helps prevent such attacks from affecting your application.**

## How LavaMoat Works

LavaMoat provides protection at three stages:

### 1. Installation Protection (`@lavamoat/allow-scripts`)

Blocks malicious `postinstall` scripts — the most common attack vector.

```json
{
  "lavamoat": {
    "allowScripts": {
      "suspicious-package": false,  // Block scripts
      "trusted-package": true       // Allow scripts
    }
  }
}
```

### 2. Build-Time Protection

For bundlers (Webpack, Browserify), LavaMoat wraps dependencies in isolated compartments.

### 3. Runtime Protection

Using SES (Secure EcmaScript), LavaMoat:
- Prevents modification of JavaScript primitives (Object, Array, etc.)
- Limits API access per package (network, filesystem, etc.)
- Enforces a strict policy file

## Setup in This Project

### Root Project (Anchor/Tests)

The root `package.json` includes:

```json
{
  "scripts": {
    "postinstall": "yarn allow-scripts auto"
  },
  "devDependencies": {
    "@lavamoat/allow-scripts": "^3.3.1",
    "@lavamoat/preinstall-always-fail": "^2.1.0"
  },
  "lavamoat": {
    "allowScripts": {
      "@lavamoat/preinstall-always-fail": false,
      "@coral-xyz/anchor": false
    }
  }
}
```

### Frontend App

The `app/package.json` includes similar protection for all Solana and React dependencies.

## Usage

### Initial Setup

When you first install dependencies:

```bash
yarn install
```

LavaMoat will:
1. Block all install scripts by default
2. Run `allow-scripts auto` to scan dependencies
3. Fail installation if unknown scripts are detected

### Updating the Allowlist

If a new package needs to run scripts:

```bash
# Scan and update the allowlist
yarn allow-scripts auto

# Review changes in package.json under "lavamoat.allowScripts"
```

### Manual Configuration

Edit the `lavamoat` section in `package.json`:

```json
{
  "lavamoat": {
    "allowScripts": {
      "new-package-needing-scripts": true,
      "suspicious-package": false
    }
  }
}
```

## Best Practices

### 1. Review New Dependencies

Before adding a new package:

```bash
# Check the package on npm
npm info <package-name>

# Look for:
# - Download count
# - Last publish date
# - Maintainers
# - GitHub repository
```

### 2. Lock Dependencies

Always use a lockfile and review changes:

```bash
# Use exact versions in package.json
"@solana/web3.js": "1.98.4"  # Not "^1.98.4"

# Review lockfile changes on updates
git diff yarn.lock
```

### 3. Audit Regularly

```bash
# Run security audit
yarn audit

# Check for known vulnerabilities
npm audit
```

### 4. Monitor for Updates

Subscribe to security advisories:
- [Solana Security](https://github.com/solana-labs/solana/security)
- [npm Security Advisories](https://www.npmjs.com/advisories)

## Advanced: Runtime Protection (Optional)

For enhanced security in Node.js scripts, you can add runtime protection:

### Install

```bash
yarn add -D lavamoat
```

### Generate Policy

```bash
# Generate policy for your entry file
npx lavamoat tests/counter.ts --autopolicy
```

### Run with LavaMoat

```bash
# Run with runtime protection
npx lavamoat tests/counter.ts
```

### Policy File Structure

The generated `lavamoat/node/policy.json`:

```json
{
  "resources": {
    "@coral-xyz/anchor": {
      "globals": {
        "console": true,
        "Buffer": true
      },
      "packages": {
        "@solana/web3.js": true
      }
    },
    "@solana/web3.js": {
      "globals": {
        "fetch": true,
        "WebSocket": true
      },
      "builtin": {
        "crypto": true
      }
    }
  }
}
```

## Troubleshooting

### "Package X wants to run install scripts"

This is expected! Review the package:
- If trusted: Add to allowlist with `true`
- If suspicious: Keep as `false` and investigate

```bash
# Check what scripts would run
npm show <package> scripts
```

### "Preinstall script failed"

The `@lavamoat/preinstall-always-fail` package intentionally fails if LavaMoat protection is bypassed. This is a security feature.

### Build Fails After Adding LavaMoat

1. Clear node_modules: `rm -rf node_modules`
2. Clear cache: `yarn cache clean`
3. Reinstall: `yarn install`

## Security Checklist

Before deploying your dApp:

- [ ] LavaMoat allow-scripts is configured
- [ ] All dependencies are at exact versions (no `^` or `~`)
- [ ] `yarn audit` shows no high/critical vulnerabilities
- [ ] Private keys are NEVER in code or environment variables in production
- [ ] Using a dedicated RPC endpoint (not public endpoints)
- [ ] Frontend never handles private keys (wallet adapter only)

## Resources

- [LavaMoat GitHub](https://github.com/LavaMoat/LavaMoat)
- [LavaMoat Documentation](https://lavamoat.github.io/)
- [MetaMask Security Blog](https://metamask.io/news/security/)
- [Solana Security Best Practices](https://docs.solana.com/security)

## Reporting Security Issues

If you discover a security vulnerability:
1. **Do NOT** open a public issue
2. Email security concerns privately
3. Allow time for patches before disclosure

---

**Remember**: Security is not a feature, it's a requirement. Especially in Web3 where attacks can directly steal user funds.
