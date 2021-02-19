const chalk = require('chalk');

module.exports = function outputLog(msg, color = 'blue') {
	return console.log(chalk.bold[color](msg));
};
