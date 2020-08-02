const fs = require('fs')
const path = require('path')
const sass = require('node-sass');
const chokidar = require('chokidar');
const chalk = require('chalk');
const file = require('../customized/file');
const {dirname,join} = path;

const postcss = require('./postcss');

/**
 * 编译scss文件
 * @param dir
 * @param config
 * @returns {Promise<any>}
 */
module.exports =  function (dir, config = null, dev) {
    let divideBy2 = config.stylesOption && config.stylesOption.divideBy2;
    let rem = config.stylesOption && config.stylesOption.rem;

    let sassCompilationPromises = [];

    for (let i = 0; i < global.sassCompileList.length; i++) {
        let _sourceFile = global.sassCompileList[i];

        sassCompilationPromises.push(new Promise(async (resolve, reject) => {
            sass.render({
                file: join(dir, _sourceFile),
                includePaths: [join(__dirname, 'common-scss'), join(process.cwd(), 'static/css/sprite')],
                outputStyle: 'compress'
            }, async (err, result) => {
                if (err) {
                    console.log(err);
                    console.log(`${err.file} error:  ${err.message}`);

                    reject(err);
                } else {
                    let _outputPath = join(dir, config.distDir, _sourceFile).replace(/\.scss$/, '.css');

                    file.mkdirRecursive(dirname(_outputPath));

                    fs.writeFileSync(_outputPath, result.css.toString());

                    if (!dev)
                        global.cssCompileList.push(_outputPath);

                    await postcss(_outputPath, {
                        divideBy2, rem
                    });

                    resolve(result);
                }
            });
        }));
    }

    return new Promise((resolve, reject) => {
        Promise.all(sassCompilationPromises).then(values => {
            /*// dev模式监听文件变动并重新编译
            if (dev) {
                let _cssDir = join(dir, 'static/css');

                console.log(chalk.blue(`SASS compilation: Watching for changes in static/css/!**!/!*.scss`));

                // 监听sass文件变化
                chokidar.watch(`${_cssDir}/!**!/!*.scss`).on('all', (event, path) => {
                    if (event === 'change' || event === 'unlink') {
                        console.log(chalk.green(`SASS compilation: Event ${event} on ${path}`));

                        // 之前push过的Promise已经成为resolved状态，无法继续执行
                        // 清空数组，并重新执行SASS编译
                        sassCompilationPromises = [];

                        for (let i = 0; i < global.sassCompileList.length; i++) {
                            let _sourceFile = global.sassCompileList[i];

                            sassCompilationPromises.push(new Promise((_resolve, _reject) => {
                                sass.render({
                                    file: join(dir, _sourceFile),
                                    includePaths: [join(__dirname, 'common-scss'), join(process.cwd(), 'static/css/sprite')],
                                    outputStyle: 'compress'
                                }, async (err, result) => {
                                    if (err) {
                                        console.log(`${err.file} error:  ${err.message}`);

                                        _reject(err);
                                    } else {
                                        let _outputPath = join(dir, config.distDir, _sourceFile).replace(/\.scss$/, '.css');

                                        file.mkdirRecursive(dirname(_outputPath));

                                        fs.writeFileSync(_outputPath, result.css.toString());

                                        await postcss(_outputPath, {
                                            divideBy2, rem
                                        });

                                        _resolve(result);
                                    }
                                });
                            }));
                        }

                        Promise.all(sassCompilationPromises).then(values => {
                            console.log(chalk.green('SASS compilation: Re-Compilation done!'));
                        }).catch(err => {
                            console.log(chalk.red(`SASS compilation: Error when re-compile sass: ${err}`));
                        });
                    }
                });
            }*/

            resolve(values);
        }).catch(err => {
            reject(err);
        });
    });
}