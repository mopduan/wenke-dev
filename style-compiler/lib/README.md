# 使用 wenke-dev 编译样式

命令行添加 `--style` 参数即可编辑样式文件，包含对 `scss`、`sprite`、`image`、`iconfont`、`webfont` 编译处理
不包含 `--style` 参数时，`wenke-dev` 保持原有逻辑不变

## script

推荐在项目 `package.json` 添加 scripts 使用，以科学项目为例：

```json
{
    "name": "new-baike",
    //...
    "scripts": {
        "wenke-dev": "wenke-dev -w $(pwd) -s $(pwd)/static --preact --np --style",
        // other scripts...
    }
} 
```

运行`wenke-dev`时，只需要在项目根目录下执行`npm run wenke-dev`即可（ `tips`:不同项目可以配置不同的端口，以防同时启动时发生端口冲突， `--livereload-port 9006`）


## 目录规范
保持原文件位置不变

```js
// 雪碧图源文件
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/asset/sprite`) // 支持一层子目录 将分别打包

// 打包后的雪碧图位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/dist/images/sprite`)

// 雪碧图打包生成的 sprite-css 位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/css/sprite`)

// scss 文件位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/css`)

// 打包后的 css 文件位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/dist/css`)
```

## 打包配置

对齐 `gulpfile.js` 中的参数配置，默认为

```js
const defaultConfig =   {
	useRetina: true,
	noHash: true
}
```

如有非默认配置需求，需添加 `styleBuild.config.js`(与 `gulpfile.js` 在同一目录下)，使用`wenke-dev`打包时会自动读取该文件作为配置进行打包；

```js
// styleBuild.config.js
module.exports = {
    useRetina: true,
	divideBy2: true,
	noHash: true
}
```

## 样式回滚

继续使用 `gulp-uedtask` 打包即可覆盖 `wenke-dev` 打包产生的所有样式文件