const gm = require("gm").subClass({
    imageMagick: true
});
//const sharp = require("sharp");
const { dirname, basename } = require('path');
const glob = require('glob');
const file = require('../customized/file')

function getMetadata(imagePath) {
    return new Promise((resolve, reject) => {
        gm(imagePath).identify((error, metadata) => {
            if (error) {
                reject(error);
            }

            resolve(metadata);
        });
    });
}

/**
 * 2倍图转成1倍图，进行spritesmith操作
 * TODO 支持3倍图
 * @param globPath
 * @param ratio
 */
module.exports = async function (globPath, ratio) {
    //const sprites = glob.sync(`${dir.replace(/\/$/, '')}/static/images/sprite/src/**/*.{png,jpg,gif}`);
    const sprites = glob.sync(globPath);
    const _promises = [];

    for (let i = 0; i < sprites.length; i++) {
        const _path = sprites[i]; // sprite 源图片 filenamesPath

        _promises.push(new Promise(async (resolve, reject) => {
            try {
                const metadata = await getMetadata(_path);

                const { width, height } = metadata.size;

                for (let to = 2; to > 0; to--) {
                    const _outputPath = _path.replace('/src/asset/sprite/', '/.tempsprite/resizer/')
                        .replace(/@2x\./, '.')
                        .replace(/\.(png|jpg|gif)$/, function ($extname) {
                            return `@${to}x${$extname}`;
                        });

                    const convertedWidth = Math.ceil(width / ratio * to);
                    const convertedHeight = Math.ceil(height / ratio * to);

                    const borderWidth = Math.ceil(convertedWidth / to) * to - convertedWidth;
                    const borderHeight = Math.ceil(convertedHeight / to) * to - convertedHeight;

                    file.mkdirRecursive(dirname(_outputPath));

                    function outputImage() {
                        return new Promise((resolve, reject) => {
                            gm(_path).resize(convertedWidth, convertedHeight, '!')
                                .borderColor('transparent')
                                .border(borderWidth, borderHeight)
                                .crop(convertedWidth + borderWidth, convertedHeight + borderHeight, Math.floor(borderWidth / 2), Math.floor(borderHeight / 2)).write(_outputPath, error => {
                                    if (error) reject(error);

                                    resolve();
                                });
                        });
                    }

                    await outputImage();
                }

                resolve();
            } catch (e) {
                reject(e);
            }
        }));
    }

    await Promise.all(_promises);
};