# Outgoing CTI — Epic-Initiated Calls

Epic calls these endpoints on **your server** when a user initiates or ends a call from within Hyperspace (click-to-call).

---

## Epic.Common.InitiateCall

**POST** your server's configured endpoint
Available: October 2018

### What it does

When a user clicks a call button in Hyperspace (e.g. click-to-call on a patient's phone number), Epic sends this to your phone system to initiate the call.

### Request

```json
{
  "InitiateCallRequest": {
    "PhoneAgentID": "jlehmann",
    "OriginPhoneExtension": "1111",
    "PhoneNumber": "+16082719000",
    "EpicCallID": "1234"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `PhoneAgentID` | Conditional | Agent's ID in your phone system. At least one of `PhoneAgentID` or `OriginPhoneExtension` required |
| `OriginPhoneExtension` | Conditional | Extension to originate the call from. At least one of the two required |
| `PhoneNumber` | Yes | Number to dial |
| `EpicCallID` | No | Epic's CAL record ID — store this to link call data back to Epic later |

### Response

```json
{ "PhoneSystemCallID": "56789" }
```

Return your phone system's call ID. Epic will use it to correlate events.

### Error Codes

| Code | Meaning |
|------|---------|
| `NO-USER-FOUND` | Agent ID invalid |
| `NO-EXTENSIONFOUND` | Extension invalid |
| `INVALID-PHONENUMBER` | Phone number format invalid |
| `CALL-FAILED` | Inputs valid but phone system failed to initiate |

---

## Epic.Common.HangUpCall

**POST** your server's configured endpoint

### What it does

User clicks "End Call" in Hyperspace — Epic tells your phone system to hang up.

### Request

```json
{
  "HangUpCallRequest": {
    "PhoneAgentID": "jlehmann",
    "OriginPhoneExtension": "1111",
    "EpicCallID": "1234"
  }
}
```

| Field | Required | Description |
|-------|----------|-------------|
| `PhoneAgentID` | Conditional | At least one of `PhoneAgentID` or `OriginPhoneExtension` required |
| `OriginPhoneExtension` | Conditional | At least one of the two required |
| `EpicCallID` | No | Epic's CAL record ID |

No response body on success.

Error codes: same as `InitiateCall`.

---

## Epic.Common.StoreCallID

**POST** your server's configured endpoint

Links the phone system's call ID to Epic's CAL record. Same as the Incoming CTI version — use this when the call was initiated from Epic's side.

```json
{ "EpicCallID": "1490", "PhoneSystemCallID": "123456" }
```

No response body on success.

---

## Stub Notes

For a self-contained test:
- Implement three POST endpoints: `InitiateCall`, `HangUpCall`, `StoreCallID`
- `InitiateCall` just logs the request and returns a fake `PhoneSystemCallID`
- `HangUpCall` just logs the request and returns 200
- `StoreCallID` just logs the IDs
- Register these URLs in Epic's configuration pointing to your GitHub Pages domain or a local tunnel (ngrok, etc.)
- Later, replace the stub logic with real calls into your CTI platform SDK
