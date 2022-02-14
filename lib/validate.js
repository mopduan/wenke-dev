const fs = require('fs');
const path = require('path');
const utils = require('../lib/utils');
const { ValidationError, PropertyRequiredError } = require('./customError');

const defaultLiveReloadPort = 8999;

module.exports = function (options) {
	const {
		webappDirectory,
		commonLibraryDirectory,
		preact,
		react,
		hmr,
		esbuild,
		smp,
		ba
	} = options;

	if (typeof preact === 'boolean' && typeof react === 'boolean') {
		throw new ValidationError('preact and react can not be both boolean');
	}

	if (typeof preact === 'string' && typeof react === 'string') {
		throw new ValidationError('preact and react can not be both string');
	}

	if (typeof preact === 'string') {
		global.preactPageList = preact.split(',');
	}

	if (typeof react === 'string') {
		global.reactPageList = react.split(',');
	}

	if (!preact) {
		global.onlyReact = true;
	}

	if (hmr) {
		global.hmr = true;
	}

	if (esbuild) {
		global.esbuild = true;
	}

	if (smp) {
		global.smp = true;
	}

	if (ba) {
		global.ba = true;
	}

	let webappDirectoryList = []; //所有的 webapp 工程
	if (!webappDirectory) {
		throw new PropertyRequiredError('webappDirectory');
	}

	if (typeof webappDirectory !== 'string') {
		throw new Error('The webapp directory path is empty!');
	}

	if (commonLibraryDirectory) {
		if (!fs.existsSync(commonLibraryDirectory)) {
			throw new ValidationError(
				"can't find the common-library directory: " +
					commonLibraryDirectory
			);
		}

		global.commonLibraryDirectory = commonLibraryDirectory;
	}

	//模板目录与静态资源目录默认在传入的web工程路径下查找
	webappDirectoryList = webappDirectory.split(',');

	if (webappDirectoryList.length > 2) {
		throw new Error(
			'The count of webapp directory must be less than or equal 2'
		);
	}

	if (webappDirectoryList.length === 2) {
		global.multiWebappDevServerPorts = [9981, 9982];
		global.multiWebappBaPorts = [7791, 7792];
	}

	webappDirectoryList.forEach(webappDirectoryPath => {
		if (!fs.existsSync(webappDirectoryPath)) {
			throw new ValidationError(
				"can't find the webapp directory: " + webappDirectoryPath
			);
		}

		const templateViewSrcPagePath = path.join(
			webappDirectoryPath,
			'views/src'
		);

		if (!fs.existsSync(templateViewSrcPagePath)) {
			throw new ValidationError(
				"can't find the webapp template directory: " +
					templateViewSrcPagePath
			);
		}

		const staticFilesDirectory = path.join(webappDirectoryPath, 'static');
		if (!fs.existsSync(staticFilesDirectory)) {
			throw new ValidationError(
				"can't find the static files directory " + staticFilesDirectory
			);
		}

		if (!fs.existsSync(path.join(staticFilesDirectory, 'src'))) {
			throw new ValidationError(
				"can't find 'src' directory in staticDirectory " +
					staticFilesDirectory
			);
		}
	});

	global.webappDirectoryList = webappDirectoryList;

	const preactEntryMap = {}; //待编译的js文件列表，按webapp工程进行聚合 按框架区分
	const reactEntryMap = {};
	const ssrEntryMap = {};
	webappDirectoryList.forEach(function (webappDirectoryPath) {
		const templateViewSrcPagePath = path.join(
			webappDirectoryPath,
			'views/src'
		);
		const regexpStaticFilesPrefix = utils.getRegexpStaticFilesPrefix();
		const staticDirectory = path.join(webappDirectoryPath, 'static');
		const staticJSSrcDirectory = path.join(
			staticDirectory,
			global.srcPrefix,
			'js'
		);
		const tplKey = utils.normalizePath(templateViewSrcPagePath);
		preactEntryMap[tplKey] = {};
		reactEntryMap[tplKey] = {};
		ssrEntryMap[tplKey] = {};

		const fileList = utils.getAllFilesByDir(
			templateViewSrcPagePath,
			utils.njkTemplateExtensionList.concat(
				utils.ssrTemplateExtensionList
			)
		);

		for (const tplPath of fileList) {
			if (
				utils.ssrTemplateExtensionList.includes(
					path.extname(tplPath.toLowerCase())
				)
			) {
				const tplPathWithoutPrefix = tplPath.replace(
					templateViewSrcPagePath,
					''
				);
				const ssrEntryKey =
					'deploy' +
					path.join(
						path.dirname(tplPathWithoutPrefix),
						path.basename(
							tplPathWithoutPrefix,
							path.extname(tplPathWithoutPrefix)
						)
					);
				ssrEntryMap[tplKey][ssrEntryKey] =
					'./src' + tplPathWithoutPrefix;
			}

			const tplContent = fs.readFileSync(tplPath).toString();
			const scriptElementMatches = [
				...tplContent.matchAll(
					utils.getRegexpScriptElementSrcAttrValue()
				)
			];

			for (const scriptElementMatchesItem of scriptElementMatches) {
				const [scriptElement, scriptElementSrc] =
					scriptElementMatchesItem;
				const scriptElementLowerCase = scriptElement.toLowerCase();
				if (
					scriptElementLowerCase.indexOf('release="false"') > -1 &&
					scriptElementLowerCase.indexOf('bundle') === -1
				) {
					continue;
				}

				if (
					!global.localStaticResourcesPrefix.test(scriptElementSrc) ||
					!scriptElementSrc.includes('bundle')
				) {
					continue;
				}

				const jsPath = scriptElementSrc.replace(
					regexpStaticFilesPrefix,
					''
				);
				const extname = path.extname(scriptElementSrc);
				const bundleName = `main${extname}`;

				let jsSrcPath = utils
					.normalizePath(
						path.join(
							staticDirectory,
							path.dirname(jsPath),
							bundleName
						)
					)
					.replace(global.deployPrefix, global.srcPrefix)
					.replace(staticJSSrcDirectory, '');

				const jsDeployPath = utils
					.normalizePath(path.dirname(jsSrcPath))
					.replace(utils.normalizePath(staticJSSrcDirectory), '');

				let entryKey = path.join(jsDeployPath, 'bundle');

				if (entryKey.startsWith('/')) {
					entryKey = entryKey.replace('/', '');
				}

				if (jsSrcPath.startsWith('/')) {
					jsSrcPath = jsSrcPath.replace('/', './');
				}

				if (
					(global.preactPageList?.length &&
						utils.isKeyIncludesArrayItem(
							entryKey,
							global.preactPageList
						)) ||
					(global.reactPageList?.length &&
						!utils.isKeyIncludesArrayItem(
							entryKey,
							global.reactPageList
						)) ||
					(!global.reactPageList?.length && preact)
				) {
					preactEntryMap[tplKey][entryKey] = jsSrcPath;
				} else {
					reactEntryMap[tplKey][entryKey] = jsSrcPath;
				}
			}
		}
	});

	global.livereloadPort =
		typeof options.livereloadPort !== 'undefined' &&
		utils.isInt(options.livereloadPort)
			? parseInt(options.livereloadPort)
			: defaultLiveReloadPort;

	return {
		preactEntryMap,
		reactEntryMap,
		ssrEntryMap
	};
};
