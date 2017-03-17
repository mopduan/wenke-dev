var fs = require('fs');
var path = require('path');

/**
 *
 * @param jsonArray
 * @returns {Array}
 */
function jsonArrayUnique(jsonArray) {
    var n = {}, r = [];
    for (var i = 0; i < jsonArray.length; i++) {
        if (!n[jsonArray[i].path]) {
            n[jsonArray[i].path] = true;
            r.push(jsonArray[i]);
        }
    }
    return r;
}

exports.jsonArrayUnique = jsonArrayUnique;

/**
 *
 * @param errorInfo
 */
function errorHandler(errorInfo) {
    console.log(errorInfo);
    process.exit();
}

exports.errorHandler = errorHandler;

/**
 * 判断是否为整数
 * @param x
 * @returns {boolean}
 */
function isInt(x) {
    var y = parseInt(x, 10);
    return !isNaN(y) && x == y && x.toString() == y.toString();
}

exports.isInt = isInt;

/**
 *
 * @param arr
 * @param search
 * @returns {boolean}
 */
function isInArray(arr, search) {
    if (typeof arr == 'object' && typeof arr.length == 'number') {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == search) {
                return true;
            }
        }
    }

    return false;
}

exports.isInArray = isInArray;

/**
 *
 * @param path
 * @returns {string}
 */
function normalizePath(path) {
    if (typeof path == 'string') {
        return path.replace(/[\\|\\\\|//|////]/ig, '/');
    }

    return path;
}

exports.normalizePath = normalizePath;


/**
 * 获取本地调试下的静态资源前缀
 * @returns {RegExp}
 */
function getRegexpStaticFilesPrefix() {
    global.debugDomain.lastIndex = 0;
    return global.debugDomain;
}

exports.getRegexpStaticFilesPrefix = getRegexpStaticFilesPrefix;

/**
 *
 * @param dir
 * @param list
 * @param extension
 * @returns {*}
 */
function getAllFilesByDir(dir, list, extension) {
    if (!(list instanceof Array)) {
        list = [];
    }

    var fileList = fs.readdirSync(dir);

    for (var i = fileList.length - 1; i >= 0; i--) {
        var filePath = path.join(dir, fileList[i]);

        var stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            getAllFilesByDir(filePath, list, extension);
        } else {
            if (isInArray(extension, path.extname(filePath))) {
                list.push(normalizePath(filePath));
            }
        }
    }

    return list;
}
exports.getAllFilesByDir = getAllFilesByDir;

/**
 *
 * @param dir
 */
function mkdirRecursive(dir) {
    if (fs.existsSync(dir)) {
        return;
    }

    if (!fs.existsSync(path.dirname(dir))) {
        mkdirRecursive(path.dirname(dir));
    }

    fs.mkdirSync(dir);
}

exports.mkdirRecursive = mkdirRecursive;


/**
 *
 * @param argv
 * @param search
 * @returns {boolean}
 */
function hasArgument(argv, search) {
    var ret = false;

    for (var i = 0; i < argv.length; i++) {
        if (argv[i] == search) {
            ret = true;
            break;
        }
    }
    return ret;
}
exports.hasArgument = hasArgument;

/**
 * 获取当前机器IP
 */
function getLocalIP() {
    var os = require('os');
    var interfaceList = os.networkInterfaces();
    var ip = '127.0.0.1';
    Object.keys(interfaceList).forEach(function (interfaceName) {
        interfaceList[interfaceName].forEach(function (interfaceItem) {
            //跳过非IPV4项
            if ('IPv4' !== interfaceItem.family || interfaceItem.internal !== false) {
                return;
            }

            //暂时不考虑有多个IPV4地址的情况
            ip = interfaceItem.address;
        });
    });

    return ip;
}

exports.getLocalIP = getLocalIP;

/**
 * 启动WebSocket服务, 用于监听文件修改信号
 */
function startWebSocketServer() {
    var app = require('http').createServer(function (req, res) {

    });
    var io = require('socket.io')(app);
    app.listen(global.livereloadPort);

    io.on('connection', function (socket) {
        global.socket = socket;
    });

    console.log("WebSocketServer running... port: " + global.livereloadPort);
}

exports.startWebSocketServer = startWebSocketServer;

/**
 * 扩展配置
 * @param originalConfig
 * @param additionalConfig
 */
function extendConfig(originalConfig, additionalConfig) {
    if (typeof originalConfig == 'object' && typeof additionalConfig == 'object') {
        for (var k in additionalConfig) {
            if (additionalConfig.hasOwnProperty(k)) {
                originalConfig[k] = additionalConfig[k];
            }
        }
    }
}

exports.extendConfig = extendConfig;

/**
 * 获取script标签正则
 * @returns {RegExp}
 */
function getRegexpScriptElements() {
    return /<script([\s\S\w\W]*?)>{1}?[\s\S\w\W]*?(<\/script>){1}?/ig;
}

exports.getRegexpScriptElements = getRegexpScriptElements;

/**
 * 获取script标签src属性匹配正则
 * @returns {RegExp}
 */
function getRegexpScriptElementSrcAttrValue() {
    return /<script[\s\S\w\W]+?src="([\s\S\w\W]+?)"[\s\S\w\W]*?>[\s\S\w\W]*?<\/script>/gi;
}

exports.getRegexpScriptElementSrcAttrValue = getRegexpScriptElementSrcAttrValue;

/**
 * 获取link标签正则
 * @returns {RegExp}
 */
function getRegexpCSSLinkElements() {
    return /<link((?![>])[\s\S\w\W])+?rel="stylesheet"((?![>])[\s\S\w\W])*?>{1}?/gi;
}

exports.getRegexpCSSLinkElements = getRegexpCSSLinkElements;

/**
 * 获取link标签的href匹配正则
 * @returns {RegExp}
 */
function getRegexpCSSHrefValue() {
    return /<link([\s\S\w\W]+?)href="(.+?)"([\s\S\w\W]*?)>{1}?/gi;
}

exports.getRegexpCSSHrefValue = getRegexpCSSHrefValue;

/**
 * 获取img标签正则
 * @returns {RegExp}
 */
function getRegexpImgElements() {
    return /<img[\S\s\W\w]+?src="(.+?)"[\S\s\W\w]+?/ig;
}

exports.getRegexpImgElements = getRegexpImgElements;

/**
 * 获取内联style属性里的backgroundImage匹配正则
 * @returns {RegExp}
 */
function getRegexpBackgroundImage() {
    return /:[\s]?url\(['|"]??(\$!?(\{)?.+?\(\)(})?[\w\W]+?)['|"]??\)/ig;
}

exports.getRegexpBackgroundImage = getRegexpBackgroundImage;

/**
 * 获取公用Loaders列表
 * @returns JSON Array
 */
function getRules() {
    return [
        {
            test: /\.(jpe?g|png|gif|svg)$/i,
            use: [
                {
                    loader: "file-loader",
                    options: {
                        "name": "[name].[ext]"
                    }
                }
            ]
        },
        {
            test: /\.(html|tpl)$/i, use: [
            {
                loader: "raw-loader"
            }
        ]
        },
        {
            test: /\.css$/i, use: [
            {
                loader: "style-loader"
            },
            {
                loader: "css-loader"
            }
        ]
        },
        {
            test: /\.vue/i, use: [
            {
                loader: "vue-loader"
            }
        ]
        }
    ];
}

exports.getRules = getRules;