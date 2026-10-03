import {
  NodeConnectionTypes,
  NodeOperationError,
  type IDataObject,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from 'n8n-workflow';

import { everygenRequest } from './GenericFunctions';

export class Everygen implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Everygen',
    name: 'everygen',
    icon: { light: 'file:everygen.svg', dark: 'file:everygen.svg' },
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Create AI images and videos with Everygen',
    defaults: { name: 'Everygen' },
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    usableAsTool: true,
    credentials: [{ name: 'everygenOAuth2Api', required: true }],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Get Account',
            value: 'getAccount',
            action: 'Get account credits',
          },
          {
            name: 'Get Generation',
            value: 'getGeneration',
            action: 'Get a generation',
          },
          {
            name: 'List Completed Generations',
            value: 'listCompleted',
            action: 'List completed generations',
          },
          {
            name: 'Start Image Generation',
            value: 'generateImage',
            action: 'Start image generation',
          },
          {
            name: 'Start Video Generation',
            value: 'generateVideo',
            action: 'Start video generation',
          },
        ],
        default: 'generateImage',
      },
      {
        displayName: 'Generation ID',
        name: 'generationId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: { show: { operation: ['getGeneration'] } },
        description:
          'ID returned by Start Image Generation or Start Video Generation',
      },
      {
        displayName: 'Request ID',
        name: 'requestId',
        type: 'string',
        default: '',
        required: true,
        displayOptions: {
          show: { operation: ['generateImage', 'generateVideo'] },
        },
        description:
          'Map a unique source event ID. Keep it for retries; use a different ID for each intended new generation. A constant would reuse the first task.',
      },
      {
        displayName: 'Prompt',
        name: 'prompt',
        type: 'string',
        typeOptions: { rows: 4 },
        default: '',
        required: true,
        displayOptions: {
          show: { operation: ['generateImage', 'generateVideo'] },
        },
        description: 'What to create (3–4,000 characters)',
      },
      {
        displayName: 'Max Credits',
        name: 'maxCredits',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 100000, numberPrecision: 0 },
        default: 1,
        required: true,
        displayOptions: {
          show: { operation: ['generateImage', 'generateVideo'] },
        },
        description:
          'Maximum Everygen credits authorized per generation. Quotes over this limit are rejected without charging; choose a sufficient limit explicitly.',
      },
      {
        displayName: 'Model',
        name: 'model',
        type: 'options',
        options: [
          { name: 'GPT Image 2', value: 'gpt-image-2' },
          { name: 'Nano Banana 2', value: 'nano-banana-2' },
          { name: 'Seedream 5.0', value: 'seedream-5-0' },
        ],
        default: 'gpt-image-2',
        displayOptions: { show: { operation: ['generateImage'] } },
      },
      {
        displayName: 'Aspect Ratio',
        name: 'imageRatio',
        type: 'options',
        options: ['1:1', '16:9', '9:16', '4:3', '3:4'].map((value) => ({
          name: value,
          value,
        })),
        default: '1:1',
        displayOptions: { show: { operation: ['generateImage'] } },
      },
      {
        displayName: 'Aspect Ratio',
        name: 'videoRatio',
        type: 'options',
        options: ['16:9', '9:16'].map((value) => ({ name: value, value })),
        default: '16:9',
        displayOptions: { show: { operation: ['generateVideo'] } },
      },
      {
        displayName: 'Duration (Seconds)',
        name: 'seconds',
        type: 'number',
        typeOptions: { minValue: 4, maxValue: 15, numberPrecision: 0 },
        default: 5,
        displayOptions: { show: { operation: ['generateVideo'] } },
      },
      {
        displayName: 'Resolution',
        name: 'resolution',
        type: 'options',
        options: [
          { name: '480p', value: '480p' },
          { name: '720p', value: '720p' },
        ],
        default: '480p',
        displayOptions: { show: { operation: ['generateVideo'] } },
      },
      {
        displayName: 'Generate Audio',
        name: 'audio',
        type: 'boolean',
        default: true,
        displayOptions: { show: { operation: ['generateVideo'] } },
        description: 'Whether the generated video includes audio',
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
        displayOptions: { show: { operation: ['listCompleted'] } },
      },
      {
        displayName: 'Limit',
        name: 'limit',
        type: 'number',
        typeOptions: { minValue: 1, maxValue: 100 },
        default: 50,
        displayOptions: { show: { operation: ['listCompleted'] } },
        description: 'Max number of results to return',
      },
    ],
  };
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData(),
      output: INodeExecutionData[] = [];
    for (let index = 0; index < items.length; index++) {
      try {
        const operation = this.getNodeParameter('operation', index) as string;
        let result: IDataObject;
        if (operation === 'getAccount')
          result = await everygenRequest.call(this, 'GET', '/account');
        else if (operation === 'getGeneration')
          result = await everygenRequest.call(
            this,
            'GET',
            `/generations/${encodeURIComponent(this.getNodeParameter('generationId', index) as string)}`
          );
        else if (operation === 'listCompleted')
          result = await everygenRequest.call(
            this,
            'GET',
            '/generations',
            undefined,
            {
              kind: this.getNodeParameter('kind', index) as string,
              limit: this.getNodeParameter('limit', index) as number,
            }
          );
        else {
          const kind = operation === 'generateImage' ? 'image' : 'video';
          const generation: IDataObject = {
            kind,
            prompt: this.getNodeParameter('prompt', index) as string,
          };
          if (kind === 'image') {
            generation.model = this.getNodeParameter('model', index) as string;
            generation.ratio = this.getNodeParameter(
              'imageRatio',
              index
            ) as string;
          } else {
            generation.seconds = this.getNodeParameter(
              'seconds',
              index
            ) as number;
            generation.ratio = this.getNodeParameter(
              'videoRatio',
              index
            ) as string;
            generation.resolution = this.getNodeParameter(
              'resolution',
              index
            ) as string;
            generation.audio = this.getNodeParameter('audio', index) as boolean;
          }
          result = await everygenRequest.call(this, 'POST', '/generations', {
            request_id: this.getNodeParameter('requestId', index) as string,
            max_credits: this.getNodeParameter('maxCredits', index) as number,
            generation,
          });
        }
        const records =
          operation === 'listCompleted'
            ? (result.items as IDataObject[])
            : [result];
        for (const json of records)
          output.push({ json, pairedItem: { item: index } });
      } catch (error) {
        if (this.continueOnFail())
          output.push({
            json: {
              error:
                error instanceof Error
                  ? error.message
                  : 'Everygen request failed',
            },
            pairedItem: { item: index },
          });
        else
          throw new NodeOperationError(
            this.getNode(),
            error instanceof Error
              ? error
              : new Error('Everygen request failed'),
            { itemIndex: index }
          );
      }
    }
    return [output];
  }
}
