# Everygen for Zapier

Private development integration: **Everygen**, app **247154**, version **1.0.0**.

[Accept the test invitation](https://zapier.com/developer/public-invite/247154/514935/26b498ffb9f9a3cb43da90a4c7ba95b5/)

Connect your own Everygen account with OAuth. No API key or shared account is
needed. Your existing Everygen credits fund generation separately from Zapier.

Actions: **Start Image Generation**, **Start Video Generation**, and
**Find Generation**. Trigger: **Generation Completed** (polling).

1. Map a stable source event ID into Request ID. Include the workflow step and
   revision if one event intentionally creates more than one asset.
2. Enter the prompt and choose settings.
3. Set Max Credits explicitly. A quote over this ceiling stops without charging.
4. Save the returned generation ID. The create action does not return finished
   media. Use a separate Everygen Generation Completed Zap to process the media,
   or Delay + Find Generation to inspect one task.

The completion trigger sees all successful images/videos in the connected
account. It polls the newest 100; keep fewer than 100 completions between Zapier
polls. Your Zapier plan controls polling frequency. Do not create a loop that
starts another generation from every completion without an intentional filter.

For publication validation, real users must enable and successfully run Zaps,
and each public operation needs a live successful test. Development uploads,
mock tests, and sample objects do not count as real user activity.

Development (Node 22+): `npm ci`, `npm test`, `npm run validate`, `npm run push`.
Configure `CLIENT_ID` through Zapier's per-version environment. The public
client uses S256 PKCE and no embedded client secret. CLI authentication uses a
private deploy-key file, never this repository.

See [API reference](../API.md) and [Chinese tester checklist](../TESTERS.zh-CN.md).
