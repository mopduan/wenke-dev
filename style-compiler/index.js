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


/**
 * 打包雪碧图，并生成scss文件。
 * 需要打包2倍图，请确保目录下文件后缀都以`@2x`结尾
 * 生成的.scss文件会将公用方法(清除浮动等)打包进去
 * @param {*} dir
 * @param {*} config
 * @param {boolean} dev dev模式下需要监听文件变动
 */
module.exports = async function () {
    const webappDirectory = process.cwd();
    const uedDir = path.join(webappDirectory, `static/src/ued`)
    const uedTaskDirs = recursiveFindDir(uedDir, 'src');

    for (let i = 0; i < uedTaskDirs.length; i++) {
        const constPaths = getConstPaths(uedTaskDir)

        await Compiler(constPaths);
    }
}

async function Compiler(constPaths) {

    stylesCleaner(constPaths);

    const startBundleSpriteTime = Date.now();
    console.log('start bundle the sprites...')
    await buildSprite(constPaths);
    console.log('end bundle sprite, take', Date.now() - startBundleSpriteTime + 'ms')

    const startBundleCSSTime = Date.now();
    console.log('start bundle the css...')
    await buildScss(constPaths);
    console.log('end bundle css, take', Date.now() - startBundleCSSTime + 'ms')

    const startBundleImgTime = Date.now();
    console.log('start bundle the image...')
    await buildImage(constPaths);
    console.log('end bundle image, take', Date.now() - startBundleImgTime + 'ms');

    await buildIconFont(constPaths);
    console.log('finish init bundle ')

    // await buildWebfont(constPaths) // TODO
};

/**
 * @param {parent directory} dir 
 * @param {target dirname to find} target 
 * @returns {Array} uedTaskDir
 */
// const res = []
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
    }
    console.log('these folders are cleaning:')

    const delPaths = [
        path.join(spriteDistPath, '**'),
        path.join(spriteScssPath, '**'),
        path.join(spriteTempPath, '**'),
        path.join(cssDistLocation, '**'),
        path.join(imgDistLocation, '**'),
        // path.join(iconfontDistPath,'**')
        // font file TODO
    ];

    console.log(delPaths)
    del.sync(delPaths);
    console.log('clean dist directory sucesss')
};

