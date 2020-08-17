const path = require('path');
const fs = require('fs');
const imagemin = require('imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const chokidar = require('chokidar');

module.exports = async function buildImage(constPaths) {
    const { imgSrcLocation, imgDistLocation } = constPaths;
    console.log(imgSrcLocation + '**/*.{jpg,png}')
    const file = await imagemin([path.join(imgSrcLocation, '**/*.{jpg,png}')], {
        destination: imgDistLocation,
        plugins: [
            mozjpeg({ quality: 80 }),
            pngquant()
        ]
    });

    file.forEach(item => {
        console.log(item.sourcePath)
    })
    console.log('build img length:', file.length)


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
                    destination: imgDistLocation,
                    plugins: [
                        mozjpeg({ quality: 80 }),
                        pngquant()
                    ]
                });
            }
        })
}
