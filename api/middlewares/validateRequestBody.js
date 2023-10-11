const { body } = require('express-validator');

// Custom validation function for positive integers
const isPositiveInteger = (value) => {
    return /^[0-9]\d*$/.test(value);
};

// Custom validation function for obsolete keys
const checkForObsoleteKeys = (value, { req }) => {
    const allowedKeys = ['hours', 'minutes', 'seconds']; // List of allowed keys
    const receivedKeys = Object.keys(req.body);
  
    // Find unwanted keys
    const obsoleteKeys = receivedKeys.filter((key) => !allowedKeys.includes(key));
    if (obsoleteKeys.length > 0) {
        throw new Error(`Unwanted keys: ${obsoleteKeys.join(', ')}`);
    }
  
    return true; // Validation passed
};

// Middleware for request body validation
const validateRequestBody = [
    body().custom(checkForObsoleteKeys).withMessage('Obsolete keys found'),
    body('hours').custom(isPositiveInteger).withMessage('hours must be a positive integer'),
    body('minutes').custom(isPositiveInteger).withMessage('minutes must be a positive integer'),
    body('seconds').custom(isPositiveInteger).withMessage('seconds must be a positive integer')
];

module.exports = validateRequestBody;