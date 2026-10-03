const { request, outputFields, sample } = require('./api');
const authentication = require('./authentication');
const common = [
  {
    key: 'request_id',
    label: 'Request ID',
    type: 'string',
    required: true,
    helpText:
      'Map a unique source event ID (for example a row ID plus revision). Retries must keep this ID. Use a new ID for each new generation; never use a constant for all events.',
  },
  {
    key: 'prompt',
    label: 'Prompt',
    type: 'text',
    required: true,
    helpText: 'Describe what to create (3–4,000 characters).',
  },
  {
    key: 'max_credits',
    label: 'Max Credits',
    type: 'integer',
    required: true,
    helpText:
      'Maximum Everygen credits you authorize per generation. A higher quote stops without charging. Everygen credits are separate from Zapier tasks.',
  },
];
const imageFields = [
  {
    key: 'model',
    label: 'Model',
    default: 'gpt-image-2',
    choices: ['gpt-image-2', 'seedream-5-0', 'nano-banana-2'],
  },
  {
    key: 'ratio',
    label: 'Aspect Ratio',
    default: '1:1',
    choices: ['1:1', '16:9', '9:16', '4:3', '3:4'],
  },
];
const videoFields = [
  {
    key: 'seconds',
    label: 'Duration in Seconds',
    type: 'integer',
    default: '5',
    helpText: 'Whole seconds from 4 to 15.',
  },
  {
    key: 'resolution',
    label: 'Resolution',
    default: '480p',
    choices: ['480p', '720p'],
  },
  {
    key: 'ratio',
    label: 'Aspect Ratio',
    default: '16:9',
    choices: ['16:9', '9:16'],
  },
  { key: 'audio', label: 'Generate Audio', type: 'boolean', default: 'true' },
];
const create = (kind) => ({
  key: `generate_${kind}`,
  noun: kind === 'image' ? 'Image' : 'Video',
  display: {
    label: `Start ${kind === 'image' ? 'Image' : 'Video'} Generation`,
    description: `Starts an AI ${kind} generation within your credit limit. Returns a task ID; use Generation Completed for the finished media.`,
  },
  operation: {
    inputFields: [...common, ...(kind === 'image' ? imageFields : videoFields)],
    perform: async (z, bundle) => {
      const { request_id, max_credits, prompt, ...settings } = bundle.inputData;
      const generation =
        kind === 'image'
          ? {
              kind,
              prompt,
              model: settings.model || 'gpt-image-2',
              ratio: settings.ratio || '1:1',
            }
          : {
              kind,
              prompt,
              seconds: Number(settings.seconds ?? 5),
              resolution: settings.resolution || '480p',
              ratio: settings.ratio || '16:9',
              audio:
                settings.audio === false || settings.audio === 'false'
                  ? false
                  : true,
            };
      return request(z, bundle, '/generations', {
        method: 'POST',
        body: { request_id, max_credits: Number(max_credits), generation },
      });
    },
    sample: { ...sample, kind },
    outputFields,
  },
});
const completed = {
  key: 'generation_completed',
  noun: 'Generation',
  display: {
    label: 'Generation Completed',
    description:
      'Triggers when an image or video in your Everygen account finishes successfully.',
  },
  operation: {
    type: 'polling',
    inputFields: [
      {
        key: 'kind',
        label: 'Media Type',
        default: 'all',
        choices: ['all', 'image', 'video'],
      },
    ],
    perform: async (z, bundle) => {
      const data = await request(z, bundle, '/generations', {
        params: { kind: bundle.inputData.kind || 'all', limit: 100 },
      });
      return data.items;
    },
    sample: { ...sample, status: 'success' },
    outputFields,
  },
};
const find = {
  key: 'find_generation',
  noun: 'Generation',
  display: {
    label: 'Find Generation',
    description:
      'Finds a generation by task ID and returns its latest saved progress and media URL.',
  },
  operation: {
    inputFields: [
      { key: 'id', label: 'Generation ID', required: true, type: 'string' },
    ],
    perform: async (z, bundle) => {
      try {
        return [
          await request(
            z,
            bundle,
            `/generations/${encodeURIComponent(bundle.inputData.id)}`
          ),
        ];
      } catch (error) {
        if (error.status === 404 || error.code === 'NOT_FOUND') return [];
        throw error;
      }
    },
    sample,
    outputFields,
  },
};
module.exports = {
  flags: { cleanInputData: false },
  version: require('./package.json').version,
  platformVersion: require('zapier-platform-core').version,
  authentication,
  triggers: { [completed.key]: completed },
  creates: { generate_image: create('image'), generate_video: create('video') },
  searches: { [find.key]: find },
};
