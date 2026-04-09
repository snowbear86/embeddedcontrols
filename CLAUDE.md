# Project Context

## What this is

A **GitHub Pages static site** that is an embedded call control for Epic Hyperspace. It sits inside a collapsible iframe in the Hyperspace toolbar (the phone control window) and handles telephony for contact center agents without leaving Epic.

You are the contact center — you own both the embedded UI and the back-end CTI endpoints. The spec docs are the source of truth for how Epic communicates with both.

**Hosted at:** https://snowbear86.github.io/embeddedcontrols/

## Tech stack

- Plain HTML + vanilla JavaScript — no build step, no framework
- GitHub Pages for hosting
- The current `index.html` is a diagnostic/handshake test page

## Current goal

Stub everything out in a self-contained system to see the full flow working end-to-end. Real contact center platform vars get swapped in later.

## How Epic and this app communicate

```
                   ┌─────────────────────────────────┐
                   │          Epic Hyperspace          │
                   │                                   │
                   │  ┌─────────────────────────────┐ │
  postMessage  ◄───┤  │  This iframe (index.html)   │ │
  (AGL protocol)   │  └─────────────────────────────┘ │
                   │                                   │
  REST API calls   │  ←── InitiateCall / HangUpCall    │  (Epic calls YOUR server)
  ─────────────►   │                                   │
                   └─────────────────────────────────┘
        │
        │  REST API call
        ▼
  ReceiveCommunication3                                  (YOU call Epic's server)
```

**Three integration points:**

1. **AGL postMessage** — iframe ↔ Hyperspace parent window (no server needed)
2. **Outgoing CTI** — Epic calls `InitiateCall` / `HangUpCall` on your server when agents click call buttons in Hyperspace
3. **Incoming CTI** — Your server calls Epic's `ReceiveCommunication3` when a call arrives to pop an activity

## Docs

| File | What it covers |
|------|---------------|
| [`docs/agl-framework.md`](docs/agl-framework.md) | AGL handshake, postMessage protocol, all available actions, hibernation, delayed close |
| [`docs/agl-telephone-alert.md`](docs/agl-telephone-alert.md) | `TelephoneAlert` action + embedded call control best practices |
| [`docs/cti-incoming.md`](docs/cti-incoming.md) | `ReceiveCommunication3` — your server telling Epic a call arrived |
| [`docs/cti-outgoing.md`](docs/cti-outgoing.md) | `InitiateCall` / `HangUpCall` — Epic telling your server to dial/hang up |
| [`docs/hyperdrive.md`](docs/hyperdrive.md) | Hyperdrive client compatibility notes |
| [`docs/oauth.md`](docs/oauth.md) | OAuth 2.0 — EHR launch (SMART on FHIR) and backend services flows |
| [`docs/goals.md`](docs/goals.md) | Project goals and requirements (fill in as needed) |
