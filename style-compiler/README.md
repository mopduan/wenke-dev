# 使用 wenke-dev 编译样式

在原有命令行下添加 `--style` 参数即可编辑样式文件，包含对 `scss`、`sprite`、`image`、`iconfont`、`webfont` 编译处理
不包含 `--style` 参数时，`wenke-dev` 保持原有逻辑不变


## 性能对比

- **rebuid scss速度提升90%以上**
- 性能提升点：**按需`rebuild`**

以科学无线详情页为例统计 rebuild 耗时：

修改文件 |   gulp-uedtask 耗时 | wenke-dev 耗时 | 速度提升
--|--|--|--
`detail.js`(2021行) | 1.61s | 135ms | `92% ↑`
`sprite/index` 下添加雪碧图 | 3.29s | 422ms | `89% ↑`
`src/images` 下添加图片 | 614ms | 25ms | `96% ↑`


`tip:` 由于初次启动时，会打包pc/wap下所有样式文件，所以 wenke-dev 命令启动耗时会变长。


## script

推荐在项目 `package.json` 添加 scripts 使用，以科学项目为例：

```js
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
与 gulp-uedtask 打包位置保持一致

```js
// 雪碧图源文件
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/asset/sprite`) // 支持一层子目录 将分别打包
// 打包后的雪碧图位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/dist/images/sprite`)
// 雪碧图打包生成的 sprite-css 位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/css/sprite`)

// scss 文件打包前后位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/css`)
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/dist/css`)

// img 
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/images`)
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/dist/images`)

// iconfont & webfont 资源位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/asset/iconfont`)
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/src/asset/webfont`)
// iconfont & webfont 打包位置
path.join(webappDirectory, `/static/src/ued/${app_name}/${pc_or_wap}/dist/font`)

```

## 打包配置

对齐 `gulpfile.js` 中的参数配置，默认为

```js
const defaultConfig =  {
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


