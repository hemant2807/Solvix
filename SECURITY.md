# Security Policy

## Supported Versions

Solvix doesn't currently follow a formal version-release cycle — the Chrome Extension auto-updates to the latest version via the Chrome Web Store, and the backend runs off the `main` branch. Only the latest version of each is supported with security fixes.

| Component          | Supported |
| ------------------ | --------- |
| Chrome Extension (latest, Web Store) | :white_check_mark: |
| Backend (`main` branch)              | :white_check_mark: |
| Older/forked versions                | :x: |

## Reporting a Vulnerability

If you discover a security vulnerability in Solvix (e.g. exposed credentials, an auth bypass, unsafe handling of GitHub/AI API tokens, or anything that could compromise a user's account or data):

- **Do not** open a public GitHub issue for it.
- Instead, report it privately by emailing **hemant.k2807@gmail.com**, or by using GitHub's [private vulnerability reporting](https://github.com/hemant2807/Solvix/security/advisories/new) feature on this repo.

**What to include:**
- A clear description of the vulnerability
- Steps to reproduce it
- The potential impact (what an attacker could do with it)

**What to expect:**
- An acknowledgment within **3–5 days** of your report
- A status update as we investigate and work on a fix
- Credit in the release notes if you'd like (optional), once the fix is shipped

Thank you for helping keep Solvix and its users safe.