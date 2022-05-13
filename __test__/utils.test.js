const path = require('path');

const {
	isInt,
	isInArray,
	jsonArrayUnique,
	normalizePath,
	getAllFilesByDir,
	isKeyIncludesArrayItem
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
		];
		const res = [
			{ path: '/views/src/js/test/0/main.js' },
			{ path: '/views/src/js/test/1/main.js' }
		];
		expect(jsonArrayUnique(duplicate)).toEqual(res);
	});

	test('normalizePath()', () => {
		const url = `\\Workspace\\test\\dir`;
		expect(normalizePath(url)).toBe('/Workspace/test/dir');
	});

	test('isKeyIncludesArrayItem()', () => {
		const key = '/baike_wap/index/bundle/';

		expect(isKeyIncludesArrayItem(key, ['index'])).toBe(true);
		expect(isKeyIncludesArrayItem()).toBe(undefined);
		expect(isKeyIncludesArrayItem('1', [])).toBe(undefined);
		expect(isKeyIncludesArrayItem(key, ['lemma'])).toBe(undefined);
	});
});

describe('test extract files', () => {
	test('get all ssr files in provided directory', () => {
		const providedDir = path.join(__dirname, 'mock/views/src');
		const res = getAllFilesByDir(providedDir, ['.js']).join();

		expect(res).toContain('/src/template2.js');
		expect(res).toContain('/src/template1.js');
	});
});
