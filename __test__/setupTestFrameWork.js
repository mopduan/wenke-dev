expect.extend({
	toBeTypeOf(received, expected) {
		const objType = typeof received;
		const pass = objType === expected;

		const message = pass
			? () =>
					this.utils.matcherHint('.not.toBeTypeOf') +
					'\n\n' +
					'Expected value to not be (using typeof):\n' +
					`  ${this.utils.printExpected(expected)}\n` +
					'Received:\n' +
					`  ${this.utils.printReceived(objType)}`
			: () =>
					this.utils.matcherHint('.toBeTypeOf') +
					'\n\n' +
					'Expected value to be (using typeof):\n' +
					`  ${this.utils.printExpected(expected)}\n` +
					'Received:\n' +
					`  ${this.utils.printReceived(objType)}`;

		return { message, pass };
	},
	toEndWith(received, expected) {
		const pass =
			typeof received === 'string' && received.endsWith(expected);

		const message = pass
			? () =>
					this.utils.matcherHint('.not.toEndWith') +
					'\n\n' +
					'Expected value to not end with:\n' +
					`  ${this.utils.printExpected(expected)}\n` +
					'Received:\n' +
					`  ${this.utils.printReceived(received)}`
			: () =>
					this.utils.matcherHint('.toEndWith') +
					'\n\n' +
					'Expected value to end with:\n' +
					`  ${this.utils.printExpected(expected)}\n` +
					'Received:\n' +
					`  ${this.utils.printReceived(received)}`;

		return { message, pass };
	}
});
