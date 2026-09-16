# HTTP Security Headers & Content Security Policy

## Hardened Headers
- `Content-Security-Policy`: Restricts script execution, allows OpenFreeMap & ArcGIS tile servers.
- `X-Frame-Options`: `DENY` prevents clickjacking.
- `X-Content-Type-Options`: `nosniff` prevents MIME sniffing.
- `Strict-Transport-Security`: Enforces HTTPS for 1 year (`max-age=31536000`).
