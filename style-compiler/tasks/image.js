const path = require('path');
const fs = require('fs');
const imagemin = require('imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const chokidar = require('chokidar');
const glob = require('glob')
const outputLog = require('../lib/logger')
const del = require('del')

module.exports = async function buildImage(constPaths) {
    const { imgSrcLocation, imgDistLocation, uedTaskDir } = constPaths;
    const imgFiles = glob.sync(path.join(imgSrcLocation, '/**/*.{jpg,png}'));

    const matchPath = imgFiles[0].match(/\/(images|img)\//i)[1] || 'images';
    const watchedDir = path.join(uedTaskDir, 'src', matchPath);

    for (let i = 0; i < imgFiles.length; i++) {
        const imgFile = imgFiles[i];

        console.log(imgFile)

        await imagemin([imgFile], {
            destination: path.dirname(imgFile).replace(/src\/|(images|img)/, function ($0, $1) {
                return `src/${$1}`
            }),
            plugins: [
                mozjpeg({ quality: 80 }),
                pngquant()
            ]
        });
    }

    let timerImgBuild = null;
    let initWatchImg = true;
    chokidar.watch(watchedDir)
        .on('all', async (event, changePath) => {
            if (event === 'addDir') return;

            if (event === 'unlink') {
                console.log(`${event} ${changePath}`)
                const delFile = changePath.replace(`src/${matchPath}`, `dist/${matchPath}`)
                del.sync([delFile])
                outputLog('delete ' + delFile)
                return
            } else if (event === 'unlinkDir') {
                console.log(`${event} ${changePath}`)
                const delFile = changePath.replace(`src/${matchPath}`, `dist/${matchPath}`) + '/**'
                del.sync([delFile])
                outputLog('delete ' + delFile)
                return
            }

            if (timerImgBuild) clearTimeout(timerImgBuild);
            timerImgBuild = setTimeout(rebuildImg, 500);

            async function rebuildImg() {
                if (initWatchImg) {
                    initWatchImg = false;
                    return;
                }

                console.log(`preparing rebuild images:${event} ${changePath}`)
                const start = Date.now();
                await imagemin([changePath], {
                    destination: path.dirname(changePath).replace(`src/${matchPath}`, `dist/${matchPath}`),
                    plugins: [
                        mozjpeg({ quality: 80 }),
                        pngquant()
                    ]
                });
                outputLog(`rebuild success,take ${Date.now() - start}ms`)
            }
        })
}
