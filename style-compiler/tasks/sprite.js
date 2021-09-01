const path = require('path');
const fs = require('fs');
const file = require('../lib/file');
const retinaResizer = require('../lib/retina-resizer');
const spriteBundler = require('../lib/sprite-bundler');
const sprite2scss = require('../lib/sprites2scss');
const chokidar = require('chokidar');
const chalk = require('chalk');
const del = require('del');
const outputLog = require('../lib/logger');
const utils = require('../../lib/utils');

/**
 * 打包雪碧图
 * @param {null|string} filePath
 * @returns {Promise<void>}
 */
module.exports = async function buildSprite(constPaths) {
	const { spriteSrcPath } = constPaths;
	try {
		fs.accessSync(
			spriteSrcPath,
			fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK
		);
	} catch (e) {
		return Promise.resolve();
	}

	const _spriteDirs = fs.readdirSync(spriteSrcPath);
	for (let i = 0; i < _spriteDirs.length; i++) {
		const childPath = _spriteDirs[i];

		const _path = path.join(spriteSrcPath, childPath);

		if (fs.statSync(_path).isDirectory()) {
			console.log(_path);
			await spritesBuilder(_path, childPath, constPaths);
		} else if (/\.(jpg|jpg|gif|jpeg)$/.test(path.extname(childPath))) {
			throw new Error(
				`img direct in spritePath has not been support yet, please check spritePath:${_spritePath}`
			);
		}
	}

	let timerSpriteBuild = null;
	let initWatchSprite = true;
	chokidar
		.watch(spriteSrcPath)
		.on('all', async function (event, changePath) {
			if (event === 'addDir') return;

			if (timerSpriteBuild) clearTimeout(timerSpriteBuild); // 避免首次watch 重复调用
			timerSpriteBuild = setTimeout(rebuildSprite, 500);

			async function rebuildSprite() {
				if (initWatchSprite) {
					initWatchSprite = false;
					return;
				}
				try {
					console.log('preparing rebuild sprite:', event, changePath);
					// 只需要对该文件所属的sprite图进行处理
					const start = Date.now();
					const spritePath = path.dirname(changePath);
					const spriteSubDir = spritePath
						.substring(spritePath.lastIndexOf('/'))
						.replace('/', '');
					await spritesBuilder(spritePath, spriteSubDir, constPaths);
					outputLog(`rebuild success,take ${Date.now() - start}ms`);

					utils.triggerRefresh();
				} catch (error) {
					console.log(chalk.bold.red(error.message));
					throw error;
				}
			}
		})
		.on('error', function (error) {
			console.log(`file watcher encounter ${error}`);
		});
};

async function spritesBuilder(_spritePath, childPath, constPaths) {
	const {
		config: { stylesOption = {} },
		spriteTempPath,
		spriteDistPath,
		spriteScssPath,
		uedTaskDir
	} = constPaths;

	const isRetina = stylesOption.useRetina;
	const divideBy2 = stylesOption.divideBy2;
	const isRem = stylesOption.rem;

	const cssTemplate = sprite2scss({
		rem: isRem,
		retina: isRetina,
		divideBy2,
		dirPrefix: spriteScssPath
	});

	file.mkdirRecursive(spriteDistPath);
	file.mkdirRecursive(spriteScssPath);
	const _imgSrc = `${_spritePath}/*.{png,jpg,gif}`;

	let spritesmithConfig = {
		padding: 2,
		imgSrc: _imgSrc,
		imgName: `dist/images/sprite/sprite_${childPath}.png`,
		cssName: `src/css/sprite/_sprite_${childPath}.scss`,
		// Optional path to use in CSS referring to image location
		imgPath: `/images/sprite/sprite_${childPath}.png`,
		cssTemplate: cssTemplate,
		dest: uedTaskDir
	};

	if (isRetina) {
		// 将globPath中的图作为2倍图，压缩生成1倍图 分别以 @1.png @2.png 生成至与src同级下的  ./.tempsprite/resizer/目录中
		await retinaResizer(_spritePath, childPath, spriteTempPath);

		spritesmithConfig = {
			...spritesmithConfig,
			imgSrc: `${uedTaskDir}/.tempsprite/resizer/${childPath}/*.{png,jpg,gif}`,
			retinaImgName: `dist/images/sprite/sprite_${childPath}@2x.png`,
			retinaSrcFilter: `${uedTaskDir}/.tempsprite/resizer/**/*@2x.png`,
			retinaImgPath: `/images/sprite/sprite_${childPath}@2x.png`,
			padding: 8
		};
	}

	await spriteBundler(spritesmithConfig);
	del.sync([path.join(spriteTempPath, '**')], {
		force: true
	});
}
