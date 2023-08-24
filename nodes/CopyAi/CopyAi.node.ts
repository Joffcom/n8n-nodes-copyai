import type {
	IExecuteFunctions,
	IDataObject,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { NodeOperationError } from 'n8n-workflow';

import { copyAiApiRequest, copyAiApiRequestAllItems } from './GenericFunctions';
import {
	workflowRunDescription,
	workflowRunFields
} from './Descriptions';

export class CopyAi implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Copy AI',
		name: 'copyAi',
		group: ['transform'],
		icon: 'file:copyai.svg',
		version: 1,
		subtitle: '={{ $parameter["operation"] + ": " + $parameter["resource"] }}',
		description: 'Copy AI',
		defaults: {
			name: 'Copy AI',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'copyAiApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Workflow Run',
						value: 'workflowRun',
					},
				],
				default: 'workflowRun',
			},
			...workflowRunDescription,
			...workflowRunFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		let responseData;

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				const resource = this.getNodeParameter('resource', 0);
				const operation = this.getNodeParameter('operation', 0);

				if (resource === 'workflowRun') {
					if (operation === 'get') {
						const workflowId = this.getNodeParameter('workflowId', itemIndex) as string;
						const runId = this.getNodeParameter('runId', itemIndex) as string;

						responseData = await copyAiApiRequest.call(this, 'GET', `workflow/${workflowId}/run/${runId}`);
						responseData = responseData.data;
					}
					if (operation === 'getMany') {
						const workflowId = this.getNodeParameter('workflowId', itemIndex) as string;
						const returnAll = this.getNodeParameter('returnAll', itemIndex) as boolean;
						const qs: IDataObject = {};

						if (returnAll) {
							responseData = await copyAiApiRequestAllItems.call(this, 'GET', `workflow/${workflowId}/run`, {}, qs);
						} else {
							const limit = this.getNodeParameter('limit', itemIndex) as number;

							// Allow more than the 100 items default limit
							if (limit >= 100) {
								responseData = await copyAiApiRequestAllItems.call(this, 'GET', `workflow/${workflowId}/run`, {}, qs, limit);
							} else {
								responseData = await copyAiApiRequest.call(this, 'GET', `workflow/${workflowId}/run`, {}, qs);
								responseData = responseData.data.data.slice(0, limit);
							}
						}
					}
					if (operation === 'start') {
						const workflowId = this.getNodeParameter('workflowId', itemIndex) as string;
						const startVariables = JSON.parse(this.getNodeParameter('startVariables', itemIndex) as string);

						let body: IDataObject = {
							startVariables: startVariables,
						};

						let metadata = {};
						const additionalFields = this.getNodeParameter('additionalFields', itemIndex) as IDataObject;
						if (additionalFields.metadata) {
							metadata = JSON.parse(additionalFields.metadata as string);
							body = {
								...body,
								metadata,
							};
						}
						responseData = await copyAiApiRequest.call(this, 'POST', `workflow/${workflowId}/run`, body);
						responseData = responseData;
					}

				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject),
					{ itemData: { item: itemIndex } },
				);
				returnData.push(...executionData);

			} catch (error) {
				if (this.continueOnFail()) {
					items.push({ json: this.getInputData(itemIndex)[0].json, error, pairedItem: itemIndex });
				} else {
					if (error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error, {
						itemIndex,
					});
				}
			}
		}

		return this.prepareOutputData(returnData);
	}
}
