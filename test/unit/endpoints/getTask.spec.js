const gettask = require('../../../api/endpoints/gettask');
const { getItemInDB } = require('../../../lib/aws');

// Mock the dependency function
jest.mock('../../../lib/aws', () => ({
    getItemInDB : jest.fn(() => {}),
}));

describe.skip('Get task Endpoint Lambda Handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should get task from DynamoDB ', async () => {
        const req = ({ params: { taskId: 123}});
        await gettask(req, {});
        
        expect(getItemInDB).toHaveBeenCalledWith(process.env.TASKS_DYNAMO_DB, 123);
    });
});
