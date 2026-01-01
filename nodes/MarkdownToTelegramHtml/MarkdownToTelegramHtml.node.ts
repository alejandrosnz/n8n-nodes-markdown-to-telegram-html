import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';
import { markdownToTelegramHtml } from '../../src/lib/markdownToTelegramHtml';
import { safeTruncateHtml, splitHtmlIntoChunks } from '../../src/lib/htmlUtils';

export class MarkdownToTelegramHtml implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Markdown to Telegram-HTML',
		name: 'markdownToTelegramHtml',
		icon: { light: 'file:markdown-to-telegram-html.svg', dark: 'file:markdown-to-telegram-html.svg' },
		group: ['transform'],
		version: 1,
		description: 'Convert Markdown to Telegram-compatible HTML',
		defaults: {
			name: 'Markdown to Telegram-HTML',
		},
		inputs: ['main'],
		outputs: ['main'],
		usableAsTool: true,
		properties: [
			{
				displayName: 'Markdown Text',
				name: 'markdownText',
				type: 'string',
				typeOptions: {
					rows: 10,
				},
				default: '',
				placeholder: '# Example\n\n**Bold text** with a [link](https://example.com) and a ||spoiler||',
				description:
					'The markdown text to convert to Telegram HTML. Supports standard markdown plus Telegram features like spoilers (||text||) and user mentions.',
			},
			{
				displayName: 'Output Field',
				name: 'outputField',
				type: 'string',
				default: 'telegram_html',
				description: 'The name of the field where the converted HTML will be stored',
			},
			{
				displayName: 'Message Limit Strategy',
				name: 'messageLimitStrategy',
				type: 'options',
				options: [
					{
						description: 'Truncate the message to 4096 characters and append [...]',
						name: 'Truncate Message',
						value: 'truncate',
					},
					{
						description: 'Split the message into multiple messages of <=4096 characters without cutting HTML sections',
						name: 'Split Message',
						value: 'split',
					},
				],
				default: 'truncate',
				description: 'What to do when the generated HTML exceeds Telegram\'s 4096 character limit',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Show Advanced Options',
				default: {},
				options: [
					{
						displayName: 'Clean Escaped Characters',
						name: 'cleanEscapes',
						type: 'boolean',
						default: true,
						description: 'Whether to replace literal escape sequences (e.g. "\\n", "\\\\") with actual characters. Enable this if your input text shows "\\n" instead of newlines.',
					},
					{
						displayName: 'Character Limit',
						name: 'charLimit',
						type: 'number',
						default: 4096,
						typeOptions: {
							min: 1,
							max: 4096,
						},
						description: 'Maximum character limit for Telegram messages. Telegram allows max 4096 characters per message.',
					},
					{
						displayName: 'Table Conversion Mode',
						name: 'tableConversionMode',
						type: 'options',
						default: 'codeBlock',
						options: [
							{
								name: 'Monospaced Table',
								value: 'codeBlock',
								description: 'Maintain table structure using <pre><code>',
							},
							{
								name: 'Compact List',
								value: 'compactList',
								description: 'Each row becomes a single list item: - **Cell1** – Cell2',
							},
							{
								name: 'Detailed List',
								value: 'detailedList',
								description: 'Each row becomes a nested list with headers: - Value1 - Header2: Value2',
							},
							{
								name: 'Detailed List without Headers',
								value: 'detailedListNoHeaders',
								description: 'Each row becomes a nested list without headers: - Value1 - Value2',
							},
						],
						description: 'How to convert Markdown tables for better mobile readability',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			try {
				let markdownText = this.getNodeParameter('markdownText', itemIndex, '') as string;
				const outputField = this.getNodeParameter('outputField', itemIndex, 'telegramHtml') as string;
				const messageLimitStrategy = this.getNodeParameter('messageLimitStrategy', itemIndex, 'truncate') as string;
				const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

				// Clean escaped characters by default, unless explicitly disabled in advanced settings
				if (options.cleanEscapes !== false) {
					markdownText = markdownText.replace(/\\\\/g, '\\').replace(/\\n/g, '\n');
				}

				let charLimit = (options.charLimit as number) || 4096;
				const tableConversionMode = (options.tableConversionMode as string) || 'codeBlock';
				const mode = tableConversionMode === 'detailedListNoHeaders' ? 'detailedList' : tableConversionMode;
				const includeHeaders = tableConversionMode !== 'detailedListNoHeaders';
				// Ensure charLimit never exceeds 4096 (Telegram's maximum)
				charLimit = Math.min(charLimit, 4096);
				const telegramHtml = markdownToTelegramHtml(markdownText, { mode, includeHeaders });

				// If message is under Telegram limit, just return as single item
				if (telegramHtml.length <= charLimit) {
					const newItem: INodeExecutionData = {
						json: {
							...items[itemIndex].json,
							[outputField]: telegramHtml,
						},
						pairedItem: itemIndex,
					};
					returnData.push(newItem);
					continue;
				}

				if (messageLimitStrategy === 'truncate') {
					const truncated = safeTruncateHtml(telegramHtml, charLimit);
					const newItem: INodeExecutionData = {
						json: {
							...items[itemIndex].json,
							[outputField]: truncated,
						},
						pairedItem: itemIndex,
					};
					returnData.push(newItem);
					continue;
				}

				if (messageLimitStrategy === 'split') {
					const parts = splitHtmlIntoChunks(telegramHtml, charLimit);
					// For split, create multiple output items, each with the same original data
					for (const part of parts) {
						const newItem: INodeExecutionData = {
							json: {
								...items[itemIndex].json,
								[outputField]: part,
							},
							pairedItem: itemIndex,
						};
						returnData.push(newItem);
					}
					continue;
				}

				const newItem: INodeExecutionData = {
					json: {
						...items[itemIndex].json,
						[outputField]: telegramHtml,
					},
					pairedItem: itemIndex,
				};

				returnData.push(newItem);
			} catch (error) {
				if (this.continueOnFail()) {
					const nodeError = new NodeOperationError(this.getNode(), error as Error, {
						itemIndex,
					});
					returnData.push({
						json: items[itemIndex].json,
						error: nodeError,
						pairedItem: itemIndex,
					});
				} else {
					if (error instanceof NodeOperationError && error.context) {
						error.context.itemIndex = itemIndex;
						throw error;
					}
					throw new NodeOperationError(this.getNode(), error as Error, {
						itemIndex,
					});
				}
			}
		}

		return [returnData];
	}
}
