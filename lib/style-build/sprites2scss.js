const fs = require('fs');
const path = require('path');

function toSCSS(data) {
    return JSON.stringify(data, null, '\t').replace(/\{/g, '(').replace(/\}/g, ')');
}

function parseSprites(sprites, dirPrefix) {
    const data = sprites.reduce((result, sprite) => {
        const { name, width, height, total_width, total_height, offset_x, offset_y, escaped_image, source_image } = sprite;
        //console.log(escaped_image);
        const spriteName = escaped_image.substring(escaped_image.lastIndexOf('/') + 1);

        // 例如`common/task-expire.png`
        // const nameWithDir = source_image.replace(dirPrefix, '').replace(dirPrefix.replace('sprite/src/', 'sprite/dist/.retina_tmp/'), '');
        let _dir = path.dirname(escaped_image).replace("/static/images/sprite/dist/", '').replace(/^\.retina_tmp\//, "");
        //console.log(_dir);

        // const dirIndex = nameWithDir.indexOf('/');

        const group = _dir ? _dir : 'default';

        if (typeof result[group] === 'undefined') {
            result[group] = {};
        }

        // 如果图片名称中包含`@2x`，取`@`之前的内容作为name
        const _at = name.indexOf('@');
        const _name = _at > -1 ? name.substring(0, _at) : name;

        const offset_x_pct = offset_x ? parseFloat((offset_x / (width - total_width) * 100).toFixed(3)) + '%' : 0;
        const offset_y_pct = offset_y ? parseFloat((offset_y / (height - total_height) * 100).toFixed(3)) + '%' : 0;

        result[group][_name] = {
            name: _name,
            width,
            height,
            total_width,
            total_height,
            x: offset_x,
            y: offset_y,
            x_pct: offset_x_pct,
            y_pct: offset_y_pct,
            url: escaped_image,
            sprite_name: spriteName
        };

        return result;
    }, {});

    return toSCSS(data);
}

module.exports = function (options) {
    let rem = options.rem;
    let divideBy2 = options.divideBy2;
    let retina = options.retina;
    let dirPrefix = options.dirPrefix || '/';

    function handler(data) {
        const scss = [];

        scss.push(`$__sprite-is-rem__: ${Boolean(rem && data.retina_sprites)};`);
        scss.push(`$__sprite-only-retina__: ${Boolean(!divideBy2 && retina)};`);
        scss.push(`$__sprite-local-group__:  ${parseSprites(data.sprites, dirPrefix)};`);
        if (data.retina_sprites) {
            scss.push(`$__sprite-local-group-2x__: ${parseSprites(data.retina_sprites, dirPrefix)};`);
        }
        scss.push(fs.readFileSync(path.join(__dirname, 'common-scss/function.scss')).toString());

        return scss.join('\n');
    }

    return handler;
};