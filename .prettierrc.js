module.exports = {
	printWidth: 80,
	useTabs: true,
	tabWidth: 4,
	singleQuote: true,
	trailingComma: 'none',
	arrowParens: 'avoid',
	overrides: [
		{
			files: '*.json',
			options: {
				parser: 'json',
				useTabs: false
			}
		},
		{
			files: '*.ts',
			options: {
				parser: 'typescript'
			}
		}
	]
};
