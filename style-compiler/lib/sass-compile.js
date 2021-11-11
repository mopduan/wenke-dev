const fs = require('fs');
const path = require('path');
const sass = require('node-sass');
const file = require('./file');
const postcss = require('./postcss');

function sassAlias(sourceFile, uedTaskDir) {
	const content = fs
		.readFileSync(sourceFile, { encoding: 'utf-8' })
		.toString();

	return content.replace('@ued/', uedTaskDir + '/');
}

/**
 * 编译scss文件
 * @param dir
 * @param config
 * @returns {Promise<any>}
 */
module.exports = function ({ sourceFile, config, dev = false, uedTaskDir }) {
	const configCopy = config ? config : { stylesOption: {} };

	const { divideBy2, rem, noHash } = configCopy.stylesOption;

	const { spriteCssLocation, spriteDistLocation, imgDistLocation } =
		configCopy;

	if (!spriteCssLocation) {
		throw new Error('sass-compile function need spriteCssLocation config');
	}

	if (!spriteDistLocation) {
		throw new Error('sass-compile function need spriteDistLocation config');
	}

	return new Promise((resolve, reject) => {
		sass.render(
			{
				file: sourceFile,
				includePaths: [
					path.join(__dirname, 'common-scss'),
					spriteCssLocation
				],
				outputStyle: dev ? 'expanded' : 'compress',
				importer: function (url, prev) {
					// hack 公共 template
					if (url.indexOf('template') > -1) {
						const dir = path.dirname(prev);
						const realPath =
							path
								.resolve(dir, url.replace('../', ''))
								.replace('template/', 'template/_') + '.scss';

						const content = sassAlias(realPath, uedTaskDir);
						return {
							file: url,
							contents: content
						};
					} else {
						return { file: url };
					}
				}
			},
			async (err, result) => {
				if (err) {
					console.log(err);
					console.log(`${err.file} error:  ${err.message}`);

					reject(err);
				} else {
					const _outputPath = sourceFile
						.replace('src/css', 'dist/css')
						.replace(/\.scss$/, '.css');
					file.mkdirRecursive(path.dirname(_outputPath));
					fs.writeFileSync(_outputPath, result.css.toString());

					await postcss(_outputPath, {
						divideBy2,
						rem,
						noHash,
						spriteDistLocation,
						imgDistLocation
					});

					resolve();
				}
			}
		);
	});
};
