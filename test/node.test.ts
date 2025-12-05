import { MarkdownToTelegramHtml } from '../nodes/MarkdownToTelegramHtml/MarkdownToTelegramHtml.node';
import { IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { markdownToTelegramHtml } from '../src/lib/markdownToTelegramHtml';

// Mock the library function
jest.mock('../src/lib/markdownToTelegramHtml', () => ({
    markdownToTelegramHtml: jest.fn((text) => `Converted: ${text}`),
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
            getNode: jest.fn().mockReturnValue({}),
        };
        (markdownToTelegramHtml as jest.Mock).mockClear();
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
        expect(markdownToTelegramHtml).toHaveBeenCalledWith('Line 1\nLine 2');
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
        expect(markdownToTelegramHtml).toHaveBeenCalledWith('Line 1\\\\nLine 2');
    });
});
