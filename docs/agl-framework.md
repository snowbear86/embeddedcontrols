# AGL Framework — Embedding Web Content in Epic Hyperspace

Last reviewed: June 21, 2024

## Overview

Your web page is hosted in a **sandboxed iframe** inside Epic's Active Guidelines (AGL) framework. Communication with Hyperspace uses the HTML5 `postMessage` API — no direct DOM access to the Epic parent.

Key constraints:
- Must use **HTTPS** (non-https opens in external browser with no integration)
- Must be **frameable** — do not set `X-Frame-Options` restrictively
- Cannot navigate the top-level window — use AGL's `OpenExternalWindow` action instead
- Popups, JS, and form submission are allowed within the iframe

---

## Handshake

The embedded page must initiate the handshake on load. This is the only postMessage that does **not** require a token.

```js
function onLoad() {
  window.addEventListener("message", Listener, false);
  window.parent.postMessage({
    action: "Epic.Clinical.Informatics.Web.InitiateHandshake"
  }, "*");
}
```

AGL responds with a message containing `token`, `actions`, and optionally `state`, `version`, `isContextReadOnly`, and `historyPackage`.

To subscribe to Epic events at handshake time (e.g. delayed close):

```js
window.parent.postMessage({
  action: "Epic.Clinical.Informatics.Web.InitiateHandshake",
  args: {
    SubscriptionRequests: [{
      EventName: "Epic.Common.RequestToCloseApp",
      EventArgs: { PauseDuration: "200" }
    }]
  }
}, "*");
```

---

## Message Listener

All messages from AGL arrive on `event.data`. Keys that AGL may send:

| Key | Description |
|-----|-------------|
| `token` | String token — include in every subsequent postMessage to AGL |
| `actions` | Array of action strings this app is allowed to call in the current context |
| `version` | AGL JS interface version (e.g. `"10.4"`) |
| `isContextReadOnly` | Boolean — true if the encounter/chart is read-only |
| `state` | State string saved via `SaveState` before hibernation |
| `historyPackage` | Object with `webIntegrationHistoryState` and `fromHibernation` |
| `history` | `"Back"` or `"Forward"` — user clicked a nav button |
| `actionExecuted` | Boolean — result of the last action sent |
| `errorCodes` | Array of error code integers (see below) |
| `error` | Human-readable error string |
| `EventName` + `EventArgs` | Subscription event (e.g. `Epic.Common.RequestToCloseApp`) |
| `subscriptionResults` | Array confirming which subscriptions were successfully initialized |

Error codes:
- `[5]` Two messages posted back-to-back without waiting for `actionExecuted`
- `[7]` Action sent without a token
- `[9]` Action does not exist
- `[15]` Action not allowed during closing
- `[16]` Invalid SubscriptionRequest
- `[18]` Browser launch attempted for non-allowlisted URL

Example listener skeleton:

```js
var epicToken = null;

function Listener(event) {
  var data = event.data || {};
  for (var type in data) {
    var payload = data[type];
    switch (type) {
      case "token":
        epicToken = payload;
        break;
      case "actions":
        // payload is array of allowed action strings
        break;
      case "state":
        // payload is string saved before hibernation
        break;
      case "actionExecuted":
        // payload is boolean — wait for this before sending the next message
        break;
      case "errorCodes":
        // payload is array of integers
        break;
      case "error":
        // payload is error string
        break;
      case "historyPackage":
        // payload: { webIntegrationHistoryState, fromHibernation }
        break;
      case "history":
        // payload: "Back" or "Forward"
        break;
      case "EventName":
        // subscription event fired
        break;
    }
  }
}
```

> **Important:** Wait for `actionExecuted` before sending the next message. Any message sent before `actionExecuted` returns is ignored, and you'll get errorCode `[5]`.

---

## Sending Actions to AGL

Every action (except the initial handshake) must include the token:

```js
window.parent.postMessage({
  token: epicToken,
  action: "ActionName",
  args: { /* ... */ }
}, "*");
```

### Available Actions

#### Close AGL
```js
window.parent.postMessage({ token: epicToken, action: "Epic.Clinical.Informatics.Web.CloseActivity" }, "*");
```
If the user has pending actions or unsaved changes, Epic shows a confirmation prompt. `actionExecuted: false` is returned if the user chooses not to quit.

#### Open External Window (for IE/Classic compatibility)
```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Clinical.Informatics.Web.OpenExternalWindow",
  args: "https://example.com"
}, "*");
```

#### Open in System Default Browser (Hyperdrive only, Feb 2022+)
```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Common.OpenDefaultBrowser",
  args: "https://example.com"
}, "*");
```

#### Save State (for hibernation restore)
```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Clinical.Informatics.Web.SaveState",
  args: "some string representing state"
}, "*");
```
State is returned in the next handshake's `state` key. Cleared when AGL closes. Different from cookies (which persist across AGL instances in the same session).

#### Save History State
```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Clinical.Informatics.Web.SaveHistoryState",
  args: { Args: "your navigation state string" }
}, "*");
```

#### Enable/Disable Back and Forward Buttons
```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Clinical.Informatics.Web.SetEnabledHistBtns",
  args: { Back: false, Forward: false }
}, "*");
```
Disable buttons when loading a new page, re-enable after load. AGL sends `{ history: "Back" }` or `{ history: "Forward" }` when the user clicks.

#### Add a Print Button
```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Clinical.Informatics.Web.SetEnabledPrintBtn",
  args: { enable: true }
}, "*");
```
When the user clicks Print, AGL sends `{ action: "Print" }`. Your app must then call `window.print()`.

---

## Delayed Closing

Subscribe at handshake time (see above). When AGL is closing it sends:

```json
{
  "EventName": "Epic.Common.RequestToCloseApp",
  "EventArgs": { "ForceClose": false },
  "errorCodes": []
}
```

Within `PauseDuration` ms, respond:

```js
window.parent.postMessage({
  token: epicToken,
  action: "Epic.Common.CloseAppResponse",
  args: { CanClose: true }
}, "*");
```

Max `PauseDuration` is 5000ms. If no response is received in time, AGL closes immediately. Design for this — don't assume you'll always get to respond.

---

## Hibernation

AGL may destroy the iframe in certain situations (session lock, layout change, navigator section collapse). Use `SaveState` to checkpoint. On the next handshake, if `state` is present in the response, this is a hibernation restore — not a fresh load.

---

## Platform Support

| Action | Hyperspace | EpicCare Link | Haiku iOS | Canto | Rover iOS |
|--------|-----------|---------------|-----------|-------|-----------|
| InitiateHandshake | ✓ | ✓ | ✓ | ✓ | ✓ |
| OpenExternalWindow | ✓ | ✓ | ✓ | ✓ | ✓ |
| All others | ✓ | — | — | — | — |

The `actions` array from the handshake response tells you what's available in the current context — check it before calling any action.
