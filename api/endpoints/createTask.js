const asyncHandler = require('express-async-handler');
const { v4: uuidv4 } = require('uuid');
const { validationResult } = require('express-validator');
const {
    calculateTimeDifferenceInSeconds,
    calculateFutureTimestamp,
    subtractMinutesFromISO8601,
    toTaskResponse,
} = require('../../lib/utils');
const { pushToSQSQueue, putItemInDB } = require('../../lib/aws');
const config = require('../../config');

const dynamoDBTableName = process.env.TASKS_DYNAMO_DB;
const queueUrl = process.env.taskS_SQS_QUEUE;

module.exports = () =>
    asyncHandler(async (req, res) => {
        try {
            // validate input data - if not valid return http 400
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { hours, minutes, seconds } = req.body;
            const timestamp = calculateFutureTimestamp(hours, minutes, seconds);            
            const startExecutionAt = subtractMinutesFromISO8601(
                timestamp, 
                config.START_EXEC_BEFORE_MINUTES
            );
            const secondsLeft = calculateTimeDifferenceInSeconds(timestamp);
            const task = {
                id: uuidv4(),
                timestamp,
                taskStatus: config.TASK_STATUS_VALUES.SCHEDULED,
                startExecutionAt
            };

            console.log(`Creating task: ${JSON.stringify(task)}`);
            await putItemInDB(dynamoDBTableName, task);
            console.log(`task created: id: ${JSON.stringify(task.id)} ${JSON.stringify(task)}`);
            
            // execution time < SHORT_TERM_WINDOW_MINUTES from now => send record to SQS directly 
            if (secondsLeft < 60 * config.MINUTES_WINDOW) {
                console.log(`task: ${task.id} scheduled in lt ${60 * config.SHORT_TERM_WINDOW_MINUTES} seconds:`);
                await pushToSQSQueue(queueUrl, task);
                console.log(`task : ${task.id} pushed to SQS Queue:`);
            }
            
            return res
                .status(201)
                .send(toTaskResponse(task));
        } catch (err) {
            console.error(err);
            throw new Error(err);
        }
    });
