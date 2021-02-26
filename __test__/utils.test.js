const path = require('path')

const { isInt, isInArray, jsonArrayUnique, normalizePath, getAllFilesByDir
} = require('../lib/utils');

describe('test utils functions', () => {
	test('isInt()', () => {
		expect(isInt(8)).toBe(true);
		expect(isInt('8')).toBe(true);
		expect(isInt('')).toBe(false);
		expect(isInt(1.4)).toBe(false);
	});

	test('isInArray()', () => {
		const ele = { test: 'test' };
		const arr = [1, 2, 3, 4, ele];

		expect(isInArray(arr, 2)).toBeTruthy();
		expect(isInArray(arr, '2')).toBeFalsy();
		expect(isInArray(arr, ele)).toBeTruthy();
	});

	test('jsonArrayUnique()', () => {
		const duplicate = [
			{ path: '/views/src/js/test/0/main.js' },
			{ path: '/views/src/js/test/0/main.js' },
			{ path: '/views/src/js/test/1/main.js' }
		]
		const res = [
			{ path: '/views/src/js/test/0/main.js' },
			{ path: '/views/src/js/test/1/main.js' }
		]
		expect(jsonArrayUnique(duplicate)).toEqual(res);
	});

	test('normalizePath()', () => {
		const url = `\\Workspace\\test\\dir`
		expect(normalizePath(url)).toBe('/Workspace/test/dir');
	})
});

describe('test extract files', () => {
	test('get all njk files in provided directory', () => {
		const providedDir = path.join(__dirname, 'mock/views/src')
		const res = getAllFilesByDir(providedDir, ['.njk']).join()

		expect(res).toContain('/src/template2.njk');
		expect(res).toContain('/src/template1.njk');
	});
});


