const { convertEventTimeToEpochSeconds } = require('../lib/utils');
const { pushRecordsToFifoSQS, querytasksDue } = require('../lib/aws');
const config = require('../config');
const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;
const queueUrl = process.env.taskS_SQS_QUEUE;
const DYNAMODB_INDEX_NAME = process.env.TASKS_DYNAMO_DB_INDEX;

exports.handler = async (event) => {
    try {
        const eventTimeInUtc = event.time || new Date().toISOString();
        console.log(`Executing cron at: ${eventTimeInUtc}`);
        // query tasks with `status`: scheduled and `startExecutionAt`: <= eventTimeInUtc
        const eventTimeInEpochSeconds = convertEventTimeToEpochSeconds(eventTimeInUtc);
        const currentJobs = 
            await querytasksDue(
                dynamoDBTableName,
                DYNAMODB_INDEX_NAME,
                config.TASK_STATUS_VALUES.SCHEDULED,
                eventTimeInEpochSeconds
            );
        // push jobs to queue
        console.log(`dispatching ${currentJobs.length} jobs`);
        await pushRecordsToFifoSQS(queueUrl, currentJobs);
        console.log(`dispatched  ${currentJobs.length} jobs`);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};