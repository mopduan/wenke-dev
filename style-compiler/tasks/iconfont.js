const path = require('path');
const fs = require('fs');
const webfontsGenerator = require('webfonts-generator');
const chalk = require('chalk');
const chokidar = require('chokidar');
const unicodeRE = /^u([A-Z0-9]{4})-/;

function getSvgs(iconPath) {
    return fs.readdirSync(iconPath).filter(file => /\.svg$/i.test(file));
}

function getMaxUnicode(iconPath) {
    let max = 59904;
    getSvgs(iconPath).forEach(function (svg) {
        const exec = unicodeRE.exec(svg);
        if (exec) {
            const index = parseInt(exec[1], 16);
            if (index > max) {
                max = index;
            }
        }
    });
    return max;
}

function renameSvgs(iconPath) {
    let begin = getMaxUnicode() + 1;
    getSvgs(iconPath).forEach(function (svg) {
        if (unicodeRE.test(svg)) {
            return;
        }
        const newPath = iconPath + 'u' + begin.toString(16).toUpperCase() + '-' + svg;
        fs.renameSync(iconPath + svg, newPath);
        begin++;
    });
    return true;
}


async function buildIconFont(constPaths) {
    const {
        iconPath,
        iconfontDistPath
    } = constPaths;

    renameSvgs(iconPath)

    return new Promise((resolve, reject) => {
        webfontsGenerator({
            files: svgfileName.map(fileName => path.join(iconPath, fileName)),
            fontName: 'iconfont',
            types: ['svg', 'ttf', 'eot', 'woff'],
            dest: iconfontDistPath,

        }, function (error) {
            if (error) {
                console.log('Fail!', error);
                reject(error)
            } else {
                resolve()
                console.log('Done!');
            }
        })
    })
}

module.exports = (constPaths) => {
    await buildIconFont(constPaths);

    let timer = null;
    let initWatch = true;
    chokidar.watch(iconPath)
        .on('all', async (event, changePath) => {
            if (event === 'addDir') return;

            if (timer) clearTimeout(timer);
            timer = setTimeout(rebuildIconFont, 500);

            async function rebuildIconFont() {
                if (initWatch) {
                    initWatch = false;
                    return;
                }

                console.log(`${event}  ${changePath},rebuild iconfont`)
                await buildIconFont(constPaths);
            }
        })


}