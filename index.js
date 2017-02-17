var webpack = require("webpack");
var async = require('async');
var gulp = require('gulp');
var fs = require('fs');
var path = require('path');
var utils = require('./lib/utils');
global.srcPrefix = '/src/';
global.deployPrefix = '/deploy/';
global.debugDomain = /\$!{0,1}\{.+?\}/i;

exports = module.exports = function (options) {
    var webappDirectory = options.webappDirectory;
    var webappDirectoryList = [];
    if (webappDirectory && typeof webappDirectory == 'string') {
        webappDirectoryList = webappDirectory.split(',');
        webappDirectoryList.forEach(function (item, index) {
            item = item.trim();
            if (!fs.existsSync(item)) {
                throw new Error('can\'t find the webapp directory: ' + item);
            }
        });
    } else {
        throw new Error('can\'t find the arugment -w, this argument is webapp directory!');
    }

    var staticFilesDirectory = options.staticFilesDirectory;

    if (staticFilesDirectory && typeof staticFilesDirectory == 'string') {
        if (!fs.existsSync(staticFilesDirectory)) {
            throw new Error('can\'t find the static files directory ', staticFilesDirectory);
        }
    } else {
        throw new Error('can\'t find the arugment -s, this argument is webapp static file directory!');
    }

    global.staticDirectory = utils.normalizePath(staticFilesDirectory);

    if (!fs.existsSync(path.join(global.staticDirectory, 'src'))) {
        throw new Error("can't find 'src' directory in staticDirectory ");
    }

    var defaultLiveReloadPort = 8999;
    var defaultHotPort = 9797;
    global.livereloadPort = typeof options.livereloadPort != 'undefined' && utils.isInt(options.livereloadPort) ? parseInt(options.livereloadPort) : defaultLiveReloadPort;
    global.hotPort = typeof options.hotPort != 'undefined' && utils.isInt(options.hotPort) ? parseInt(options.hotPort) : defaultHotPort;

    var templateFileList = [];
    webappDirectoryList.forEach(function (item, index) {
        var templateViewSrcPagePath = path.join(item, '/src/main/webapp/WEB-INF/view/src/');
        //if no webapp directory, then exit;
        if (!fs.existsSync(templateViewSrcPagePath)) {
            throw new Error('can\'t find the webapp velocity template directory: ' + templateViewSrcPagePath);
        }
        utils.getAllFilesByDir(templateViewSrcPagePath, templateFileList, ['.vm', '.html', '.tpl']);
    });

    var cssCacheList = {};
    var cssCompileList = [];
    var regexpStaticFilesPrefix = utils.getRegexpStaticFilesPrefix();

    templateFileList.forEach(function (tplPath) {
        var tplContent = fs.readFileSync(tplPath).toString();

        tplContent.replace(utils.getRegexpCSSLinkElements(), function ($link) {
            $link.replace(utils.getRegexpCSSHrefValue(), function ($cssLink, $someSplitStr, $href) {
                var cssPath = $href.replace(regexpStaticFilesPrefix, '');
                if (!cssCacheList[cssPath]) {
                    if ($href && !($href.indexOf('http') == 0)) {
                        cssCompileList.push(path.join(global.staticDirectory, cssPath));
                        cssCacheList[cssPath] = true;
                    }
                }

                return $cssLink;
            });

            return $link;
        });
    });

    var jsCacheList = {};
    var jsCompileList = [];
    var jsCompileListWithPureReact = [];

    templateFileList.forEach(function (tplPath, index) {
        var tplContent = fs.readFileSync(tplPath).toString();
        tplContent.replace(utils.getRegexpScriptElements(), function ($1, $2) {
            if ($2.indexOf('type="text/html"') > -1 || $2.indexOf('x-template') > -1) {
                return $1;
            }

            if ($2.toLowerCase().indexOf('release="false"') > -1) {
                return $1;
            }

            $1.replace(utils.getRegexpScriptElementSrcAttrValue(), function ($2_1, $src) {
                //需要使用热加载的入口JS文件标识
                var hotTag = '?hot=true';
                if ($src && $src.toLowerCase().indexOf('http') == -1) {
                    var jsPath = $src.replace(regexpStaticFilesPrefix, '').replace(hotTag, '');
                    if (!jsCacheList[jsPath]) {
                        if ($src.indexOf('bundle.js') != -1) {
                            //需要使用ES6/7/8转换的JS
                            var isES = $2.toLowerCase().indexOf('babel="true"') > -1;
                            var isPureReact = $src.toLowerCase().indexOf(hotTag) > -1;
                            var jsSrcPath = utils.normalizePath(path.join(global.staticDirectory, path.dirname(jsPath), 'main.js')).replace(global.deployPrefix, global.srcPrefix)

                            if (isPureReact) {
                                jsCompileListWithPureReact.push({
                                    "path": jsSrcPath
                                });
                            } else {
                                jsCompileList.push({
                                    "babel": isES,
                                    "path": jsSrcPath
                                });
                            }

                            jsCacheList[jsPath] = true;
                        }
                    }
                }
            });
        });
    });

    jsCompileList = utils.jsonArrayUnique(jsCompileList);

    console.log('jsCompileList：');
    console.log(jsCompileList);

    console.log('jsCompileListWithPureReact：');
    console.log(jsCompileListWithPureReact);

    var commonConfig = {
        cache: true,
        resolve: {
            modules: [
                path.join(__dirname, "node_modules")
            ],
            extensions: ['.js', '.jsx']
        },
        resolveLoader: {
            modules: [
                path.join(__dirname, "node_modules")
            ]
        },
        devtool: utils.hasArgument(process.argv, '--inline') ? "inline-source-map" : "eval"
    };

    var babelSettings = {
        cacheDirectory: true,
        presets: [[__dirname + "/node_modules/babel-preset-es2015", {
            "modules": false
        }], __dirname + "/node_modules/babel-preset-es2016", __dirname + "/node_modules/babel-preset-es2017", __dirname + '/node_modules/babel-preset-react'],
        compact: false
    };

    async.map(jsCompileList, function (jsCompileItem, callback) {
        var rebuildCompile = false;
        var contextPath = path.join(global.staticDirectory, global.srcPrefix, 'js');
        var staticFilesSourceDir = path.join(global.staticDirectory, global.srcPrefix);
        var entryPath = './' + jsCompileItem.path.replace(utils.normalizePath(contextPath), '');
        var config = {
            context: contextPath,
            entry: entryPath,
            plugins: [],
            output: {
                path: path.join(global.staticDirectory, global.deployPrefix, 'js', utils.normalizePath(path.dirname(jsCompileItem.path)).replace(utils.normalizePath(contextPath), '')),
                filename: "bundle.js",
                chunkFilename: "[id].bundle.js",
                publicPath: utils.normalizePath(path.join("/sf/", utils.normalizePath(path.join(global.deployPrefix, 'js', utils.normalizePath(path.dirname(jsCompileItem.path)).replace(utils.normalizePath(contextPath), ''))), '/'))
            }
        };

        config.externals = {
            "react": "React",
            "react-dom": "ReactDOM",
            "redux": "Redux",
            "react-redux": "ReactRedux",
            "react-router": "ReactRouter",
            "immutable": "Immutable"
        };

        config.module = {rules: utils.getRules()};
        utils.extendConfig(config, commonConfig);

        if (jsCompileItem.babel) {
            config.module.rules.push({
                test: /\.(js|jsx)$/,
                use: [{loader: 'babel-loader', options: babelSettings}],
                exclude: /(node_modules|bower_components)/,
                include: [staticFilesSourceDir]
            });
        }

        var compiler = webpack(config);
        compiler.watch({
            aggregateTimeout: 300,
            poll: true
        }, function (err, stats) {
            if (err) {
                throw err;
            }

            if (stats.hasErrors()) {
                console.log('ERROR start ==============================================================');
                console.log(stats.toString());
                console.log('ERROR end   ==============================================================');
            } else {
                console.log(stats.toString());
            }

            if (rebuildCompile) {
                console.log('rebuild complete!');
                if (global.socket) {
                    global.socket.emit("refresh", {"refresh": 1});
                    console.log("files changed： trigger refresh...");
                }
            }

            if (typeof callback == 'function') {
                callback();
            }

            if (!rebuildCompile) {
                rebuildCompile = true;
                callback = null;
            }
        });
    }, function (err) {
        if (err) {
            throw err;
        }

        //如果有需要使用react-hot-loader的入口JS
        if (jsCompileListWithPureReact.length) {
            var entryList = {};
            var debugDomain = typeof options.debugDomain == 'string' ? options.debugDomain : 'local.wenwen.sogou.com';
            jsCompileListWithPureReact.forEach(function (jsCompileItemWithPureReact) {
                var entryKey = jsCompileItemWithPureReact.path.replace(utils.normalizePath(path.join(global.staticDirectory, 'src/')), 'sf/deploy/').replace('/main.js', '');
                entryList[entryKey] = [
                    'react-hot-loader/patch',
                    'webpack-hot-middleware/client?reload=true',
                    jsCompileItemWithPureReact.path
                ];
            });

            var staticFilesSourceDir = path.join(global.staticDirectory, global.srcPrefix);

            var config = {
                devtool: "eval",
                entry: entryList,
                plugins: [
                    new webpack.HotModuleReplacementPlugin(),
                    new webpack.NoEmitOnErrorsPlugin(),
                    new webpack.LoaderOptionsPlugin({
                        options: {context: __dirname}
                    })
                ],
                output: {
                    path: path.join(__dirname, 'deploy'),
                    filename: "[name]/bundle.js",
                    chunkFilename: "[id].bundle.js",
                    publicPath: 'http://' + debugDomain + ':' + global.hotPort + '/'
                }
            };

            config.module = {rules: utils.getRules()};
            utils.extendConfig(config, commonConfig);
            config.externals = {};

            config.module.rules.push({
                test: /\.(js|jsx)$/,
                use: [{
                    loader: 'babel-loader', options: babelSettings
                }],
                include: [staticFilesSourceDir]
            });

            var express = require('express');
            var app = express();
            var compiler = webpack(config);

            app.use(require('webpack-dev-middleware')(compiler, {
                publicPath: config.output.publicPath
            }));

            app.use(require('webpack-hot-middleware')(compiler));

            app.get('*', function (req, res) {

            });

            app.listen(global.hotPort, function (err) {
                if (err) {
                    return console.error(err);
                }

                console.log('Hot loader server start listening at http://' + debugDomain + ':' + global.hotPort + '/');
            });
        }

        if (!utils.hasArgument(process.argv, '--norefresh')) {
            gulp.task('default', function () {
                var watchFiles = [];

                webappDirectoryList.forEach(function (item, index) {
                    var webappViewSrcDir = item + '/src/main/webapp/WEB-INF/view/src/';
                    watchFiles.push(path.join(webappViewSrcDir + "/**/*.vm"));
                    watchFiles.push(path.join(webappViewSrcDir + "/**/*.html"));
                    watchFiles.push(path.join(webappViewSrcDir + "/**/*.tpl"));
                });
                watchFiles.push(cssCompileList);
                console.log('watchFiles List: ');
                console.log(watchFiles);
                gulp.watch(watchFiles).on('change', function () {
                    if (global.socket) {
                        global.socket.emit("refresh", {"refresh": 1});
                        console.log("files changed： trigger refresh...");
                    }
                });
                utils.startWebSocketServer();
            });

            gulp.start();
        } else {
            console.log('status: norefresh');
        }
    });
};