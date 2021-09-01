const path = require('path');
const chokidar = require('chokidar');
const chalk = require('chalk');
const scssCompile = require('../lib/sass-compile');
const { glob } = require('glob');
const outputLog = require('../lib/logger');
const utils = require('../../lib/utils');

async function build(constPaths) {
	const { config, dev, scssLocation } = constPaths;

	const sassCompileList = glob.sync(path.join(scssLocation, '**/*.scss'), {
		ignore: path.join(scssLocation, '**/_*.scss')
	});

	const compilePath = sassCompileList;
	if (!compilePath || !compilePath.length) return;

	for (let i = 0; i < compilePath.length; i++) {
		const sourceFile = compilePath[i];
		console.log(sourceFile);
		await scssCompile(sourceFile, config, dev);
	}
}

module.exports = async function buildScss(constPaths) {
	await build(constPaths);

	const { config, scssLocation, dev } = constPaths;

	let initWatchScss = true;
	let timerCssBuild = null;
	// 监听sass文件变化
	chokidar.watch(scssLocation).on('all', async (event, changePath) => {
		const isIgnoreFile = path.basename(changePath).startsWith('_');
		if (isIgnoreFile || event === 'addDir') return;

		if (timerCssBuild) clearTimeout(timerCssBuild);
		timerCssBuild = setTimeout(rebuildScss, 500);

		async function rebuildScss() {
			if (initWatchScss) {
				initWatchScss = false;
				return;
			}

			try {
				console.log(`preparing rebuild css:${event} ${changePath}`);
				const startTime = Date.now();
				await scssCompile(changePath, config, dev);
				outputLog(`rebuild success,take ${Date.now() - startTime}ms `);

				utils.triggerRefresh();
			} catch (error) {
				console.log(chalk.bold.red(error));
				throw error;
			}
		}
	});
};
