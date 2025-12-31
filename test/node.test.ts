import { MarkdownToTelegramHtml } from '../nodes/MarkdownToTelegramHtml/MarkdownToTelegramHtml.node';
import { IExecuteFunctions, INodeExecutionData, NodeOperationError } from 'n8n-workflow';
import { markdownToTelegramHtml } from '../src/lib/markdownToTelegramHtml';
import { safeTruncateHtml, splitHtmlIntoChunks } from '../src/lib/htmlUtils';

// Mock the library functions
jest.mock('../src/lib/markdownToTelegramHtml', () => ({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    markdownToTelegramHtml: jest.fn((text, options) => `Converted: ${text}`),
}));

jest.mock('../src/lib/htmlUtils', () => ({
    safeTruncateHtml: jest.fn(() => 'truncated [...]'),
    splitHtmlIntoChunks: jest.fn(() => ['Part 1', 'Part 2']),
}));

describe('MarkdownToTelegramHtml Node', () => {
    let node: MarkdownToTelegramHtml;
    let mockExecuteFunctions: Partial<IExecuteFunctions>;

    beforeEach(() => {
        node = new MarkdownToTelegramHtml();
        mockExecuteFunctions = {
            getInputData: jest.fn(),
            getNodeParameter: jest.fn(),
            continueOnFail: jest.fn().mockReturnValue(false),
            getNode: jest.fn().mockReturnValue({ name: 'TestNode' }),
        };
        (markdownToTelegramHtml as jest.Mock).mockClear();
        (safeTruncateHtml as jest.Mock).mockClear();
        (splitHtmlIntoChunks as jest.Mock).mockClear();
    });

    it('should unescape input when cleanEscapes option is true', async () => {
        // Input: "Line 1\\nLine 2" (literal backslash followed by n, typical escaped newline)
        const inputString = 'Line 1\\\\nLine 2';

        // Mock input data
        const inputData: INodeExecutionData[] = [{ json: { text: inputString }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        // Mock getNodeParameter
        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return inputString;
            if (paramName === 'outputField') return 'telegramHtml';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return { cleanEscapes: true };
            return undefined;
        });

        await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        // Expectation: The double backslash n "Line 1\\nLine 2" becomes actual newline "Line 1\nLine 2".
        // JS string with newline is 'Line 1\nLine 2'.
        expect(markdownToTelegramHtml).toHaveBeenCalledWith('Line 1\nLine 2', { mode: 'codeBlock', includeHeaders: true });
    });

    it('should NOT unescape input when cleanEscapes option is false', async () => {
        const inputString = 'Line 1\\\\nLine 2';

        // Mock input data
        const inputData: INodeExecutionData[] = [{ json: { text: inputString }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        // Mock getNodeParameter
        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return inputString;
            if (paramName === 'outputField') return 'telegramHtml';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return { cleanEscapes: false };
            return undefined;
        });

        await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        // Expectation: Input passed as is.
        // Input was "Line 1\\nLine 2" (double backslash n).
        // JS string: 'Line 1\\\\nLine 2'.
        expect(markdownToTelegramHtml).toHaveBeenCalledWith('Line 1\\\\nLine 2', { mode: 'codeBlock', includeHeaders: true });
    });

    it('should apply cleanEscapes by default when options is empty', async () => {
        const inputString = 'Line 1\\nLine 2';

        const inputData: INodeExecutionData[] = [{ json: { text: inputString }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return inputString;
            if (paramName === 'outputField') return 'telegramHtml';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return {}; // Empty options - cleanEscapes should apply by default
            return undefined;
        });

        await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        // cleanEscapes !== false, so it should clean
        expect(markdownToTelegramHtml).toHaveBeenCalledWith('Line 1\nLine 2', { mode: 'codeBlock', includeHeaders: true });
    });

    it('should use custom charLimit when provided', async () => {
        const longText = 'A'.repeat(100);
        const inputData: INodeExecutionData[] = [{ json: {}, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        // Mock to return text longer than custom limit
        (markdownToTelegramHtml as jest.Mock).mockReturnValue('B'.repeat(100));

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return longText;
            if (paramName === 'outputField') return 'telegramHtml';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return { charLimit: 50 };
            return undefined;
        });

        await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        expect(safeTruncateHtml).toHaveBeenCalledWith('B'.repeat(100), 50);
    });

    it('should pass tableConversionMode to markdownToTelegramHtml', async () => {
        const inputString = '| A | B |\n|---|---|\n| 1 | 2 |';
        const inputData: INodeExecutionData[] = [{ json: {}, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return inputString;
            if (paramName === 'outputField') return 'telegramHtml';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return { tableConversionMode: 'compactList' };
            return undefined;
        });

        await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        expect(markdownToTelegramHtml).toHaveBeenCalledWith(inputString, { mode: 'compactList', includeHeaders: true });
    });

    it('should cap charLimit to 4096 even if user provides a larger value', async () => {
        const inputData: INodeExecutionData[] = [{ json: {}, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        // Mock to return text longer than Telegram's limit
        (markdownToTelegramHtml as jest.Mock).mockReturnValue('X'.repeat(5000));

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return 'test';
            if (paramName === 'outputField') return 'telegramHtml';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return { charLimit: 10000 }; // User tries to set limit > 4096
            return undefined;
        });

        await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        // Should be capped to 4096, not 10000
        expect(safeTruncateHtml).toHaveBeenCalledWith('X'.repeat(5000), 4096);
    });

    it('should truncate message when exceeding limit with truncate strategy', async () => {
        const inputData: INodeExecutionData[] = [{ json: { original: 'data' }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        // Mock to return text longer than 4096
        (markdownToTelegramHtml as jest.Mock).mockReturnValue('X'.repeat(5000));

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return 'test';
            if (paramName === 'outputField') return 'telegram_html';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return {};
            return undefined;
        });

        const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        expect(safeTruncateHtml).toHaveBeenCalledWith('X'.repeat(5000), 4096);
        expect(result[0]).toHaveLength(1);
        expect(result[0][0].json.original).toBe('data');
    });

    it('should split message into multiple items with split strategy', async () => {
        const inputData: INodeExecutionData[] = [{ json: { original: 'data' }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);

        // Mock to return text longer than 4096
        (markdownToTelegramHtml as jest.Mock).mockReturnValue('X'.repeat(5000));

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return 'test';
            if (paramName === 'outputField') return 'telegram_html';
            if (paramName === 'messageLimitStrategy') return 'split';
            if (paramName === 'options') return {};
            return undefined;
        });

        const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        expect(splitHtmlIntoChunks).toHaveBeenCalledWith('X'.repeat(5000), 4096);
        // Mock returns ['Part 1', 'Part 2'], so we expect 2 items
        expect(result[0]).toHaveLength(2);
        expect(result[0][0].json.telegram_html).toBe('Part 1');
        expect(result[0][1].json.telegram_html).toBe('Part 2');
        expect(result[0][0].json.original).toBe('data');
        expect(result[0][1].json.original).toBe('data');
    });

    it('should handle errors with continueOnFail enabled', async () => {
        const inputData: INodeExecutionData[] = [{ json: { test: 'data' }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
        (mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(true);

        // Mock to throw error
        (markdownToTelegramHtml as jest.Mock).mockImplementation(() => {
            throw new Error('Test error');
        });

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return 'test';
            if (paramName === 'outputField') return 'telegram_html';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return {};
            return undefined;
        });

        const result = await node.execute.call(mockExecuteFunctions as IExecuteFunctions);

        expect(result[0]).toHaveLength(1);
        expect(result[0][0].json.test).toBe('data');
        expect(result[0][0].error).toBeDefined();
    });

    it('should throw error when continueOnFail is disabled', async () => {
        const inputData: INodeExecutionData[] = [{ json: { test: 'data' }, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
        (mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

        // Mock to throw error
        (markdownToTelegramHtml as jest.Mock).mockImplementation(() => {
            throw new Error('Test error');
        });

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return 'test';
            if (paramName === 'outputField') return 'telegram_html';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return {};
            return undefined;
        });

        await expect(node.execute.call(mockExecuteFunctions as IExecuteFunctions)).rejects.toThrow();
    });

    it('should re-throw NodeOperationError with context', async () => {
        const inputData: INodeExecutionData[] = [{ json: {}, pairedItem: 0 }];
        (mockExecuteFunctions.getInputData as jest.Mock).mockReturnValue(inputData);
        (mockExecuteFunctions.continueOnFail as jest.Mock).mockReturnValue(false);

        const nodeError = new NodeOperationError(
            { name: 'TestNode' } as NodeOperationError['node'],
            'Test error'
        );
        nodeError.context = { someContext: 'value' };

        (markdownToTelegramHtml as jest.Mock).mockImplementation(() => {
            throw nodeError;
        });

        (mockExecuteFunctions.getNodeParameter as jest.Mock).mockImplementation((paramName: string) => {
            if (paramName === 'markdownText') return 'test';
            if (paramName === 'outputField') return 'telegram_html';
            if (paramName === 'messageLimitStrategy') return 'truncate';
            if (paramName === 'options') return {};
            return undefined;
        });

        await expect(node.execute.call(mockExecuteFunctions as IExecuteFunctions)).rejects.toThrow(NodeOperationError);
    });
});
