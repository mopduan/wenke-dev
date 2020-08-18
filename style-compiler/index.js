const path = require('path');
const fs = require('fs');
const del = require('del');
const chalk = require('chalk');
const getConstPaths = require('./constPaths');
const buildIconFont = require('./tasks/iconfont');
const buildImage = require('./tasks/image')
const buildScss = require('./tasks/css')
const buildSprite = require('./tasks/sprite')
const buildWebfont = require('./tasks/webfont')
const outputLog = require('./lib/logger');

module.exports = async function () {
    const webappDirectory = process.cwd();
    const uedDir = path.join(webappDirectory, `static/src/ued`)
    const uedTaskDirs = recursiveFindDir(uedDir, 'src');

    const watchedDir = []
    for (let i = 0; i < uedTaskDirs.length; i++) {
        const constPaths = getConstPaths(uedTaskDirs[i])

        watchedDir.push(
            constPaths.uedTaskDir,
            constPaths.spriteSrcPath,
            constPaths.imgSrcLocation,
            constPaths.iconPath,
            constPaths.scssLocation,
        )

        await Compiler(constPaths);
    }

    outputLog('finish init bundle! These dirs are watched for changing')
    console.log(watchedDir)
}

async function Compiler(constPaths) {
    stylesCleaner(constPaths);

    const {
        uedTaskDir,
    } = constPaths;

    const tasks = {
        buildSprite,
        buildImage,
        buildIconFont,
        buildWebfont,
        buildScss
    }

    for (const funcname in tasks) {
        const func = tasks[funcname];
        const startBundleTime = Date.now();
        outputLog(`${uedTaskDir}: start ${funcname}...`)
        await func(constPaths);
        outputLog(`finish ${funcname}, take ${Date.now() - startBundleTime}ms`)
    }

};

/**
 * @param {parent directory} dir 
 * @param {target dirname to find} target 
 * @returns {Array} uedTaskDir
 */
function recursiveFindDir(dir, target, res = []) {
    const subDirs = fs.readdirSync(dir).filter(file => {
        const fileStat = fs.statSync(path.join(dir, file))
        return fileStat.isDirectory() && file !== 'node_modules'
    })

    subDirs.forEach(subDir => {
        if (subDir === target) {
            res.push(dir)
        } else {
            const parentDir = path.join(dir, subDir)
            return recursiveFindDir(parentDir, target, res)
        }
    })
    return res
}

function stylesCleaner(constPaths) {
    const {
        spriteDistPath,
        spriteScssPath,
        spriteTempPath,
        cssDistLocation,
        imgDistLocation,
        iconfontDistPath,
    } = constPaths;
    console.log('these folders are cleaning:')

    const delPaths = [
        path.join(spriteDistPath, '**'),
        path.join(spriteScssPath, '**'),
        path.join(spriteTempPath, '**'),
        path.join(cssDistLocation, '**'),
        // path.join(imgDistLocation, '**'),// img dist目录可能存在 src 目录中不存在的文件
        path.join(iconfontDistPath, '**')
        // font file TODO
    ];

    console.log(delPaths)
    del.sync(delPaths);
    console.log('clean dist directory sucesss')
};

