const { handler } = require('../../../lambdas/sqsProcessor');

const {
    deleteMessageFromQueue,
    startStepFunctionExecution,
    updateItemInDB
} = require('../../../lib/aws');

// Mock the dependency function
jest.mock('../../../lib/aws', () => ({
    deleteMessageFromQueue: jest.fn(() => {}),
    startStepFunctionExecution: jest.fn(() => null),
    updateItemInDB: jest.fn(() => null),
}));

describe('SQS Processor Lambda Handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should start SFN execution, delete message from SQS and update task record in DB', async () => {
        const mockEventData = {
            Records: [
                {
                    messageId: '26a918e1-ef5e-4e09-bc47-797132ecfef0',
                    receiptHandle: 'AQEBDErRQ0Ll3+',
                    body: `
                        {"startExecutionAt":1692966765,
                        "taskStatus":"SCHEDULED",
                        "id":"cfe73951-e76f-4110-8d76-7a2a38769808",
                        "timestamp":"2023-08-25T12:34:45.757Z"}`,
                }
            ]
        };
        await handler(mockEventData);
        
        expect(deleteMessageFromQueue).toHaveBeenCalledTimes(1);
        expect(startStepFunctionExecution).toHaveBeenCalledTimes(1);
        expect(updateItemInDB).toHaveBeenCalledTimes(1);
    });
});
