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
    let begin = getMaxUnicode(iconPath) + 1;
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

async function bundleIconFont(constPaths) {
    const {
        iconPath,
        iconfontDistPath
    } = constPaths;
    try {
        fs.accessSync(iconPath, fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK);
    } catch (e) {
        return Promise.resolve();
    }

    renameSvgs(iconPath)

    console.log('iconPath', iconPath)
    return new Promise((resolve, reject) => {
        webfontsGenerator({
            files: getSvgs(iconPath).map(fileName => path.join(iconPath, fileName)),
            fontName: 'iconfont',
            types: ['svg', 'ttf', 'eot', 'woff'],
            dest: iconfontDistPath,
            css: false,//Whether to generate CSS file.
            normalize: true,
            fontHeight: 1001,
            startCodepoint: 0xEA01,
            rename: (filePath) => {
                const name = path.basename(filePath, path.extname(filePath))
                const resName = name.split('-')[1];
                return resName
            }
        }, function (error) {
            if (error) {
                console.log('Fail!', error);
                reject(error)
            } else {
                resolve()
                // console.log('Done!');
            }
        })
    })
}

async function generateIconScss(constPaths) {
    const { iconPath, scssLocation } = constPaths;

    try {
        fs.accessSync(iconPath, fs.hasOwnProperty('R_OK') ? fs.R_OK : fs.constants.R_OK);
    } catch (e) {
        return Promise.resolve();
    }

    const pathname = path.resolve(__dirname, '../lib/common-scss/_iconfont.scss');

    const icons = getSvgs(iconPath).reduce(function (iconfont, svg) {
        const svgFileNameArr = path.basename(svg, path.extname(svg)).split('-')

        return Object.defineProperty(iconfont, svgFileNameArr[1], {
            value: svgFileNameArr[0].toLowerCase().replace('u', '\\'),
            enumerable: true
        })
    }, {})

    const content = [
        '$__iconfont__data: ' + JSON.stringify(icons, null, '\t').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\\\\/g, '\\') + ';',
        fs.readFileSync(pathname).toString()
    ].join('\n\n');
    fs.writeFileSync(path.join(scssLocation, '/_iconfont.scss'), content);
}

module.exports = async (constPaths) => {
    const { iconPath } = constPaths;
    await bundleIconFont(constPaths);
    await generateIconScss(constPaths);

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