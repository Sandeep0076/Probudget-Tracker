#!/usr/bin/env node

/**
 * Test script to verify date persistence fix
 * This script tests that dates in YYYY-MM-DD format are preserved correctly
 * without timezone-related shifts.
 */

// Test the formatToDateOnly function
const formatToDateOnly = (dateValue) => {
    if (!dateValue) return dateValue;
    // If already in YYYY-MM-DD format (10 characters), use as-is
    if (typeof dateValue === 'string' && dateValue.length === 10 && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue;
    }
    // Otherwise convert to date format
    return new Date(dateValue).toISOString().split('T')[0];
};

console.log('Testing formatToDateOnly function...\n');

// Test cases
const testCases = [
    { input: '2025-12-07', expected: '2025-12-07', description: 'Already formatted date' },
    { input: '2025-01-15', expected: '2025-01-15', description: 'Another formatted date' },
    { input: null, expected: null, description: 'Null value' },
    { input: undefined, expected: undefined, description: 'Undefined value' },
    { input: '2025-12-07T10:30:00.000Z', expected: '2025-12-07', description: 'ISO timestamp' },
    { input: new Date('2025-12-07').toISOString(), expected: '2025-12-07', description: 'Date object converted to ISO' },
];

let passed = 0;
let failed = 0;

testCases.forEach((test, index) => {
    const result = formatToDateOnly(test.input);
    const success = result === test.expected;

    if (success) {
        passed++;
        console.log(`✅ Test ${index + 1}: ${test.description}`);
        console.log(`   Input: ${test.input}`);
        console.log(`   Output: ${result}`);
    } else {
        failed++;
        console.log(`❌ Test ${index + 1}: ${test.description}`);
        console.log(`   Input: ${test.input}`);
        console.log(`   Expected: ${test.expected}`);
        console.log(`   Got: ${result}`);
    }
    console.log('');
});

console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${'='.repeat(50)}\n`);

// Additional timezone test
console.log('Timezone Preservation Test:');
console.log('Current timezone offset:', new Date().getTimezoneOffset(), 'minutes');
console.log('');

const testDate = '2025-12-07';
console.log(`Input date: ${testDate}`);
console.log(`After formatToDateOnly: ${formatToDateOnly(testDate)}`);
console.log(`Preserved correctly: ${formatToDateOnly(testDate) === testDate ? '✅ YES' : '❌ NO'}`);
console.log('');

// Old buggy method for comparison
const oldBuggyMethod = (dateValue) => {
    return dateValue ? new Date(dateValue).toISOString().split('T')[0] : dateValue;
};

console.log('Comparison with old buggy method:');
console.log(`Old method result: ${oldBuggyMethod(testDate)}`);
console.log(`New method result: ${formatToDateOnly(testDate)}`);
console.log(`Same result: ${oldBuggyMethod(testDate) === formatToDateOnly(testDate) ? '✅ YES' : '⚠️  NO (timezone dependent)'}`);

process.exit(failed > 0 ? 1 : 0);
