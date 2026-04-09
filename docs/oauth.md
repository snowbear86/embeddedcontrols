# OAuth 2.0 — Epic Authentication

## Overview

Epic uses OAuth 2.0 for all API authentication. For this integration (an embedded call control with back-end CTI APIs), the relevant flows are:

| Flow | Use case |
|------|----------|
| **EHR Launch (SMART on FHIR)** | The embedded iframe is launched from within Hyperspace — Epic provides a launch token |
| **Backend Services** | Your server-to-server CTI API calls (ReceiveCommunication3, etc.) |

## Key requirement: Private Key JWT (August 2025+)

Starting August 2025, all backend OAuth 2.0 apps must host public keys at a **JWK Set URL (JKU)** rather than uploading a static key. Timeline:

| Epic Version | Requirement |
|-------------|-------------|
| Feb 2025 and prior | JKU optional |
| Aug 2025 | No new static key uploads allowed in sandbox |
| Feb 2026 | Static keys no longer supported in sandbox |
| May 2026 | Static keys no longer supported in customer environments |

**Bottom line:** Use private key JWT with a hosted JWKS endpoint from the start.

---

## EHR Launch Flow (SMART on FHIR)

Used when Epic launches your embedded control. Epic appends `launch` and `iss` params to your URL.

### Step 1 — Epic launches your app

Epic calls your URL with:
- `launch` — one-time token, exchange for auth code
- `iss` — Epic's FHIR server base URL

### Step 2 — Discover endpoints

```
GET {iss}/metadata
Accept: application/fhir+json
Epic-Client-ID: your-client-id
```

Or (Aug 2021+):
```
GET {iss}/.well-known/smart-configuration
```

Response contains `authorize` and `token` endpoint URLs.

### Step 3 — Request authorization code

Redirect user-agent to authorize endpoint:

```
GET {authorize}?
  response_type=code
  &client_id={your-client-id}
  &redirect_uri={your-redirect-uri}
  &scope=launch
  &launch={launch-token}
  &aud={iss}
  &state={random-state}
```

### Step 4 — Exchange code for access token

```
POST {token}
Content-Type: application/x-www-form-urlencoded

grant_type=authorization_code
&code={auth-code}
&redirect_uri={your-redirect-uri}
&client_id={your-client-id}
```

Response:
```json
{
  "access_token": "...",
  "token_type": "bearer",
  "expires_in": 3240,
  "scope": "...",
  "patient": "{fhir-patient-id}",
  "encounter": "{fhir-encounter-id}"
}
```

### Step 5 — Use the access token

```
GET {iss}/api/FHIR/R4/Patient/{id}
Authorization: Bearer {access_token}
```

---

## Backend Services Flow

Used for server-to-server calls where no user is launching the app (e.g. your server calling Epic's ReceiveCommunication3).

### Private Key JWT Authentication

1. Generate RSA key pair
2. Host the public key at a JWKS endpoint (e.g. `https://yourdomain.com/.well-known/jwks.json`)
3. Register the JKU with Epic Vendor Services
4. For each token request, sign a client assertion JWT with your private key and POST to the token endpoint

Token request:
```
POST {token}
Content-Type: application/x-www-form-urlencoded

grant_type=client_credentials
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion={signed-jwt}
```

The signed JWT payload:
```json
{
  "iss": "{your-client-id}",
  "sub": "{your-client-id}",
  "aud": "{token-endpoint}",
  "jti": "{unique-id}",
  "exp": {now + 5min}
}
```

---

## Sandbox URLs

```
Current:   https://vendorservices.epic.com/interconnect-amcurprd-oauth/
Previous:  https://vendorservices.epic.com/interconnect-amrel1prd-oauth/
```

Use the **non-production Client ID** when testing in sandbox.

---

## Stub Notes

For initial stubbing — if Epic is calling your CTI endpoints but you haven't set up real OAuth yet:
- Epic's outgoing CTI calls (InitiateCall, HangUpCall) are server-to-server; configure a stub endpoint that just returns 200
- For incoming CTI (your server calling Epic's ReceiveCommunication3), you'll need real credentials even in testing — register on Vendor Services and use the sandbox endpoint
- The AGL handshake (postMessage) does not require OAuth — it's just the iframe's parent window communication
