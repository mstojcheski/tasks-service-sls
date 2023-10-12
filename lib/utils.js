const calculateTimeDifferenceInSeconds = (timestampISO8601) => {
    const currentTimestamp = new Date();
    const providedTimestamp = new Date(timestampISO8601);
  
    const timeDifferenceInSeconds = Math.floor((providedTimestamp - currentTimestamp) / 1000);
    return timeDifferenceInSeconds;
};

const calculateFutureTimestamp = (hours, minutes, seconds) => {
    const currentTimestamp = new Date();
    const futureTimestamp = new Date(currentTimestamp);
  
    futureTimestamp.setHours(futureTimestamp.getHours() + hours);
    futureTimestamp.setMinutes(futureTimestamp.getMinutes() + minutes);
    futureTimestamp.setSeconds(futureTimestamp.getSeconds() + seconds);
  
    return futureTimestamp.toISOString();
};

const subtractMinutesFromISO8601 = (timestampISO8601, minutes) => {
    const timestamp = new Date(timestampISO8601);
    const epochTimestamp = Math.floor(timestamp.getTime() / 1000); // Convert to seconds
  
    const newEpochTimestamp = epochTimestamp - (minutes * 60); // substract minutes
    return newEpochTimestamp;
};

const isValidISO8601String = (str) => {
    // Regular expression for ISO 8601 format
    const iso8601Pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
  
    return iso8601Pattern.test(str);
};

const convertEventTimeToEpochSeconds = (eventTimeISO8601) => {
    const eventTimestamp = new Date(eventTimeISO8601);
    const epochTimestampInSeconds = Math.floor(eventTimestamp.getTime() / 1000); // Convert to seconds
  
    return epochTimestampInSeconds;
};

const toTaskResponse = (task) => {
    const {
        id,
        timestamp = null,
        taskStatus,
    } = task;

    if (!id || !isValidISO8601String(timestamp)) {
        throw new Error(`Invalid data for task: ${JSON.stringify(task)}`);
    }

    const secondsLeft = calculateTimeDifferenceInSeconds(timestamp);
    return {
        id,
        taskStatus,
        time_left: secondsLeft > 0 ? secondsLeft : 0
    };
};

module.exports = {
    calculateTimeDifferenceInSeconds,
    calculateFutureTimestamp,
    subtractMinutesFromISO8601,
    isValidISO8601String,
    convertEventTimeToEpochSeconds,
    toTaskResponse,
};
