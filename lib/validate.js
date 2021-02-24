const fs = require('fs');
const path = require('path');
const utils = require('../lib/utils');

module.exports = function (options) {
	let { staticFilesDirectory, webappDirectory } = options;
	let webappDirectoryList = []; //所有的 webapp 工程
	let jsCompileList = []; //待编译的 js 文件集合
	let cssCompileList = []; //模板中引用的所有 css 文件集合

	if (staticFilesDirectory && typeof staticFilesDirectory === 'string') {
		if (!fs.existsSync(staticFilesDirectory)) {
			throw new Error(
				"can't find the static files directory ",
				staticFilesDirectory
			);
		}
	} else {
		throw new Error(
			"can't find the arugment -s, this argument is webapp static file directory!"
		);
	}

	global.staticDirectory = utils.normalizePath(staticFilesDirectory);

	if (!fs.existsSync(path.join(global.staticDirectory, 'src'))) {
		throw new Error("can't find 'src' directory in staticDirectory ");
	}

	if (webappDirectory && typeof webappDirectory === 'string') {
		webappDirectoryList = webappDirectory.split(',');
		global.webappDirectoryList = webappDirectoryList;
		webappDirectoryList.forEach(function (webappDirectoryPath) {
			if (!fs.existsSync(webappDirectoryPath)) {
				throw new Error(
					"can't find the webapp directory: " + webappDirectoryPath
				);
			}
		});
	} else {
		throw new Error(
			"can't find the arugment -w, this argument is webapp directory!"
		);
	}

	let templateFileList = [];

	webappDirectoryList.forEach(function (item) {
		//如果是node 模板工程，模板默认在传入的web工程路径下查找
		const templateViewSrcPagePath = options.np
			? path.join(item, 'views/src')
			: path.join(item, '/src/main/webapp/WEB-INF/view/src/');

		if (!fs.existsSync(templateViewSrcPagePath)) {
			throw new Error(
				"can't find the webapp velocity template directory: " +
				templateViewSrcPagePath
			);
		}
		templateFileList = templateFileList.concat(
			utils.getAllFilesByDir(templateViewSrcPagePath, [
				'.vm',
				'.html',
				'.tpl',
				'.njk'
			])
		);
	});

	const defaultLiveReloadPort = 8999;

	global.livereloadPort =
		typeof options.livereloadPort !== 'undefined' &&
			utils.isInt(options.livereloadPort)
			? parseInt(options.livereloadPort)
			: defaultLiveReloadPort;

	const regexpStaticFilesPrefix = utils.getRegexpStaticFilesPrefix();

	const cssCacheList = {};
	templateFileList.forEach(function (tplPath) {
		const tplContent = fs.readFileSync(tplPath).toString();

		tplContent.replace(utils.getRegexpCSSLinkElements(), function ($link) {
			$link.replace(
				utils.getRegexpCSSHrefValue(),
				function ($cssLink, $someSplitStr, $href) {
					const cssPath = $href.replace(regexpStaticFilesPrefix, '');
					if (!cssCacheList[cssPath]) {
						if ($href && !($href.indexOf('http') === 0)) {
							cssCompileList.push(
								path.join(global.staticDirectory, cssPath)
							);
							cssCacheList[cssPath] = true;
						}
					}

					return $cssLink;
				}
			);

			return $link;
		});
	});

	global.cssCompileList = cssCompileList;

	console.log(cssCompileList);

	const jsCacheList = {};
	templateFileList.forEach(function (tplPath) {
		const tplContent = fs.readFileSync(tplPath).toString();
		tplContent.replace(utils.getRegexpScriptElements(), function ($1, $2) {
			if (
				$2.indexOf('type="text/html"') > -1 ||
				$2.indexOf('x-template') > -1
			) {
				return $1;
			}

			if (
				$2.toLowerCase().indexOf('release="false"') > -1 &&
				$2.toLowerCase().indexOf('bundle') === -1
			) {
				return $1;
			}

			$1.replace(
				utils.getRegexpScriptElementSrcAttrValue(),
				function ($2_1, $src) {
					if ($src && global.localStaticResourcesPrefix.test($src)) {
						const jsPath = $src.replace(
							regexpStaticFilesPrefix,
							''
						);

						if (!jsCacheList[jsPath]) {
							if ($src.includes('bundle')) {
								const extname = path.extname($src);
								const bundleName = `main${extname}`;

								const jsSrcPath = utils
									.normalizePath(
										path.join(
											global.staticDirectory,
											path.dirname(jsPath),
											bundleName
										)
									)
									.replace(
										global.deployPrefix,
										global.srcPrefix
									);

								jsCompileList.push({
									path: jsSrcPath
								});

								jsCacheList[jsPath] = true;
							}
						}
					}
				}
			);
		});
	});

	jsCompileList = utils.jsonArrayUnique(jsCompileList);

	console.log('jsCompileList：');
	console.log(jsCompileList);

	return {
		jsCompileList
	};
};
