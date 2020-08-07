# todo

1. 打包配置参数
2. 路径自动化
3. 测试成功后  wenke 添加相应逻辑  从此不再需要提交dist 的代码
4. 兼容两种情况：1雪碧图文件平铺在 sprite 文件夹  2 嵌套子目录打包
5. 定义一个变量
6. resolve url

# note

## gulp 打包雪碧图的流程

1. 四种情况：sprite 包含子目录与否，进而 isRetina；（不包含子目录的 TODO）
2. 如果是 retina ，则需要 resize 将 sprite 源文件转换为1倍图和二倍图(放置在temp目录下); 然后分别使用temp 目录下的1倍图和2倍图来合成打包；
3. gulp 多了一步使用 gulp-imagemin 来压缩图片的步骤  // TODO
4. 写入目标地址
5. 删除temp文件