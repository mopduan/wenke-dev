const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');
const chalk = require('chalk');
const scssCompile = require('../lib/sass-compile');

function getSassCompileList(csslist) {
    if (!Array.isArray(csslist)) {
        console.log(chalk.blue('expect params to be a array,please check'))
        throw new Error('typeError')
    }
    return csslist.map(fileName => {

        let scssFileName = fileName.replace('/dist/css', '/src/css').replace('.css', '.scss')
        return scssFileName
    });
}

async function build(constPaths) {
    // if (global.hasBuildScss) return;
    const { config, dev, uedTaskDir } = constPaths;
    const sassCompileList = getSassCompileList(global.cssCompileList).filter(filePath => filePath.includes(uedTaskDir))


    const compilePath = sassCompileList;
    if (!compilePath || !compilePath.length) return

    for (let i = 0; i < compilePath.length; i++) {
        const sourceFile = compilePath[i]
        await scssCompile(sourceFile, config, dev);
    }

    // global.hasBuildScss = true;
}


module.exports = async function buildScss(constPaths) {
    await build(constPaths);

    const { config, scssLocation, dev } = constPaths;


    let initWatchScss = true;
    let timerCssBuild = null;
    // 监听sass文件变化
    chokidar
        .watch(scssLocation)
        .on('all', async (event, changePath) => {
            const isIgnoreFile = path.basename(changePath).startsWith('_');
            if (isIgnoreFile || event === 'addDir') return;

            if (timerCssBuild) clearTimeout(timerCssBuild);
            timerCssBuild = setTimeout(rebuildScss, 500);

            async function rebuildScss() {
                if (initWatchScss) {
                    initWatchScss = false;
                    return;
                }

                try {
                    console.log(`preparing rebuild css:${event} ${changePath}`)
                    const startTime = Date.now();
                    await scssCompile(changePath, config, dev);
                    console.log(`rebuild take ${Date.now() - startTime}ms `)
                } catch (error) {
                    console.log(chalk.bold.red(error));
                    throw error;
                }
            }
        });

}