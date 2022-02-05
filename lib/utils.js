const fs = require('fs');
const path = require('path');
const http = require('http');
const got = require('got');
const packageConfig = require('../package.json');
const semver = require('semver');

/**
 *
 * @param jsonArray
 * @returns {Array}
 */
function jsonArrayUnique(jsonArray) {
	const n = {},
		r = [];
	for (let i = 0; i < jsonArray.length; i++) {
		if (!n[jsonArray[i].path]) {
			n[jsonArray[i].path] = true;
			r.push(jsonArray[i]);
		}
	}
	return r;
}

/**
 *
 * @param errorInfo
 */
function errorHandler(errorInfo) {
	console.log(errorInfo);
	process.exit();
}

/**
 * 判断是否为整数
 * @param x
 * @returns {boolean}
 */
function isInt(x) {
	const y = parseInt(x, 10);
	return !isNaN(y) && x == y && x.toString() === y.toString();
}

/**
 *
 * @param arr
 * @param search
 * @returns {boolean}
 */
function isInArray(arr, search) {
	if (typeof arr === 'object' && typeof arr.length === 'number') {
		for (let i = 0; i < arr.length; i++) {
			if (arr[i] === search) {
				return true;
			}
		}
	}

	return false;
}

/**
 *
 * @param path
 * @returns {string}
 */
function normalizePath(path) {
	if (typeof path === 'string') {
		return path.replace(/[\\|\\\\|//|////]/gi, '/');
	}

	return path;
}

/**
 * 获取本地调试下的静态资源前缀
 * @returns {RegExp}
 */
function getRegexpStaticFilesPrefix() {
	global.localStaticResourcesPrefix.lastIndex = 0;
	return global.localStaticResourcesPrefix;
}

/**
 *
 * @param dir
 * @param extension
 * @returns {*}
 */
function getAllFilesByDir(dir, extension) {
	let list = [];
	const fileList = fs.readdirSync(dir);

	for (let i = fileList.length - 1; i >= 0; i--) {
		const filePath = path.join(dir, fileList[i]);

		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			list = list.concat(getAllFilesByDir(filePath, extension));
		} else {
			if (isInArray(extension, path.extname(filePath))) {
				list.push(normalizePath(filePath));
			}
		}
	}

	return list;
}

/**
 *
 * @param dir
 */
function mkdirRecursive(dir) {
	if (fs.existsSync(dir)) {
		return;
	}

	if (!fs.existsSync(path.dirname(dir))) {
		mkdirRecursive(path.dirname(dir));
	}

	fs.mkdirSync(dir);
}

/**
 *
 * @param argv
 * @param search
 * @returns {boolean}
 */
function hasArgument(argv, search) {
	let ret = false;

	for (let i = 0; i < argv.length; i++) {
		if (argv[i] === search) {
			ret = true;
			break;
		}
	}
	return ret;
}

/**
 * 启动WebSocket服务, 用于监听文件修改信号
 */
function startWebSocketServer() {
	const app = http.createServer();
	const io = require('socket.io')(app, {
		cors: {
			origin: '*',
			methods: ['GET', 'POST'],
			allowedHeaders: []
		}
	});

	app.listen(global.livereloadPort);

	io.on('connection', function (socket) {
		global.socket = socket;
	});

	console.log('WebSocketServer running... port: ' + global.livereloadPort);
}

/**
 * 获取script标签正则
 * @returns {RegExp}
 */
function getRegexpScriptElements() {
	return /<script([\s\S\w\W]*?)>{1}?[\s\S\w\W]*?(<\/script>){1}?/gi;
}

/**
 * 获取script标签src属性匹配正则
 * @returns {RegExp}
 */
function getRegexpScriptElementSrcAttrValue() {
	return /<script[\s\S\w\W]+?src="([\s\S\w\W]+?)"[\s\S\w\W]*?>[\s\S\w\W]*?<\/script>/gi;
}

/**
 * 获取link标签正则
 * @returns {RegExp}
 */
function getRegexpCSSLinkElements() {
	return /<link((?![>])[\s\S\w\W])+?rel="stylesheet"((?![>])[\s\S\w\W])*?>{1}?/gi;
}

/**
 * 获取link标签的href匹配正则
 * @returns {RegExp}
 */
function getRegexpCSSHrefValue() {
	return /<link([\s\S\w\W]+?)href="(.+?)"([\s\S\w\W]*?)>{1}?/gi;
}

/**
 * 获取img标签正则
 * @returns {RegExp}
 */
function getRegexpImgElements() {
	return /<img[\S\s\W\w]+?src="(.+?)"[\S\s\W\w]+?/gi;
}

/**
 * 获取内联style属性里的backgroundImage匹配正则
 * @returns {RegExp}
 */
function getRegexpBackgroundImage() {
	return /:[\s]?url\(['|"]??(\$!?(\{)?.+?\(\)(})?[\w\W]+?)['|"]??\)/gi;
}

/**
 * 生成唯一值
 */
function uniqueVal() {
	return `webpackJsonp${Date.now()}${Math.random()}`.replace('.', '');
}

async function verifyVersion() {
	const check1 = nodeVersionCheck();
	const check2 = await wenkeDevVersionCheck();

	return check1 && check2;
}

//检测本地版本与最新版本是否一致
async function wenkeDevVersionCheck() {
	let latestVersion;
	try {
		const jsonRes = await got('https://registry.npmjs.org/wenke-dev', {
			timeout: {
				request: 10000
			}
		}).json();
		latestVersion = jsonRes['dist-tags'].latest;
	} catch {
		console.log(
			"latest version of 'https://registry.npmjs.org/wenke-dev' fetch failed, please check your network or try again"
		);
		return false;
	}

	const localVersion = packageConfig.version;
	if (semver.lt(localVersion, latestVersion)) {
		console.log(`
        **************************************************************
        *                                                            *
        *   .=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-.       *
        *    |                     ______                     |      *
        *    |                  .-"      "-.                  |      *
        *    |                 /            \\                 |      *
        *    |     _          |              |          _     |      *
        *    |    ( \\         |,  .-.  .-.  ,|         / )    |      *
        *    |     > "=._     | )(__/  \\__)( |     _.=" <     |      *
        *    |    (_/"=._"=._ |/     /\\     \\| _.="_.="\\_)    |      *
        *    |           "=._"(_     ^^     _)"_.="           |      *
        *    |               "=\\__|IIIIII|__/="               |      *
        *    |              _.="| \\IIIIII/ |"=._              |      *
        *    |    _     _.="_.="\\          /"=._"=._     _    |      *
        *    |   ( \\_.="_.="     \`--------\`     "=._"=._/ )   |      *
        *    |    > _.="                            "=._ <    |      *
        *    |   (_/                                    \\_)   |      *
        *    |                                                |      *
        *    '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-='      *
        *                                                            *
        *      wenke-dev工具当前版本（${localVersion}）不是最新版本，          *
        *             请升级到最新版本(${latestVersion})。                      *
        **************************************************************
        `);
		return false;
	}

	return true;
}

// 增加Node版本检查
function nodeVersionCheck() {
	const nodeVersion = process.versions.node;
	const rightVersionReg = /16\.\d+\.\d+/;

	if (!rightVersionReg.test(nodeVersion)) {
		console.error(
			'[ERROR] Node.js的版本必须是16.*，当前运行版本：',
			nodeVersion
		);
		return false;
	} else {
		console.log('[INFO] 当前Node.js运行版本：', nodeVersion);
	}

	return true;
}

function triggerRefresh() {
	if (global.socket) {
		global.socket.emit('refresh', {
			refresh: 1
		});
		console.log('some files changed: trigger refresh...');
	} else {
		console.log('socket not connected');
	}
}

function isKeyIncludesArrayItem(key, array = []) {
	if (!key?.length || !array.length) {
		return;
	}

	for (let i = 0; i < array.length; i++) {
		const item = array[i];

		if (key.indexOf(item) > -1) {
			return true;
		}
	}

	return;
}

const njkTemplateExtensionList = ['.njk'];
const ssrTemplateExtensionList = ['.js', '.jsx', '.ts', '.tsx'];

module.exports = {
	jsonArrayUnique,
	errorHandler,
	isInt,
	isInArray,
	normalizePath,
	getRegexpStaticFilesPrefix,
	getAllFilesByDir,
	mkdirRecursive,
	hasArgument,
	startWebSocketServer,
	getRegexpScriptElements,
	getRegexpScriptElementSrcAttrValue,
	getRegexpCSSLinkElements,
	getRegexpCSSHrefValue,
	getRegexpImgElements,
	getRegexpBackgroundImage,
	uniqueVal,
	verifyVersion,
	triggerRefresh,
	isKeyIncludesArrayItem,
	njkTemplateExtensionList,
	ssrTemplateExtensionList
};
