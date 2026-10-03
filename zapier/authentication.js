const { request } = require('./api');
const ISSUER = 'https://everygen-ai.com/api/plugin-auth/oauth2';
const RESOURCE = 'https://everygen-ai.com/mcp';
const token = async (z, bundle, refresh) => {
  const body = {
    client_id: process.env.CLIENT_ID,
    resource: RESOURCE,
    ...(refresh
      ? {
          grant_type: 'refresh_token',
          refresh_token: bundle.authData.refresh_token,
        }
      : {
          grant_type: 'authorization_code',
          code: bundle.inputData.code,
          redirect_uri: bundle.inputData.redirect_uri,
          code_verifier: bundle.inputData.code_verifier,
        }),
  };
  const response = await z.request({
    url: `${ISSUER}/token`,
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  response.throwForStatus();
  return {
    ...response.data,
    ...(refresh && !response.data.refresh_token
      ? { refresh_token: bundle.authData.refresh_token }
      : {}),
  };
};
module.exports = {
  type: 'oauth2',
  test: (z, bundle) => request(z, bundle, '/account'),
  connectionLabel: '{{bundle.inputData.email}}',
  oauth2Config: {
    enablePkce: true,
    authorizeUrl: {
      url: `${ISSUER}/authorize`,
      params: {
        client_id: '{{process.env.CLIENT_ID}}',
        redirect_uri: '{{bundle.inputData.redirect_uri}}',
        response_type: 'code',
        scope:
          'openid profile email offline_access everygen:read everygen:create',
        state: '{{bundle.inputData.state}}',
        resource: RESOURCE,
      },
    },
    getAccessToken: (z, bundle) => token(z, bundle, false),
    refreshAccessToken: (z, bundle) => token(z, bundle, true),
    autoRefresh: true,
  },
};
