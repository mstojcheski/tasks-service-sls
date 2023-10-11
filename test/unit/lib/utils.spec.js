const {
    calculateTimeDifferenceInSeconds,
    calculateFutureTimestamp,
    subtractMinutesFromISO8601,
    isValidISO8601String,
    convertEventTimeToEpochSeconds,
    toTaskResponse,
} = require('../../../lib/utils');

describe('calculateTimeDifferenceInSeconds', () => {
    it('calculates the time difference in seconds correctly', () => {
        const currentTimestamp = new Date('2023-08-30T10:00:00Z');
        const providedTimestamp = new Date('2023-08-30T10:00:30Z');

        // Mock the Date constructor to return the fixed current timestamp
        const dateSpy = jest.spyOn(global, 'Date')
            .mockImplementationOnce(() => currentTimestamp)
            .mockImplementationOnce(() => providedTimestamp);
        // Calculate the time difference
        const timeDifferenceInSeconds = calculateTimeDifferenceInSeconds(providedTimestamp.toISOString());
        // Restore the original Date constructor
        dateSpy.mockRestore();
        // Expect the calculated time difference to be 30 seconds
        expect(timeDifferenceInSeconds).toBe(30);
    });
});

describe('calculateFutureTimestamp', () => {
    it('calculates the future timestamp correctly', () => {
        // Set the current timestamp to a fixed value (e.g., 2023-08-30T10:00:00Z)
        const currentTimestamp = new Date('2023-08-30T10:00:00Z');
        // Calculate a future timestamp that's 2 hours, 30 minutes, and 15 seconds from now
        // Mock the Date constructor to return the fixed current timestamp
        const dateSpy = jest.spyOn(global, 'Date')
            .mockImplementationOnce(() => currentTimestamp)
            .mockImplementationOnce(() => currentTimestamp);
        const futureTimestamp = calculateFutureTimestamp(2, 30, 15);

        // Restore the original Date constructor
        dateSpy.mockRestore();
        // Expect the calculated future timestamp to match the expected value
        expect(futureTimestamp).toBe('2023-08-30T12:30:15.000Z');
    });
});

describe('subtractMinutesFromISO8601', () => {
    it('subtracts minutes from a given ISO8601 timestamp correctly', () => {
        // Set a fixed ISO8601 timestamp (e.g., 2023-08-30T10:00:00Z)
        const inputTimestamp = '2023-08-30T10:00:00Z';
        
        // Subtract 5 minutes from the input timestamp
        const newEpochTimestamp = subtractMinutesFromISO8601(inputTimestamp, 5);
        
        // Expect the new epoch timestamp to match the expected value
        expect(newEpochTimestamp).toBe(1693389300); // Corresponds to 2023-08-30T09:55:00Z
    });
});

describe('isValidISO8601String', () => {
    it('validates ISO8601 format strings correctly', () => {
        // Valid ISO8601 format strings
        const validStrings = [
            '2023-08-25T10:00:00Z',
            '2023-08-25T10:00:00.123Z',
        ];
        
        // Invalid ISO8601 format strings
        const invalidStrings = [
            '2023-08-25',
            '2023-08-25T10:00:00',
            '2023-08-25T10:00:00Z1',
            'invalid'
        ];
        
        // Test valid strings
        validStrings.forEach((str) => {
            expect(isValidISO8601String(str)).toBe(true);
        });
        
        // Test invalid strings
        invalidStrings.forEach((str) => {
            expect(isValidISO8601String(str)).toBe(false);
        });
    });
});

describe('convertEventTimeToEpochSeconds', () => {
    it('converts event time to epoch seconds correctly', () => {
        // Set a fixed event time in ISO8601 format
        const eventTimeISO8601 = '2023-08-30T10:00:00Z';
        
        // Calculate the expected epoch timestamp in seconds (based on the fixed event time)
        const expectedEpochTimestamp = 1693389600; // Corresponds to 2023-08-30T10:00:00Z
        
        // Convert the event time to epoch seconds using the function
        const actualEpochTimestamp = convertEventTimeToEpochSeconds(eventTimeISO8601);
        
        // Expect the converted epoch timestamp to match the expected value
        expect(actualEpochTimestamp).toBe(expectedEpochTimestamp);
    });
});

describe('toTaskResponse', () => {
    it('for valid input, returns correct response', () => {
        // Set the current timestamp to a fixed value (e.g., 2023-08-30T10:00:00Z)
        const pastTimestamp = '2023-08-25T10:00:00.123Z';
        const currentTimestamp = new Date().toISOString();
        const futureTimestamp = () => { 
            const ts = new Date();
            ts.setSeconds(ts.getSeconds() + 30);
            return ts.toISOString();
        };

        const testCasesInPast = [
            {
                timestamp: pastTimestamp,
                id: '123',
                expected: {'id': '123', 'time_left': 0}
            },
            {
                timestamp: currentTimestamp,
                id: '456',
                expected: {'id': '456', 'time_left': 0}
            }
        ];
        
        // Test cases with timestamp past/current
        testCasesInPast.forEach((testCase) => {
            const result = toTaskResponse(testCase);
            expect(result).toEqual(testCase.expected);
        });
        // test case with timestamp in future
        const result = toTaskResponse({
            timestamp: futureTimestamp(),
            id: '456'
        });
        expect(result.id).toEqual('456');
        expect(result.time_left).toBeGreaterThan(0);
    });
    
    it('throws an error for invalid timestamp or id', () => {
        const invalidtask1 = {id: null, timestamp: '2023-08-25T10:00:00Z'};
        expect(() => toTaskResponse(invalidtask1))
            .toThrow();
        const invalidtask2 = {id: '123', timestamp: null};
        expect(() => toTaskResponse(invalidtask2))
            .toThrow();
    });
});
