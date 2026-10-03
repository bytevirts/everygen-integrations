import type {
  IDataObject,
  IExecuteFunctions,
  IPollFunctions,
} from 'n8n-workflow';

export const API = 'https://everygen-ai.com/api/automation/v1';
export async function everygenRequest(
  this: IExecuteFunctions | IPollFunctions,
  method: 'GET' | 'POST',
  path: string,
  body?: IDataObject,
  qs?: IDataObject
): Promise<IDataObject> {
  return await this.helpers.httpRequestWithAuthentication.call(
    this,
    'everygenOAuth2Api',
    { method, url: `${API}${path}`, body, qs, json: true }
  );
}
