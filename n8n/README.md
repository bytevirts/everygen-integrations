# n8n-nodes-everygen

Everygen community nodes for AI image and video workflows. This is a development
package; npm publication and n8n Cloud verification are separate milestones.

## Installation and credentials

Use a current n8n release with generic OAuth2 Dynamic Client Registration.
The initial integration targets **n8n 2.41.6**, which requires **Node.js 24+**.
Older runtime compatibility is not claimed. When published, install
`n8n-nodes-everygen` under Settings → Community Nodes in self-hosted n8n.
Cloud use requires n8n verification and availability in the Cloud node picker.

Create an **Everygen OAuth2 API** credential and connect your Everygen account.
Dynamic registration discovers `https://everygen-ai.com/mcp`; you do not enter a
client secret or API key. Your callback must use the default path
`/rest/oauth2-credential/callback` on your HTTPS instance, or HTTP localhost for
local development. Custom callback paths need a reviewed server addition.

## Operations

- Get Account: connected identity and available credits.
- Start Image Generation / Start Video Generation: prompt, settings, unique
  Request ID and explicit Max Credits → immediate generation ID/status.
- Get Generation: saved progress and media URL by generation ID.
- List Completed Generations: most recently updated successful media (up to100).
- Everygen Trigger / Generation Completed: polls completed media; activation
  initializes a baseline, so old history does not trigger new executions.
  Manual testing returns up to five real existing results without moving that
  baseline. It follows pagination up to2,000 new records per poll and reports
  overflow without advancing the saved cursor.

Everygen credits are separate from n8n execution fees. Map a stable source
business-event key to Request ID, including step/revision when appropriate.
Keep it identical during retries and full workflow re-runs intended to replay
the same event. New IDs mean new paid generations, even for identical prompts.
Max Credits is a spending ceiling; the account is charged the current actual
rate only when dispatch starts. An over-limit quote starts nothing.

Use the trigger to continue when media is ready, or use a Wait node before Get
Generation. The completed feed includes website-created media in the same
account. A `needs_attention` response requires checking the original ID, not
starting another copy. See the [API reference](https://github.com/bytevirts/everygen-integrations/blob/main/API.md).

## Development

`npm ci && npm run build && npm run lint && npm test`

Package contents contain no runtime external dependencies beyond host-provided
`n8n-workflow`. HTTP calls use n8n's authentication helper. Publish through the
repository's GitHub Actions workflow with npm provenance; then request review
in the n8n Creator Portal. Never store OAuth or npm secrets in node parameters,
source files or workflow exports.

## Test before npm publication

The release handoff includes `n8n-nodes-everygen-0.1.0.tgz`. For a self-hosted
instance, install that archive in the instance’s community-node directory, then
restart n8n. For a conventional installation this is `~/.n8n/nodes`; create
the directory if needed and run `npm install /absolute/path/to/n8n-nodes-everygen-0.1.0.tgz`
there. Use the container’s persistent n8n volume for Docker. Select the installed
Everygen nodes and connect your own credential. This archive cannot be installed
into n8n Cloud.

Import [check-account.json](https://github.com/bytevirts/everygen-integrations/blob/main/n8n/examples/check-account.json)
for a read-only connection check, or [completed-media.json](https://github.com/bytevirts/everygen-integrations/blob/main/n8n/examples/completed-media.json)
for the completion trigger. Both start inactive and contain no credentials.
