# Security Policy

## Supported versions

As a startup-stage platform, the project supports only the latest main branch and currently deployed release unless explicitly tagged otherwise.

## Reporting a vulnerability

Please report security issues privately. Do **not** open public issues for exploitable vulnerabilities.

Recommended report contents:
- Vulnerability type and impacted components.
- Reproduction steps and prerequisites.
- Potential impact and attacker model.
- Suggested mitigation (if known).

## Response targets

- Initial triage acknowledgement: **within 2 business days**.
- Severity assessment and remediation plan: **within 5 business days**.
- Critical vulnerabilities: expedited patching and hotfix release.

## Security principles

- Least privilege across users, services, and infrastructure.
- Defense in depth (validation, auth, rate limiting, monitoring).
- Secure defaults in cookies, CORS, and endpoint protections.
- Continuous dependency and image scanning in CI/CD.

## Operational expectations

- Rotate secrets regularly and on incident triggers.
- Maintain access logs and audit trails.
- Enforce MFA for administrative control planes.
- Review third-party integrations for data exposure risk.
