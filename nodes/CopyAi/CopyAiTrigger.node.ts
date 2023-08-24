import { IHookFunctions, INodeType, INodeTypeDescription, IWebhookFunctions, IWebhookResponseData, NodeApiError, NodeOperationError } from "n8n-workflow";
import { copyAiApiRequest } from "./GenericFunctions";


export class CopyAiTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Copy AI Trigger',
		name: 'copyAiTrigger',
		icon: 'file:copyai.svg',
		group: ['trigger'],
		version: 1,
		subtitle:
			'={{$parameter["events"].join(", ")}}',
		description: 'Starts the workflow when Copy AI events occur',
		defaults: {
			name: 'Copy AI Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'copyAiApi',
				required: true,
			},
		],
		webhooks: [
			{
				name: 'default',
				httpMethod: 'POST',
				responseMode: 'onReceived',
				path: 'webhook',
			},
		],
		properties: [
			{
				displayName: 'Event Type',
				name: 'eventType',
				type: 'options',
				options: [
					{
						name: 'Workflow Started',
						value: 'workflowRun.started',
						description: 'Triggers an event anytime a workflow run is started',
					},
					{
						name: 'Workflow Completed',
						value: 'workflowRun.completed',
						description: 'Triggers an event anytime a workflow run is completed',
					},
					{
						name: 'Workflow Failed',
						value: 'workflowRun.failed',
						description: 'Triggers an event anytime a workflow run fails',
					},
					{
						name: 'Credit Limit Reached',
						value: 'workflowCreditLimit.reached',
						description: 'Triggers an event when your workspace reaches the credit limit',
					},
									],
				default: 'workflowRun.completed',
				description: 'The event which will trigger the workflow',
			},
		],
	};

	webhookMethods = {
		default: {
			async checkExists(this: IHookFunctions): Promise<boolean>  {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId === undefined) {
					return false;
				}
				try {
					await copyAiApiRequest.call(this, 'GET', `webhook/${webhookData.webhookId}`);
				} catch (error) {
					if (error.response.status === 404) {
						delete webhookData.webhookId;
						delete webhookData.webhookEvents;
						return false;
					}
					throw error;
				}
				return true;
			},

			async create(this: IHookFunctions): Promise<boolean>  {
				const webhookUrl = this.getNodeWebhookUrl('default') as string;

				if (webhookUrl.includes('//localhost')) {
					throw new NodeOperationError(
						this.getNode(),
						'The Webhook can not work on "localhost". Please, either setup n8n on a custom domain or start with "--tunnel"!',
					);
				}
				const eventType = this.getNodeParameter('eventType') as string;

				const body = {
					'url': webhookUrl,
					eventType,
				};

				const webhookData = this.getWorkflowStaticData('node');

				let responseData;
				try {
					responseData = await copyAiApiRequest.call(this, 'POST', 'webhook', body);
				} catch (error) {
					throw error;
				}

				if (responseData.data.id === undefined || responseData.status !== 'success') {
					throw new NodeApiError(this.getNode(), responseData, {
						message: 'CopyAI webhook creation response did not contain the expected data.',
					});
				}

				webhookData.webhookId = responseData.data.id as string;
				webhookData.webhookEvents = responseData.data.eventType as string;

				return true;
			},

			async delete(this: IHookFunctions): Promise<boolean>  {
				const webhookData = this.getWorkflowStaticData('node');

				if (webhookData.webhookId !== undefined) {
					const endpoint = `webhook/${webhookData.webhookId}`;
					try {
						await copyAiApiRequest.call(this, 'DELETE', endpoint);
					} catch (error) {
						if (error.response.status !== 404) {
							return false;
						}
					}
					delete webhookData.webhookId;
					delete webhookData.webhookEvents;
				}
				return true;
			},
		},
	};

	async webhook(this: IWebhookFunctions): Promise<IWebhookResponseData> {
		const bodyData = this.getBodyData();
		return {
			workflowData: [this.helpers.returnJsonArray(bodyData)],
		};
	}
}
