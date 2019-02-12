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
    const { webappDirectoryList, jsCompileList, cssCompileList } = validate(options);
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
    const entry = {};
    let rebuildCompile = false, chunkFileNamePrefix;
    const oneEntryJs = jsCompileList[0];
    jsCompileList.forEach(jsCompileItem => {
        const entryItem = jsCompileItem.path.replace(utils.normalizePath(contextPath) + "/", '');
        entry[entryItem.replace('main.js', 'bundle.js')] = './' + entryItem;
        if (!chunkFileNamePrefix) {
            chunkFileNamePrefix = entryItem.substring(0, entryItem.indexOf('/') + 1);
            global.chunkFileNamePrefix = chunkFileNamePrefix;
        }
    });
    const config = {
        context: contextPath,
        entry: entry,
        plugins: [
            new webpack.DefinePlugin({
                __DEVTOOLS__: options.preact ? true : false
            })
        ],
        output: {
            path: path.join(global.staticDirectory, global.deployPrefix, 'js'),
            filename: "[name]",
            chunkFilename: chunkFileNamePrefix + "_chunks/[name].bundle.js",
            publicPath: utils.normalizePath(path.join(global.sfPrefix, utils.normalizePath(path.join(global.deployPrefix, 'js')), '/'))
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
            console.log('rebuild complete!', (stats.endTime - stats.startTime) + "ms");
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

            console.log(`**************** total compile time: ${new Date() - global.startCompile}ms ****************`);
            if (!utils.hasArgument(process.argv, '--norefresh')) {
                let watchFiles = [];

                webappDirectoryList.forEach(function (item) {
                    const webappViewSrcDir = item + '/src/main/webapp/WEB-INF/view/src/';

                    watchFiles.push(path.join(webappViewSrcDir + "/**/*.vm"));
                    watchFiles.push(path.join(webappViewSrcDir + "/**/*.html"));
                    watchFiles.push(path.join(webappViewSrcDir + "/**/*.tpl"));
                });
                watchFiles = watchFiles.concat(cssCompileList);
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
            } else {
                console.log('status: norefresh');
            }
        }
    });
};