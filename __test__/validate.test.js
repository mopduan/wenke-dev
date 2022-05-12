const path = require('path');
const verifyFn = require('../lib/validate');

beforeAll(() => {
	setGlobalVariable();
});

describe('test logic of verify cli arguments', () => {
	test('is a function', () => {
		expect(verifyFn).toBeTypeOf('function');
	});

	test('throw Error when pass invalid arguments', () => {
		const invalidOption_1 = {
			staticFilesDirectory: undefined,
			webappDirectory: ''
		};
		const invalidOption_2 = {
			staticFilesDirectory: path.join(__dirname, './mock/views/src'),
			webappDirectory: path.join(__dirname, './mock/views/src')
		};
		const invalidOption_3 = {
			staticFilesDirectory: 'undefined',
			webappDirectory: ''
		};

		expect(() => verifyFn(invalidOption_1)).toThrow();
		expect(() => verifyFn(invalidOption_2)).toThrow();
		expect(() => verifyFn(invalidOption_3)).toThrow();
	});

	test('right case', () => {
		const validOption = {
			webappDirectory: path.join(__dirname, './mock')
		};

		const { reactEntryMap } = verifyFn(validOption);

		let strList = '';

		for (const tplKey in reactEntryMap) {
			for (const entry in reactEntryMap[tplKey]) {
				strList += reactEntryMap[tplKey][entry];
			}
		}

		expect(strList).toContain('test/1/main.js');
		expect(strList).toContain('test/2/main.js');
		expect(strList).not.toContain('jquery-3.5.1.min.js');
	});
});

function setGlobalVariable() {
	global.srcPrefix = '/src/';
	global.deployPrefix = '/deploy/';
	global.localStaticResourcesPrefix = /\/sf/;
	global.sfPrefix = '/sf/';
}
