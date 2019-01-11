# wenke-dev
wenwen实时开发辅助工具

[![NPM](https://nodei.co/npm/wenke-dev.svg?downloads=true)](https://nodei.co/npm/wenke-dev/)

[![npm version](https://badge.fury.io/js/wenke-dev.svg)](https://badge.fury.io/js/wenke-dev)

[![Known Vulnerabilities](https://snyk.io/test/npm/wenke-dev/badge.svg)](https://snyk.io/test/npm/wenke-dev)

> wenke-dev是腾讯/搜狗社区搜索部实时开发辅助工具, 主要用于将ES6/7/8、React、Preact、前端模板、CSS、图片等静态资源实时编译为浏览器中可以正常运行的代码

## 安装
```
npm install -g wenke-dev
```

## 兼容说明
从1.5.0版本开始，不再支持IE8，如需兼容IE8，请安装使用[wenke-devie8](https://github.com/mopduan/wenke-devie8)：
```
npm install -g wenke-devie8
```

## 使用说明
```
wenke-dev -w 后端模板文件目录（同时处理多个工程请用"," 英文逗号分隔) -s 静态资源文件目录
```


## 目录规范说明

### js文件引入规范
在后端模板中引入的JS主要有3种情况:

1. 直接引入CDN中的JS, 这种引入方法会被 wenke-dev 排除在编译列表之外;

2. 业务共用库, 例如: 

    ```
    <script src="http://local.wenwen.sogou.com/src/js/lib/wenke/entry.js"></script>
    ```

3. 具体页面入口JS文件, 例如:
    
    ```
    <script src="http://local.wenwen.sogou.com/deploy/js/project1/wenke/wenke/bundle.js"></script>
    ```

**注意: **
> 1. 页面入口文件名必须为: main.js
> 2. 地址中的src必须修改为deploy, 这样主要是为了避免svn识别src目录下实时编译产生的中间文件


### 后端模板文件目录
> 后端模板文件目录下**必须要有src目录**，例如后端模板文件目录为view的话，如下：

    view
    └─src

  构建后的后端模板文件会放置在与src同级目录下的deploy目录，无需用户手动创建，构建时会自动建立，编译后的目录结构如下：
  
    view
    ├─deploy
    └─src  
    
### 静态资源文件目录
> 静态资源根目录下**必须要有src目录**，例如静态资源根目录为static的话，如下：

    static
    └─src

  构建后的静态资源会放置在与src同级目录下的deploy目录，无需用户手动创建，构建时会自动建立，编译后的目录结构如下：
  
    static
    ├─deploy
    └─src  
    

更详细的目录规范请参考[wenke](https://github.com/mopduan/wenke)中的目录规范说明


## 命令行参数说明

### -s  必需
静态资源文件目录

### -w 必需
后端模板文件目录

### --livereload-port
livereload服务端口, 默认为: 8999

### --norefresh
禁用livereload服务, 当此参数存在时, --livereload-port参数设置无效

### --preact
使用preact来编译工程

### --xcx
编译小程序样式

## Report an issue
>欢迎大家将使用wenke-dev中遇到的任何问题提交给我，提问地址：<a href="https://github.com/mopduan/wenke-dev/issues" target="_blank">Report an issue</a>


## Pull Requests
>如果您发现了代码中的问题，可以 <a href="https://github.com/mopduan/wenke-dev/compare/" target="_blank">New pull request</a>


---

如果wenke-dev对您有帮助，欢迎打赏：）

![欢迎打赏](https://cloud.githubusercontent.com/assets/675025/20477523/f4bc4a56-b010-11e6-9b55-13138ffcf0bb.png)


## License

wenke-dev 使用 <a href="https://github.com/mopduan/wenke-dev/blob/master/LICENSE" target="_blank" title="wenke-dev use MIT license">MIT License</a>
