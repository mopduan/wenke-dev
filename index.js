const webpack = require("webpack");
const gulp = require('gulp');
const path = require('path');
const utils = require('./lib/utils');
const validate = require('./lib/validate');
global.srcPrefix = '/src/';
global.deployPrefix = '/deploy/';
global.localStaticResourcesPrefix = /\/sf/;
global.sfPrefix = '/sf/';

exports = module.exports = function (options) {
    const { webappDirectoryList, staticDirectory, jsCompileList, cssCompileList } = validate(options);
    const isHttps = utils.hasArgument(process.argv, '--https');
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
        devtool: "inline-source-map",
        mode: "development"
    };

    const _presets = [
        __dirname + "/node_modules/@babel/preset-env"
    ];

    if (options.preact) {
        _presets.push([__dirname + "/node_modules/@babel/preset-react", { "pragma": "h" }]);
    } else {
        _presets.push(__dirname + "/node_modules/@babel/preset-react");
    }

    const babelSettings = {
        cacheDirectory: true,
        presets: _presets,
        compact: false,
        plugins: [
            [__dirname + "/node_modules/@babel/plugin-proposal-decorators", { legacy: true }],
            [__dirname + "/node_modules/@babel/plugin-proposal-class-properties", { "loose": false }],
            __dirname + "/node_modules/@babel/plugin-syntax-dynamic-import",
            __dirname + "/node_modules/@babel/plugin-syntax-import-meta"
        ]
    };

    const externals = {
        "react": "React",
        "react-dom": "ReactDOM",
        "redux": "Redux",
        "react-redux": "ReactRedux",
        "react-router": "ReactRouter",
        "react-router-dom": "ReactRouterDOM",
        "preact-redux": "preactRedux",
        "immutable": "Immutable",
        "preact": "preact"
    };

    const contextPath = path.join(global.staticDirectory, global.srcPrefix, 'js');
    const staticFilesSourceDir = path.join(global.staticDirectory, global.srcPrefix);
    let compilerPromiseList = [];
    jsCompileList.forEach(jsCompileItem => {
        compilerPromiseList.push(new Promise((resolve, reject) => {
            let rebuildCompile = false;
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

            config.externals = externals;

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
                    resolve();
                }
            });
        }))
    });

    let allCompilePromise = Promise.all(compilerPromiseList);
    allCompilePromise.then(() => {
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
    })
};