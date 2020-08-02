/**
 * 和ares-logger保持一致
 * @param {*} opts 
 */
const ip = require('ip');
const serverIP = ip.address();

function getCurrentDatetime() {
    const _time = new Date();
    const _hour =
        _time.getHours() < 10 ? `0${_time.getHours()}` : `${_time.getHours()}`;
    const _minute =
        _time.getMinutes() < 10
            ? `0${_time.getMinutes()}`
            : `${_time.getMinutes()}`;
    const _second =
        _time.getSeconds() < 10
            ? `0${_time.getSeconds()}`
            : `${_time.getSeconds()}`;
    const _ms =
        _time.getMilliseconds() < 10
            ? `00${_time.getMilliseconds()}`
            : _time.getMilliseconds() < 100
                ? `0${_time.getMilliseconds()}`
                : `${_time.getMilliseconds()}`;

    const _year = _time.getFullYear();
    const _month =
        _time.getMonth() + 1 < 10
            ? `0${_time.getMonth() + 1}`
            : `${_time.getMonth() + 1}`;
    const _date =
        _time.getDate() < 10 ? `0${_time.getDate()}` : `${_time.getDate()}`;

    return `${_year}-${_month}-${_date} ${_hour}:${_minute}:${_second}.${_ms}`;
}

function formatIp(ipStr) {
    try {
        ipStr = ipStr.split(",")[0];
        ipStr = ipStr.length ? ipStr.replace("::ffff:", "") : "";
    } catch (err) { }

    return ipStr;
}

function errLog(opts) {
    const ctx = opts && opts.ctx ? opts.ctx : {};
    const err = opts && opts.err ? opts.err : {};

    let stack = "";
    if (err && err.stack) {
        stack = JSON.stringify(err.stack)
            .replace(/\\n/gi, "")
            .replace(/\s*/gi, "")
            .replace(/\"/gi, "");
    }

    const interStr = (ctx.req && ctx.req.url) || "";

    const log = {
        logtime: getCurrentDatetime(),
        aresid: (ctx && ctx.req && ctx.req.traceid) || "notraceid",
        errorType: (err && err.errType) || "aresNextNonFatalError",
        method: (ctx && ctx.method) || "unknown",
        business: ctx && ctx.req && ctx.req.__BUSINESS__ || "unknownbusiness",
        interface: interStr || "unknowpath",
        errorMessage: (err && err.message) || "nomessage",
        errorStack: stack || "nostack",
        url: (ctx && ctx.req.url) || "-",
        clientIP: formatIp(
            (ctx && ctx.req.headers && ctx.req.headers["x-real-ip"]) ||
            (ctx && ctx.ip) ||
            "127.0.0.1"
        ),
        serverIP: serverIP,
        status: "404",
        referrer: (ctx && ctx.req.headers && ctx.req.headers.referer) || "-",
        userAgent: (ctx && ctx.req.headers && ctx.req.headers["user-agent"]) || "-",
        cookie: (ctx && ctx.req.headers && ctx.req.headers.cookie) || "-"
    };

    if (
        ctx &&
        ctx.request &&
        ctx.request.method &&
        ctx.request.method.toLowerCase() === "post"
    ) {
        log.postBody = ctx.request.body || ctx.request.rawBody || "-";
    }

    return log;
}

module.exports = function (ctx, err) {
    //console.log(ctx);
    const log = errLog({ ctx, err });

    console.log(JSON.stringify(log));
};