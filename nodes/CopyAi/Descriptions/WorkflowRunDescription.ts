import type { INodeProperties } from 'n8n-workflow';

export const workflowRunDescription: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['workflowRun'],
			},
		},
		options: [
			{
				name: 'Get',
				value: 'get',
				description: 'Get a run for a workflow',
				action: 'Get a run for a workflow',
			},
			{
				name: 'Get Many',
				value: 'getMany',
				description: 'Get all runs for a workflow',
				action: 'Get all runs for a workflow',
			},
			{
				name: 'Start',
				value: 'start',
				description: 'Start a workflow run',
				action: 'Start a workflow run',
			},
		],
		default: 'get',
	},
];

export const workflowRunFields: INodeProperties[] = [
	// ----------------------------------
	//         Shared
	// ----------------------------------
	{
		displayName: 'Workflow ID',
		name: 'workflowId',
		description: 'ID of the workflow',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workflowRun'],
				operation: ['get', 'getMany', 'start'],
			},
		},
		default: '',
	},
	// ----------------------------------
	//         workflowRun: get
	// ----------------------------------
	{
		displayName: 'Run ID',
		name: 'runId',
		description: 'ID of the workflow run',
		type: 'string',
		required: true,
		displayOptions: {
			show: {
				resource: ['workflowRun'],
				operation: ['get'],
			},
		},
		default: '',
	},
	// ----------------------------------
	//         workflowRun: getMany
	// ----------------------------------
	{
		displayName: 'Return All',
		name: 'returnAll',
		type: 'boolean',
		displayOptions: {
			show: {
				resource: ['workflowRun'],
				operation: ['getMany'],
			},
		},
		default: false,
		description: 'Whether to return all results or only up to a given limit',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: {
			show: {
				resource: ['workflowRun'],
				operation: ['getMany'],
				returnAll: [false],
			},
		},
		typeOptions: {
			minValue: 1,
		},
		default: 50,
		description: 'Max number of results to return',
	},
	// ----------------------------------
	//         workflowRun: start
	// ----------------------------------
	{
		displayName: 'Start Variables',
		name: 'startVariables',
		description: 'A JSON object containing all start variables for your workflow',
		type: 'json',
		required: true,
		displayOptions: {
			show: {
				resource: ['workflowRun'],
				operation: ['start'],
			},
		},
		default: '{}',
	},
	{
		displayName: 'Additional Fields',
		name: 'additionalFields',
		type: 'collection',
		placeholder: 'Add Field',
		displayOptions: {
			show: {
				resource: ['workflowRun'],
				operation: ['start'],
			},
		},
		default: {},
		options: [
			{
				displayName: 'Metadata',
				name: 'metadata',
				description: 'A JSON object containing metadata to store and return with the workflow run',
				type: 'json',
				default: '',
			},
		],
	},
];


