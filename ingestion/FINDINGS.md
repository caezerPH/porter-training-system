# GHL Call Export - verified findings (2026-10-05)

## Auth
- Private Integration Token (PIT) in .env works with `Version: v3` header.
- Scopes granted: conversations.readonly, conversations/message.readonly, voice-ai-dashboard.readonly,
  voice-ai-agents.readonly, contacts.readonly, locations.readonly.

## Endpoints confirmed live
- `GET /voice-ai/dashboard/call-logs?locationId=..&page=1&pageSize=N` -> `{callLogs[], total, page, pageSize}`
  - do NOT send `limit` (422). Optional filters: agentId, contactId, callType, startDate+endDate (ms epoch, both), sortBy, sort.
  - call fields: id, contactId, agentId, isAgentDeleted, fromNumber, createdAt, duration (s), summary, transcript,
    agentTransferOccurred, translation, messageId, trialCall, executedCallActions[]
  - NO extractedData / sentiment / recordingUrl in the response.
- `GET /conversations/messages/{messageId}/locations/{locationId}/recording` -> 200 audio/x-wav (4.1 MB for a 257 s call)
- `GET /conversations/messages/{messageId}/locations/{locationId}/transcription` -> 404 for Voice AI calls (transcript comes from call log instead)
- `GET /voice-ai/agents?locationId=..` -> 3 agents in this location

## Data reality
- Agent is a SALES TRAINING ROLEPLAY bot. The human rep calls in, roleplays, says "end roleplay".
- The scorecard is SPOKEN by the agent at the end and lives in `transcript` text, e.g.
  "Opening and introduction, 5 out of 10. Compliance disclosure, 6 out of 10. ... That comes to 40 out of 100,
   so this one would be retraining required. ... automatic fail."
  Then "Two things you did well ... What you missed ... The one thing to focus on next time ..."
- Rubric observed (10 criteria x 10 pts = 100): Opening and introduction, Compliance disclosure, Rapport and trust,
  Needs discovery, Current plan review, Plan recommendation, Objection handling, Medicare clarity,
  Closing and next steps, Overall professionalism. Plus verdict band (e.g. "retraining required") and compliance auto-fail flag.
- Backlog: 51 calls total at time of check -> small backfill.
- Recording download is enabled (proven by 200 WAV).
