const {
    deleteMessageFromQueue,
    startStepFunctionExecution,
    updateItemInDB
} = require('../lib/aws');
const config = require('../config');

const tasksStateMachineArn = process.env.taskS_STATE_MACHINE;
const tasksQueueUrl = process.env.taskS_SQS_QUEUE;
const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;

exports.handler = async (event) => {
    try {
        const records = event.Records;
        // Process each record in the batch
        for (const record of records) {
            const body = JSON.parse(record.body);
            console.log('Processing message:', body);
            // Start AWS Step Functions execution for each record
            await startStepFunctionExecution(tasksStateMachineArn, body);
            // Delete the processed message from the queue
            await deleteMessageFromQueue(tasksQueueUrl, record.receiptHandle);
            // update status of task from scheduled to in_progress
            await updateItemInDB(
                dynamoDBTableName,
                body.id,
                config.TASK_STATUS_NAME,
                config.TASK_STATUS_VALUES.IN_PROGRESS
            );
        }
        return 'Batch processing completed.';
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};



