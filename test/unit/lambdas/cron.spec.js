const { handler } = require('../../../lambdas/cron');

const { pushRecordsToFifoSQS, querytasksDue } = require('../../../lib/aws');

// Mock the dependency function
jest.mock('../../../lib/aws', () => ({
    querytasksDue: jest.fn(() => {}),
    pushRecordsToFifoSQS: jest.fn(() => null),
}));

describe('Cron Lambda Handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should query DynamoDB for due tasks and push tasks to SQS queue', async () => {
        const mockData = [{ id: 1 },  {id: 2 }];
        querytasksDue.mockReturnValue(mockData);
        const event = {};
        await handler(event);
        
        expect(querytasksDue).toHaveBeenCalled();
        expect(pushRecordsToFifoSQS).toHaveBeenCalledWith(process.env.TASKS_SQS_QUEUE, mockData);
    });
});
