const AWS = require('aws-sdk');
const axios = require('axios');

AWS.config.update({
    accessKeyId: 'test',
    secretAccessKey: 'test',
    region: 'us-east-1'
});

const stageName = 'local-tasks-service'; 
const LOCALSTACK_HOSTNAME = 'localhost';
const dynamoDB = new AWS.DynamoDB({ endpoint: `http://${LOCALSTACK_HOSTNAME}:4566`});
const apiGateway = new AWS.APIGateway({ endpoint: `http://${LOCALSTACK_HOSTNAME}:4566`});
const queryIntervalMs = 10000; // 10 seconds
const queryDurationMs = 180000; // 3 minutes

const getApiGatewayByName = async(apiName) => {
    try {
        const { items } = await apiGateway.getRestApis().promise();
        const matchingApis = items.filter((api) => {
            return api.name && api.name.toLowerCase() === apiName.toLowerCase();
        });
  
        if (matchingApis.length > 0) {
            const apiId = matchingApis[0].id;
            console.log('API Gateway ID:', apiId);
            return apiId;
        } else {
            console.error('No API found for the given name.');
        }
    } catch (error) {
        console.error('Error:', error);
    }
};

const sendHttpPostRequest = async(url, data) => {
    try {
        const response = await axios.post(url, data);
        console.log('Response:', response.data);
        return response;
    } catch (error) {
        console.error('Error:', error.message);
    }
};

const getItemFromDynamoDB = async(tableName, taskId) => {
    const params = {
        TableName: tableName,
        Key: {
            id: { S: taskId },
        },
    };
  
    try {
        const { Item } = await dynamoDB.getItem(params).promise();
        return Item;
    } catch (error) {
        console.error('Error:', error);
    }
};

const queryDynamoDBRepeatedly = async(intervalMs, durationMs, tableName, taskId) => {
    const endTime = Date.now() + durationMs;
    let taskExecuted = false;
    while (Date.now() < endTime && !taskExecuted) {
        const task = await getItemFromDynamoDB(tableName, taskId);
        console.log(`task record in DB: ${JSON.stringify(task)}`);
        if (['COMPLETED', 'FAILED'].includes(task.taskStatus.S)){
            taskExecuted = true;
            break;
        }
        await new Promise((resolve) => setTimeout(resolve, intervalMs));
    }
};

const main = async() => {
    console.log('Start test..');
    console.log('Get API Gateway ID:');
    const API_GATEWAY_ID = await getApiGatewayByName(stageName);
    const BASE_DOMAIN = `http://${LOCALSTACK_HOSTNAME}:4566/restapis/${API_GATEWAY_ID}/local/_user_request_`;
    console.log('Got API Gateway ID');
    console.log('Send post request to url: ');
    const response = await sendHttpPostRequest(
        `${BASE_DOMAIN}/tasks`, 
        {
            'url': 'https://httpbin.org/post', 
            'hours': 0,
            'minutes': 1, 
            'seconds': 5
        }
    );
    console.log(`Got response from the API: ${JSON.stringify(response.data)}`);
    console.log(`Going to query DB each ${queryIntervalMs / 1000} seconds...`);
    await queryDynamoDBRepeatedly(queryIntervalMs, queryDurationMs, 'tasksTable-local', response.data.id);
    console.log('Test completed...');
};

main();
