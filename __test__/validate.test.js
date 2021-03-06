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
			staticFilesDirectory: path.join(__dirname, './mock/views'),
			webappDirectory: path.join(__dirname, './mock'),
			np: true
		};

		const { jsCompileList } = verifyFn(validOption);

		const strList = jsCompileList.map(item => item.path).join();

		expect(strList).toContain('src/js/test/1/main.js');
		expect(strList).toContain('src/js/test/2/main.js');
		expect(strList).not.toContain('jquery-3.5.1.min.js');
	});
});

function setGlobalVariable() {
	global.srcPrefix = '/src/';
	global.deployPrefix = '/deploy/';
	global.localStaticResourcesPrefix = /\/sf/;
	global.sfPrefix = '/sf/';
}
