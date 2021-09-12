'use strict';

const path = require('path');
const http = require('http');
const fs = require('fs');
const falafel = require('falafel');

/**
 *
 * @returns {string}
 */
function getDate() {
	const date = new Date();

	return (
		date.getFullYear().toString() +
		(date.getMonth() < 9
			? '0' + (date.getMonth() + 1)
			: date.getMonth() + 1) +
		(date.getDate() < 10 ? '0' + date.getDate() : date.getDate()) +
		'_' +
		(date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) +
		'_' +
		(date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()) +
		'_' +
		(date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds())
	);
}

exports.getDate = getDate;

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

exports.isInArray = isInArray;

/**
 *
 * @param content
 * @returns {*}
 */
function md5(content) {
	const crypto = require('crypto');

	//return crypto.createHash('md5').update(content, 'utf8').digest('hex');

	return crypto.createHash('sha256').update(content).digest('hex');
}

exports.md5 = md5;

/**
 *
 * @param reg
 * @returns {*}
 */
function escapeRegexp(reg) {
	let regCopy = reg;
	if (typeof regCopy === 'string') {
		regCopy = regCopy.replace(/[$|{|}|(|)|\\.]/gi, function ($0) {
			return '\\' + $0;
		});
	}

	return regCopy;
}

exports.escapeRegexp = escapeRegexp;

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

exports.normalizePath = normalizePath;

/**
 *
 * @param arr
 * @returns {Array}
 */
function arrUnique(arr) {
	const n = {},
		r = [];
	for (let i = 0; i < arr.length; i++) {
		if (!n[arr[i]]) {
			n[arr[i]] = true;
			r.push(arr[i]);
		}
	}
	return r;
}

exports.arrUnique = arrUnique;

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

exports.jsonArrayUnique = jsonArrayUnique;

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

exports.hasArgument = hasArgument;

function errorHandler(errorInfo) {
	throw new Error(errorInfo);
}

exports.errorHandler = errorHandler;

/**
 * 下载文件
 * @param url
 * @param localPath
 * @param successCallback
 * @param refreshCallback
 */
function downloadFile(url, localPath, successCallback, refreshCallback) {
	http.get(url, function (res) {
		let data = '';

		res.setEncoding('utf8');
		res.on('data', function (chunk) {
			data += chunk.toString();
		});

		res.on('end', function () {
			//检测CDN文件与本地文件是否内容完全一致
			const fileContent = fs.readFileSync(localPath).toString();
			if (fileContent === data) {
				successCallback();
			} else {
				console.log(
					'check: file ' + localPath + ' fail! begin refresh...'
				);
				refreshCallback();
			}
		});
	}).on('error', function () {
		throw new Error('downloadFile Error! URL: ' + url);
	});
}

exports.downloadFile = downloadFile;

/**
 * 获取本地调试下的静态资源前缀
 * @returns {RegExp}
 */
function getRegexpStaticFilesPrefix() {
	global.debugDomain.lastIndex = 0;
	return global.debugDomain;
}

exports.getRegexpStaticFilesPrefix = getRegexpStaticFilesPrefix;

/**
 * 获取script标签正则
 * @returns {RegExp}
 */
function getRegexpScriptElements() {
	return /<script([\s\S\w\W]*?)>{1}?[\s\S\w\W]*?(<\/script>){1}?/gi;
}

exports.getRegexpScriptElements = getRegexpScriptElements;

/**
 * 获取script标签src属性匹配正则
 * @returns {RegExp}
 */
function getRegexpScriptElementSrcAttrValue() {
	return /<script[\s\S\w\W]+?src="([\s\S\w\W]+?)"[\s\S\w\W]*?>[\s\S\w\W]*?<\/script>/gi;
}

exports.getRegexpScriptElementSrcAttrValue = getRegexpScriptElementSrcAttrValue;

/**
 * 获取vm中的$script的js引用地址
 * $script('/path/to/js') || $script(['/path/to/js1', '/path/to/js2', ...])
 * @returns {RegExp}
 */
function get$ScriptSrc() {
	return /\$script\(\[?(['"][^{)}]+['"])\]?.*\)/gi;
}

exports.get$ScriptSrc = get$ScriptSrc;

/**
 * 获取script标签中production版本js的地址
 * @returns {RegExp}
 */
function getRegexpScriptElementProdSrcAttrValue() {
	return /.*(\s+data-prod="([\s\S\w\W]+)")/;
}

exports.getRegexpScriptElementProdSrcAttrValue = getRegexpScriptElementProdSrcAttrValue;

/**
 * 获取script标签中babel="true"
 * @returns {RegExp}
 */
function getRegexpScriptElementBabelAttrValue() {
	return /.*(\s+babel="true").*/;
}

exports.getRegexpScriptElementBabelAttrValue = getRegexpScriptElementBabelAttrValue;

/**
 * 获取script标签中md5="false"
 * @returns {RegExp}
 */
function getRegexpScriptElementMD5AttrValue() {
	return /.*(\s+md5="false").*/;
}

exports.getRegexpScriptElementMD5AttrValue = getRegexpScriptElementMD5AttrValue;

/**
 * 获取link标签正则
 * @returns {RegExp}
 */
function getRegexpCSSLinkElements() {
	return /<link((?![>])[\s\S\w\W])+?rel="stylesheet"((?![>])[\s\S\w\W])*?>{1}?/gi;
}

exports.getRegexpCSSLinkElements = getRegexpCSSLinkElements;

/**
 * 获取link标签的href匹配正则
 * @returns {RegExp}
 */
function getRegexpCSSHrefValue() {
	return /<link([\s\S\w\W]+?)href="(.+?)"([\s\S\w\W]*?)>{1}?/gi;
}

exports.getRegexpCSSHrefValue = getRegexpCSSHrefValue;

/**
 * 获取img标签正则
 * @returns {RegExp}
 */
function getRegexpImgElements() {
	return /<img[\S\s\W\w]+?src=\{?["'](.+?)["']\}?[\S\s\W\w]+?/gi;
}

exports.getRegexpImgElements = getRegexpImgElements;

/**
 * 获取img标签srcset值正则
 * @returns {RegExp}
 */
function getRegexpImgSrcsetElements() {
	return /<img[\S\s\W\w]+?srcset="([\S\s]+?)"[\S\s\W\w]+?/gi;
}

exports.getRegexpImgSrcsetElements = getRegexpImgSrcsetElements;

/**
 * 获取img标签srcset图片url正则
 * @returns {RegExp}
 */
function getRegexpImgSrcsetUrl() {
	return /(\S+)?\s+\d+\w/i;
}

exports.getRegexpImgSrcsetUrl = getRegexpImgSrcsetUrl;

/**
 * 获取内联style属性里的backgroundImage匹配正则
 * @returns {RegExp}
 */
function getRegexpBackgroundImage() {
	//return /:[\s]?url\(['|"]??(\/static[\w\W]+?)['|"]??\)/ig;
	return /backgroundImage[\s]*:[\s]*'url\(['|"]??(\/static[\w\W]+?)['|"]??\)/gi;
}

exports.getRegexpBackgroundImage = getRegexpBackgroundImage;

/**
 * 截取文件MD5前N位，默认截取前7位
 * @param md5Str
 * @returns {string}
 */
function cutOutMD5(md5Str) {
	return md5Str.substr(0, global.md5Length || 7);
}

exports.cutOutMD5 = cutOutMD5;

/**
 * 递归创建文件夹
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

exports.mkdirRecursive = mkdirRecursive;

// function uploadSourceMapFile(sourcemapFilePath, cdnPath, cdnConfig, completeCallback) {
//     let request = require('request');

//     var formData = {
//         // Pass a simple key-value pair
//         path: cdnPath,
//         file: fs.createReadStream(sourcemapFilePath),
//         token: "9347089e-f30e-4fbc-a1f0-c45f83430f29"
//     };

//     request.post({
//         url: cdnConfig.sourceMapPost.url,
//         formData: formData
//     }, function optionalCallback(err, httpResponse, body) {
//         if (err) {
//             console.error('just warning info: upload sourcemap file failed.');
//         } else {
//             console.log('upload sourcemap file successful!');
//         }

//         if (typeof completeCallback === 'function') {
//             completeCallback();
//         }
//     });
// }

// exports.uploadSourceMapFile = uploadSourceMapFile;

// 遍历script中的属性节点，查找需要替换或者移除的属性
// 需要移除的属性：md5,compile,testonly
// 需要添加的属性：crossOrigin: anonymous
function walkThroughProperties(props) {
	let hasCrossOrigin = false;
	const testOnlyIdx = [];
	const md5Idx = [];
	const compileIdx = [];
	let src = '';
	for (let i = 0; i < props.length; i++) {
		const node = props[i];

		if (node.type === 'Property' && node.key && node.value) {
			// console.log(node);
			if (
				(node.key.type === 'Literal' &&
					node.key.value === 'crossOrigin') ||
				(node.key.type === 'Identifier' &&
					node.key.name === 'crossOrigin')
			) {
				hasCrossOrigin = true;
			}

			if (
				(node.key.type === 'Literal' &&
					node.key.value === 'testonly') ||
				(node.key.type === 'Identifier' && node.key.name === 'testonly')
			) {
				testOnlyIdx.push(i, node.key.start, node.value.end);
			}

			if (
				(node.key.type === 'Literal' && node.key.value === 'md5') ||
				(node.key.type === 'Identifier' && node.key.name === 'md5')
			) {
				md5Idx.push(i, node.key.start, node.value.end);
			}

			if (
				(node.key.type === 'Literal' && node.key.value === 'compile') ||
				(node.key.type === 'Identifier' && node.key.name === 'compile')
			) {
				compileIdx.push(i, node.key.start, node.value.end);
			}

			if (
				(node.key.type === 'Literal' && node.key.value === 'src') ||
				(node.key.type === 'Identifier' && node.key.name === 'src')
			) {
				src = node.source();
			}
		}
	}

	return {
		hasCrossOrigin,
		indices: [testOnlyIdx, md5Idx, compileIdx],
		src
	};
}

/**
 * 处理createElement.script的属性，例如移除testonly属性，添加crossOrigin:anonymous
 * @param {*} source
 */
function manipulateScriptAttribute(source, env, taskid, vid) {
	const _fakeSource = `const a = ${source}`;
	const replacedArray = [];

	// 需要添加赋值前缀，否则解析会报错
	const output = falafel(_fakeSource, function (node) {
		if (node.type === 'ObjectExpression') {
			const walkThrough = walkThroughProperties(node.properties);

			for (let i = 0; i < walkThrough.indices.length; i++) {
				const idx = walkThrough.indices[i];

				if (idx.length === 3) {
					const _propIdx = idx[0];
					let _substitute = '';

					if (
						walkThrough.src.indexOf('reportAjax/main.js') > -1 &&
						i === 0
					) {
						// reportAjax在测试环境时需要替换
						if (env === 'test' && taskid && vid) {
							_substitute = `"data-taskid": "${taskid}", "data-vid": "${vid}"${_propIdx === node.properties.length - 1
									? ''
									: ','
								}`;
						} else {
							_substitute = '';
						}
					}

					let _substr = _fakeSource.substring(idx[1], idx[2]); // 需要替换掉后面的逗号

					if (source[idx[2]] === ',') {
						_substr = _fakeSource.substring(idx[1], idx[2] + 1);
					}

					replacedArray.push({
						src: _substr, // 原代码
						sub: _substitute // 需要替换的代码
					});
				}
			}

			// 这样可以对单个properties进行update
			if (
				!walkThrough.hasCrossOrigin &&
				walkThrough.src.indexOf('cache.soso.com') > -1
			)
				node.properties[node.properties.length - 1].update(
					'"crossOrigin": "anonymous", ' +
					node.properties[node.properties.length - 1].source()
				);
		}

		let _source = node.source();
		for (let i = 0; i < replacedArray.length; i++) {
			_source = _source.replace(
				replacedArray[i].src,
				replacedArray[i].sub
			);
		}

		node.update(_source.replace('const a =', ''));
	});

	return output;
}

exports.manipulateScriptAttribute = manipulateScriptAttribute;

function manipulateScript(content, regexp, env, taskid, vid) {
	return content.replace(regexp, function (createElement, srcObjStr) {
		//const validStr = srcObjStr.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2": ').replace(/'/g, '"');

		// 补全对象中的
		const validStr = srcObjStr
			.replace(
				/(['"])?([a-zA-Z0-9_]+)(['"])?:/g,
				function ($key, $1, $2) {
					if ($2 !== 'http' && $2 !== 'https') {
						return `"${$2}": `;
					} else {
						return $key;
					}
				}
			)
			.replace(/'/g, '"');

		try {
			if (srcObjStr.indexOf('testonly') > -1) {
				if (env === 'test') {
					return createElement.replace(
						srcObjStr,
						manipulateScriptAttribute(srcObjStr, env, taskid, vid)
					);
				} else {
					return '';
				}
			} else {
				return createElement.replace(
					srcObjStr,
					manipulateScriptAttribute(srcObjStr, env, taskid, vid)
				);
			}
		} catch (e) {
			console.log(createElement, validStr, srcObjStr);

			throw e;
		}
	});
}

exports.manipulateScript = manipulateScript;
