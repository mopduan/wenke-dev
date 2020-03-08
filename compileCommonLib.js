const webpack = require('webpack');
const Koa = require('koa');
const fs = require('fs');
const koaWebpackDevMiddleware = require('koa-webpack-dev-middleware');
const del = require('del');
const path = require('path');
const http = require('http');

module.exports = function (dir) {

    if (!fs.existsSync(dir)) {
        throw new Error("can not find this dir" + dir);
    }

    const app = new Koa();
    const contextdir = dir;
    /** 
     * 添加新的公共文件需要修改对应入口文件
     */
    const entries = {
        "deploy/js/lib/wenke/main.js": "./src/wenke/main.js",
        "deploy/js/lib/connectLogin/pc/main.js": "./src/connectLogin/pc/main.js",
        "deploy/js/lib/connectLogin/wap/main.js": "./src/connectLogin/wap/main.js",
        "deploy/js/lib/deploy-test/main.js": "./src/deploy-test/main.js",
        "deploy/js/lib/404.js": "./src/404/404.js",
        "deploy/js/lib/share/mobileShare.js": "./src/share/mobileShare.js",
        "deploy/js/lib/hhy/main.js": "./src/hhy/main.js",
        "deploy/js/lib/reportAjax/main.js": "./src/reportAjax/main.js",
        "deploy/js/lib/realNameVerify/main.js": "./src/realNameVerify/main.js",
        "deploy/js/lib/ie8tips/main.js": './src/ie8tips/main.js'
    };

    let rebuild = false;

    const compiler = webpack({
        mode: 'development',
        context: contextdir,
        entry: entries,
        devtool: "inline-source-map",
        resolve: {
            extensions: ['.js', '.jsx'],
            modules: [path.join(contextdir, "node_modules")]
        },
        resolveLoader: {
            modules: [path.join(__dirname, "node_modules")]
        },
        module: {
            rules: [
                {
                    test: /\.jsx?$/,
                    include: contextdir,
                    exclude: /node-modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            cacheDirectory: false,
                            presets: [
                                [require.resolve('@babel/preset-env'), { modules: false }],
                                require.resolve('@babel/preset-react')],
                            compact: false,
                            plugins: [
                                [__dirname + "/node_modules/@babel/plugin-proposal-decorators", { legacy: true }],
                                [__dirname + "/node_modules/@babel/plugin-proposal-class-properties", { "loose": false }],
                                __dirname + "/node_modules/@babel/plugin-syntax-import-meta"
                            ]
                        }
                    }
                },
                {
                    test: /\.css$/,
                    use: [
                        {
                            loader: 'style-loader'
                        },
                        {
                            loader: 'css-loader'
                        }
                    ]
                },
                {
                    test: /\.(jpe?g|png|gif|svg|eot|ttf|woff|woff2)$/i,
                    use: {
                        loader: 'file-loader',
                        options: {
                            'name': "[name].[ext]"
                        }
                    }
                }
            ]
        },
        output: {
            hashFunction: 'sha256',
            hashDigest: 'hex',
            filename: "[name]",
            chunkFilename: "deploy/js/lib/[id].js",
            publicPath: "http://localhost:2080/",
            jsonpFunction: "commonLibJsonp"
        }
    });

    compiler.hooks.done.tap('WebpackDevMiddleware', function (stats) {
        console.log(Object.keys(stats.compilation.assets));
        if (rebuild && global.socket) {
            console.log('\n ===== Webpack rebuild done! =====\n');
            console.log('emit refresh');

            global.socket.emit('refresh', { refresh: true });
        }

        if (!rebuild) {
            rebuild = true;
        }
    });

    // 将打包好的文件以 localhost:2080/[output.filename] 在内存中服务，无硬盘 IO
    app.use(koaWebpackDevMiddleware(compiler));

    const server = http.createServer(app.callback());
    const io = require('socket.io')(server);

    server.listen(2080);

    io.on('connection', function (socket) {
        global.socket = socket;
    });

    server.on("listening", async err => {
        if (err) {
            throw err;
        }
        console.log(`\nWebpack dev server starts on port: 2080.\n`);
    });
};