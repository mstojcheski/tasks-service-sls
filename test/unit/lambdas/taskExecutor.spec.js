const { handler } = require('../../../lambdas/taskExecutor');

const {
    updateItemInDBWithTransaction,
    putMetricInCloudWatch
} = require('../../../lib/aws');

// Mock the dependency function
jest.mock('../../../lib/aws', () => ({
    updateItemInDBWithTransaction: jest.fn(() => {}),
    putMetricInCloudWatch: jest.fn(() => null),
}));

describe('Task Executor Lambda Handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should update taskStatus in DynamoDB to completed and put SUCCESS metric in CloudWatch', async () => {
        const mockEventData = {
            'startExecutionAt': 1692965679,
            'taskStatus': 'IN_PROGRESS',
            'id': '568eeb9a-9d64-411a-88ed-b712befa6110',
            'timestamp': '2023-08-25T12:16:39.019Z'
        };
        await handler(mockEventData);
        
        expect(updateItemInDBWithTransaction).toHaveBeenCalledTimes(1);
        expect(putMetricInCloudWatch).toHaveBeenCalledTimes(1);
    });
});
