const { isInt, isInArray } = require('../lib/utils');

describe('test lib functions', () => {
    test('isInt()', () => {
        expect(isInt(8)).toBe(true);
        expect(isInt('8')).toBe(true);
        expect(isInt('')).toBe(false);
        expect(isInt(1.4)).toBe(false);
    })

    test('isInArray', () => {
        const ele = { test: 'test' }
        const arr = [1, 2, 3, 4, ele];

        expect(isInArray(arr, 2)).toBeTruthy();
        expect(isInArray(arr, '2')).toBeFalsy();
        expect(isInArray(arr, ele)).toBeTruthy();
    })
}); 