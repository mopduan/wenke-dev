const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const autoprefixer = require('autoprefixer');
const pxEditor = require('postcss-px-editor');
const px2rem = require('postcss-pxtorem');
const assets = require('postcss-assets');

/**
 * 本模块用于生成需要转换到REM值的属性名。默认以下属性均要转换：

 'top', 'right', 'bottom', 'left', 'clip', 'clip-path',
 'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
 'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
 'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
 'border-radius', 'border-top-right-radius', 'border-top-left-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
 'border-image', 'border-image-width', 'border-image-outset',
 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
 'background', 'background-position', 'background-size',
 'outline', 'outline-width', 'outline-offset',
 'columns', 'column-width', 'column-rule', 'column-rule-width',
 'flex', 'flex-basis',
 'transform', 'transform-origin', 'perspective', 'perspective-origin',
 'border-spacing','box-shadow','line-height'

 可以根据项目对上述列表进行修改，如：

 // 禁止转换 line-height
 // 添加转换 font-size
 pxtorem('!line-height', 'font-size')
 * @returns {string[]}
 */
function px2remProp() {
    var list = Array.from(arguments);
    var black = [];
    var white = [
        'top', 'right', 'bottom', 'left', 'clip', 'clip-path',
        'width', 'min-width', 'max-width', 'height', 'min-height', 'max-height',
        'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
        'border', 'border-top', 'border-right', 'border-bottom', 'border-left',
        'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
        'border-radius', 'border-top-right-radius', 'border-top-left-radius', 'border-bottom-right-radius', 'border-bottom-left-radius',
        'border-image', 'border-image-width', 'border-image-outset',
        'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
        'background', 'background-position', 'background-size', 'background-image',
        'outline', 'outline-width', 'outline-offset',
        'columns', 'column-width', 'column-rule', 'column-rule-width',
        'flex', 'flex-basis',
        'transform', 'transform-origin', 'perspective', 'perspective-origin',
        'border-spacing', 'box-shadow', 'line-height', 'font-size'
    ];

    list.reduce(function (args, prop) {
        if (0 === prop.indexOf('!')) {
            args.black.push(prop.substring(1));
        } else if (args.white.indexOf(prop) < 0) {
            args.white.push(prop);
        }
        return args;
    }, {
        white: white,
        black: black
    });

    return white.filter(function (prop) {
        return this.indexOf(prop) < 0;
    }, black);
}

module.exports = function (filePath, { rootValue = 40, divideBy2 = false, rem = false, spriteDistLocation }) {
    const postcssSettings = [];

    if (divideBy2) {
        postcssSettings.push(pxEditor('divide-by-two?warn=true&min=3'));
    } else if (rem) {
        postcssSettings.push(px2rem({
            rootValue,
            minPixelValue: 3,
            propWhiteList: px2remProp()
        }));
    }

    postcssSettings.push(
        autoprefixer(['iOS >= 8', 'last 2 versions', 'Android >= 4', 'ie >= 9']),
        assets({
            relative: true,
            loadPaths: [spriteDistLocation]
        })
    );

    return new Promise((resolve, reject) => {
        try {
            const css = fs.readFileSync(filePath);

            postcss(postcssSettings)
                .process(css, { from: filePath, to: filePath })
                .then(result => {
                    try {
                        fs.writeFileSync(filePath, result.css);

                        resolve();
                    } catch (writeError) {
                        reject(writeError);
                    }
                });
        } catch (error) {
            reject(error);
        }
    });
};