const {
    updateItemInDBWithTransaction,
    putMetricInCloudWatch
} = require('../lib/aws');
const config = require('../config');

const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;
const serviceName = process.env.SERVICE_NAME;
const region = process.env.AWS_REGION;

const headerConfig = {
    headers: {
        'User-Agent': `${serviceName}-${region}`
    }
};

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event));
    try {
        console.log(`Updating status to ${config.TASK_STATUS_VALUES.COMPLETED} for ${event.id}`);
        await updateItemInDBWithTransaction(
            dynamoDBTableName,
            event.id,
            config.TASK_STATUS_NAME,
            config.TASK_STATUS_VALUES.COMPLETED,
            config.TASK_STATUS_NAME,
            config.TASK_STATUS_VALUES.IN_PROGRESS
        );
    } catch (error) {
        console.error('Transaction Canceled:', JSON.stringify(error));
        if (error.code === 'TransactionCanceledException') {
            //
            const msg = `task with ID: ${event.id} already completed!`;
            console.log(msg);
            return {
                statusCode: 200,
                body: JSON.stringify(msg)
            };
        } else {
            throw error;
        }
    }
    
    try {
        console.log(`Executing task: ${event.id}`);
        // send metrics to cloudwatch
        await putMetricInCloudWatch(
            `${serviceName}-${region}`,
            config.SUCCESS_METRIC_NAME,
            { Name: 'taskId', Value: event.id }
        );
    } catch (err) {
        console.error('Error:', err);
        throw err;
    }
    
    return {
        statusCode: 200,
        body: JSON.stringify(`Successfully executed task with ID: ${event.id}`)
    };
};
