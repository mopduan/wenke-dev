const webpack = require("webpack");
const async = require('async');
const gulp = require('gulp');
const fs = require('fs');
const path = require('path');
const utils = require('./lib/utils');
global.srcPrefix = '/src/';
global.deployPrefix = '/deploy/';
global.localStaticResourcesPrefix = /\/sf/;
global.sfPrefix = '/sf/';

exports = module.exports = function (options) {
    //支持小程序编译
    if (utils.hasArgument(process.argv, '--xcx')) {
        const less = require('gulp-less');
        const postcss = require('gulp-postcss');
        const autoprefixer = require('autoprefixer');
        const rename = require('gulp-rename');

        gulp.task('build:app', function () {
            gulp.src(['src/**/*', '!src/style{,/**}', '!src/app.less'], { base: 'src' })
                .pipe(gulp.dest('dist')).on('end', function () {
                    console.log('build:app complete!');
                });
        });

        gulp.task('build:style', function () {
            return gulp.src(['src/app.less'], { base: 'src' })
                .pipe(less())
                .pipe(postcss([autoprefixer(['iOS >= 7', 'Android >= 4.1'])]))
                .pipe(rename(function (path) {
                    path.extname = '.wxss';
                }))
                .pipe(gulp.dest('dist')).on('end', function () {
                    console.log('build:style complete!');
                });
        });

        gulp.task('watch', function () {
            gulp.watch(['src/**/*'], ['build:style', 'build:app']).on('change', function () {
                console.log('files change...');
            });
        });

        gulp.task('default', ['build:style', 'build:app', 'watch']);
        gulp.start();
    } else {
        const isHttps = utils.hasArgument(process.argv, '--https');
        const staticFilesDirectory = options.staticFilesDirectory;

        if (staticFilesDirectory && typeof staticFilesDirectory === 'string') {
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

        const webappDirectory = options.webappDirectory;
        let webappDirectoryList = [];
        if (webappDirectory && typeof webappDirectory === 'string') {
            webappDirectoryList = webappDirectory.split(',');
            webappDirectoryList.forEach(function (webappDirectoryPath) {
                if (!fs.existsSync(webappDirectoryPath)) {
                    throw new Error('can\'t find the webapp directory: ' + webappDirectoryPath);
                }
            });
        } else {
            throw new Error('can\'t find the arugment -w, this argument is webapp directory!');
        }

        let templateFileList = [];

        webappDirectoryList.forEach(function (item) {
            const templateViewSrcPagePath = path.join(item, '/src/main/webapp/WEB-INF/view/src/');

            if (!fs.existsSync(templateViewSrcPagePath)) {
                throw new Error('can\'t find the webapp velocity template directory: ' + templateViewSrcPagePath);
            }
            templateFileList = templateFileList.concat(utils.getAllFilesByDir(templateViewSrcPagePath, ['.vm', '.html', '.tpl']));
        });

        const defaultLiveReloadPort = 8999;
        const defaultHttpsLiveReloadPort = 8998;
        global.livereloadPort = typeof options.livereloadPort !== 'undefined' && utils.isInt(options.livereloadPort) ? parseInt(options.livereloadPort) : defaultLiveReloadPort;
        global.httpsLivereloadPort = typeof options.httpsLivereloadPort !== 'undefined' && utils.isInt(options.httpsLivereloadPort) ? parseInt(options.httpsLivereloadPort) : defaultHttpsLiveReloadPort;

        const cssCacheList = {};
        const cssCompileList = [];
        const regexpStaticFilesPrefix = utils.getRegexpStaticFilesPrefix();

        templateFileList.forEach(function (tplPath) {
            const tplContent = fs.readFileSync(tplPath).toString();

            tplContent.replace(utils.getRegexpCSSLinkElements(), function ($link) {
                $link.replace(utils.getRegexpCSSHrefValue(), function ($cssLink, $someSplitStr, $href) {
                    const cssPath = $href.replace(regexpStaticFilesPrefix, '');
                    if (!cssCacheList[cssPath]) {
                        if ($href && !($href.indexOf('http') === 0)) {
                            cssCompileList.push(path.join(global.staticDirectory, cssPath));
                            cssCacheList[cssPath] = true;
                        }
                    }

                    return $cssLink;
                });

                return $link;
            });
        });

        const jsCacheList = {};
        let jsCompileList = [];

        templateFileList.forEach(function (tplPath) {
            const tplContent = fs.readFileSync(tplPath).toString();
            tplContent.replace(utils.getRegexpScriptElements(), function ($1, $2) {
                if ($2.indexOf('type="text/html"') > -1 || $2.indexOf('x-template') > -1) {
                    return $1;
                }

                if ($2.toLowerCase().indexOf('release="false"') > -1) {
                    return $1;
                }

                $1.replace(utils.getRegexpScriptElementSrcAttrValue(), function ($2_1, $src) {
                    if ($src && global.localStaticResourcesPrefix.test($src)) {
                        const jsPath = $src.replace(regexpStaticFilesPrefix, '');

                        if (!jsCacheList[jsPath]) {
                            if ($src.indexOf('bundle.js') !== -1) {
                                const jsSrcPath = utils.normalizePath(path.join(global.staticDirectory, path.dirname(jsPath), 'main.js')).replace(global.deployPrefix, global.srcPrefix);

                                jsCompileList.push({
                                    "path": jsSrcPath
                                });

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

        const commonConfig = {
            cache: true,
            resolve: {
                modules: [
                    path.join(__dirname, "node_modules")
                ],
                extensions: ['.js', '.jsx'],
                alias: options.preact ? {
                    'react': 'preact-compat',
                    'react-dom': 'preact-compat'
                } : {}
            },
            resolveLoader: {
                modules: [
                    path.join(__dirname, "node_modules")
                ]
            },
            devtool: "inline-source-map"
        };

        const _presets = [
            [__dirname + "/node_modules/babel-preset-es2015", { "modules": false }],
            __dirname + "/node_modules/babel-preset-es2016",
            __dirname + "/node_modules/babel-preset-es2017",
            __dirname + "/node_modules/babel-preset-stage-3"
        ];

        if (options.preact) {
            _presets.push(__dirname + "/node_modules/babel-preset-preact");
        } else {
            _presets.push(__dirname + "/node_modules/babel-preset-react");
        }

        const babelSettings = {
            cacheDirectory: true,
            presets: _presets,
            compact: false,
            plugins: [
                __dirname + "/node_modules/babel-plugin-transform-decorators-legacy",
                __dirname + "/node_modules/babel-plugin-syntax-dynamic-import",
                __dirname + "/node_modules/babel-plugin-transform-react-loadable",
            ]
        };

        async.map(jsCompileList, function (jsCompileItem, callback) {
            let rebuildCompile = false;
            const contextPath = path.join(global.staticDirectory, global.srcPrefix, 'js');
            const staticFilesSourceDir = path.join(global.staticDirectory, global.srcPrefix);
            const entryPath = './' + jsCompileItem.path.replace(utils.normalizePath(contextPath), '');
            const config = {
                context: contextPath,
                entry: entryPath,
                plugins: [
                    new webpack.DefinePlugin({
                        __DEVTOOLS__: options.preact ? true : false
                    })
                ],
                output: {
                    path: path.join(global.staticDirectory, global.deployPrefix, 'js', utils.normalizePath(path.dirname(jsCompileItem.path)).replace(utils.normalizePath(contextPath), '')),
                    filename: "bundle.js",
                    chunkFilename: "[name].bundle.js",
                    publicPath: utils.normalizePath(path.join(global.sfPrefix, utils.normalizePath(path.join(global.deployPrefix, 'js', utils.normalizePath(path.dirname(jsCompileItem.path)).replace(utils.normalizePath(contextPath), ''))), '/'))
                }
            };

            config.externals = {
                "react": "React",
                "react-dom": "ReactDOM",
                "redux": "Redux",
                "react-redux": "ReactRedux",
                "react-router": "ReactRouter",
                "react-router-dom": "ReactRouterDOM",
                "preact-redux": "preactRedux",
                "immutable": "Immutable"
            };

            config.module = { rules: utils.getRules() };
            utils.extendConfig(config, commonConfig);

            config.module.rules.push({
                test: /\.(js|jsx)$/,
                use: [{ loader: 'babel-loader', options: JSON.stringify(babelSettings) }],
                exclude: /(node_modules|bower_components)/,
                include: [staticFilesSourceDir]
            });

            const compiler = webpack(config);
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
                        global.socket.emit("refresh", { "refresh": 1 });
                        console.log("files changed： trigger refresh...");
                    }

                    if (isHttps && global.httpsSocket) {
                        global.httpsSocket.emit("refresh", { "refresh": 1 });
                        console.log("[https] files changed: trigger refresh...");
                    }
                }

                if (!rebuildCompile) {
                    rebuildCompile = true;
                    if (typeof callback === 'function') {
                        callback();
                    }
                }
            });
        }, function (err) {
            if (err) {
                throw err;
            }

            if (!utils.hasArgument(process.argv, '--norefresh')) {
                gulp.task('default', function () {
                    const watchFiles = [];

                    webappDirectoryList.forEach(function (item) {
                        const webappViewSrcDir = item + '/src/main/webapp/WEB-INF/view/src/';

                        watchFiles.push(path.join(webappViewSrcDir + "/**/*.vm"));
                        watchFiles.push(path.join(webappViewSrcDir + "/**/*.html"));
                        watchFiles.push(path.join(webappViewSrcDir + "/**/*.tpl"));
                    });
                    watchFiles.push(cssCompileList);
                    console.log('watchFiles List: ');
                    console.log(watchFiles);
                    gulp.watch(watchFiles).on('change', function () {
                        if (global.socket) {
                            global.socket.emit("refresh", { "refresh": 1 });
                            console.log("files changed： trigger refresh...");
                        }

                        if (isHttps && global.httpsSocket) {
                            global.httpsSocket.emit("refresh", { "refresh": 1 });
                            console.log("[https] file changed: trigger refresh...");
                        }
                    });
                    utils.startWebSocketServer(isHttps);
                });

                gulp.start();
            } else {
                console.log('status: norefresh');
            }
        });
    }
};