const fs = require('fs');
const path = require('path');
const utils = require('../lib/utils');
exports = module.exports = function (options) {
    const { staticFilesDirectory, webappDirectory } = options;
    let webappDirectoryList = [], //所有的webapp工程
        jsCompileList = []; //待编译的js文件集合
    const cssCompileList = []; //模板中引用的所有css文件集合

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


    if (webappDirectory && typeof webappDirectory === 'string') {
        webappDirectoryList = webappDirectory.split(',');
        global.webappDirectoryList = webappDirectoryList;
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


    const regexpStaticFilesPrefix = utils.getRegexpStaticFilesPrefix();

    const cssCacheList = {};
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

    global.cssCompileList = cssCompileList;

    const jsCacheList = {};
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

    return {
        jsCompileList,
    }
}