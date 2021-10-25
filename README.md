# wenke-dev [![npm version](https://badge.fury.io/js/wenke-dev.svg)](https://badge.fury.io/js/wenke-dev)

[![NPM](https://nodei.co/npm/wenke-dev.svg?downloads=true)](https://nodei.co/npm/wenke-dev/)

> wenke-dev 是腾讯/搜狗社区搜索部实时开发辅助工具, 主要用于将 ES6/7/8、TypeScript、React、Preact、Node.js 端&浏览器端模板、SASS、CSS、iconfont、图片等静态资源实时编译为浏览器端正常运行的代码

## 安装

```
npm install -g wenke-dev
```

## 兼容说明

从 1.5.0 版本开始，不再支持 IE8，如需兼容 IE8，请安装使用[wenke-devie8](https://github.com/mopduan/wenke-devie8)：

```
npm install -g wenke-devie8
```

## 使用说明

```
wenke-dev -w Node.js工程目录（同时构建多个工程请用"," 英文逗号分隔)
```

## 目录规范说明

### js 文件引入规范

在 Node.js 模板中引入的 JS 主要有 3 种情况:

1. 直接引入 CDN 中的 JS, 这种引入方法会被 wenke-dev 排除在编译列表之外;

2. 业务共用库, 例如:

    ```
    <script src="http://local.wenwen.sogou.com/src/js/lib/wenke/entry.js"></script>
    ```

3. 具体页面入口 JS 文件, 例如:

    ```
    <script src="http://local.wenwen.sogou.com/deploy/js/project1/wenke/wenke/bundle.js"></script>
    ```

**注意: **

> 1. 页面入口文件名必须为: main.js
> 2. 地址中的 src 必须修改为 deploy, 这样主要是为了避免 svn 识别 src 目录下实时编译产生的中间文件

### Node.js 工程文件目录

> Node.js 工程下的模板文件目录**必须要有 src 目录**，如下：

    view
    └─src

构建后的模板文件会放置在与 src 同级目录下的 deploy 目录，无需用户手动创建，构建时会自动建立，编译后的目录结构如下：

    view
    ├─deploy
    └─src

### 静态资源文件目录

> 静态资源根目录下**必须要有 src 目录**，例如静态资源根目录为 static 的话，如下：

    static
    └─src

构建后的静态资源会放置在与 src 同级目录下的 deploy 目录，无需用户手动创建，构建时会自动建立，编译后的目录结构如下：

    static
    ├─deploy
    └─src

更详细的目录规范请参考[wenke](https://github.com/mopduan/wenke)中的目录规范说明

## 命令行参数说明

### -w 必需

Node.js 工程文件目录

### --livereload-port

livereload 服务端口, 默认为: 8999

### --norefresh

禁用 livereload 服务, 当此参数存在时, --livereload-port 参数设置无效

### --preact

使用 preact 来编译工程

### --style

[编译 sass、iconfont、图片等样式相关静态文件](https://github.com/mopduan/wenke-dev/blob/master/style-compiler/README.md)

### -c

common-library工程路径

## Report an issue

> 欢迎大家将使用 wenke-dev 中遇到的任何问题提交给我，提问地址：<a href="https://github.com/mopduan/wenke-dev/issues" target="_blank">Report an issue</a>

## Pull Requests

> 如果您发现了代码中的问题，可以 <a href="https://github.com/mopduan/wenke-dev/compare/" target="_blank">New pull request</a>

## License

wenke-dev 使用 <a href="https://github.com/mopduan/wenke-dev/blob/master/LICENSE" target="_blank" title="wenke-dev use MIT license">MIT License</a>
