# Hyperdrive

Epic's modern web-based client — replaces the classic Hyperspace desktop application.

## What it is

Hyperdrive is a secure, Epic-specific browser based on Chromium. For embedded web apps (like this one), Hyperdrive renders content in a modern Chromium engine rather than Internet Explorer.

## Impact on this integration

| Integration type | Requires changes for Hyperdrive? |
|-----------------|----------------------------------|
| SMART on FHIR / OAuth 2.0 | No |
| HL7, Web Services, DICOM, XML | No |
| **Embedded web content (AGL)** | Possibly — see below |
| COM-based APIs | Yes |

## Things to verify for Hyperdrive compatibility

- **CSP (Content Security Policy):** Hyperdrive respects CSP; classic Hyperspace does not. If you set CSP headers, ensure they allow framing from Hyperspace Web Server domains. Use `%CLIENTHOSTSOURCE%` as a token for the host frame domain in Epic-hosted environments.
- **X-Frame-Options:** `ALLOW-FROM` is deprecated and not supported in Chromium. Use CSP `frame-ancestors` instead. Be careful not to break the classic Hyperspace integration while fixing for Hyperdrive.
- **Citrix compatibility:** When Hyperdrive is published as a Citrix app, some integrations use Slingshot to make them available on the endpoint device.

## Testing Tools

**Hyperdrive Web Developer Test Harness** — validates that your site renders and functions correctly when hosted inside Hyperdrive before going to production. Lets you test in both iframe and embedded window modes.

**Hyperdrive Client Test Harness** — validates client-level integrations (E-Signature, Voice Recognition, Scan, FHIRcast, web content, etc.)

**Hyperspace for Mac** — for testing URL-based integrations (SMART on FHIR, HTTP GET, SAML). Client integrations requiring Windows-native plugins should be tested on a Windows workstation or VM.

Hyperspace for Mac connection URL (Epic FHIR sandbox): `https://fhir.epic.com/HSWeb_uscdi`

## Side-by-side compatibility

Your integration should support both Hyperdrive and classic Hyperspace simultaneously until all customers have migrated. They can coexist on the same workstation/server.
