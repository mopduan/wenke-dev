# gulp 梳理

1. 根目录 `gulpfile.js` export 的function 都会被添加进 gulp task system
2. Each gulp task is an asynchronous JavaScript function

# 现有项目文件位置

```js
// dir of sprite source
path.join(webappDir,  `/static/src/ued/${app_name}/${pc_or_wap}/src/asset/sprite`) // 可以有一层子目录 将分别打包

// dir of sprite dist
path.join(webappDir,  `/static/src/ued/${app_name}/${pc_or_wap}/dist/images/sprite`)

// dir of sprite-css
path.join(webappDir,  `/static/src/ued/${app_name}/${pc_or_wap}/src/css/sprite`)

// dir of css dist
path.join(webappDir,  `/static/src/ued/${app_name}/${pc_or_wap}/dist/css`)
```

# todo

- [] 测试阶段 添加打包配置参数 开启css打包 不影响之前的逻辑、如果发现问题能够尽快使用之前的方式打包发布
- [] 测试成功后  wenke 添加相应逻辑  从此不再需要提交dist 的代码
- []兼容两种情况：1雪碧图文件平铺在 sprite 文件夹  2 嵌套子目录打包
- [] 定义路径变量、路径自动化
- [x] resolve url
- [ ] dev兼容
- [ ] images 文件平移
- [ ] 优化重复reload
- [ ] 测试 unlink  是否直接添加删除dist对应文件逻辑即可
- [] 解决 outdated 问题
- [] 参照gulp-uedtask优化日志
- [] 参照 gulp-uedtask优化doc
- [] svg 字体打包？？

# note

## gulp 打包雪碧图的流程

1. 四种情况：sprite 包含子目录与否，进而 isRetina；（不包含子目录的 TODO）
2. 如果是 retina ，则需要 resize 将 sprite 源文件转换为1倍图和二倍图(放置在temp目录下); 然后分别使用temp 目录下的1倍图和2倍图来合成打包；
3. gulp 多了一步使用 gulp-imagemin 来压缩图片的步骤  // TODO
4. 写入目标地址
5. 删除temp文件


## 改进

1. --np 时   -w 参数也是传的是node-app的目录

## 监听机制

1. njk 中引入的css 会存入  global.cssCompileList, 进而找到对应的src目录的 scss 文件， 对这些 scss 文件进行监听，修改则重新编译
2. 雪碧图 监听 src/asset/sprite/ 目录，  有添加或删除则重新打包对应的子雪碧图

## 测试用例

1. 添加子


# 性能对比


| compare     | gulp-uedtask | wenke-dev |
|-------------|--------------|-----------|
| rebuild css | 1.34s        | 70ms      |