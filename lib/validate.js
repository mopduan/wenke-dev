const fs = require('fs');
const path = require('path');
const utils = require('../lib/utils');
const { ValidationError, PropertyRequiredError } = require('./customError');

const defaultLiveReloadPort = 8999;

module.exports = function (options) {
	let { staticFilesDirectory, webappDirectory } = options;

	let webappDirectoryList = []; //所有的 webapp 工程
	let jsCompileList = []; //待编译的 js 文件集合

	if (!staticFilesDirectory) {
		throw new PropertyRequiredError('staticFilesDirectory');
	}

	if (!webappDirectory) {
		throw new PropertyRequiredError('webappDirectory');
	}

	if (!fs.existsSync(staticFilesDirectory)) {
		throw new ValidationError(
			"can't find the static files directory ",
			staticFilesDirectory
		);
	}

	if (!fs.existsSync(path.join(staticFilesDirectory, 'src'))) {
		throw new ValidationError(
			"can't find 'src' directory in staticDirectory "
		);
	}

	webappDirectoryList = webappDirectory.split(',');
	webappDirectoryList.forEach(webappDirectoryPath => {
		if (!fs.existsSync(webappDirectoryPath)) {
			throw new ValidationError(
				"can't find the webapp directory: " + webappDirectoryPath
			);
		}
	});

	global.staticDirectory = staticFilesDirectory;
	global.webappDirectoryList = webappDirectoryList;

	let templateFileList = [];

	webappDirectoryList.forEach(function (item) {
		//如果是node 模板工程，模板默认在传入的web工程路径下查找
		const templateViewSrcPagePath = options.np
			? path.join(item, 'views/src')
			: path.join(item, '/src/main/webapp/WEB-INF/view/src/');

		if (!fs.existsSync(templateViewSrcPagePath)) {
			throw new ValidationError(
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

	global.livereloadPort =
		typeof options.livereloadPort !== 'undefined' &&
			utils.isInt(options.livereloadPort)
			? parseInt(options.livereloadPort)
			: defaultLiveReloadPort;

	const jsCacheList = {};
	const regexpStaticFilesPrefix = utils.getRegexpStaticFilesPrefix();

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

	console.log('js files to complie：');
	console.log(jsCompileList.map(item => item.path));

	return {
		jsCompileList
	};
};
