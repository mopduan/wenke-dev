const path = require('path');
const fs = require('fs');
const del = require('del');
const glob = require('glob');
const imagemin = require('imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');
const retinaResizer = require('./lib/style-build/retina-resizer');
const spriteBundler = require('./lib/style-build/sprite-bundler');
const sprite2scss = require('./lib/style-build/sprites2scss');
const scssCompile = require('./lib/style-build/sass-compile');
const chokidar = require('chokidar');
const chalk = require('chalk');
const file = require('./lib/customized/file');
// const customizeUtils = require('./lib/customized/utils');
// const { env } = require('process');
// const { anySeries } = require('async');
// const { retry } = require('async');

const spritePath = {
    dist: '/static/src/ued/new_baike/pc/dist/images/sprite',
    scss: '/static/src/ued/new_baike/pc/src/css/sprite',
    src: '/static/src/ued/new_baike/pc/src/asset/sprite'
};

const imgSrcLocation = '/Users/daipeng/Workspace/baike-projects/new-baike/static/src/ued/new_baike/pc/src/images/';
const imgDistLocation = imgSrcLocation.replace('/src/images/', '/dist/images/');

/**
 * 打包雪碧图，并生成scss文件。
 * 需要打包2倍图，请确保目录下文件后缀都以`@2x`结尾
 * 生成的.scss文件会将公用方法(清除浮动等)打包进去
 * @param {*} dir
 * @param {*} config
 * @param {boolean} dev dev模式下需要监听文件变动
 */
module.exports = async function stylesCompiler(options) {
    global.sassCompileList = getSassCompileList(global.cssCompileList).filter(name => name.includes('pc/src/css'))

    const dir = options.webappDirectory;

    const webappDirectory = dir;

    // TODO 存储 css build配置文件
    const styleConfigLocation = path.join(webappDirectory, 'static/src/ued/new_baike/pc', 'style.config.js')
    const sprite2scssDir = path.join(webappDirectory, 'static/src/ued/new_baike/pc', 'src/css/sprite')
    const spriteSmithDest = path.join(webappDirectory, 'static/src/ued/new_baike/pc')

    const _spritePath = path.join(webappDirectory, 'static/src/ued/new_baike/pc/src/asset/sprite') // 雪碧图源文件路径

    let stylesOption = {
        useRetina: true,
        // noHash: true,
    }
    if (fs.existsSync(styleConfigLocation)) {
        stylesOption = require(styleConfigLocation);
    }

    const dev = true;
    const config = { stylesOption }

    const isRetina = stylesOption && stylesOption.useRetina;
    const divideBy2 = stylesOption && stylesOption.divideBy2;
    const isRem = stylesOption && stylesOption.rem;

    const cssTemplate = sprite2scss({
        rem: isRem,
        retina: isRetina,
        divideBy2,
        dirPrefix: sprite2scssDir
    });

    const startBundleSpriteTime = Date.now();
    console.log('start bundle the sprites...')
    await buildSprite(_spritePath);
    console.log('end bundle sprite, take', Date.now() - startBundleSpriteTime + 'ms')


    const startBundleCSSTime = Date.now();
    console.log('start bundle the css...')
    await buildScss();
    console.log('end bundle css, take', Date.now() - startBundleCSSTime + 'ms')


    const startBundleImgTime = Date.now();
    console.log('start bundle the image...')
    await buildImage();
    console.log('end bundle image, take', Date.now() - startBundleImgTime + 'ms');

    async function buildImage() {

        const file = await imagemin([imgSrcLocation + '**/*.{jpg,png}'], {
            destination: imgDistLocation,
            plugins: [
                mozjpeg({ quality: 80 }),
                pngquant()
            ]
        });

        // file.forEach(item => {
        //     console.log(item.sourcePath)
        // })

        // console.log('build img length:', file.length)
    }


    async function buildScss() {
        const { sassCompileList } = global;
        if (!sassCompileList || !sassCompileList.length) return

        for (let i = 0; i < sassCompileList.length; i++) {
            const sourceFile = sassCompileList[i]
            await scssCompile(sourceFile, config, dev);
        }
    }

    console.log('finish init bundle ')

    let initWatchSprite = true;
    let initWatchScss = true;
    let initWatchImg = true;

    if (dev) {
        let timerSpriteBuild = null;
        let timerCssBuild = null;
        let timerImgBuild = null;

        chokidar
            .watch('/Users/daipeng/Workspace/baike-projects/new-baike/static/src/ued/new_baike/pc/src/asset/sprite/')
            .on('all', async function (event, changePath) {
                if (event === 'addDir') return;
                // console.log('雪碧图 watch',event, changePath)
                // stylesCleaner(webappDirectory)
                if (timerSpriteBuild) clearTimeout(timerSpriteBuild);// 避免首次watch 重复调用
                timerSpriteBuild = setTimeout(rebuildSprite, 500)

                async function rebuildSprite() {
                    if (initWatchSprite) {
                        initWatchSprite = false;
                        return
                    }
                    try {
                        // 只需要对该文件所属的sprite图进行处理

                        console.log('rebuild:' + path.dirname(changePath))
                        const spritePath = path.dirname(changePath)
                        const spriteSubDir = spritePath.substring(spritePath.lastIndexOf('/')).replace('/', '');
                        await spritesBuilder(spritePath, spriteSubDir);
                    } catch (error) {
                        console.log(chalk.bold.red(error.message));
                        throw error
                    }
                }
            })
            .on('error', function (error) {
                console.log(`file watcher encounter ${error}`);
            });

        let _cssDir = path.join(dir, 'static/src/ued/new_baike/pc/src/css');
        console.log(chalk.blue(`SASS compilation: Watching for changes in ${_cssDir}/**/*.scss`));


        // 监听sass文件变化
        chokidar.watch(_cssDir).on('all', async (event, changePath) => {
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

        chokidar
            .watch('/Users/daipeng/Workspace/baike-projects/new-baike/static/src/ued/new_baike/pc/src/images/')
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

    /**
     * 打包雪碧图
     * @param {null|string} filePath
     * @returns {Promise<void>}
     */
    async function spritesBuilder(_path, _dir) {

        file.mkdirRecursive(path.join(spriteSmithDest, 'dist/images/sprite'));
        let _imgSrc = `${_path}/*.{png,jpg,gif}`;

        let _spritesmithConfig = {
            padding: 2,
            imgSrc: _imgSrc,
            imgName: `dist/images/sprite/sprite_${_dir}.png`,
            cssName: `src/css/sprite/_sprite_${_dir}.scss`,
            // Optional path to use in CSS referring to image location
            imgPath: `/images/sprite/sprite_${_dir}.png`,
            cssTemplate: cssTemplate,
            dest: spriteSmithDest
        };

        if (isRetina) {
            // 将globPath中的图作为2倍图，压缩生成1倍图 分别以 @1.png @2.png 生成至与src同级下的  ./.tempsprite/resizer/目录中
            await retinaResizer(_path, _dir);

            _spritesmithConfig = {
                ..._spritesmithConfig,
                imgSrc: `${spriteSmithDest}/.tempsprite/resizer/${_dir}/*.{png,jpg,gif}`,
                retinaImgName: `dist/images/sprite/sprite_${_dir}@2x.png`,
                retinaSrcFilter: `${spriteSmithDest}/.tempsprite/resizer/**/*@2x.png`,
                retinaImgPath: `/images/sprite/sprite_${_dir}@2x.png`,
                padding: 8,
            }
        }

        await spriteBundler(_spritesmithConfig);
    }

    async function buildSprite(_spritePath) {

        const tempSpriteDir = path.join('/Users/daipeng/Workspace/baike-projects/new-baike/static/src/ued/new_baike/pc', '/.tempsprite/resizer/*')
        del.sync([tempSpriteDir])

        let _spriteDirs = fs.readdirSync(_spritePath);
        // 遍历 assert/sprite 文件夹

        for (let i = 0; i < _spriteDirs.length; i++) {
            const childPath = _spriteDirs[i];
            let _path = path.join(_spritePath, childPath);
            if (fs.statSync(_path).isDirectory()) {
                await spritesBuilder(_path, childPath)
            } else {
                // TODO  暂不支持sprite下直接打包
            }
        }
    }
};

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

function stylesCleaner(dir) {
    console.log('start clean sprite dist directory')
    const _spriteDistPath = path.join(dir, spritePath.dist, '**');
    const _spriteTemp = path.join(dir, '/static/src/ued/new_baike/pc/', '.tempsprite/resizer/', '**');
    const _scssDistPath = path.join(dir, spritePath.scss, '**');

    del.sync([_spriteDistPath, _scssDistPath, _spriteTemp]);
    console.log('clean sprite dist directory sucesss')
};

