const { handler } = require('../../../lambdas/handleFailure');

const { updateItemInDB, putMetricInCloudWatch } = require('../../../lib/aws');

const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;
const serviceName = process.env.SERVICE_NAME;
const region = process.env.AWS_REGION;
const taskStatusColumnName = 'taskStatus';
const taskStatusFailed = 'FAILED';
const failureMetricName = 'TASK_FAILED';

// Mock the dependency function
jest.mock('../../../lib/aws', () => ({
    updateItemInDB: jest.fn(() => {}),
    putMetricInCloudWatch: jest.fn(() => null),
}));

describe('Handle Failure Lambda Handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should update taskstatus in DB to FAILED and put Metric in CloudWatch', async () => {
        const mockEventData = {
            'id': '6a2ef146-f124-4f04-8ef5-5459de6c93e1',
            'url': 'someserver.com',
            'timestamp': '2023-08-25T12:39:20.584Z',
            'taskStatus': 'SCHEDULED',
            'startExecutionAt': 1692967040,
            'cause': {
                'Error': 'Error',
                'Cause': '{\'errorType\':\'Error\',\'errorMessage\':\'connect ECONNREFUSED'
            }
        };
        
        await handler(mockEventData);
        
        expect(updateItemInDB).toHaveBeenCalledWith(
            dynamoDBTableName,
            mockEventData.id,
            taskStatusColumnName,
            taskStatusFailed
        );
        
        expect(putMetricInCloudWatch).toHaveBeenCalledWith(
            `${serviceName}-${region}`,
            failureMetricName,
            { Name: 'taskId', Value: mockEventData.id }
        );
    });
});
