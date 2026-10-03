import {
  NodeConnectionTypes,
  NodeOperationError,
  type IDataObject,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  type IPollFunctions,
} from 'n8n-workflow';

import { everygenRequest } from './GenericFunctions';

export class EverygenTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Everygen Trigger',
    name: 'everygenTrigger',
    icon: { light: 'file:everygen.svg', dark: 'file:everygen.svg' },
    subtitle: 'Generation Completed',
    group: ['trigger'],
    version: 1,
    description: 'Trigger when an Everygen image or video finishes',
    defaults: { name: 'Everygen Trigger' },
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    polling: true,
    credentials: [{ name: 'everygenOAuth2Api', required: true }],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        options: [
          { name: 'Generation Completed', value: 'generationCompleted' },
        ],
        default: 'generationCompleted',
      },
      {
        displayName: 'Media Type',
        name: 'kind',
        type: 'options',
        options: [
          { name: 'All', value: 'all' },
          { name: 'Image', value: 'image' },
          { name: 'Video', value: 'video' },
        ],
        default: 'all',
      },
    ],
  };
  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    const state = this.getWorkflowStaticData('node');
    const known = new Set(
      Array.isArray(state.seenIds) ? (state.seenIds as string[]) : []
    );
    const kind = this.getNodeParameter('kind') as string;
    const found: IDataObject[] = [];
    const boundary = String(state.lastSeenAt || '1970-01-01T00:00:00.000Z');
    let newest = boundary;
    let cursor: string | undefined;
    for (let page = 0; page < 20; page++) {
      const response = await everygenRequest.call(
        this,
        'GET',
        '/generations',
        undefined,
        { kind, limit: 100, ...(cursor ? { cursor } : {}) }
      );
      const records = response.items as IDataObject[];
      if (page === 0 && records[0]) newest = String(records[0].updated_at);
      if (this.getMode() === 'manual')
        return records.length
          ? [records.slice(0, 5).map((json) => ({ json }))]
          : null;
      if (!state.initialized) {
        state.initialized = true;
        state.seenIds = records.map((row) => String(row.id));
        state.lastSeenAt = newest;
        return null;
      }
      let reachedBoundary = false;
      for (const row of records) {
        if (String(row.updated_at) < boundary) {
          reachedBoundary = true;
          break;
        }
        if (!known.has(String(row.id))) found.push(row);
      }
      if (reachedBoundary || !response.next_cursor) {
        state.lastSeenAt = newest;
        state.seenIds = [...found.map((row) => String(row.id)), ...known].slice(
          0,
          2000
        );
        return found.length
          ? [found.reverse().map((json) => ({ json }))]
          : null;
      }
      cursor = String(response.next_cursor);
    }
    throw new NodeOperationError(
      this.getNode(),
      'More than 2,000 new generations appeared since the last poll. Increase polling frequency before retrying. The cursor was retained.'
    );
  }
}
