const webpack = require("webpack");
const path = require("path");
const utils = require('./lib/utils');
module.exports = function (
    {
        jsCompileItem,
        externals,
        commonConfig,
        babelSettings,
        preact,
        np,
        staticDirectory,
        srcPrefix,
        sfPrefix,
        deployPrefix
    },
    callback) {
    const contextPath = path.join(staticDirectory, srcPrefix, 'js');
    const staticFilesSourceDir = path.join(staticDirectory, srcPrefix);
    const entryItem = jsCompileItem.path.replace(utils.normalizePath(contextPath) + "/", '');
    const entryPath = './' + entryItem;
    const config = {
        context: contextPath,
        entry: entryPath,
        output: {
            jsonpFunction: utils.uniqueVal(),
            path: path.join(staticDirectory, deployPrefix, 'js', utils.normalizePath(path.dirname(jsCompileItem.path)).replace(utils.normalizePath(contextPath), '')),
            filename: "bundle.js",
            chunkFilename: "[name].bundle.js",
            publicPath: utils.normalizePath(path.join(sfPrefix, utils.normalizePath(path.join(deployPrefix, 'js', utils.normalizePath(path.dirname(jsCompileItem.path)).replace(utils.normalizePath(contextPath), ''))), '/'))
        }
    };

    config.externals = externals;
    config.module = { rules: utils.getRules() };
    utils.extendConfig(config, commonConfig);
    const jsRules = {
        test: /\.(js|jsx)$/,
        use: [{ loader: 'babel-loader', options: JSON.stringify(babelSettings) }],
        exclude: /(node_modules|bower_components)/,
        include: [staticFilesSourceDir]
    };
    if (np) {//针对模板工程需要引用工程下前端公用私有npm包
        jsRules.exclude = [path.join(__dirname, 'node_modules'), /bower_components/];
        jsRules.include = [path.join(staticDirectory, '../node_modules/@ares'), staticDirectory, /clientLib/];
    }
    config.module.rules.push(jsRules);

    let rebuildCompile = false;
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
        }

        if (!rebuildCompile) {
            rebuildCompile = true;
            callback();
        }
    });
};