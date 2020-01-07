# http://www.ahtba.org.cn/  安徽省招标投标信息网

import requests, re, execjs


s = requests.Session()
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4018.0 Safari/537.36',
}


def get_eval():
    # 第一次访问网站，获取eval函数内的字符
    response = s.get('http://www.ahtba.org.cn/', headers=headers)
    response.encoding = response.apparent_encoding
    # print(response.text)
    pattern = re.compile(r"eval\((functi.*?\))\);", re.S)
    result = re.findall(pattern, response.text)
    result = result[0] if result else ""
    # print(result)
    return result


def get_url(result):
    # 将拿到的字符传入js解密，获取加密后的链接
    js = """
        eval(%s);
        function _0x412a72(_0x2a28c0) {
            var _0x4257c9 = {
                'mGirf': function _0x2eb028(_0x5ab0bc, _0x5505f4) {
                    return _0x5ab0bc < _0x5505f4;
                },
                'hOkXt': function _0x16449b(_0x22286c, _0x41c8cd) {
                    return _0x22286c & _0x41c8cd;
                },
                'RJeYY': function _0x24beb6(_0x59303b, _0x576d3b) {
                    return _0x59303b == _0x576d3b;
                },
                'cFxMb': function _0x45b03c(_0xadce3d, _0x5416a9) {
                    return _0xadce3d >> _0x5416a9;
                },
                'spzgJ': function _0x3c313d(_0x19fd11, _0xcacabb) {
                    return _0x19fd11 << _0xcacabb;
                },
                'VdlKD': function _0x2427d5(_0x23b25b, _0x23b39e) {
                    return _0x23b25b & _0x23b39e;
                },
                'VDeWo': function _0x1ef1b0(_0x476993, _0x40dd2a) {
                    return _0x476993 == _0x40dd2a;
                },
                'gHLRp': function _0x16afb3(_0x4bdebb, _0x1065a7) {
                    return _0x4bdebb >> _0x1065a7;
                },
                'biRta': function _0x301047(_0x2ada60, _0x1c4232) {
                    return _0x2ada60 | _0x1c4232;
                },
                'oKMpY': function _0x1d0b02(_0x547e37, _0x500868) {
                    return _0x547e37 << _0x500868;
                },
                'HlUXJ': function _0x21902c(_0x16ae1a, _0x466bbf) {
                    return _0x16ae1a >> _0x466bbf;
                },
                'vuJTm': function _0x2fea95(_0x34f7b5, _0x59e46f) {
                    return _0x34f7b5 << _0x59e46f;
                },
                'lHuwG': function _0x1339d0(_0x3c775a, _0x3450ae) {
                    return _0x3c775a >> _0x3450ae;
                },
                'fpeDs': function _0x52b661(_0x318fc3, _0x59aa7b) {
                    return _0x318fc3 & _0x59aa7b;
                },
                'HqwlU': function _0x2144ca(_0x4799d4, _0x25b745) {
                    return _0x4799d4 | _0x25b745;
                },
                'nPBKx': function _0x42b833(_0xe339b1, _0x5c500c) {
                    return _0xe339b1 & _0x5c500c;
                },
                'ZRhVT': function _0xc9529d(_0x5ed560, _0x4383da) {
                    return _0x5ed560 & _0x4383da;
                },
            };
            var _0x2097d8 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var _0x27d1f5, _0x4262d0, _0xc876d4;
            var _0x5526a7, _0x138cf5, _0x4093e6;
            _0xc876d4 = _0x2a28c0['length'];
            _0x4262d0 = 0x0;
            _0x27d1f5 = '';
            while (_0x4257c9["mGirf"](_0x4262d0, _0xc876d4)) {
                _0x5526a7 = _0x4257c9["hOkXt"](_0x2a28c0['charCodeAt'](_0x4262d0++), 0xff);
                if (_0x4257c9['RJeYY'](_0x4262d0, _0xc876d4)) {
                    _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9["cFxMb"](_0x5526a7, 0x2));
                    _0x27d1f5 += _0x2097d8['charAt'](_0x4257c9["spzgJ"](_0x4257c9["VdlKD"](_0x5526a7, 0x3), 0x4));
                    _0x27d1f5 += '==';
                    break;
                }
                _0x138cf5 = _0x2a28c0['charCodeAt'](_0x4262d0++);
                if (_0x4257c9["VDeWo"](_0x4262d0, _0xc876d4)) {
                    _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9['gHLRp'](_0x5526a7, 0x2));
                    _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9["biRta"](_0x4257c9["oKMpY"](_0x4257c9["VdlKD"](_0x5526a7, 0x3), 0x4), _0x4257c9["HlUXJ"](_0x4257c9["VdlKD"](_0x138cf5, 0xf0), 0x4)));
                    _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9["vuJTm"](_0x4257c9['VdlKD'](_0x138cf5, 0xf), 0x2));
                    _0x27d1f5 += '=';
                    break;
                }
                _0x4093e6 = _0x2a28c0["charCodeAt"](_0x4262d0++);
                _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9['lHuwG'](_0x5526a7, 0x2));
                _0x27d1f5 += _0x2097d8['charAt'](_0x4257c9["biRta"](_0x4257c9['VdlKD'](_0x5526a7, 0x3) << 0x4, _0x4257c9["fpeDs"](_0x138cf5, 0xf0) >> 0x4));
                _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9["HqwlU"](_0x4257c9["vuJTm"](_0x4257c9['nPBKx'](_0x138cf5, 0xf), 0x2), _0x4257c9["ZRhVT"](_0x4093e6, 0xc0) >> 0x6));
                _0x27d1f5 += _0x2097d8["charAt"](_0x4257c9['ZRhVT'](_0x4093e6, 0x3f));
            }
            return _0x27d1f5;
        };
        function _0x344cd4() {
            var _0x3c9135 = 0x0;
            var _0x43beea = 0x0;
            for (_0x43beea = 0x0; _0x43beea < wzwsquestion["length"]; _0x43beea++) {
                _0x3c9135 += wzwsquestion["charCodeAt"](_0x43beea);
            }
            _0x3c9135 *= wzwsfactor;
            _0x3c9135 += 0x1b207;
            return "WZWS_CONFIRM_PREFIX_LABEL" + _0x3c9135;
        };
        function get_url() {
            var _0xb14971 = _0x344cd4();
            var _0x10ace8 = _0x412a72(_0xb14971["toString"]());
            var _0x35ace3 = dynamicurl + "?wzwschallenge=" + _0x10ace8;
            return _0x35ace3;
        };
        """ % result
    ctx = execjs.compile(js)
    try:
        url = ctx.call("get_url")
        # print("http://www.ahtba.org.cn" + url)
        return "http://www.ahtba.org.cn" + url
    except Exception as e:
        print("获取加密链接失败！", e)
        print(result)
        return None


def get_page(url):
    # 访问加密后的链接，获取网页源代码
    if url:
        response = s.get(url, headers=headers)
        print(response.text)
        return response.text


if __name__ == "__main__":
    js_string = get_eval()
    url = get_url(js_string)
    get_page(url)

    
