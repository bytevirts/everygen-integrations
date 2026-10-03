const assert = require('node:assert/strict');
const test = require('node:test');
const App = require('../index');
const zapier = require('zapier-platform-core');
const appTester = zapier.createAppTester(App);
class ZapierError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}
const mock = (respond) => ({
  request: async (options) => respond(options),
  errors: { Error: ZapierError, RefreshAuthError: class extends Error {} },
});

test('authorize URL preserves Zapier state, redirect and Everygen resource', async () => {
  process.env.CLIENT_ID = 'test-public-client';
  const url = new URL(
    await appTester(App.authentication.oauth2Config.authorizeUrl, {
      inputData: {
        state: 'zapier-state',
        redirect_uri:
          'https://zapier.com/dashboard/auth/oauth/return/App247154CLIAPI/',
      },
      environment: { CLIENT_ID: 'test-public-client' },
    })
  );
  assert.equal(url.searchParams.get('state'), 'zapier-state');
  assert.equal(url.searchParams.get('resource'), 'https://everygen-ai.com/mcp');
  assert.equal(url.searchParams.get('client_id'), 'test-public-client');
  assert.equal(App.authentication.oauth2Config.enablePkce, true);
});

test('create retries carry the same event key, bounded credits, and false audio; no wait loop', async () => {
  const requests = [];
  const z = mock((options) => {
    requests.push(options);
    return { status: 202, data: { id: 'auto_one', status: 'queued' } };
  });
  const bundle = {
    authData: { access_token: 'test-token' },
    inputData: {
      request_id: 'row-123:revision-1',
      prompt: 'A fox runs',
      max_credits: 50,
      seconds: 4,
      audio: false,
    },
  };
  for (let i = 0; i < 2; i++)
    assert.equal(
      (await App.creates.generate_video.operation.perform(z, bundle)).id,
      'auto_one'
    );
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(requests[0].body.max_credits, 50);
  assert.equal(requests[0].body.generation.audio, false);
  assert.equal(requests[0].headers.Authorization, 'Bearer test-token');
  assert.equal(requests.length, 2);
});

test('search returns no result for missing task; credit refusal stays a visible error', async () => {
  const bundle = {
    authData: { access_token: 'test' },
    inputData: { id: 'no-task' },
  };
  const missing = mock(() => ({
    status: 404,
    data: { error: { code: 'NOT_FOUND', message: 'Missing' } },
  }));
  assert.deepEqual(
    await App.searches.find_generation.operation.perform(missing, bundle),
    []
  );
  const denied = mock(() => ({
    status: 422,
    data: {
      error: { code: 'CREDIT_LIMIT_EXCEEDED', message: 'Limit exceeded' },
    },
  }));
  await assert.rejects(
    App.creates.generate_image.operation.perform(denied, {
      ...bundle,
      inputData: { request_id: 'one', prompt: 'A fox', max_credits: 1 },
    }),
    { code: 'CREDIT_LIMIT_EXCEEDED' }
  );
});

test('refresh stores rotated tokens and retains an unchanged refresh token if omitted', async () => {
  process.env.CLIENT_ID = 'public-test';
  let seen;
  const z = mock((options) => {
    seen = options;
    return {
      data: { access_token: 'new-access', refresh_token: 'rotated' },
      throwForStatus() {},
    };
  });
  const result = await App.authentication.oauth2Config.refreshAccessToken(z, {
    authData: { refresh_token: 'old' },
  });
  assert.equal(result.refresh_token, 'rotated');
  assert.equal(seen.body.resource, 'https://everygen-ai.com/mcp');
  assert.equal(seen.body.refresh_token, 'old');
  assert.equal('client_secret' in seen.body, false);
});
