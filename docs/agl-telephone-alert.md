# AGL TelephoneAlert

AGL action: `Epic.Common.CallManagement.Telephony.Alert`
First available: February 2025
API level: Epic Public Level 3 Group

## What it does

Notifies the Hyperspace agent that something needs attention in the phone system. The embedded call control (your iframe) sends this message to the Epic parent window to trigger a notification.

## Usage

```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Common.CallManagement.Telephony.Alert",
  args: {
    Quiet: true   // optional
  }
}, "*");
```

### `Quiet` parameter

| Value | Behavior |
|-------|----------|
| `true` | Shows only a visual indicator on the Phone Control button in the toolbar — does **not** open the call control panel |
| `false` or omitted | Opens the call control panel automatically |

**Incoming / outgoing calls** — use `Quiet: false` (or omit) so the panel opens and the agent can accept the call.

**Other notifications** (scheduled breaks, end of shift, queue alerts) — use `Quiet: true` so it's just an indicator.

## Error Codes

| Code | Meaning |
|------|---------|
| `[9]` | `Epic.Common.CallManagement.Telephony.Alert` is not implemented. The iframe is not hosted in the Hyperspace phone control window. |

---

## Embedded Call Control — Best Practices Summary

These are the requirements for a compliant embedded call control integration.

### Authentication
- Use **private key JWT OAuth 2.0** for SSO — agents should not enter credentials into the phone system separately after logging into Hyperspace
- Support a configurable session timeout aligned with the Hyperspace session timeout

### Embedding
- Hosted in an iframe via Epic's Web Integration Framework
- Support call notifications via `TelephoneAlert` (open panel or visual indicator)
- **Do not** redirect the browser, open other windows, or invoke modal dialogs outside the iframe

### Core Call Capabilities
- Accept inbound calls — use Incoming CTI (`ReceiveCommunication3`) to open an activity in Epic after accepting
- No extra interaction required after accepting a call to trigger `ReceiveCommunication`
- Controls for: end call, hold/resume, mute/unmute
- Support call transfers and conference calls
- Initiate outbound calls via Outgoing CTI (`InitiateCall`) — click-to-call from Epic
- Agent availability/presence controls (Available, On Break, Offline)
- Join/leave call queues based on role

### UI Requirements
- Core call controls must be immediately accessible — no scrolling required to accept an incoming call
- Do not include operational metrics (queue lengths, staffing ratios, chat, historical durations)
- Support dynamic sizing to accommodate Hyperspace layout configuration

### Virtual / Thin Client
- Must function in Citrix and VDI environments
- WebRTC traffic should be routed locally for call quality
- Support **Citrix Unified Communications SDK**

### Performance & Reliability
- Minimize CPU/memory footprint
- Support error logging to vendor system on crashes or functional failures
