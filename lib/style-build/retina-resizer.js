const fs = require('fs');
const path = require('path')
const gm = require("gm").subClass({
    imageMagick: true
});
//const sharp = require("sharp");
const { dirname, basename, join } = require('path');
const glob = require('glob');
const file = require('../customized/file');
const del = require('del');

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
 * @param spritePath
 * @param ratio
 */
module.exports = async function (spritePath, ratio = 2) {

    /**
     * spritePath 两种情况  
     * 1. 整体全部重新打包 src/assert/sprite/../.{png,jpg}
     * 2. 子目录单独打包例如 src/assert/sprite/common/.{png,jpg}
     */
    const tempSpriteDir = path.join('/Users/daipeng/Workspace/baike-projects/new-baike/static/src/ued/new_baike/pc', '/.tempsprite/resizer/')
    const spriteSubDir = spritePath.substring(spritePath.lastIndexOf('/')).replace('/', '');
    const delPath = spritePath === 'sprite' ? tempSpriteDir : path.join(tempSpriteDir, spriteSubDir);

    if (fs.existsSync(delPath)) {
        del.sync([path.join(delPath, '*')])
    }

    const sprites = glob.sync(path.join(spritePath, '*.{png,jpg,gif}'));
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