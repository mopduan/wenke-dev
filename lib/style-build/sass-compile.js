const fs = require('fs')
const path = require('path')
const sass = require('node-sass');
const chokidar = require('chokidar');
const chalk = require('chalk');
const file = require('../customized/file');
const { dirname, join } = path;

const postcss = require('./postcss');

/**
 * 编译scss文件
 * @param dir
 * @param config
 * @returns {Promise<any>}
 */

module.exports = function (_sourceFile, config, dev = false) {

    if (!config) config = { stylesOption: {} };
    let divideBy2 = config.stylesOption && config.stylesOption.divideBy2;
    let rem = config.stylesOption && config.stylesOption.rem;

    let spriteCssLocation = config.spriteCssLocation;
    let spriteDistLocation = config.spriteDistLocation;
    if (!spriteCssLocation) {
        throw new Error('sass-compile function need spriteCssLocation config')
    }

    if (!spriteDistLocation) {
        throw new Error('sass-compile function need spriteDistLocation config')
    }

    return new Promise((resolve, reject) => {
        sass.render({
            file: _sourceFile,
            includePaths: [
                path.join(__dirname, 'common-scss'),
                spriteCssLocation
            ],
            outputStyle: dev ? 'expanded' : 'compress'
        }, async (err, result) => {
            if (err) {
                console.log(err);
                console.log(`${err.file} error:  ${err.message}`);

                reject(err);
            } else {
                let _outputPath = _sourceFile.replace('src/css', 'dist/css').replace(/\.scss$/, '.css');
                file.mkdirRecursive(dirname(_outputPath));
                fs.writeFileSync(_outputPath, result.css.toString());

                await postcss(_outputPath, {
                    divideBy2,
                    rem,
                    spriteDistLocation
                });

                resolve();
            }
        });
    })
}