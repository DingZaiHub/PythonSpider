var $ = {};
(function($) {
    var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
      , a256 = ''
      , r64 = [256]
      , r256 = [256]
      , i = 0;
    var UTF8 = {
        encode: function(strUni) {
            var strUtf = strUni.replace(/[\u0080-\u07ff]/g, function(c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xc0 | cc >> 6, 0x80 | cc & 0x3f);
            }).replace(/[\u0800-\uffff]/g, function(c) {
                var cc = c.charCodeAt(0);
                return String.fromCharCode(0xe0 | cc >> 12, 0x80 | cc >> 6 & 0x3F, 0x80 | cc & 0x3f);
            });
            return strUtf;
        },
        decode: function(strUtf) {
            var strUni = strUtf.replace(/[\u00e0-\u00ef][\u0080-\u00bf][\u0080-\u00bf]/g, function(c) {
                var cc = ((c.charCodeAt(0) & 0x0f) << 12) | ((c.charCodeAt(1) & 0x3f) << 6) | (c.charCodeAt(2) & 0x3f);
                return String.fromCharCode(cc);
            }).replace(/[\u00c0-\u00df][\u0080-\u00bf]/g, function(c) {
                var cc = (c.charCodeAt(0) & 0x1f) << 6 | c.charCodeAt(1) & 0x3f;
                return String.fromCharCode(cc);
            });
            return strUni;
        }
    };
    while (i < 256) {
        var c = String.fromCharCode(i);
        a256 += c;
        r256[i] = i;
        r64[i] = b64.indexOf(c);
        ++i;
    }
    function code(s, discard, alpha, beta, w1, w2) {
        s = String(s);
        var buffer = 0
          , i = 0
          , length = s.length
          , result = ''
          , bitsInBuffer = 0;
        while (i < length) {
            var c = s.charCodeAt(i);
            c = c < 256 ? alpha[c] : -1;
            buffer = (buffer << w1) + c;
            bitsInBuffer += w1;
            while (bitsInBuffer >= w2) {
                bitsInBuffer -= w2;
                var tmp = buffer >> bitsInBuffer;
                result += beta.charAt(tmp);
                buffer ^= tmp << bitsInBuffer;
            }
            ++i;
        }
        if (!discard && bitsInBuffer > 0)
            result += beta.charAt(buffer << (w2 - bitsInBuffer));
        return result;
    }
    var Plugin = $.base64 = function(dir, input, encode) {
        return input ? Plugin[dir](input, encode) : dir ? null : this;
    }
    ;
    Plugin.btoa = Plugin.encode = function(plain, utf8encode) {
        plain = Plugin.raw === false || Plugin.utf8encode || utf8encode ? UTF8.encode(plain) : plain;
        plain = code(plain, false, r256, b64, 8, 6);
        return plain + '===='.slice((plain.length % 4) || 4);
    }
    ;
    Plugin.atob = Plugin.decode = function(coded, utf8decode) {
        coded = String(coded).split('=');
        var i = coded.length;
        do {
            --i;
            coded[i] = code(coded[i], true, r64, a256, 6, 8);
        } while (i > 0);coded = coded.join('');
        return Plugin.raw === false || Plugin.utf8decode || utf8decode ? UTF8.decode(coded) : coded;
    }
    ;
}($));
function r3(str) {
    var newarr = [];
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) < 65 || str.charCodeAt(i) > 90) {
            newarr.push(str.charAt(i))
        } else if (str.charCodeAt(i) > 77) {
            newarr.push(String.fromCharCode(str.charCodeAt(i) - 13))
        } else {
            newarr.push(String.fromCharCode(str.charCodeAt(i) + 13))
        }
    }
    return newarr.join("")
}
function rot(t, u, v) {
    return String.fromCharCode(((t - u + v) % (v * 2)) + u)
}
function r13(s) {
    var b = [],
    c,
    i = s.length,
    a = 'a'.charCodeAt(),
    z = a + 26,
    A = 'A'.charCodeAt(),
    Z = A + 26;
    while (i--) {
        c = s.charCodeAt(i);
        if (c >= a && c < z) {
            b[i] = rot(c, a, 13)
        } else if (c >= A && c < Z) {
            b[i] = rot(c, A, 13)
        } else {
            b[i] = s.charAt(i)
        }
    }
    return b.join('')
}
function rot5(s) {
    var b = [],
    c,
    i = s.length,
    a = '0'.charCodeAt(),
    z = a + 10;
    while (i--) {
        c = s.charCodeAt(i);
        if (c >= a && c < z) {
            b[i] = rot(c, a, 5)
        } else {
            b[i] = s.charAt(i)
        }
    }
    return b.join('')
}
function rot135(s) {
    return rot13(rot5(s))
}
function ddip(e0) {
    e1 = r13(e0.toString());
    e2 = $.base64.decode(e1);
    e3 = e2.toString().substr(10);
    l3 = e3.length;
    e4 = e3.substr(0, l3 - 10);
    return e4
}
console.log(ddip("ZGH3ZQxmAwx3ZGR2AF4lZwHhZmLhAwxkAGp4BQNjAGN0"))
