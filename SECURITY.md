# Security

Please do not post credentials, real resume contents or exploitable vulnerability
details in a public issue. Use GitHub private vulnerability reporting if enabled.
If unavailable, open an issue requesting a private reporting channel without
disclosing the vulnerability itself.

Provide affected versions, reproduction steps, impact and a minimal example
using synthetic data through the agreed private channel.

## Deployment Notes

- Keep API keys server-side and restrict CORS to trusted frontend origins.
- Configure appropriate rate limits and protected administrative routes.
- Local browser drafts contain resume data; use trusted devices and clear them
  when appropriate. Browser storage is not an encrypted cloud vault.
- Before enabling AI services, review what resume text is sent to providers.
- Keep dependencies and hosting runtime patched.

Only the latest main branch is maintained; no response-time guarantee is made.
