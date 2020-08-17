const chalk = require('chalk')

module.exports = function outputLog(color, msg) {
    return {
        red: console.log(chalk.bold.red(msg)),
        blue: console.log(chalk.bold.blue(msg))
    }[color]

}