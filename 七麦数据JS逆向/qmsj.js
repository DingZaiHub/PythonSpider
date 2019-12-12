function _(n) {
    return new Buffer.from(encodeURIComponent(n).replace(/%([0-9A-F]{2})/g, function(a, n) {
        return i("0x" + n)
    })).toString('base64')
}
function i(n) {
    return String["fromCharCode"](n)
}
function k(a, n) {
    n || (n = o()),
    a = a.split("");
    for (var t = a.length, e = n["length"], r = "charCodeAt", m = 0; m < t; m++)
        a[m] = i(a[m][r](0) ^ n[(m + 10) % e][r](0));
    return a["join"]("")
}
function analysis(url, params) {
    var e = +new Date() - 140173 - 1515125653845
    , i = []
    , r = ""
    , R = "@#";
    if (params) {
        params = JSON.parse(params)
        Object.keys(params)["forEach"](function(a) {
            if (a == "analysis")
                return !1;
            params["hasOwnProperty"](a) && i["push"](params[a])
        })
    }
    i = i["sort"]()["join"](""),
    i = _(i),
    i += R + url.replace("https://api.qimai.cn", ""),
    i += R + e,
    i += R + 1,
    r = _(k(i, "00000008d78d46a"))
    return r
}
var params = {
    brand: "all",
    country: "cn",
    device: "iphone",
    genre: "5000"
}
console.log(analysis("https://api.qimai.cn/rank/indexPlus/brand_id/1", JSON.stringify(params)))
