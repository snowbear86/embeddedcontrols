# Incoming CTI — ReceiveCommunication API

Epic calls these endpoints on **your server** when a call arrives, to pop an activity in Hyperspace for the agent.

**Use `ReceiveCommunication3`** — it's the recommended version (August 2023+). It supports multiple phone systems and captures the dialed phone number.

---

## ReceiveCommunication3

**POST** `api/epic/2023/Common/Utility/RECEIVECOMMUNICATION3/ReceiveCommunication3`
Available: August 2023 | Supports: SOAP, REST

### What it does

When an agent receives a call, your phone system calls this Epic endpoint. Epic creates a Communication Tracking (CAL) record and launches the appropriate Hyperspace activity (e.g. Scheduling, Triage, CRM). If caller info is provided, Epic looks up the patient and pops their chart.

### Sample Request

```json
{
  "Context": "Scheduling",
  "RecipientID": "29900",
  "RecipientIDType": "External",
  "LookupType": "Patient",
  "LookupInformationType": "SS",
  "LookupInformation": "000218293",
  "CallID": "2990000",
  "ContactType": "Incoming",
  "CommunicationType": "Phone",
  "CallerPhoneNumber": "540-999-9999",
  "DialedPhoneNumber": "608-555-0123",
  "LookupID": { "ID": "", "Type": "" },
  "PhoneSystemID": { "ID": "12345", "Type": "External" }
}
```

### Request Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `RecipientID` | String | **Yes** | User or workstation ID receiving the call |
| `RecipientIDType` | String | No | Type of RecipientID. Default: `Phone`. Also accepts `Internal`, `System Login` |
| `Context` | String | No | Which activity to launch. See contexts below |
| `CallID` | String | No | Your phone system's call ID — used to link Epic data back to the call |
| `ContactType` | String | No | `Incoming` or `Outgoing`. Defaults to `Incoming` if phone number is provided |
| `CommunicationType` | String | No | `Phone`, `Email`, `Web`, `Text Message`, `Email SMS`. Defaults to `Phone` |
| `CallerPhoneNumber` | String | Conditional | Phone number the caller is calling from |
| `DialedPhoneNumber` | String | No | Phone number the caller dialed |
| `LookupType` | String | No | `Patient`, `Provider`, or `None`. Default: `Patient` |
| `LookupID` | IDType | Conditional | Direct ID lookup — links directly to patient record |
| `LookupInformationType` | String | Conditional | How to search: `SS`, `PH`, `DOB`, `A` (guarantor acct), `HAR`, `IN` (insurance ID) |
| `LookupInformation` | String | Conditional | Value matching `LookupInformationType` |
| `PhoneSystemID` | IDType | No | ID of your phone system in Epic. Falls back to Shared Configuration default |

**Lookup precedence:** At least one of `LookupID`, `LookupInformationType`/`LookupInformation`, or `CallerPhoneNumber` is required when `LookupType` is not `None`.

- `LookupID` → direct chart pop
- `LookupInformationType` / `CallerPhoneNumber` → search, user picks from list if multiple matches
- No match → user sees patient lookup screen

### Context Values

| Context | Activity Launched |
|---------|------------------|
| *(blank)* | No Context Given |
| `Triage` | Nurse triage line |
| `CRM` | Customer service / Member Hub |
| `Scheduling` | Scheduling or cancel visit |
| `Member Call` | Member services / Member Inquiry |
| `Phone` | Generic clinic call |
| `Refill` | Medication refill |
| `TC` | Transfer center request |

### Response

```json
{ "EpicCallID": "2990000" }
```

Save `EpicCallID` — you'll use it with `StoreCallID` and the Outgoing CTI.

### Error Codes

| Code | Meaning |
|------|---------|
| `NOT-LICENSED` | Required license not activated |
| `INVALID-CONTEXT` | Context value not valid |
| `NO-USER-ID` | RecipientID not provided |
| `INVALID-USER-ID` | User ID doesn't match OAuth token |
| `NO-USER-FOUND` | User not logged in or not found |
| `INVALID-LOOKUP-TYPE` | LookupType invalid |
| `NO-RECORD-FOUND` | Patient record not found |
| `NO-LOOKUP-INFORMATION` | Required lookup info not provided |
| `INVALID-CONTACT-TYPE` | ContactType invalid |
| `EVENT-PUBLISH-FAILED` | Failed to publish event to Hyperspace |
| `NO-EXTENSION-FOUND` | Phone extension not mapped |
| `INVALID-PHONE-NUMBER` | Phone number format invalid |
| `NO-PHONE-SYSTEM-FOUND` | PhoneSystemID invalid |

---

## StoreCallID

Links your phone system's call ID to the Epic CAL record after the call is established.

**POST** `api/epic/2018/Common/Utility/STORECALLID/StoreCallID`

```json
{ "EpicCallID": "1490", "PhoneSystemCallID": "123456" }
```

| Field | Required | Description |
|-------|----------|-------------|
| `EpicCallID` | Yes | The ID returned by ReceiveCommunication3 |
| `PhoneSystemCallID` | Yes | Your phone system's identifier for this call |

No response body on success.

Error codes: `NO-EPIC-CALL-ID`, `NO-PHONE-CALL-ID`, `NO-CALL-FOUND`, `LOCK-FAILED`

---

## Deprecated Versions (for reference)

- **ReceiveCommunication2** — November 2022. Deprecated in favor of v3. Use v3 instead.
- **ReceiveCommunication** (v1) — Original. Deprecated. Use v3 instead.

---

## Stub Notes

For a self-contained test without a real phone system:
- Your stub server implements a `/receive-call` endpoint that calls Epic's `ReceiveCommunication3`
- Use a hardcoded `RecipientID` (the test agent's Epic user ID) and a test `CallID`
- Use `LookupType: "None"` and omit caller info to launch an activity without a patient pop
- Later, swap in real agent IDs and real caller lookup data from your CTI platform
