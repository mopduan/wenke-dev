const fs = require('fs')
const path = require('path')

module.exports = uedTaskDir => {
    const dev = true;
    const spriteTempPath = path.join(uedTaskDir, `.tempsprite/resizer`);
    const spriteDistPath = path.join(uedTaskDir, `dist/images/sprite`);
    const spriteScssPath = path.join(uedTaskDir, `src/css/sprite`);
    const spriteSrcPath = path.join(uedTaskDir, `src/asset/sprite`);

    const scssLocation = path.join(uedTaskDir, `src/css`)
    const cssDistLocation = path.join(uedTaskDir, `dist/css`)
    const imgSrcLocation = path.join(uedTaskDir, `src/images`)
    const imgDistLocation = path.join(uedTaskDir, `dist/images`)
    const iconPath = path.join(uedTaskDir, 'src/asset/iconfont')
    const iconfontDistPath = path.join(uedTaskDir, 'dist/font')

    // TODO 存储 css build配置文件

    const styleConfigLocation = path.join(uedTaskDir, `styleBuild.config.js`)
    let stylesOption = {
        useRetina: true,
        noHash: true,
    }

    if (fs.existsSync(styleConfigLocation)) {
        stylesOption = require(styleConfigLocation);
    }

    const config = {
        stylesOption,
        spriteCssLocation: spriteScssPath,
        spriteDistLocation: spriteDistPath,
    }

    return {
        spriteTempPath,
        spriteDistPath,
        spriteScssPath,
        spriteSrcPath,
        scssLocation,
        cssDistLocation,
        imgSrcLocation,
        imgDistLocation,
        iconPath,
        iconfontDistPath,
        config,
        dev,
        uedTaskDir,
    }
}
