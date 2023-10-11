const createTask = require('../../../api/endpoints/createtask');
const { pushToSQSQueue, putItemInDB } = require('../../../lib/aws');

// Mock the dependency function
jest.mock('../../../lib/aws', () => ({
    pushToSQSQueue : jest.fn(() => {}),
    putItemInDB : jest.fn(() => {}),
}));

describe.skip('Create task Endpoint Lambda Handler', () => {
    beforeEach(() => {
        jest.resetAllMocks();
    });

    it('should create task in DB (when task timestamp is in more the 2 minutes from now', async () => {
        const req = ({ params: { taskId: 123}});
        await createTask(req, {});
        expect(putItemInDB).toHaveBeenCalled();
        expect(pushToSQSQueue).not.toHaveBeenCalled();
    });

    it('should create task in DB and push it to SQS(if task timestamp is in <= the 2min from now', async () => {
        const req = ({ params: { taskId: 123}});
        await createTask(req, {});
        expect(putItemInDB).toHaveBeenCalled();
        expect(pushToSQSQueue).toHaveBeenCalled();
    });
});
