const path = require('path');
const fs = require('fs');
const del = require('del');
const glob = require('glob');
const retinaResizer = require('./lib/style-build/retina-resizer');
const spriteBundler = require('./lib/style-build/sprite-bundler');
const sprite2scss = require('./lib/style-build/sprites2scss');
const scssCompile = require('./lib/style-build/sass-compile');
const chokidar = require('chokidar');
const chalk = require('chalk');
const file = require('./lib/customized/file');
const customizeUtils = require('./lib/customized/utils');
const { retry } = require('async');


const spritePath = {
    dist: '/static/src/ued/new_baike/pc/dist/images/sprite',
    scss: '/static/src/ued/new_baike/pc/src/css/sprite',
    src: '/static/src/ued/new_baike/pc/src/asset/sprite'
}

const srcLocation = 'src/asset/sprite';
const distLocation = 'dist/images/sprite'

function stylesCleaner(dir) {
    console.log('start clean sprite dist directory sucesss')
    const _spriteDistPath = path.join(dir, spritePath.dist, '**');
    const _scssDistPath = path.join(dir, spritePath.scss, '**');

    del.sync([_spriteDistPath, _scssDistPath]);
    console.log('clean sprite dist directory sucesss')
};

/**
 * 打包雪碧图，并生成scss文件。
 * 需要打包2倍图，请确保目录下文件后缀都以`@2x`结尾
 * 生成的.scss文件会将公用方法(清除浮动等)打包进去
 * @param {*} dir
 * @param {*} config
 * @param {boolean} dev dev模式下需要监听文件变动
 */
module.exports = async function stylesCompiler(options) {

    const dir = options.webappDirectory;

    console.log(`start compile ${dir} styles`)
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

    // clean
    // stylesCleaner(dir);

    // return;

    /**
     * 打包雪碧图
     * @param {null|string} filePath
     * @returns {Promise<void>}
     */
    const spritesBuilder = async function (filePath) {

        // 默认全量图片文件全部打包
        let globPath = `${dir.replace(/\/$/, '')}${spritePath.src}/**/*.{png,jpg,gif}`;

        // rebuild sprite
        let rebuild = false;

        let spriteDir = '';

        if (filePath) {
            rebuild = true;
            const _fileDir = path.dirname(filePath);
            const _filePathWithoutPrefix = _fileDir.replace(customizeUtils.normalizePath(_spritePath), '').replace(/^\//, ''); // 例如 detail/some.png 或者 some.png
            globPath = filePath;
            spriteDir = _filePathWithoutPrefix;
        }

        // TODO 测试2倍图中不包含`@2x`的情况
        if (isRetina) {

            console.log('isRetina', isRetina)
            // 将globPath中的图作为2倍图，压缩生成1倍图 分别以 @1.png @2.png 生成至与src同级下的  ./.tempsprite/resizer/目录中
            await retinaResizer(globPath, 2);
        }

        let _spriteBundlePromises = [];

        // if (rebuild) {
        //     let dest = [filePath.replace(srcLocation, distLocation)];
        //     const _dirname = path.dirname(filePath);
        //     const _basename = path.basename(filePath);
        //     const _extname = path.extname(filePath);

        //     if (isRetina) {
        //         dest = [
        //             filePath.replace(srcLocation, `${distLocation}/.retina_tmp/`).replace('@2x', '').replace(_extname, `@1x${_extname}`),
        //             filePath.replace(srcLocation, `${distLocation}/.retina_tmp/`).replace('@2x', '').replace(_extname, `@2x${_extname}`)
        //         ];
        //     }

        //     del.sync(dest);

        //     if (spriteDir) {
        //         _spriteBundlePromises.push(new Promise(async (resolve, reject) => {
        //             let imgSrc = `${_dirname.replace(/\/$/, '')}/*.{png,jpg,gif}`;

        //             let _spritesmithConfig = {
        //                 imgSrc: imgSrc,
        //                 imgName: `images/sprite/dist/${spriteDir}/sprite_${spriteDir}.png`,
        //                 cssName: `css/sprite/sprite_${spriteDir}.scss`,
        //                 imgPath: `/static/images/sprite/dist/${spriteDir}/sprite_${spriteDir}.png`,
        //                 cssTemplate: cssTemplate,
        //                 dest: webappDirectory
        //             };

        //             if (isRetina) {
        //                 const retinaTmpDir = _dirname.replace(srcLocation, `${distLocation}/.retina_tmp/`);
        //                 imgSrc = `${retinaTmpDir}/*.{png,jpg,gif}`;

        //                 _spritesmithConfig = {
        //                     imgSrc: imgSrc,
        //                     imgName: `images/sprite/dist/${spriteDir}/sprite_${spriteDir}@1x.png`,
        //                     imgPath: `/static/images/sprite/dist/${spriteDir}/sprite_${spriteDir}@1x.png`,
        //                     cssName: `css/sprite/sprite_${spriteDir}.scss`,
        //                     retinaImgName: `images/sprite/dist/${spriteDir}/sprite_${spriteDir}@2x.png`,
        //                     retinaSrcFilter: `${retinaTmpDir}/*@2x.{png,jpg,gif}`,
        //                     retinaImgPath: `/static/images/sprite/dist/${spriteDir}/sprite_${spriteDir}@2x.png`,
        //                     cssTemplate: cssTemplate,
        //                     dest: webappDirectory
        //                 };
        //             }

        //             try {
        //                 await spriteBundler(_spritesmithConfig);

        //                 resolve();
        //             } catch (e) {
        //                 reject(e);
        //             }
        //         }));
        //     } else { // sprite目录下文件
        //         let _spriteBundlePath = `${_spritePath}/*.{png,jpg,gif}`;
        //         const retinaTmpDir = _spritePath.replace(srcLocation, `${distLocation}/.retina_tmp/`);

        //         let _spritesmithConfig = {
        //             imgSrc: _spriteBundlePath,
        //             imgName: 'images/sprite/dist/sprite.png',
        //             cssName: 'css/sprite/sprite.scss',
        //             imgPath: `/static/images/sprite/dist/sprite.png`,
        //             cssTemplate: cssTemplate,
        //             dest: path.join(webappDirectory, spritePath.dist)
        //         };

        //         if (isRetina) {
        //             _spriteBundlePath = `${retinaTmpDir}/*.{png,jpg,gif}`;

        //             _spritesmithConfig = {
        //                 imgSrc: _spriteBundlePath,
        //                 imgName: 'images/sprite/dist/sprite@1x.png',
        //                 cssName: 'css/sprite/sprite.scss',
        //                 imgPath: `/static/images/sprite/dist/sprite@1x.png`,
        //                 retinaImgName: `images/sprite/dist/sprite@2x.png`,
        //                 retinaSrcFilter: `${_spritePath}/*@2x.{png,jpg,gif}`,
        //                 retinaImgPath: `/static/images/sprite/dist/sprite@2x.png`,
        //                 cssTemplate: cssTemplate,
        //                 dest: path.join(webappDirectory, spritePath.dist)
        //             };
        //         }

        //         _spriteBundlePromises.push(new Promise(async (resolve, reject) => {
        //             try {
        //                 await spriteBundler(_spritesmithConfig);

        //                 resolve();
        //             } catch (e) {
        //                 reject(e);
        //             }
        //         }));
        //     }
        // } else {
        let _spriteDirs = fs.readdirSync(_spritePath);
        console.log('214：', _spriteDirs)

        // 遍历 assert/sprite 文件夹
        _spriteDirs.forEach(_dir => {
            let _path = path.join(_spritePath, _dir);

            let _stats = fs.statSync(_path);

            if (_stats.isDirectory()) {
                // 创建对应的雪碧图dist 目录，
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

                    _spritesmithConfig = {
                        ..._spritesmithConfig,
                        imgSrc: `${spriteSmithDest}/.tempsprite/resizer/${_dir}/*.{png,jpg,gif}`,
                        retinaImgName: `dist/images/sprite/sprite_${_dir}@2x.png`,
                        retinaSrcFilter: `${spriteSmithDest}/.tempsprite/resizer/**/*@2x.png`,
                        retinaImgPath: `/images/sprite/sprite_${_dir}@2x.png`,
                        padding: 8,
                    }
                }

                _spriteBundlePromises.push(new Promise(async (resolve, reject) => {
                    try {
                        await spriteBundler(_spritesmithConfig);

                        resolve();
                    } catch (e) {
                        reject(e);
                    }
                }));
            }
        });

        // let _spriteBundlePath = `${_spritePath}/*.{png,jpg,gif}`;
        // const retinaTmpDir = _spritePath.replace(srcLocation, `${distLocation}/.retina_tmp/`);

        // let _spritesmithConfig = {
        //     imgSrc: _spriteBundlePath,
        //     imgName: 'images/sprite/dist/sprite.png',
        //     cssName: 'css/sprite/sprite.scss',
        //     imgPath: `/static/images/sprite/dist/sprite.png`,
        //     cssTemplate: cssTemplate,
        //     dest: path.join(webappDirectory, spritePath.dist)
        // };

        // if (isRetina) {
        //     _spriteBundlePath = `${retinaTmpDir}/*.{png,jpg,gif}`;

        //     _spritesmithConfig = {
        //         imgSrc: _spriteBundlePath,
        //         imgName: 'images/sprite/dist/sprite@1x.png',
        //         cssName: 'css/sprite/sprite.scss',
        //         imgPath: `/static/images/sprite/dist/sprite@1x.png`,
        //         retinaImgName: `images/sprite/dist/sprite@2x.png`,
        //         retinaSrcFilter: `${_spritePath}/*@2x.{png,jpg,gif}`,
        //         retinaImgPath: `/static/images/sprite/dist/sprite@2x.png`,
        //         cssTemplate: cssTemplate,
        //         dest: path.join(webappDirectory, spritePath.dist)
        //     };
        // }

        // _spriteBundlePromises.push(new Promise(async (resolve, reject) => {
        //     try {
        //         await spriteBundler(_spritesmithConfig);

        //         resolve();
        //     } catch (e) {
        //         reject(e);
        //     }
        // }));
        // }

        await Promise.all(_spriteBundlePromises);
    };

    // if (fs.existsSync(path.join(dir, spritePath.src)) && fs.readdirSync(path.join(dir, spritePath.src)).length) {
    //     await spritesBuilder();
    // }

    const startBundleSpriteTime = Date.now();
    console.log('start bundle the sprites...')
    await spritesBuilder();

    console.log('end bundle, take', Date.now() - startBundleSpriteTime + 'ms')


    global.sassCompileList = getSassCompileList(global.cssCompileList).filter(name => name.includes('pc/src/css'))

    if (global.sassCompileList && global.sassCompileList.length) {
        await scssCompile(dir, config, dev);
    }

    return;


    if (dev) {
        const sprites = glob.sync(`${dir.replace(/\/$/, '')}${spritePath.src}/**/*.{png,jpg,gif}`);

        chokidar.watch(sprites).on('all', async function (event, changePath) {

            console.log(event, changePath)
            const _extname = path.extname(changePath);

            // 只需要对`add`, `addDir`, `change`, `unlink`, `unlinkDir`事件进行处理
            if (event === 'add' || event === 'addDir' || event === 'change' || event === 'unlink' || event === 'unlinkDir') {
                // dist目录下的文件地址
                // let distPath = [changePath.replace(srcLocation, 'sprite/dist/')];

                let distPath = [changePath.replace(srcLocation, distLocation)];

                // 移动端需要校验1倍图和2倍图同时存在。
                if (isRetina) {
                    distPath = [
                        changePath.replace(srcLocation, `${distLocation}/.retina_tmp/`).replace('@2x', '').replace(_extname, `@1x.png`),//????
                        changePath.replace(srcLocation, `${distLocation}/.retina_tmp/`).replace('@2x', '').replace(_extname, `@2x.png`)
                    ];
                }

                const isExisted = distPath.every(item => fs.existsSync(item));

                // 如果dist目录下没有对应文件，则需要进行打包处理
                if (!isExisted || event === 'unlink' || event === 'unlinkDir') {
                    try {
                        // 只需要对该文件所属的sprite图进行处理
                        await spritesBuilder(changePath);
                    } catch (error) {
                        console.log(chalk.bold.red(error.message));
                        throw error
                    }
                }
            }
        }).on('error', function (error) {
            console.log(`file watcher encounter ${error}`);
        });

        let _cssDir = path.join(dir, 'static/src/ued/new_baike/pc/src/css');

        console.log(chalk.blue(`SASS compilation: Watching for changes in ${_cssDir}/**/*.scss`));

        // 监听sass文件变化
        chokidar.watch(`${_cssDir}/**/*.scss`).on('all', async (event, path) => {
            if (event === 'change' || event === 'unlink') {
                try {
                    await scssCompile(dir, config, dev);
                } catch (error) {
                    console.log(chalk.bold.red(error));
                    throw error;
                }
            }
        });
    }
};

function getSassCompileList(csslist) {
    return csslist.map(fileName => {

        let scssFileName = fileName.replace('/dist/css', '/src/css').replace('.css', '.scss')
        return scssFileName
    });
}