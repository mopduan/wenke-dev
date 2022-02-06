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
		esbuild
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

	let webappDirectoryList = []; //所有的 webapp 工程
	if (!webappDirectory) {
		throw new PropertyRequiredError('webappDirectory');
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

	//如果是Nunjucks模板工程，模板目录与静态资源目录默认在传入的web工程路径下查找
	webappDirectoryList = webappDirectory.split(',');
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

		utils
			.getAllFilesByDir(
				templateViewSrcPagePath,
				utils.njkTemplateExtensionList.concat(
					utils.ssrTemplateExtensionList
				)
			)
			.forEach(tplPath => {
				console.log(tplPath);
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
				tplContent.replace(
					utils.getRegexpScriptElements(),
					function ($1, $2) {
						if (
							$2.toLowerCase().indexOf('release="false"') > -1 &&
							$2.toLowerCase().indexOf('bundle') === -1
						) {
							return $1;
						}

						$1.replace(
							utils.getRegexpScriptElementSrcAttrValue(),
							function ($2_1, $src) {
								if (
									$src &&
									global.localStaticResourcesPrefix.test($src)
								) {
									const jsPath = $src.replace(
										regexpStaticFilesPrefix,
										''
									);

									if ($src.includes('bundle')) {
										const extname = path.extname($src);
										const bundleName = `main${extname}`;

										let jsSrcPath = utils
											.normalizePath(
												path.join(
													staticDirectory,
													path.dirname(jsPath),
													bundleName
												)
											)
											.replace(
												global.deployPrefix,
												global.srcPrefix
											)
											.replace(staticJSSrcDirectory, '');

										const jsDeployPath = utils
											.normalizePath(
												path.dirname(jsSrcPath)
											)
											.replace(
												utils.normalizePath(
													staticJSSrcDirectory
												),
												''
											);

										let entryKey = path.join(
											jsDeployPath,
											'bundle'
										);

										if (entryKey.startsWith('/')) {
											entryKey = entryKey.replace(
												'/',
												''
											);
										}

										if (jsSrcPath.startsWith('/')) {
											jsSrcPath = jsSrcPath.replace(
												'/',
												'./'
											);
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
											(!global.reactPageList?.length &&
												preact)
										) {
											preactEntryMap[tplKey][entryKey] =
												jsSrcPath;
										} else {
											reactEntryMap[tplKey][entryKey] =
												jsSrcPath;
										}
									}
								}
							}
						);
					}
				);
			});
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
