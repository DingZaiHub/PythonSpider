var navigator = {};
navigator.appName = "Netscape";

var RSA = RSA || function() {
    function t(t, e) {
        return new r(t,e)
    }
    function e(t, e) {
        if (e < t.length + 11)
            return uv_alert("Message too long for RSA"),
            null;
        for (var i = new Array, n = t.length - 1; n >= 0 && e > 0; ) {
            var o = t.charCodeAt(n--);
            i[--e] = o
        }
        i[--e] = 0;
        for (var p = new Y, s = new Array; e > 2; ) {
            for (s[0] = 0; 0 == s[0]; )
                p.nextBytes(s);
            i[--e] = s[0]
        }
        return i[--e] = 2,
        i[--e] = 0,
        new r(i)
    }
    function i() {
        this.n = null,
        this.e = 0,
        this.d = null,
        this.p = null,
        this.q = null,
        this.dmp1 = null,
        this.dmq1 = null,
        this.coeff = null
    }
    function n(e, i) {
        null != e && null != i && e.length > 0 && i.length > 0 ? (this.n = t(e, 16),
        this.e = parseInt(i, 16)) : uv_alert("Invalid RSA public key")
    }
    function o(t) {
        return t.modPowInt(this.e, this.n)
    }
    function p(t) {
        var i = e(t, this.n.bitLength() + 7 >> 3);
        if (null == i)
            return null;
        var n = this.doPublic(i);
        if (null == n)
            return null;
        var o = n.toString(16);
        return 0 == (1 & o.length) ? o : "0" + o
    }
    function r(t, e, i) {
        null != t && ("number" == typeof t ? this.fromNumber(t, e, i) : null == e && "string" != typeof t ? this.fromString(t, 256) : this.fromString(t, e))
    }
    function s() {
        return new r(null)
    }
    function a(t, e, i, n, o, p) {
        for (; --p >= 0; ) {
            var r = e * this[t++] + i[n] + o;
            o = Math.floor(r / 67108864),
            i[n++] = 67108863 & r
        }
        return o
    }
    function l(t, e, i, n, o, p) {
        for (var r = 32767 & e, s = e >> 15; --p >= 0; ) {
            var a = 32767 & this[t]
              , l = this[t++] >> 15
              , c = s * a + l * r;
            a = r * a + ((32767 & c) << 15) + i[n] + (1073741823 & o),
            o = (a >>> 30) + (c >>> 15) + s * l + (o >>> 30),
            i[n++] = 1073741823 & a
        }
        return o
    }
    function c(t, e, i, n, o, p) {
        for (var r = 16383 & e, s = e >> 14; --p >= 0; ) {
            var a = 16383 & this[t]
              , l = this[t++] >> 14
              , c = s * a + l * r;
            a = r * a + ((16383 & c) << 14) + i[n] + o,
            o = (a >> 28) + (c >> 14) + s * l,
            i[n++] = 268435455 & a
        }
        return o
    }
    function u(t) {
        return at.charAt(t)
    }
    function g(t, e) {
        var i = lt[t.charCodeAt(e)];
        return null == i ? -1 : i
    }
    function d(t) {
        for (var e = this.t - 1; e >= 0; --e)
            t[e] = this[e];
        t.t = this.t,
        t.s = this.s
    }
    function h(t) {
        this.t = 1,
        this.s = t < 0 ? -1 : 0,
        t > 0 ? this[0] = t : t < -1 ? this[0] = t + DV : this.t = 0
    }
    function f(t) {
        var e = s();
        return e.fromInt(t),
        e
    }
    function _(t, e) {
        var i;
        if (16 == e)
            i = 4;
        else if (8 == e)
            i = 3;
        else if (256 == e)
            i = 8;
        else if (2 == e)
            i = 1;
        else if (32 == e)
            i = 5;
        else {
            if (4 != e)
                return void this.fromRadix(t, e);
            i = 2
        }
        this.t = 0,
        this.s = 0;
        for (var n = t.length, o = !1, p = 0; --n >= 0; ) {
            var s = 8 == i ? 255 & t[n] : g(t, n);
            s < 0 ? "-" == t.charAt(n) && (o = !0) : (o = !1,
            0 == p ? this[this.t++] = s : p + i > this.DB ? (this[this.t - 1] |= (s & (1 << this.DB - p) - 1) << p,
            this[this.t++] = s >> this.DB - p) : this[this.t - 1] |= s << p,
            (p += i) >= this.DB && (p -= this.DB))
        }
        8 == i && 0 != (128 & t[0]) && (this.s = -1,
        p > 0 && (this[this.t - 1] |= (1 << this.DB - p) - 1 << p)),
        this.clamp(),
        o && r.ZERO.subTo(this, this)
    }
    function m() {
        for (var t = this.s & this.DM; this.t > 0 && this[this.t - 1] == t; )
            --this.t
    }
    function $(t) {
        if (this.s < 0)
            return "-" + this.negate().toString(t);
        var e;
        if (16 == t)
            e = 4;
        else if (8 == t)
            e = 3;
        else if (2 == t)
            e = 1;
        else if (32 == t)
            e = 5;
        else {
            if (4 != t)
                return this.toRadix(t);
            e = 2
        }
        var i, n = (1 << e) - 1, o = !1, p = "", r = this.t, s = this.DB - r * this.DB % e;
        if (r-- > 0)
            for (s < this.DB && (i = this[r] >> s) > 0 && (o = !0,
            p = u(i)); r >= 0; )
                s < e ? (i = (this[r] & (1 << s) - 1) << e - s,
                i |= this[--r] >> (s += this.DB - e)) : (i = this[r] >> (s -= e) & n,
                s <= 0 && (s += this.DB,
                --r)),
                i > 0 && (o = !0),
                o && (p += u(i));
        return o ? p : "0"
    }
    function v() {
        var t = s();
        return r.ZERO.subTo(this, t),
        t
    }
    function y() {
        return this.s < 0 ? this.negate() : this
    }
    function w(t) {
        var e = this.s - t.s;
        if (0 != e)
            return e;
        var i = this.t;
        if (0 != (e = i - t.t))
            return e;
        for (; --i >= 0; )
            if (0 != (e = this[i] - t[i]))
                return e;
        return 0
    }
    function k(t) {
        var e, i = 1;
        return 0 != (e = t >>> 16) && (t = e,
        i += 16),
        0 != (e = t >> 8) && (t = e,
        i += 8),
        0 != (e = t >> 4) && (t = e,
        i += 4),
        0 != (e = t >> 2) && (t = e,
        i += 2),
        0 != (e = t >> 1) && (t = e,
        i += 1),
        i
    }
    function b() {
        return this.t <= 0 ? 0 : this.DB * (this.t - 1) + k(this[this.t - 1] ^ this.s & this.DM)
    }
    function q(t, e) {
        var i;
        for (i = this.t - 1; i >= 0; --i)
            e[i + t] = this[i];
        for (i = t - 1; i >= 0; --i)
            e[i] = 0;
        e.t = this.t + t,
        e.s = this.s
    }
    function S(t, e) {
        for (var i = t; i < this.t; ++i)
            e[i - t] = this[i];
        e.t = Math.max(this.t - t, 0),
        e.s = this.s
    }
    function C(t, e) {
        var i, n = t % this.DB, o = this.DB - n, p = (1 << o) - 1, r = Math.floor(t / this.DB), s = this.s << n & this.DM;
        for (i = this.t - 1; i >= 0; --i)
            e[i + r + 1] = this[i] >> o | s,
            s = (this[i] & p) << n;
        for (i = r - 1; i >= 0; --i)
            e[i] = 0;
        e[r] = s,
        e.t = this.t + r + 1,
        e.s = this.s,
        e.clamp()
    }
    function T(t, e) {
        e.s = this.s;
        var i = Math.floor(t / this.DB);
        if (i >= this.t)
            return void (e.t = 0);
        var n = t % this.DB
          , o = this.DB - n
          , p = (1 << n) - 1;
        e[0] = this[i] >> n;
        for (var r = i + 1; r < this.t; ++r)
            e[r - i - 1] |= (this[r] & p) << o,
            e[r - i] = this[r] >> n;
        n > 0 && (e[this.t - i - 1] |= (this.s & p) << o),
        e.t = this.t - i,
        e.clamp()
    }
    function x(t, e) {
        for (var i = 0, n = 0, o = Math.min(t.t, this.t); i < o; )
            n += this[i] - t[i],
            e[i++] = n & this.DM,
            n >>= this.DB;
        if (t.t < this.t) {
            for (n -= t.s; i < this.t; )
                n += this[i],
                e[i++] = n & this.DM,
                n >>= this.DB;
            n += this.s
        } else {
            for (n += this.s; i < t.t; )
                n -= t[i],
                e[i++] = n & this.DM,
                n >>= this.DB;
            n -= t.s
        }
        e.s = n < 0 ? -1 : 0,
        n < -1 ? e[i++] = this.DV + n : n > 0 && (e[i++] = n),
        e.t = i,
        e.clamp()
    }
    function L(t, e) {
        var i = this.abs()
          , n = t.abs()
          , o = i.t;
        for (e.t = o + n.t; --o >= 0; )
            e[o] = 0;
        for (o = 0; o < n.t; ++o)
            e[o + i.t] = i.am(0, n[o], e, o, 0, i.t);
        e.s = 0,
        e.clamp(),
        this.s != t.s && r.ZERO.subTo(e, e)
    }
    function N(t) {
        for (var e = this.abs(), i = t.t = 2 * e.t; --i >= 0; )
            t[i] = 0;
        for (i = 0; i < e.t - 1; ++i) {
            var n = e.am(i, e[i], t, 2 * i, 0, 1);
            (t[i + e.t] += e.am(i + 1, 2 * e[i], t, 2 * i + 1, n, e.t - i - 1)) >= e.DV && (t[i + e.t] -= e.DV,
            t[i + e.t + 1] = 1)
        }
        t.t > 0 && (t[t.t - 1] += e.am(i, e[i], t, 2 * i, 0, 1)),
        t.s = 0,
        t.clamp()
    }
    function E(t, e, i) {
        var n = t.abs();
        if (!(n.t <= 0)) {
            var o = this.abs();
            if (o.t < n.t)
                return null != e && e.fromInt(0),
                void (null != i && this.copyTo(i));
            null == i && (i = s());
            var p = s()
              , a = this.s
              , l = t.s
              , c = this.DB - k(n[n.t - 1]);
            c > 0 ? (n.lShiftTo(c, p),
            o.lShiftTo(c, i)) : (n.copyTo(p),
            o.copyTo(i));
            var u = p.t
              , g = p[u - 1];
            if (0 != g) {
                var d = g * (1 << this.F1) + (u > 1 ? p[u - 2] >> this.F2 : 0)
                  , h = this.FV / d
                  , f = (1 << this.F1) / d
                  , _ = 1 << this.F2
                  , m = i.t
                  , $ = m - u
                  , v = null == e ? s() : e;
                for (p.dlShiftTo($, v),
                i.compareTo(v) >= 0 && (i[i.t++] = 1,
                i.subTo(v, i)),
                r.ONE.dlShiftTo(u, v),
                v.subTo(p, p); p.t < u; )
                    p[p.t++] = 0;
                for (; --$ >= 0; ) {
                    var y = i[--m] == g ? this.DM : Math.floor(i[m] * h + (i[m - 1] + _) * f);
                    if ((i[m] += p.am(0, y, i, $, 0, u)) < y)
                        for (p.dlShiftTo($, v),
                        i.subTo(v, i); i[m] < --y; )
                            i.subTo(v, i)
                }
                null != e && (i.drShiftTo(u, e),
                a != l && r.ZERO.subTo(e, e)),
                i.t = u,
                i.clamp(),
                c > 0 && i.rShiftTo(c, i),
                a < 0 && r.ZERO.subTo(i, i)
            }
        }
    }
    function P(t) {
        var e = s();
        return this.abs().divRemTo(t, null, e),
        this.s < 0 && e.compareTo(r.ZERO) > 0 && t.subTo(e, e),
        e
    }
    function A(t) {
        this.m = t
    }
    function I(t) {
        return t.s < 0 || t.compareTo(this.m) >= 0 ? t.mod(this.m) : t
    }
    function Q(t) {
        return t
    }
    function M(t) {
        t.divRemTo(this.m, null, t)
    }
    function D(t, e, i) {
        t.multiplyTo(e, i),
        this.reduce(i)
    }
    function U(t, e) {
        t.squareTo(e),
        this.reduce(e)
    }
    function B() {
        if (this.t < 1)
            return 0;
        var t = this[0];
        if (0 == (1 & t))
            return 0;
        var e = 3 & t;
        return e = e * (2 - (15 & t) * e) & 15,
        e = e * (2 - (255 & t) * e) & 255,
        e = e * (2 - ((65535 & t) * e & 65535)) & 65535,
        e = e * (2 - t * e % this.DV) % this.DV,
        e > 0 ? this.DV - e : -e
    }
    function H(t) {
        this.m = t,
        this.mp = t.invDigit(),
        this.mpl = 32767 & this.mp,
        this.mph = this.mp >> 15,
        this.um = (1 << t.DB - 15) - 1,
        this.mt2 = 2 * t.t
    }
    function O(t) {
        var e = s();
        return t.abs().dlShiftTo(this.m.t, e),
        e.divRemTo(this.m, null, e),
        t.s < 0 && e.compareTo(r.ZERO) > 0 && this.m.subTo(e, e),
        e
    }
    function V(t) {
        var e = s();
        return t.copyTo(e),
        this.reduce(e),
        e
    }
    function j(t) {
        for (; t.t <= this.mt2; )
            t[t.t++] = 0;
        for (var e = 0; e < this.m.t; ++e) {
            var i = 32767 & t[e]
              , n = i * this.mpl + ((i * this.mph + (t[e] >> 15) * this.mpl & this.um) << 15) & t.DM;
            for (i = e + this.m.t,
            t[i] += this.m.am(0, n, t, e, 0, this.m.t); t[i] >= t.DV; )
                t[i] -= t.DV,
                t[++i]++
        }
        t.clamp(),
        t.drShiftTo(this.m.t, t),
        t.compareTo(this.m) >= 0 && t.subTo(this.m, t)
    }
    function R(t, e) {
        t.squareTo(e),
        this.reduce(e)
    }
    function F(t, e, i) {
        t.multiplyTo(e, i),
        this.reduce(i)
    }
    function G() {
        return 0 == (this.t > 0 ? 1 & this[0] : this.s)
    }
    function z(t, e) {
        if (t > 4294967295 || t < 1)
            return r.ONE;
        var i = s()
          , n = s()
          , o = e.convert(this)
          , p = k(t) - 1;
        for (o.copyTo(i); --p >= 0; )
            if (e.sqrTo(i, n),
            (t & 1 << p) > 0)
                e.mulTo(n, o, i);
            else {
                var a = i;
                i = n,
                n = a
            }
        return e.revert(i)
    }
    function W(t, e) {
        var i;
        return i = t < 256 || e.isEven() ? new A(e) : new H(e),
        this.exp(t, i)
    }
    function X(t) {
        ut[gt++] ^= 255 & t,
        ut[gt++] ^= t >> 8 & 255,
        ut[gt++] ^= t >> 16 & 255,
        ut[gt++] ^= t >> 24 & 255,
        gt >= ft && (gt -= ft)
    }
    function Z() {
        X((new Date).getTime())
    }
    function K() {
        if (null == ct) {
            for (Z(),
            ct = nt(),
            ct.init(ut),
            gt = 0; gt < ut.length; ++gt)
                ut[gt] = 0;
            gt = 0
        }
        return ct.next()
    }
    function J(t) {
        var e;
        for (e = 0; e < t.length; ++e)
            t[e] = K()
    }
    function Y() {}
    function tt() {
        this.i = 0,
        this.j = 0,
        this.S = new Array
    }
    function et(t) {
        var e, i, n;
        for (e = 0; e < 256; ++e)
            this.S[e] = e;
        for (i = 0,
        e = 0; e < 256; ++e)
            i = i + this.S[e] + t[e % t.length] & 255,
            n = this.S[e],
            this.S[e] = this.S[i],
            this.S[i] = n;
        this.i = 0,
        this.j = 0
    }
    function it() {
        var t;
        return this.i = this.i + 1 & 255,
        this.j = this.j + this.S[this.i] & 255,
        t = this.S[this.i],
        this.S[this.i] = this.S[this.j],
        this.S[this.j] = t,
        this.S[t + this.S[this.i] & 255]
    }
    function nt() {
        return new tt
    }
    function ot(t, e, n) {
        var o = new i;
        return o.setPublic(e, n),
        o.encrypt(t)
    }
    i.prototype.doPublic = o,
    i.prototype.setPublic = n,
    i.prototype.encrypt = p;
    var pt;
    "Microsoft Internet Explorer" == navigator.appName ? (r.prototype.am = l,
    pt = 30) : "Netscape" != navigator.appName ? (r.prototype.am = a,
    pt = 26) : (r.prototype.am = c,
    pt = 28),
    r.prototype.DB = pt,
    r.prototype.DM = (1 << pt) - 1,
    r.prototype.DV = 1 << pt;
    r.prototype.FV = Math.pow(2, 52),
    r.prototype.F1 = 52 - pt,
    r.prototype.F2 = 2 * pt - 52;
    var rt, st, at = "0123456789abcdefghijklmnopqrstuvwxyz", lt = new Array;
    for (rt = "0".charCodeAt(0),
    st = 0; st <= 9; ++st)
        lt[rt++] = st;
    for (rt = "a".charCodeAt(0),
    st = 10; st < 36; ++st)
        lt[rt++] = st;
    for (rt = "A".charCodeAt(0),
    st = 10; st < 36; ++st)
        lt[rt++] = st;
    A.prototype.convert = I,
    A.prototype.revert = Q,
    A.prototype.reduce = M,
    A.prototype.mulTo = D,
    A.prototype.sqrTo = U,
    H.prototype.convert = O,
    H.prototype.revert = V,
    H.prototype.reduce = j,
    H.prototype.mulTo = F,
    H.prototype.sqrTo = R,
    r.prototype.copyTo = d,
    r.prototype.fromInt = h,
    r.prototype.fromString = _,
    r.prototype.clamp = m,
    r.prototype.dlShiftTo = q,
    r.prototype.drShiftTo = S,
    r.prototype.lShiftTo = C,
    r.prototype.rShiftTo = T,
    r.prototype.subTo = x,
    r.prototype.multiplyTo = L,
    r.prototype.squareTo = N,
    r.prototype.divRemTo = E,
    r.prototype.invDigit = B,
    r.prototype.isEven = G,
    r.prototype.exp = z,
    r.prototype.toString = $,
    r.prototype.negate = v,
    r.prototype.abs = y,
    r.prototype.compareTo = w,
    r.prototype.bitLength = b,
    r.prototype.mod = P,
    r.prototype.modPowInt = W,
    r.ZERO = f(0),
    r.ONE = f(1);
    var ct, ut, gt;
    if (null == ut) {
        ut = new Array,
        gt = 0;
        var dt;
        if ("Netscape" == navigator.appName && navigator.appVersion < "5" && window.crypto && window.crypto.random) {
            var ht = window.crypto.random(32);
            for (dt = 0; dt < ht.length; ++dt)
                ut[gt++] = 255 & ht.charCodeAt(dt)
        }
        for (; gt < ft; )
            dt = Math.floor(65536 * Math.random()),
            ut[gt++] = dt >>> 8,
            ut[gt++] = 255 & dt;
        gt = 0,
        Z()
    }
    Y.prototype.nextBytes = J,
    tt.prototype.init = et,
    tt.prototype.next = it;
    var ft = 256;
    return {
        rsa_encrypt: ot
    }
}()

// 这种RSA加密，加密相同明文，密文会变
function RSAEncrypt(t) {
    var e = "00833c4af965ff7a8409f8b5d5a83d87f2f19d7c1eb40dc59a98d2346cbb145046b2c6facc25b5cc363443f0f7ebd9524b7c1e1917bf7d849212339f6c1d3711b115ecb20f0c89fc2182a985ea28cbb4adf6a321ff7e715ba9b8d7261d1c140485df3b705247a70c28c9068caabbedbf9510dada6d13d99e57642b853a73406817";
    var n = "010001";
    return RSA.rsa_encrypt(t, e, n)
}
console.log(RSAEncrypt("111111"))
