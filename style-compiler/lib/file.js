//'use strict';

var fs = require('fs');
var path = require('path');
var utils = require('./utils');

/**
 *
 * @param dir
 * @param list
 * @param extension
 * @returns {*}
 */
function getAllFilesByDir(dir, list, extension) {
	if (!(list instanceof Array)) {
		list = [];
	}

	if (fs.existsSync(dir)) {
		var fileList = fs.readdirSync(dir);

		for (var i = fileList.length - 1; i >= 0; i--) {
			var filePath = path.join(dir, fileList[i]);

			var stat = fs.statSync(filePath);

			if (stat.isDirectory()) {
				getAllFilesByDir(filePath, list, extension);
			} else {
				if (utils.isInArray(extension, path.extname(filePath))) {
					list.push(utils.normalizePath(filePath));
				}
			}
		}
	}

	return list;
}

function getAllFilesByDirs(dirs, list, extension) {
	if (!(list instanceof Array)) list = [];

	for (let i = 0; i < dirs.length; i++) {
		getAllFilesByDir(dirs[i], list, extension);
	}

	return list;
}

/**
 *
 * @param source
 * @param target
 */
function copyDir(source, target) {
	if (!fs.existsSync(target)) {
		fs.mkdirSync(target);
	}

	var fileList = fs.readdirSync(source);

	for (var i = fileList.length - 1; i >= 0; i--) {
		var fileName = path.basename(fileList[i]);
		var targetPath = path.join(target, fileName);

		var stat = fs.statSync(path.join(source, fileName));

		if (stat.isDirectory()) {
			copyDir(path.join(source, fileName), targetPath);
		} else {
			var readable = fs.createReadStream(path.join(source, fileName));

			// 创建写入流
			var writable = fs.createWriteStream(targetPath);

			// 通过管道来传输流
			readable.pipe(writable);
		}
	}
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

exports.getAllFilesByDir = getAllFilesByDir;

exports.copyDir = copyDir;

exports.mkdirRecursive = mkdirRecursive;

exports.getAllFilesByDirs = getAllFilesByDirs;
