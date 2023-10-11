const asyncHandler = require('express-async-handler');
const {
    toTaskResponse,
} = require('../../lib/utils');
const { getItemInDB } = require('../../lib/aws');

const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;

module.exports = () =>
    asyncHandler(async (req, res) => {
        const { taskId } = req.params; // Get the ID from the URL parameter
        let task;
        try {
            task = await getItemInDB(dynamoDBTableName, taskId);
            if (!task) {
                console.log('task not found: ');
                return res.status(404).json({ error: 'task not found' });
            }

            return res.json(toTaskResponse(task));
        } catch (error) {
            console.error('Error: ', error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
