const API = 'https://everygen-ai.com/api/automation/v1';

const request = async (z, bundle, path, options = {}) => {
  const response = await z.request({
    url: `${API}${path}`,
    ...options,
    headers: {
      Authorization: `Bearer ${bundle.authData.access_token}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });
  if (response.status === 401)
    throw new z.errors.RefreshAuthError('Reconnect your Everygen account.');
  if (response.status >= 400) {
    const error = response.data?.error;
    throw new z.errors.Error(
      error?.message ||
        'Everygen request failed. Retry with the same Request ID.',
      error?.code || 'EverygenError',
      response.status
    );
  }
  return response.data;
};

const outputFields = [
  { key: 'id', label: 'Generation ID' },
  { key: 'task_id', label: 'Task ID' },
  { key: 'kind', label: 'Media Type' },
  { key: 'status', label: 'Status' },
  { key: 'model', label: 'Model' },
  { key: 'credits', label: 'Quoted Credits', type: 'integer' },
  { key: 'net_credits', label: 'Net Credits', type: 'integer' },
  { key: 'url', label: 'Media URL' },
  { key: 'created_at', label: 'Created At', type: 'datetime' },
  { key: 'updated_at', label: 'Updated At', type: 'datetime' },
  { key: 'workspace_url', label: 'Workspace URL' },
  { key: 'error_code', label: 'Error Code' },
];
// Editor schema sample only. Live tests must use real account records.
const sample = {
  id: 'auto_example',
  task_id: 'auto_example',
  kind: 'image',
  status: 'queued',
  model: 'gpt-image-2',
  credits: 15,
  net_credits: 0,
  url: null,
  created_at: '2026-10-03T00:00:00Z',
  updated_at: '2026-10-03T00:00:00Z',
  workspace_url: 'https://everygen-ai.com/activity/my-creations',
  media: [],
};
module.exports = { request, outputFields, sample };
