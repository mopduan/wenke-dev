const path = require('path');
const fs = require('fs');
const webfontsGenerator = require('shequfe-webfonts-generator');
const chalk = require('chalk');
const chokidar = require('chokidar');
const unicodeRE = /^u([A-Z0-9]{4})-/;
const outputLog = require('../lib/logger');

function getSvgs(iconPath) {
	return fs.readdirSync(iconPath).filter(file => /\.svg$/i.test(file));
}

function renameSvgs(iconPath) {
	getSvgs(iconPath).forEach(function (svg) {
		if (unicodeRE.test(svg)) {
			const newPath = path.join(iconPath, svg.replace(unicodeRE, ''));
			fs.renameSync(path.join(iconPath, svg), newPath);
		} else {
			if (svg.includes('-')) {
				throw new Error(`svg fileName can't include -`);
			}
		}
	});
	return true;
}

async function bundleIconFont(constPaths) {
	const { iconPath, iconfontDistPath, uedTaskDir, scssLocation } = constPaths;

	renameSvgs(iconPath);

	console.log('iconPath', iconPath);
	return new Promise((resolve, reject) => {
		const fontCSSDest = path.join(
			uedTaskDir,
			'src/css/common/iconfont.css'
		);
		const fontCodeReg = /\.icon-(.+?):before\s*{\s*content\s*:\s*"\\(\w+)/g;
		const generateFileList = getSvgs(iconPath).map(fileName =>
			path.join(iconPath, fileName)
		);
		webfontsGenerator(
			{
				files: generateFileList,
				dest: iconfontDistPath,
				css: true, //Whether to generate CSS file.
				cssDest: fontCSSDest,
				formatOptions: {
					svg: {
						normalize: true,
						fontHeight: 1001
					}
				}
			},
			function (error) {
				if (error) {
					console.log('Fail!', error);
					reject(error);
				} else {
					if (fs.existsSync(fontCSSDest)) {
						// 生成对应icons对象
						const ICON_DATA_STR = '$__iconfont__data';
						const ICON_FONT_FUNC = path.resolve(
							__dirname,
							'../lib/common-scss/_iconfont.scss'
						);
						const icons = {};
						fs.readFileSync(fontCSSDest, {
							encoding: 'utf-8'
						}).replace(fontCodeReg, (match, $1, $2) => {
							icons[$1] = `\\${$2}`;
						});

						const content = [
							`${ICON_DATA_STR}: ` +
								JSON.stringify(icons, null, '\t')
									.replace(/\{/g, '(')
									.replace(/\}/g, ')')
									.replace(/\\\\/g, '\\') +
								';',
							fs
								.readFileSync(ICON_FONT_FUNC, {
									encoding: 'utf-8'
								})
								.toString()
								.replace(/\r\n/gi, '\n')
						].join('\n\n');
						console.log('scssLocation', scssLocation);

						fs.writeFileSync(
							path.join(scssLocation, '/_iconfont.scss'),
							content
						);
						console.log('iconfont generator done!');
						resolve();
					}
				}
			}
		);
	});
}

module.exports = async constPaths => {
	const { iconPath } = constPaths;
	try {
		fs.accessSync(
			iconPath,
			fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK
		);
	} catch (e) {
		return Promise.resolve();
	}
	await bundleIconFont(constPaths);

	let timer = null;
	let initWatch = true;
	chokidar.watch(iconPath).on('all', async (event, changePath) => {
		if (event === 'addDir') return;

		if (timer) clearTimeout(timer);
		timer = setTimeout(rebuildIconFont, 500);

		async function rebuildIconFont() {
			if (initWatch) {
				initWatch = false;
				return;
			}
			console.log(`preparing rebuild iconfont:${event} ${changePath}`);
			const start = Date.now();
			await buildIconFont(constPaths);
			outputLog(`rebuild success,take ${Date.now() - start}ms`);
		}
	});
};
