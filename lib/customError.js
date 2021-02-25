class MyError extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
}

class ValidationError extends MyError {}

class PropertyRequiredError extends ValidationError {
	constructor(property) {
		super('No property: ' + property);
		this.property = property;
	}
}

module.exports = {
	ValidationError,
	PropertyRequiredError
};
