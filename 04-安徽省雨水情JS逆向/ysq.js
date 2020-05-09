var WaterSecurity = function() {
    this.init()
};
WaterSecurity.prototype = {
    version: "2.1",
    init: function() {
        String.prototype.gblen = function() {
            var len = 0;
            for (var i = 0; i < this.length; i++)
                if (this.charCodeAt(i) > 127 || this.charCodeAt(i) == 94)
                    len += 2;
                else
                    len++;
            return len
        }
    },
    encode: function(data) {
        this.print(data);
        data += "";
        if (data == "")
            return "";
        data = encodeURI(data).replace(/\+/g, "%2B");
        var length = data.gblen();
        if (length % 2 != 0)
            data += "*";
        this.print(data);
        data = this.parityTransposition(data);
        this.print(data);
        var result = this.version + this.utf16to8(this.base64encode(data));
        this.print(result);
        return result
    },
    print: function(data) {},
    parityTransposition: function(data) {
        var newData = [];
        for (var i = 0; i < data.length; i += 2) {
            newData.push(data[i + 1]);
            newData.push(data[i])
        }
        newData = newData.join("");
        return newData
    },
    decode: function(data) {
        data = data.substring(3, data.length);
        var endTag = data.substring(data.length - 4);
        var tagsStr = data.substring(data.indexOf(endTag));
        var tags = new Array;
        tagsStr = tagsStr.substring(4, tagsStr.length - 4);
        var content = new Array;
        for (var i = 0; 4 * i < tagsStr.length; i++) {
            var tag = tagsStr.substr(i * 4, 4);
            tags[i] = tag;
            content[tag] = null
        }
        var positions = this.getTagsPosition(data, tags);
        var index = 0;
        for (var i = 0; i < positions.length; i++) {
            var msg = data.substring(index, positions[i]);
            var tag = data.substr(positions[i], 4);
            content[tag] = msg;
            index = positions[i] + 4
        }
        var result = "";
        for (var i = 0; i < tags.length; i++)
            result += content[tags[i]];
        result = this.utf8to16(this.base64decode(result));
        return result
    },
    getTagsPosition: function(data, tags) {
        var positions = new Array;
        for (i = 0; i < tags.length; i++)
            positions[i] = data.indexOf(tags[i]);
        return positions.sort(function(a, b) {
            return a > b ? 1 : -1
        })
    },
    base64EncodeChars: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    base64DecodeChars: new Array(-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,62,-1,-1,-1,63,52,53,54,55,56,57,58,59,60,61,-1,-1,-1,-1,-1,-1,-1,0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,-1,-1,-1,-1,-1,-1,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,-1,-1,-1,-1,-1),
    base64encode: function(str) {
        var out, i, len;
        var c1, c2, c3;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            c1 = str.charCodeAt(i++) & 255;
            if (i == len) {
                out += this.base64EncodeChars.charAt(c1 >> 2);
                out += this.base64EncodeChars.charAt((c1 & 3) << 4);
                out += "\x3d\x3d";
                break
            }
            c2 = str.charCodeAt(i++);
            if (i == len) {
                out += this.base64EncodeChars.charAt(c1 >> 2);
                out += this.base64EncodeChars.charAt((c1 & 3) << 4 | (c2 & 240) >> 4);
                out += this.base64EncodeChars.charAt((c2 & 15) << 2);
                out += "\x3d";
                break
            }
            c3 = str.charCodeAt(i++);
            out += this.base64EncodeChars.charAt(c1 >> 2);
            out += this.base64EncodeChars.charAt((c1 & 3) << 4 | (c2 & 240) >> 4);
            out += this.base64EncodeChars.charAt((c2 & 15) << 2 | (c3 & 192) >> 6);
            out += this.base64EncodeChars.charAt(c3 & 63)
        }
        return out
    },
    base64decode: function(str) {
        var c1, c2, c3, c4;
        var i, len, out;
        len = str.length;
        i = 0;
        out = "";
        while (i < len) {
            do
                c1 = this.base64DecodeChars[str.charCodeAt(i++) & 255];
            while (i < len && c1 == -1);if (c1 == -1)
                break;
            do
                c2 = this.base64DecodeChars[str.charCodeAt(i++) & 255];
            while (i < len && c2 == -1);if (c2 == -1)
                break;
            out += String.fromCharCode(c1 << 2 | (c2 & 48) >> 4);
            do {
                c3 = str.charCodeAt(i++) & 255;
                if (c3 == 61)
                    return out;
                c3 = this.base64DecodeChars[c3]
            } while (i < len && c3 == -1);if (c3 == -1)
                break;
            out += String.fromCharCode((c2 & 15) << 4 | (c3 & 60) >> 2);
            do {
                c4 = str.charCodeAt(i++) & 255;
                if (c4 == 61)
                    return out;
                c4 = this.base64DecodeChars[c4]
            } while (i < len && c4 == -1);if (c4 == -1)
                break;
            out += String.fromCharCode((c3 & 3) << 6 | c4)
        }
        return out
    },
    utf16to8: function(str) {
        var out, i, len, c;
        out = "";
        len = str.length;
        for (i = 0; i < len; i++) {
            c = str.charCodeAt(i);
            if (c >= 1 && c <= 127)
                out += str.charAt(i);
            else if (c > 2047) {
                out += String.fromCharCode(224 | c >> 12 & 15);
                out += String.fromCharCode(128 | c >> 6 & 63);
                out += String.fromCharCode(128 | c >> 0 & 63)
            } else {
                out += String.fromCharCode(192 | c >> 6 & 31);
                out += String.fromCharCode(128 | c >> 0 & 63)
            }
        }
        return out
    },
    utf8to16: function(str) {
        var out, i, len, c;
        var char2, char3;
        out = "";
        len = str.length;
        i = 0;
        while (i < len) {
            c = str.charCodeAt(i++);
            switch (c >> 4) {
                case 0:
                case 1:
                case 2:
                case 3:
                case 4:
                case 5:
                case 6:
                case 7:
                    out += str.charAt(i - 1);
                    break;
                case 12:
                case 13:
                    char2 = str.charCodeAt(i++);
                    out += String.fromCharCode((c & 31) << 6 | char2 & 63);
                    break;
                case 14:
                    char2 = str.charCodeAt(i++);
                    char3 = str.charCodeAt(i++);
                    out += String.fromCharCode((c & 15) << 12 | (char2 & 63) << 6 | (char3 & 63) << 0);
                    break
            }
        }
        return out
    }
};
var waterSecurity = new WaterSecurity;
function waterEncode(data){
    return waterSecurity.encode(data)
}
function resultDecode(data){
    data = waterSecurity.decode(data);
//    data = JSON.parse(data);
    return data;
}
