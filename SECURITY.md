# Security Policy

## Reporting a Vulnerability

Please report security vulnerabilities **privately** through GitHub's
[private vulnerability reporting](https://github.com/indraaryaLabs/coffeeshop-pos/security/advisories/new)
— do not open a public issue.

You will receive an acknowledgment within 48 hours, followed by a status
update as the report is triaged. We ask that you give the maintainers
reasonable time to ship a fix before disclosing the issue publicly.

## Scope

The report should include:

- The affected component and version
- A concise description and, where possible, a minimal reproduction
- Impact (what an attacker could gain)

## Notes for self-hosted deployments

- Set a strong `BETTER_AUTH_SECRET` (`openssl rand -hex 32`) in production.
- Keep `DATABASE_URL` and Supabase credentials out of version control.
- New signups always start with the `barista` role; promote to `admin` only
  for trusted staff from **Pengaturan → Pengguna**.
