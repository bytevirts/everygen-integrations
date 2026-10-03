const test = require('node:test');
const assert = require('node:assert/strict');
const { Everygen } = require('../dist/nodes/Everygen/Everygen.node.js');
const {
  EverygenTrigger,
} = require('../dist/nodes/Everygen/EverygenTrigger.node.js');
const task = (id, at = '2026-10-03T10:00:00.000Z') => ({
  id,
  status: 'success',
  updated_at: at,
  url: `https://example.test/${id}.png`,
});
const pollContext = (state, pages, mode = 'trigger') => ({
  getWorkflowStaticData: () => state,
  getNodeParameter: () => 'all',
  getMode: () => mode,
  getNode: () => ({
    name: 'Everygen Trigger',
    type: 'everygenTrigger',
    typeVersion: 1,
    position: [0, 0],
    parameters: {},
  }),
  helpers: {
    httpRequestWithAuthentication: async (_name, options) => {
      assert.ok(options.url.startsWith('https://everygen-ai.com/'));
      return pages.shift();
    },
  },
});

test('activation excludes history; manual samples do not change the baseline', async () => {
  const node = new EverygenTrigger(),
    state = {};
  assert.equal(
    await node.poll.call(
      pollContext(state, [{ items: [task('old')], next_cursor: null }])
    ),
    null
  );
  assert.equal(state.initialized, true);
  const before = structuredClone(state);
  const sample = await node.poll.call(
    pollContext(state, [{ items: [task('new')], next_cursor: null }], 'manual')
  );
  assert.equal(sample[0][0].json.id, 'new');
  assert.deepEqual(state, before);
});

test('polling follows cursors and does not lose unseen records behind a known record updated later', async () => {
  const node = new EverygenTrigger();
  const state = {
    initialized: true,
    seenIds: ['old'],
    lastSeenAt: '2026-10-03T10:00:00.000Z',
  };
  const pages = [
    {
      items: [
        task('old', '2026-10-03T10:03:00.000Z'),
        task('newer', '2026-10-03T10:02:00.000Z'),
      ],
      next_cursor: 'next',
    },
    {
      items: [
        task('new', '2026-10-03T10:01:00.000Z'),
        task('history', '2026-10-03T09:59:00.000Z'),
      ],
      next_cursor: null,
    },
  ];
  const result = await node.poll.call(pollContext(state, pages));
  assert.deepEqual(
    result[0].map((row) => row.json.id),
    ['new', 'newer']
  );
  assert.equal(state.lastSeenAt, '2026-10-03T10:03:00.000Z');
});

test('pagination overflow leaves the baseline unchanged', async () => {
  const state = {
      initialized: true,
      seenIds: ['old'],
      lastSeenAt: '2026-10-03T09:00:00.000Z',
    },
    before = structuredClone(state);
  const pages = Array.from({ length: 20 }, (_, i) => ({
    items: [task(`new-${i}`)],
    next_cursor: `page-${i}`,
  }));
  await assert.rejects(
    new EverygenTrigger().poll.call(pollContext(state, pages)),
    /2,000/
  );
  assert.deepEqual(state, before);
});

test('item pairing, explicit authorization and event keys survive generation retries', async () => {
  const node = new Everygen(),
    requests = [];
  const params = {
    operation: 'generateVideo',
    requestId: 'event-123:video',
    prompt: 'A fox runs',
    maxCredits: 80,
    seconds: 4,
    videoRatio: '16:9',
    resolution: '480p',
    audio: false,
  };
  const context = {
    getInputData: () => [{ json: {} }],
    getNodeParameter: (name) => params[name],
    continueOnFail: () => false,
    helpers: {
      httpRequestWithAuthentication: async (name, options) => {
        assert.equal(name, 'everygenOAuth2Api');
        requests.push(options);
        return { id: 'auto_task', status: 'queued' };
      },
    },
  };
  for (let i = 0; i < 2; i++) {
    const result = await node.execute.call(context);
    assert.deepEqual(result[0][0].pairedItem, { item: 0 });
  }
  assert.deepEqual(requests[0], requests[1]);
  assert.equal(requests[0].body.max_credits, 80);
  assert.equal(requests[0].body.generation.audio, false);
});
