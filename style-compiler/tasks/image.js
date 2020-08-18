const path = require('path');
const fs = require('fs');
const imagemin = require('imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const chokidar = require('chokidar');
const glob = require('glob')

module.exports = async function buildImage(constPaths) {
    const { imgSrcLocation, imgDistLocation } = constPaths;
    const imgFiles = glob.sync(path.join(imgSrcLocation, '/**/*.{jpg,png}'));

    for (let i = 0; i < imgFiles.length; i++) {
        const imgFile = imgFiles[i];
        console.log(imgFile)

        await imagemin([imgFile], {
            destination: path.dirname(imgFile).replace('src/images', 'dist/images'),
            plugins: [
                mozjpeg({ quality: 80 }),
                pngquant()
            ]
        });
    }

    let timerImgBuild = null;
    let initWatchImg = true;
    chokidar.watch(imgSrcLocation)
        .on('all', async (event, changePath) => {
            if (event === 'addDir') return;

            if (timerImgBuild) clearTimeout(timerImgBuild);
            timerImgBuild = setTimeout(rebuildImg, 500);

            async function rebuildImg() {
                if (initWatchImg) {
                    initWatchImg = false;
                    return;
                }

                console.log(`rebuild:${event} ${changePath}`)

                await imagemin([changePath], {
                    destination: path.dirname(changePath).replace('src/images', 'dist/images'),
                    plugins: [
                        mozjpeg({ quality: 80 }),
                        pngquant()
                    ]
                });
            }
        })
}
