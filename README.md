# Everygen integrations

Official Everygen adapters for Zapier and n8n. Create images and short videos,
query progress, and continue a workflow when media finishes.

- [Zapier setup](zapier/README.md)
- [n8n setup](n8n/README.md)
- [Automation API](API.md)
- [中文试用说明](TESTERS.zh-CN.md)

These adapters use Everygen OAuth and the user's existing credits. Each creation
requires a unique Request ID and an explicit maximum credit cost. Creating a
job returns immediately; use a completion trigger for the media URL.

Status: Zapier 1.0.0 is privately available by invitation; n8n 0.1.0 is available as a local install archive. A private Zapier version does not mean App
Directory approval, and an npm package does not mean n8n Cloud verification.
Never put access tokens, deploy keys or npm credentials in these packages.
