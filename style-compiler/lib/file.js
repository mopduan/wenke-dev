//'use strict';

const fs = require('fs');
const path = require('path');
const utils = require('./utils');

/**
 *
 * @param dir
 * @param list
 * @param extension
 * @returns {*}
 */
function getAllFilesByDir(dir, list = [], extension) {
	if (fs.existsSync(dir)) {
		const fileList = fs.readdirSync(dir);

		for (let i = fileList.length - 1; i >= 0; i--) {
			const filePath = path.join(dir, fileList[i]);

			const stat = fs.statSync(filePath);

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

function getAllFilesByDirs(dirs, list = [], extension) {
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

	const fileList = fs.readdirSync(source);

	for (let i = fileList.length - 1; i >= 0; i--) {
		const fileName = path.basename(fileList[i]);
		const targetPath = path.join(target, fileName);

		const stat = fs.statSync(path.join(source, fileName));

		if (stat.isDirectory()) {
			copyDir(path.join(source, fileName), targetPath);
		} else {
			const readable = fs.createReadStream(path.join(source, fileName));

			// 创建写入流
			const writable = fs.createWriteStream(targetPath);

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
