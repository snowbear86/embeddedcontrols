# Project Context

## What this is

A **GitHub Pages static site** that is an embedded call control for Epic Hyperspace. It sits inside a collapsible iframe in the Hyperspace toolbar (the phone control window) and handles telephony for contact center agents without leaving Epic.

You are the contact center — you own both the embedded UI and the back-end CTI endpoints. The spec docs are the source of truth for how Epic communicates with both.

**Hosted at:** https://snowbear86.github.io/embeddedcontrols/

## Tech stack

- Plain HTML + vanilla JavaScript — no build step, no framework
- GitHub Pages for hosting (`index.html` + `tcn-stub.html`)
- WebSocket relay server — Node.js, deployed to Railway (`server/relay.js`)

## Current state

The stub flow is fully working end-to-end. The real TCN JS SDK and SMART on FHIR auth are the next things to swap in.

**Stub swap-out points in `index.html`:**
- `agentIdentity` object → replace with real SMART on FHIR token parsing
- `connectToTCN()` → replace BroadcastChannel with TCN JS SDK initialization and `sdk.on('call.incoming', ...)`
- `acceptCall()` / `declineCall()` → replace relay sends with `tcnSdk.answerCall()` / `tcnSdk.declineCall()`

## Running the test setup

You need three things open:

**1. TCN stub tab**
Open `https://snowbear86.github.io/embeddedcontrols/tcn-stub.html` in a browser tab. Wait for "Relay connected — waiting for agent iframe" to appear.

**2. Epic Hyperdrive Web Developer Test Harness**
Load the test harness and point it at `https://snowbear86.github.io/embeddedcontrols/`. The iframe will:
- Fire the AGL handshake
- Receive the Epic token and supported actions
- Connect to the relay and send the stub agent identity

**3. Confirm the stub tab shows the agent identity**
After the AGL handshake completes, the stub tab should show the agent identity. If it shows "Waiting for agent to connect..." — reload both tabs (stub first, then iframe).

**Simulating a call:**
1. Click "Simulate Incoming Call" in the stub tab
2. The iframe fires `TelephoneAlert` — Epic opens the phone panel
3. Click Accept or Decline in the iframe
4. The stub tab logs the response

## Relay server

The WebSocket relay (`server/relay.js`) is deployed to Railway at `wss://embeddedcontrols-production.up.railway.app`. It broadcasts messages between all clients connected to the same room.

BroadcastChannel was ruled out — it requires same-origin, which fails in Epic's sandboxed iframe. Outbound WebSocket connections work fine from sandboxed iframes, making this the correct approach for production too (the real TCN JS SDK will use WebSocket to TCN's backend).

Railway redeploys automatically on every push to `main`. Both HTML files have the relay URL hardcoded as `RELAY_URL`.

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
