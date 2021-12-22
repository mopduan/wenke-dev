const path = require('path');
const utils = require('./lib/utils');
const validate = require('./lib/validate');
const chokidar = require('chokidar');
const stylesCompiler = require('./style-compiler/index');

global.srcPrefix = '/src/';
global.deployPrefix = '/deploy/';
global.localStaticResourcesPrefix = /\/sf/;
global.sfPrefix = '/sf/';

module.exports = async program => {
	const programArguments = program._optionValues;
	const { preactEntryMap, reactEntryMap } = validate(programArguments);

	const {
		srcPrefix,
		deployPrefix,
		webappDirectoryList,
		commonLibraryDirectory
	} = global;
	global.startCompile = {};

	console.log('webpack compile start...');

	console.log('webapp js files to compile');
	console.log('react entry map:', reactEntryMap);
	console.log('preact entry map:', preactEntryMap);

	webappDirectoryList.forEach(async webappDirectoryPath => {
		const templateViewSrcPagePath = path.join(
			webappDirectoryPath,
			'views/src'
		);
		const tplKey = utils.normalizePath(templateViewSrcPagePath);
		global.startCompile[tplKey] = Date.now();
		const preactEntry = preactEntryMap[tplKey];
		const reactEntry = reactEntryMap[tplKey];
		const staticDirectory = path.join(webappDirectoryPath, 'static');

		if (programArguments.style) {
			await stylesCompiler(webappDirectoryPath);
		}

		const webappName = path.basename(webappDirectoryPath);
		const staticJSSrcDirectory = path.join(
			staticDirectory,
			srcPrefix,
			'js'
		);
		const staticJSDeployDirectory = path.join(
			staticDirectory,
			deployPrefix,
			'js'
		);

		await Promise.all([
			Object.keys(reactEntry)?.length
				? require('./webpack.compiler')({
						entry: reactEntry,
						webappDirectoryPath,
						staticDirectory,
						staticJSSrcDirectory,
						staticJSDeployDirectory,
						webappName,
						tplKey,
						preact: false
				  })
				: Promise.resolve(),
			Object.keys(preactEntry)?.length
				? require('./webpack.compiler')({
						entry: preactEntry,
						webappDirectoryPath,
						staticDirectory,
						staticJSSrcDirectory,
						staticJSDeployDirectory,
						webappName,
						tplKey,
						preact: true
				  })
				: Promise.resolve()
		]);
	});

	if (commonLibraryDirectory) {
		const entry = {
			'js/404': './404/404.js',
			'js/share/mobileShare': './share/mobileShare.js',
			'js/hhy/main': './hhy/main.js',
			'js/realNameVerify/main': './realNameVerify/main.js',
			'js/polyfill/main': './polyfill/main.js',
			'js/gray/main': './gray/main.js'
		};

		console.log('common-library js files to compile');
		console.log(entry);

		const staticDirectory = commonLibraryDirectory;
		const webappDirectoryPath = commonLibraryDirectory;
		const webappName = path.basename(webappDirectoryPath);
		const staticJSSrcDirectory = path.join(staticDirectory, srcPrefix);
		const staticJSDeployDirectory = path.join(
			staticDirectory,
			deployPrefix
		);
		const tplKey = utils.normalizePath(webappDirectoryPath);

		await require('./webpack.compiler')({
			entry,
			webappDirectoryPath,
			staticDirectory,
			staticJSSrcDirectory,
			staticJSDeployDirectory,
			webappName,
			tplKey
		});
	}

	if (!utils.hasArgument(process.argv, '--norefresh')) {
		const templateWatchFiles = [];

		webappDirectoryList.forEach(webappDirectoryPath => {
			const templateViewSrcPagePath = path.join(
				webappDirectoryPath,
				'views/src'
			);

			templateWatchFiles.push(
				path.join(templateViewSrcPagePath + '/**/*.html')
			);
			templateWatchFiles.push(
				path.join(templateViewSrcPagePath + '/**/*.njk')
			);
		});

		console.log('templateWatchFiles List: ');
		console.log(templateWatchFiles);
		utils.startWebSocketServer();
		chokidar
			.watch(templateWatchFiles)
			.on('change', utils.triggerRefresh)
			.on('unlink', utils.triggerRefresh);
	} else {
		console.log('status: norefresh');
	}
};
