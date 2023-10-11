module.exports = {
    START_EXEC_BEFORE_MINUTES: 2, // used to calculate the startExecutionAt timestamp
    SHORT_TERM_WINDOW_MINUTES: 3, // if scheduled in the short_term_window, record is pushed to sqsQueue for processing
    TASK_STATUS_VALUES: {
        SCHEDULED: 'SCHEDULED',
        IN_PROGRESS: 'IN_PROGRESS',
        COMPLETED: 'COMPLETED',
        FAILED: 'FAILED'
    },
    TASK_STATUS_NAME: 'taskStatus',
    FAILURE_METRIC_NAME: 'TASK_FAILED',
    SUCCESS_METRIC_NAME: 'TASK_COMPLETED'
};  