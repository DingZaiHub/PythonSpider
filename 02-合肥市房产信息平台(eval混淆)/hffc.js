function get_url(id, iptstamp) {
	function reurl() {
		var a = "/item/" + recode(id)
		return a
	};
	function recode(a) {
		var n = nscaler(a);
		var c = SetObjNum(a.length);
		var d = SetObjNum(a.length);
		n = parseInt(n) + parseInt(d);
		var b = iptstamp;
		b = nscaler(b.toString());
		return c + "-" + n + "-" + d + "-" + b
	}
	function SetObjNum(n) {
		var a = "";
		for (var i = 0; i < n; i++)
			a += Math.floor(Math.random() * 10);
		return a
	}
	function each(obj, callback, args) {
		var name,
			i = 0,
			length = obj.length,
			isObj = false;
		if ( args ) {
			if ( isObj ) {
				for ( name in obj ) {
					if ( callback.apply( obj[ name ], args ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.apply( obj[ i++ ], args ) === false ) {
						break;
					}
				}
			}
		} else {
			if ( isObj ) {
				for ( name in obj ) {
					if ( callback.call( obj[ name ], name, obj[ name ] ) === false ) {
						break;
					}
				}
			} else {
				for ( ; i < length; ) {
					if ( callback.call( obj[ i ], i, obj[ i++ ] ) === false ) {
						break;
					}
				}
			}
		}
		return obj;
	}
	function nscaler(a) {
		var b = "";
		each(a, function (i, e) {
			switch (e) {
			case "0":
				b += "0";
				break;
			case "1":
				b += "2";
				break;
			case "2":
				b += "5";
				break;
			case "3":
				b += "8";
				break;
			case "4":
				b += "6";
				break;
			case "5":
				b += "1";
				break;
			case "6":
				b += "3";
				break;
			case "7":
				b += "4";
				break;
			case "8":
				b += "9";
				break;
			case "9":
				b += "7";
				break
			}
		});
		return b
	}
	return reurl()
}
console.log(get_url("2703", "1578903379984"))
