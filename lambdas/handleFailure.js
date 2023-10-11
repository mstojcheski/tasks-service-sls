const { updateItemInDB, putMetricInCloudWatch } = require('../lib/aws');
const config = require('../config');

const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;
const serviceName = process.env.SERVICE_NAME;
const region = process.env.AWS_REGION;

exports.handler = async (event) => {
    try {
        await updateItemInDB(
            dynamoDBTableName,
            event.id,
            config.TASK_STATUS_NAME,
            config.TASK_STATUS_VALUES.FAILED
        );
        // send metrics to cloudwatch
        await putMetricInCloudWatch(
            `${serviceName}-${region}`,
            config.FAILURE_METRIC_NAME,
            { Name: 'taskId', Value: event.id }
        );
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Record updated successfully' })
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `An error occurred while updating task with ID: ${event.id}` })
        };
    }
};

