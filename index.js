const path = require('path');
const utils = require('./lib/utils');
const validate = require('./lib/validate');
const workerFarm = require("worker-farm");
const os = require('os');
const chokidar = require("chokidar");
global.srcPrefix = '/src/';
global.deployPrefix = '/deploy/';
global.localStaticResourcesPrefix = /\/sf/;
global.sfPrefix = '/sf/';
// In some cases cpus() returns undefined
// https://github.com/nodejs/node/issues/19022
const cpus = os.cpus() || { length: 1 };
let maxConcurrentWorkers = cpus.length;
if (maxConcurrentWorkers <= 2) {
    maxConcurrentWorkers = 1;
} else if (maxConcurrentWorkers <= 4) {
    maxConcurrentWorkers = 2;
} else if (maxConcurrentWorkers > 4) {
    maxConcurrentWorkers = 4;
}

const workerOptions = process.platform === 'win32' ?
    {
        maxConcurrentWorkers: maxConcurrentWorkers,
        maxConcurrentCallsPerWorker: 1
    } : { maxConcurrentWorkers: maxConcurrentWorkers };
const workers = workerFarm(workerOptions, require.resolve('./webpack-compiler'));
exports = module.exports = function (options) {
    const { jsCompileList } = validate(options);
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
    if (options.np) {//公用的客户端私有npm包需要从项目目录下查找依赖包
        commonConfig.resolve.modules.push(path.join(options.staticFilesDirectory, '../node_modules'));
    }

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
        "preact": "preact",
        "antd": "antd"
    };

    const preact = !!options.preact;
    const np = !!options.np;
    const { staticDirectory, srcPrefix, deployPrefix, webappDirectoryList, cssCompileList, sfPrefix } = global;
    let _leftCompileLen = jsCompileList.length;
    for (let i = 0, len = jsCompileList.length; i < len; i++) {
        const jsCompileItem = jsCompileList[i];

        workers({ jsCompileItem, externals, commonConfig, babelSettings, preact, np, staticDirectory, srcPrefix, sfPrefix, deployPrefix, webappDirectoryList, cssCompileList, childId: i }, () => {
            _leftCompileLen = _leftCompileLen - 1;
            if (!_leftCompileLen) {
                console.log(`**************** total compile time: ${new Date() - global.startCompile}ms ****************`);

                if (!utils.hasArgument(process.argv, '--norefresh')) {
                    let templateWatchFiles = [];

                    webappDirectoryList.forEach(function (item) {
                        const webappViewSrcDir = options.np ? item : item + '/src/main/webapp/WEB-INF/view/src/';

                        templateWatchFiles.push(path.join(webappViewSrcDir + "/**/*.vm"));
                        templateWatchFiles.push(path.join(webappViewSrcDir + "/**/*.html"));
                        templateWatchFiles.push(path.join(webappViewSrcDir + "/**/*.tpl"));
                        templateWatchFiles.push(path.join(webappViewSrcDir + "/**/*.njk"));
                    });
                    templateWatchFiles = templateWatchFiles.concat(cssCompileList);
                    console.log('templateWatchFiles List: ');
                    console.log(templateWatchFiles);
                    utils.startWebSocketServer();
                    chokidar.watch(templateWatchFiles).on('change', () => {
                        if (global.socket) {
                            global.socket.emit("refresh", { "refresh": 1 });
                            console.log("some files changed: trigger refresh...");
                        }
                    }).on('unlink', () => {
                        if (global.socket) {
                            global.socket.emit("refresh", { "refresh": 1 });
                            console.log("some files deleted: trigger refresh...");
                        }
                    });

                    const watcher = chokidar.watch(path.join(global.staticDirectory, global.deployPrefix));

                    watcher.on("change", () => {
                        if (global.socket) {
                            global.socket.emit("refresh", { "refresh": 1 });
                            console.log("some static files changed: trigger refresh...");
                        }
                    }).on("unlink", () => {
                        if (global.socket) {
                            global.socket.emit("refresh", { "refresh": 1 });
                            console.log("some static files deleted: trigger refresh...");
                        }
                    });
                } else {
                    console.log('status: norefresh');
                }
            }
        });
    }
    process.on("exit", function () {
        workerFarm.end(workers);
    });
};