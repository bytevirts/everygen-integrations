import type { ICredentialType, INodeProperties } from 'n8n-workflow';

export class EverygenOAuth2Api implements ICredentialType {
  name = 'everygenOAuth2Api';
  extends = ['oAuth2Api'];
  displayName = 'Everygen OAuth2 API';
  icon: ICredentialType['icon'] = {
    light: 'file:../nodes/Everygen/everygen.svg',
    dark: 'file:../nodes/Everygen/everygen.svg',
  };
  documentationUrl =
    'https://github.com/bytevirts/everygen-integrations/tree/main/n8n';
  properties: INodeProperties[] = [
    {
      displayName: 'Dynamic Client Registration',
      name: 'useDynamicClientRegistration',
      type: 'hidden',
      default: true,
    },
    {
      displayName: 'Server URL',
      name: 'serverUrl',
      type: 'hidden',
      default: 'https://everygen-ai.com/mcp',
    },
    {
      displayName: 'Resource URL',
      name: 'resourceUrl',
      type: 'hidden',
      default: 'https://everygen-ai.com/mcp',
    },
    {
      displayName: 'Grant Type',
      name: 'grantType',
      type: 'hidden',
      default: 'pkce',
    },
    {
      displayName: 'Scope',
      name: 'scope',
      type: 'hidden',
      default:
        'openid profile email offline_access everygen:read everygen:create',
    },
    {
      displayName: 'Client ID',
      name: 'clientId',
      type: 'hidden',
      default: '',
      required: false,
    },
    {
      displayName: 'Client Secret',
      name: 'clientSecret',
      typeOptions: { password: true },
      type: 'hidden',
      default: '',
      required: false,
    },
    {
      displayName: 'Authentication',
      name: 'authentication',
      type: 'hidden',
      default: 'body',
    },
    {
      displayName: 'Auth URI Query Parameters',
      name: 'authQueryParameters',
      type: 'hidden',
      default: '',
    },
  ];
}
