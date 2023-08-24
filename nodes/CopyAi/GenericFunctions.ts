import type { OptionsWithUri } from 'request';

import type {
	IDataObject,
	IExecuteFunctions,
	IExecuteSingleFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
} from 'n8n-workflow';

export async function copyAiApiRequest(
	this: IHookFunctions | IExecuteFunctions | IExecuteSingleFunctions | ILoadOptionsFunctions,
	method: string,
	resource: string,
	body: any = {},
	qs: IDataObject = {},
	uri?: string,
	option: IDataObject = {},
) {
	let options: OptionsWithUri = {
		method,
		qs,
		body,
		uri: uri || ` https://api.copy.ai/api/${resource}`,
		json: true,
	};

	options = Object.assign({}, options, option);
	if (Object.keys(options.body as IDataObject).length === 0) {
		delete options.body;
	}

	return this.helpers.requestWithAuthentication.call(this, 'copyAiApi', options);
}

export async function copyAiApiRequestAllItems(
	this: IHookFunctions | IExecuteFunctions | ILoadOptionsFunctions,
	method: string,
	resource: string,
	body: any = {},
	query: IDataObject = {},
	limit = 0,
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;
	query.size = 10;
	query.page = 1;

	do {
		responseData = await copyAiApiRequest.call(this, method, resource, body, query);
		returnData.push.apply(returnData, responseData.data.data as IDataObject[]);

		if (limit && returnData.length > limit) {
			return returnData.slice(0, limit);
		}

		query.page++;
	} while (responseData.length);
	return returnData;
}
