# Everygen Automation API v1

Base URL: `https://everygen-ai.com/api/automation/v1`.
All responses are JSON and uncached. Authenticate with `Authorization: Bearer
<access_token>`. The facade shares the Everygen MCP protected resource and scope
contract: resource/audience `https://everygen-ai.com/mcp`. Tokens minted for
other audiences are rejected; website session cookies are not API credentials.

## OAuth

- Issuer: `https://everygen-ai.com/api/plugin-auth`
- Discovery: `https://everygen-ai.com/api/plugin-auth/.well-known/oauth-authorization-server`
- Protected resource metadata: `https://everygen-ai.com/.well-known/oauth-protected-resource/mcp`
- Authorize: `https://everygen-ai.com/api/plugin-auth/oauth2/authorize`
- Token: `https://everygen-ai.com/api/plugin-auth/oauth2/token`
- Dynamic registration: `https://everygen-ai.com/api/plugin-auth/oauth2/register`
- Scopes: `openid profile email offline_access everygen:read everygen:create`
- Authorization Code + S256 PKCE; refresh tokens rotate. Always save the latest
  returned refresh token and send the resource in authorization/token requests.
- Read scope: account, task status and completed media. Create scope: enqueue a
  generation up to the explicitly supplied budget. Revoke in Everygen account
  connection settings.

Zapier app 247154 has the exact redirect
`https://zapier.com/dashboard/auth/oauth/return/App247154CLIAPI/`.
n8n registers its instance's HTTPS `/rest/oauth2-credential/callback`, or an
HTTP localhost callback for local development. A custom REST path needs a
reviewed callback addition before connecting. No client secret is shipped.

## Account

`GET /account` returns `id`, optional `name`/`email` according to token scopes,
and `available_credits`. No credits are used.

## Start generation

`POST /generations` returns HTTP 202 and a stable generation object.

```json
{
  "request_id": "campaign-42:image:revision-1",
  "max_credits": 30,
  "generation": {
    "kind": "image",
    "prompt": "A watercolor fox on a white background",
    "model": "gpt-image-2",
    "ratio": "1:1"
  }
}
```

`max_credits` is a spending ceiling, not the price. It must be an explicit
positive integer (maximum 100,000). Current rates and available balance are
checked on the server; rates are rechecked before actual debit. A ceiling below
the quote returns `CREDIT_LIMIT_EXCEEDED` without starting or charging.

`request_id` is required (1–180 characters, no control characters), scoped to
the connected user and OAuth client. Map a stable source event key and include
the workflow step/revision if the same source intentionally creates multiple
assets. Retrying the same key and settings returns the original generation.
Different settings with an existing key return HTTP 409 `IDEMPOTENCY_CONFLICT`.
To intentionally create again, choose a new key. Changing prompt whitespace is
a settings change. Retry timeouts with the same key; never generate a new UUID
on each transport retry.

Image options: `model` = `gpt-image-2` (default), `seedream-5-0` or
`nano-banana-2`; `ratio` = `1:1`, `16:9`, `9:16`, `4:3` or `3:4`.

Video example:

```json
{
  "request_id": "campaign-42:video:revision-1",
  "max_credits": 100,
  "generation": {
    "kind": "video",
    "prompt": "A fox walks through a quiet forest",
    "seconds": 5,
    "resolution": "480p",
    "ratio": "16:9",
    "audio": true
  }
}
```

Video options: whole `seconds` 4–15; `resolution` = `480p` or `720p`;
`ratio` = `16:9` or `9:16`; `audio` boolean. Both kinds support an optional
`reference_ids` array of up to 8 owned completed image task IDs; provider limits
still apply. Prompts are 3–4,000 characters. Unsupported/extra fields fail
validation; only the listed media types are available in v1.

## Get progress

`GET /generations/{id}` returns saved progress without waiting for a provider.
The `id` and `task_id` stay stable from acceptance through completion.

Fields: `id`, `task_id`, `kind`, `model`, `status`, `credits`, `net_credits`,
`created_at`, `updated_at`, `url` (first finished asset or null), `media`
(array of `{type,url}`), `workspace_url`, and `next_check_seconds`.
A queued row may additionally return `error_code`. Status is normally `queued`,
`starting`, `pending`, `processing`, `success`, `failed` or `needs_attention`.
A queued cost is a quote; `net_credits` is zero until the task/debit exists.

Completion is reconciled through existing provider callbacks and the site's
background sweep. Allow several minutes for saved status to catch up. Poll
no faster than every 30 seconds. A failed/expired/revoked queue is terminal;
resolve the reason before intentionally submitting a new Request ID. A
`needs_attention` result is uncertain: retain the ID and contact support instead
of submitting a duplicate. An accepted request that is still unclaimed expires
after 10 minutes. Claimed requests are not automatically redispatched.

## Completed feed

`GET /generations?kind=all&limit=100` returns
`{"items":[...],"next_cursor":"..."}`. `kind` is `all`, `image` or `video`;
`limit` is 1–100. Pass `cursor=<next_cursor>` for subsequent pages. Results
contain only the connected user's non-deleted successful media, ordered by
latest saved update (with ID as deterministic tie-breaker). It includes media
created on the website and other connected workflows. Filter by ID/kind in your
workflow if required. Cursors are opaque, not secrets or authorization grants.

## Errors

Errors use `{"error":{"code":"...","message":"..."}}`.
401 means reconnect/refresh; 403 means missing/revoked scope; 404 means no owned
record; 409 means the Request ID has different input; 422 means credit ceiling
exceeded; 402 means insufficient balance at quoting; 400 means invalid input;
429 may indicate account concurrency limits. Generation-time refusals appear
in saved job status because the create response already returned. Never retry
an uncertain generation with a new Request ID automatically.
