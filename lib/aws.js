const AWS = require('aws-sdk');
// Configure the AWS SDK to use LocalStack endpoint
const LOCALSTACK_HOSTNAME = process.env.LOCALSTACK_HOSTNAME;
const ENDPOINT = `http://${LOCALSTACK_HOSTNAME}:4566`;
if (LOCALSTACK_HOSTNAME) {
    process.env.AWS_SECRET_ACCESS_KEY = 'test';
    process.env.AWS_ACCESS_KEY_ID = 'test';
}
const CLIENT_CONFIG = LOCALSTACK_HOSTNAME ? {endpoint: ENDPOINT} : {};

const docClient = new AWS.DynamoDB.DocumentClient(CLIENT_CONFIG);
const sqs = new AWS.SQS(CLIENT_CONFIG);
const cloudWatch = new AWS.CloudWatch(CLIENT_CONFIG);
const stepFunctions = new AWS.StepFunctions(CLIENT_CONFIG);

const batchSize = 10;

const pushToSQSQueue = async(queueUrl, record) => {
    console.log(`pushing record to: queueURL: ${queueUrl}`);
    const params = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(record),
        MessageDeduplicationId: `TASK_${record.id}`, // Optional deduplication ID
        MessageGroupId: 'defaultGroup' // Required for FIFO queues
    };

    try {
        const response = await sqs.sendMessage(params).promise();
        console.log('Message sent:', response.MessageId);
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};

const pushBatchToSQS = (queueUrl, records, messageGroupId) => {
    const sqsParams = {
        Entries: records.map((record, index) => ({
            Id: `Record_${index}`,
            MessageBody: JSON.stringify(record),
            MessageGroupId: messageGroupId
        })),
        QueueUrl: queueUrl
    };
  
    return sqs.sendMessageBatch(sqsParams).promise();
};
  
const pushRecordsToFifoSQS = async(queueUrl, records) => {
    const totalRecords = records.length;
    const promises = [];
  
    for (let i = 0; i < totalRecords; i += batchSize) {
        const batch = records.slice(i, i + batchSize);
        const messageGroupId = `Group_${i / batchSize + 1}`;
        promises.push(pushBatchToSQS(queueUrl, batch, messageGroupId));
    }
  
    return Promise.all(promises);
};

const deleteMessageFromQueue = async(queueUrl, receiptHandle) => {
    const deleteParams = {
        QueueUrl: queueUrl,
        ReceiptHandle: receiptHandle
    };
  
    await sqs.deleteMessage(deleteParams).promise();
    console.log('Message deleted from queue.');
};
  
const getItemInDB = async (dynamoDBName, id) => {
    const { Item } = await docClient
        .get({
            TableName: dynamoDBName,
            Key: {
                id,
            }
        })
        .on('retry', (resp) => {
            if (resp.error && resp.error.retryable) {
                console.log(`Retrying(${resp.retryCount}) - get task in DynamoDB for ${id}`);
            }
        })
        .promise();
    return Item;
};
  
const putItemInDB = async (dynamoDBName, record) => {
    await docClient
        .put({
            TableName: dynamoDBName,
            Item: record
        })
        .on('retry', (resp) => {
            if (resp.error && resp.error.retryable) {
                console.log(`Retrying(${resp.retryCount}) - put task in DynamoDB: ${record.id}`);
            }
        })
        .promise();
};

const updateItemInDB = async(dynamoDBName, id, attributeName, attributeValue) => {
    const params = {
        TableName: dynamoDBName,
        Key: { id },
        UpdateExpression: 'SET #attrName = :newValue, #timestampName = :tsValue',
        ExpressionAttributeNames: {
            '#attrName': attributeName,
            '#timestampName': 'lastUpdatedAt'
        },
        ExpressionAttributeValues: {
            ':newValue': attributeValue,
            ':tsValue': new Date().toISOString()
        }
    };
  
    // Update the item in DynamoDB
    await docClient.update(params).promise();
};

const updateItemInDBWithTransaction = async(dynamoDBName, id, attrName, attrValue, conditionName, conditionValue) => {
    // Conditionally update record based on field value
    const updateParams = {
        TableName: dynamoDBName,
        Key: { id },
        UpdateExpression: 'SET #attributeName = :newValue, #timestampName = :tsValue',
        ExpressionAttributeNames: {
            '#attributeName': attrName,
            '#timestampName': 'lastUpdatedAt',
            '#attributeToUpdate': conditionName,
        },
        ExpressionAttributeValues: { 
            ':newValue': attrValue,
            ':tsValue': new Date().toISOString(),
            ':expectedValue': conditionValue,
        },
        ConditionExpression: '#attributeToUpdate = :expectedValue'
    };
    await docClient.transactWrite({
        TransactItems: [{
            Update: updateParams
        }]
    }).promise();
};

const queryTasksDue = async(dynamoDBTableName, indexName, taskStatus, upperBoundTimestamp) => {
    const pageSize = 1000; // Number of items per page
    let lastEvaluatedKey = null;
    let resultsArray = [];
    try {
        do {
            const params = {
                TableName: dynamoDBTableName,
                IndexName: indexName,
                KeyConditionExpression: 'taskStatus = :statusValue AND #ts <= :timestampValue',
                ExpressionAttributeValues: {
                    ':statusValue': taskStatus, // set as const value
                    ':timestampValue': upperBoundTimestamp //epoch timestamp with seconds precision
                },
                ExpressionAttributeNames: {
                    '#ts': 'startExecutionAt'
                },
                Limit: pageSize,
                ExclusiveStartKey: lastEvaluatedKey // For pagination
            };
  
            const result = await docClient.query(params).promise();
  
            // Process the query results here
            for (const item of result.Items) {
                resultsArray.push(item);
            }
  
            lastEvaluatedKey = result.LastEvaluatedKey;
        } while (lastEvaluatedKey);
        console.log('Query finished.');
    } catch (error) {
        console.error('Error querying records:', error);
    }
    return resultsArray;
};

const startStepFunctionExecution = async(tasksStateMachineArn, inputData) => {
    const executionParams = {
        stateMachineArn: tasksStateMachineArn,
        input: JSON.stringify(inputData)
    };
  
    await stepFunctions.startExecution(executionParams).promise();
    console.log('Step Functions execution started.');
};

const putMetricInCloudWatch = async(namespace, metricName, dimensions) => {
    // Publish a custom metric
    await cloudWatch.putMetricData({
        Namespace: namespace,
        MetricData: [
            {
                MetricName: metricName,
                Dimensions: [dimensions],
                Value: 1, 
                Unit: 'Count'
            }
        ]
    }).promise();
};

module.exports = {
    getItemInDB,
    putItemInDB,
    updateItemInDB,
    updateItemInDBWithTransaction,
    pushToSQSQueue,
    pushRecordsToFifoSQS,
    queryTasksDue,
    deleteMessageFromQueue,
    startStepFunctionExecution,
    putMetricInCloudWatch
};