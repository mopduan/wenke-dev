const fs = require('fs');
const path = require('path');
const sass = require('sass');
const file = require('./file');
const postcss = require('./postcss');

/**
 * 编译scss文件
 * @param dir
 * @param config
 * @returns {Promise<any>}
 */

module.exports = function (_sourceFile, config, dev = false) {
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
				file: _sourceFile,
				includePaths: [
					path.join(__dirname, 'common-scss'),
					spriteCssLocation
				],
				outputStyle: dev ? 'expanded' : 'compress'
			},
			async (err, result) => {
				if (err) {
					console.log(err);
					console.log(`${err.file} error:  ${err.message}`);

					reject(err);
				} else {
					const _outputPath = _sourceFile
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
