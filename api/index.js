const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const express = require('express');

const getTask = require('./endpoints/getTask');
const createTask = require('./endpoints/createTask');
const validateRequestBody = require('./middlewares/validateRequestBody');

const app = express();
 
app.use(bodyParser.json({ strict: false })); 
 
// Get task endpoint
app.get('/tasks/:taskId', getTask());
 
// Create task endpoint
app.post('/tasks', validateRequestBody, createTask());
 
module.exports.handler = serverless(app);