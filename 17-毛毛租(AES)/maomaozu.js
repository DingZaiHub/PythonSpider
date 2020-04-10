var CryptoJS = CryptoJS || (function (Math, undefined) {
    /*
        * Local polyfil of Object.create
        */
    var create = Object.create || (function () {
        function F() {};

        return function (obj) {
            var subtype;

            F.prototype = obj;

            subtype = new F();

            F.prototype = null;

            return subtype;
        };
    }())

    /**
     * CryptoJS namespace.
     */
    var C = {};

    /**
     * Library namespace.
     */
    var C_lib = C.lib = {};

    /**
     * Base object for prototypal inheritance.
     */
    var Base = C_lib.Base = (function () {


        return {
            /**
             * Creates a new object that inherits from this object.
             *
             * @param {Object} overrides Properties to copy into the new object.
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         field: 'value',
             *
             *         method: function () {
             *         }
             *     });
             */
            extend: function (overrides) {
                // Spawn
                var subtype = create(this);

                // Augment
                if (overrides) {
                    subtype.mixIn(overrides);
                }

                // Create default initializer
                if (!subtype.hasOwnProperty('init') || this.init === subtype.init) {
                    subtype.init = function () {
                        subtype.$super.init.apply(this, arguments);
                    };
                }

                // Initializer's prototype is the subtype object
                subtype.init.prototype = subtype;

                // Reference supertype
                subtype.$super = this;

                return subtype;
            },

            /**
             * Extends this object and runs the init method.
             * Arguments to create() will be passed to init().
             *
             * @return {Object} The new object.
             *
             * @static
             *
             * @example
             *
             *     var instance = MyType.create();
             */
            create: function () {
                var instance = this.extend();
                instance.init.apply(instance, arguments);

                return instance;
            },

            /**
             * Initializes a newly created object.
             * Override this method to add some logic when your objects are created.
             *
             * @example
             *
             *     var MyType = CryptoJS.lib.Base.extend({
             *         init: function () {
             *             // ...
             *         }
             *     });
             */
            init: function () {
            },

            /**
             * Copies properties into this object.
             *
             * @param {Object} properties The properties to mix in.
             *
             * @example
             *
             *     MyType.mixIn({
             *         field: 'value'
             *     });
             */
            mixIn: function (properties) {
                for (var propertyName in properties) {
                    if (properties.hasOwnProperty(propertyName)) {
                        this[propertyName] = properties[propertyName];
                    }
                }

                // IE won't copy toString using the loop above
                if (properties.hasOwnProperty('toString')) {
                    this.toString = properties.toString;
                }
            },

            /**
             * Creates a copy of this object.
             *
             * @return {Object} The clone.
             *
             * @example
             *
             *     var clone = instance.clone();
             */
            clone: function () {
                return this.init.prototype.extend(this);
            }
        };
    }());

    /**
     * An array of 32-bit words.
     *
     * @property {Array} words The array of 32-bit words.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    var WordArray = C_lib.WordArray = Base.extend({
        /**
         * Initializes a newly created word array.
         *
         * @param {Array} words (Optional) An array of 32-bit words.
         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.create();
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607]);
         *     var wordArray = CryptoJS.lib.WordArray.create([0x00010203, 0x04050607], 6);
         */
        init: function (words, sigBytes) {
            words = this.words = words || [];

            if (sigBytes != undefined) {
                this.sigBytes = sigBytes;
            } else {
                this.sigBytes = words.length * 4;
            }
        },

        /**
         * Converts this word array to a string.
         *
         * @param {Encoder} encoder (Optional) The encoding strategy to use. Default: CryptoJS.enc.Hex
         *
         * @return {string} The stringified word array.
         *
         * @example
         *
         *     var string = wordArray + '';
         *     var string = wordArray.toString();
         *     var string = wordArray.toString(CryptoJS.enc.Utf8);
         */
        toString: function (encoder) {
            return (encoder || Hex).stringify(this);
        },

        /**
         * Concatenates a word array to this word array.
         *
         * @param {WordArray} wordArray The word array to append.
         *
         * @return {WordArray} This word array.
         *
         * @example
         *
         *     wordArray1.concat(wordArray2);
         */
        concat: function (wordArray) {
            // Shortcuts
            var thisWords = this.words;
            var thatWords = wordArray.words;
            var thisSigBytes = this.sigBytes;
            var thatSigBytes = wordArray.sigBytes;

            // Clamp excess bits
            this.clamp();

            // Concat
            if (thisSigBytes % 4) {
                // Copy one byte at a time
                for (var i = 0; i < thatSigBytes; i++) {
                    var thatByte = (thatWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                    thisWords[(thisSigBytes + i) >>> 2] |= thatByte << (24 - ((thisSigBytes + i) % 4) * 8);
                }
            } else {
                // Copy one word at a time
                for (var i = 0; i < thatSigBytes; i += 4) {
                    thisWords[(thisSigBytes + i) >>> 2] = thatWords[i >>> 2];
                }
            }
            this.sigBytes += thatSigBytes;

            // Chainable
            return this;
        },

        /**
         * Removes insignificant bits.
         *
         * @example
         *
         *     wordArray.clamp();
         */
        clamp: function () {
            // Shortcuts
            var words = this.words;
            var sigBytes = this.sigBytes;

            // Clamp
            words[sigBytes >>> 2] &= 0xffffffff << (32 - (sigBytes % 4) * 8);
            words.length = Math.ceil(sigBytes / 4);
        },

        /**
         * Creates a copy of this word array.
         *
         * @return {WordArray} The clone.
         *
         * @example
         *
         *     var clone = wordArray.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone.words = this.words.slice(0);

            return clone;
        },

        /**
         * Creates a word array filled with random bytes.
         *
         * @param {number} nBytes The number of random bytes to generate.
         *
         * @return {WordArray} The random word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.lib.WordArray.random(16);
         */
        random: function (nBytes) {
            var words = [];

            var r = (function (m_w) {
                var m_w = m_w;
                var m_z = 0x3ade68b1;
                var mask = 0xffffffff;

                return function () {
                    m_z = (0x9069 * (m_z & 0xFFFF) + (m_z >> 0x10)) & mask;
                    m_w = (0x4650 * (m_w & 0xFFFF) + (m_w >> 0x10)) & mask;
                    var result = ((m_z << 0x10) + m_w) & mask;
                    result /= 0x100000000;
                    result += 0.5;
                    return result * (Math.random() > .5 ? 1 : -1);
                }
            });

            for (var i = 0, rcache; i < nBytes; i += 4) {
                var _r = r((rcache || Math.random()) * 0x100000000);

                rcache = _r() * 0x3ade67b7;
                words.push((_r() * 0x100000000) | 0);
            }

            return new WordArray.init(words, nBytes);
        }
    });

    /**
     * Encoder namespace.
     */
    var C_enc = C.enc = {};

    /**
     * Hex encoding strategy.
     */
    var Hex = C_enc.Hex = {
        /**
         * Converts a word array to a hex string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The hex string.
         *
         * @static
         *
         * @example
         *
         *     var hexString = CryptoJS.enc.Hex.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var hexChars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                hexChars.push((bite >>> 4).toString(16));
                hexChars.push((bite & 0x0f).toString(16));
            }

            return hexChars.join('');
        },

        /**
         * Converts a hex string to a word array.
         *
         * @param {string} hexStr The hex string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Hex.parse(hexString);
         */
        parse: function (hexStr) {
            // Shortcut
            var hexStrLength = hexStr.length;

            // Convert
            var words = [];
            for (var i = 0; i < hexStrLength; i += 2) {
                words[i >>> 3] |= parseInt(hexStr.substr(i, 2), 16) << (24 - (i % 8) * 4);
            }

            return new WordArray.init(words, hexStrLength / 2);
        }
    };

    /**
     * Latin1 encoding strategy.
     */
    var Latin1 = C_enc.Latin1 = {
        /**
         * Converts a word array to a Latin1 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Latin1 string.
         *
         * @static
         *
         * @example
         *
         *     var latin1String = CryptoJS.enc.Latin1.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var latin1Chars = [];
            for (var i = 0; i < sigBytes; i++) {
                var bite = (words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
                latin1Chars.push(String.fromCharCode(bite));
            }

            return latin1Chars.join('');
        },

        /**
         * Converts a Latin1 string to a word array.
         *
         * @param {string} latin1Str The Latin1 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Latin1.parse(latin1String);
         */
        parse: function (latin1Str) {
            // Shortcut
            var latin1StrLength = latin1Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < latin1StrLength; i++) {
                words[i >>> 2] |= (latin1Str.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
            }

            return new WordArray.init(words, latin1StrLength);
        }
    };

    /**
     * UTF-8 encoding strategy.
     */
    var Utf8 = C_enc.Utf8 = {
        /**
         * Converts a word array to a UTF-8 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-8 string.
         *
         * @static
         *
         * @example
         *
         *     var utf8String = CryptoJS.enc.Utf8.stringify(wordArray);
         */
        stringify: function (wordArray) {
            try {
                return decodeURIComponent(escape(Latin1.stringify(wordArray)));
            } catch (e) {
                throw new Error('Malformed UTF-8 data');
            }
        },

        /**
         * Converts a UTF-8 string to a word array.
         *
         * @param {string} utf8Str The UTF-8 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf8.parse(utf8String);
         */
        parse: function (utf8Str) {
            return Latin1.parse(unescape(encodeURIComponent(utf8Str)));
        }
    };

    /**
     * Abstract buffered block algorithm template.
     *
     * The property blockSize must be implemented in a concrete subtype.
     *
     * @property {number} _minBufferSize The number of blocks that should be kept unprocessed in the buffer. Default: 0
     */
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm = Base.extend({
        /**
         * Resets this block algorithm's data buffer to its initial state.
         *
         * @example
         *
         *     bufferedBlockAlgorithm.reset();
         */
        reset: function () {
            // Initial values
            this._data = new WordArray.init();
            this._nDataBytes = 0;
        },

        /**
         * Adds new data to this block algorithm's buffer.
         *
         * @param {WordArray|string} data The data to append. Strings are converted to a WordArray using UTF-8.
         *
         * @example
         *
         *     bufferedBlockAlgorithm._append('data');
         *     bufferedBlockAlgorithm._append(wordArray);
         */
        _append: function (data) {
            // Convert string to WordArray, else assume WordArray already
            if (typeof data == 'string') {
                data = Utf8.parse(data);
            }

            // Append
            this._data.concat(data);
            this._nDataBytes += data.sigBytes;
        },

        /**
         * Processes available data blocks.
         *
         * This method invokes _doProcessBlock(offset), which must be implemented by a concrete subtype.
         *
         * @param {boolean} doFlush Whether all blocks and partial blocks should be processed.
         *
         * @return {WordArray} The processed data.
         *
         * @example
         *
         *     var processedData = bufferedBlockAlgorithm._process();
         *     var processedData = bufferedBlockAlgorithm._process(!!'flush');
         */
        _process: function (doFlush) {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;
            var dataSigBytes = data.sigBytes;
            var blockSize = this.blockSize;
            var blockSizeBytes = blockSize * 4;

            // Count blocks ready
            var nBlocksReady = dataSigBytes / blockSizeBytes;
            if (doFlush) {
                // Round up to include partial blocks
                nBlocksReady = Math.ceil(nBlocksReady);
            } else {
                // Round down to include only full blocks,
                // less the number of blocks that must remain in the buffer
                nBlocksReady = Math.max((nBlocksReady | 0) - this._minBufferSize, 0);
            }

            // Count words ready
            var nWordsReady = nBlocksReady * blockSize;

            // Count bytes ready
            var nBytesReady = Math.min(nWordsReady * 4, dataSigBytes);

            // Process blocks
            if (nWordsReady) {
                for (var offset = 0; offset < nWordsReady; offset += blockSize) {
                    // Perform concrete-algorithm logic
                    this._doProcessBlock(dataWords, offset);
                }

                // Remove processed words
                var processedWords = dataWords.splice(0, nWordsReady);
                data.sigBytes -= nBytesReady;
            }

            // Return processed words
            return new WordArray.init(processedWords, nBytesReady);
        },

        /**
         * Creates a copy of this object.
         *
         * @return {Object} The clone.
         *
         * @example
         *
         *     var clone = bufferedBlockAlgorithm.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);
            clone._data = this._data.clone();

            return clone;
        },

        _minBufferSize: 0
    });

    /**
     * Abstract hasher template.
     *
     * @property {number} blockSize The number of 32-bit words this hasher operates on. Default: 16 (512 bits)
     */
    var Hasher = C_lib.Hasher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         */
        cfg: Base.extend(),

        /**
         * Initializes a newly created hasher.
         *
         * @param {Object} cfg (Optional) The configuration options to use for this hash computation.
         *
         * @example
         *
         *     var hasher = CryptoJS.algo.SHA256.create();
         */
        init: function (cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Set initial values
            this.reset();
        },

        /**
         * Resets this hasher to its initial state.
         *
         * @example
         *
         *     hasher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-hasher logic
            this._doReset();
        },

        /**
         * Updates this hasher with a message.
         *
         * @param {WordArray|string} messageUpdate The message to append.
         *
         * @return {Hasher} This hasher.
         *
         * @example
         *
         *     hasher.update('message');
         *     hasher.update(wordArray);
         */
        update: function (messageUpdate) {
            // Append
            this._append(messageUpdate);

            // Update the hash
            this._process();

            // Chainable
            return this;
        },

        /**
         * Finalizes the hash computation.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} messageUpdate (Optional) A final message update.
         *
         * @return {WordArray} The hash.
         *
         * @example
         *
         *     var hash = hasher.finalize();
         *     var hash = hasher.finalize('message');
         *     var hash = hasher.finalize(wordArray);
         */
        finalize: function (messageUpdate) {
            // Final message update
            if (messageUpdate) {
                this._append(messageUpdate);
            }

            // Perform concrete-hasher logic
            var hash = this._doFinalize();

            return hash;
        },

        blockSize: 512/32,

        /**
         * Creates a shortcut function to a hasher's object interface.
         *
         * @param {Hasher} hasher The hasher to create a helper for.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var SHA256 = CryptoJS.lib.Hasher._createHelper(CryptoJS.algo.SHA256);
         */
        _createHelper: function (hasher) {
            return function (message, cfg) {
                return new hasher.init(cfg).finalize(message);
            };
        },

        /**
         * Creates a shortcut function to the HMAC's object interface.
         *
         * @param {Hasher} hasher The hasher to use in this HMAC helper.
         *
         * @return {Function} The shortcut function.
         *
         * @static
         *
         * @example
         *
         *     var HmacSHA256 = CryptoJS.lib.Hasher._createHmacHelper(CryptoJS.algo.SHA256);
         */
        _createHmacHelper: function (hasher) {
            return function (message, key) {
                return new C_algo.HMAC.init(hasher, key).finalize(message);
            };
        }
    });

    /**
     * Algorithm namespace.
     */
    var C_algo = C.algo = {};

    return C;
}(Math));


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var C_enc = C.enc;

    /**
     * Base64 encoding strategy.
     */
    var Base64 = C_enc.Base64 = {
        /**
         * Converts a word array to a Base64 string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The Base64 string.
         *
         * @static
         *
         * @example
         *
         *     var base64String = CryptoJS.enc.Base64.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;
            var map = this._map;

            // Clamp excess bits
            wordArray.clamp();

            // Convert
            var base64Chars = [];
            for (var i = 0; i < sigBytes; i += 3) {
                var byte1 = (words[i >>> 2]       >>> (24 - (i % 4) * 8))       & 0xff;
                var byte2 = (words[(i + 1) >>> 2] >>> (24 - ((i + 1) % 4) * 8)) & 0xff;
                var byte3 = (words[(i + 2) >>> 2] >>> (24 - ((i + 2) % 4) * 8)) & 0xff;

                var triplet = (byte1 << 16) | (byte2 << 8) | byte3;

                for (var j = 0; (j < 4) && (i + j * 0.75 < sigBytes); j++) {
                    base64Chars.push(map.charAt((triplet >>> (6 * (3 - j))) & 0x3f));
                }
            }

            // Add padding
            var paddingChar = map.charAt(64);
            if (paddingChar) {
                while (base64Chars.length % 4) {
                    base64Chars.push(paddingChar);
                }
            }

            return base64Chars.join('');
        },

        /**
         * Converts a Base64 string to a word array.
         *
         * @param {string} base64Str The Base64 string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Base64.parse(base64String);
         */
        parse: function (base64Str) {
            // Shortcuts
            var base64StrLength = base64Str.length;
            var map = this._map;
            var reverseMap = this._reverseMap;

            if (!reverseMap) {
                    reverseMap = this._reverseMap = [];
                    for (var j = 0; j < map.length; j++) {
                        reverseMap[map.charCodeAt(j)] = j;
                    }
            }

            // Ignore padding
            var paddingChar = map.charAt(64);
            if (paddingChar) {
                var paddingIndex = base64Str.indexOf(paddingChar);
                if (paddingIndex !== -1) {
                    base64StrLength = paddingIndex;
                }
            }

            // Convert
            return parseLoop(base64Str, base64StrLength, reverseMap);

        },

        _map: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    };

    function parseLoop(base64Str, base64StrLength, reverseMap) {
        var words = [];
        var nBytes = 0;
        for (var i = 0; i < base64StrLength; i++) {
            if (i % 4) {
                var bits1 = reverseMap[base64Str.charCodeAt(i - 1)] << ((i % 4) * 2);
                var bits2 = reverseMap[base64Str.charCodeAt(i)] >>> (6 - (i % 4) * 2);
                words[nBytes >>> 2] |= (bits1 | bits2) << (24 - (nBytes % 4) * 8);
                nBytes++;
            }
        }
        return WordArray.create(words, nBytes);
    }
}());


(function (Math) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Constants table
    var T = [];

    // Compute constants
    (function () {
        for (var i = 0; i < 64; i++) {
            T[i] = (Math.abs(Math.sin(i + 1)) * 0x100000000) | 0;
        }
    }());

    /**
     * MD5 hash algorithm.
     */
    var MD5 = C_algo.MD5 = Hasher.extend({
        _doReset: function () {
            this._hash = new WordArray.init([
                0x67452301, 0xefcdab89,
                0x98badcfe, 0x10325476
            ]);
        },

        _doProcessBlock: function (M, offset) {
            // Swap endian
            for (var i = 0; i < 16; i++) {
                // Shortcuts
                var offset_i = offset + i;
                var M_offset_i = M[offset_i];

                M[offset_i] = (
                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                );
            }

            // Shortcuts
            var H = this._hash.words;

            var M_offset_0  = M[offset + 0];
            var M_offset_1  = M[offset + 1];
            var M_offset_2  = M[offset + 2];
            var M_offset_3  = M[offset + 3];
            var M_offset_4  = M[offset + 4];
            var M_offset_5  = M[offset + 5];
            var M_offset_6  = M[offset + 6];
            var M_offset_7  = M[offset + 7];
            var M_offset_8  = M[offset + 8];
            var M_offset_9  = M[offset + 9];
            var M_offset_10 = M[offset + 10];
            var M_offset_11 = M[offset + 11];
            var M_offset_12 = M[offset + 12];
            var M_offset_13 = M[offset + 13];
            var M_offset_14 = M[offset + 14];
            var M_offset_15 = M[offset + 15];

            // Working varialbes
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];

            // Computation
            a = FF(a, b, c, d, M_offset_0,  7,  T[0]);
            d = FF(d, a, b, c, M_offset_1,  12, T[1]);
            c = FF(c, d, a, b, M_offset_2,  17, T[2]);
            b = FF(b, c, d, a, M_offset_3,  22, T[3]);
            a = FF(a, b, c, d, M_offset_4,  7,  T[4]);
            d = FF(d, a, b, c, M_offset_5,  12, T[5]);
            c = FF(c, d, a, b, M_offset_6,  17, T[6]);
            b = FF(b, c, d, a, M_offset_7,  22, T[7]);
            a = FF(a, b, c, d, M_offset_8,  7,  T[8]);
            d = FF(d, a, b, c, M_offset_9,  12, T[9]);
            c = FF(c, d, a, b, M_offset_10, 17, T[10]);
            b = FF(b, c, d, a, M_offset_11, 22, T[11]);
            a = FF(a, b, c, d, M_offset_12, 7,  T[12]);
            d = FF(d, a, b, c, M_offset_13, 12, T[13]);
            c = FF(c, d, a, b, M_offset_14, 17, T[14]);
            b = FF(b, c, d, a, M_offset_15, 22, T[15]);

            a = GG(a, b, c, d, M_offset_1,  5,  T[16]);
            d = GG(d, a, b, c, M_offset_6,  9,  T[17]);
            c = GG(c, d, a, b, M_offset_11, 14, T[18]);
            b = GG(b, c, d, a, M_offset_0,  20, T[19]);
            a = GG(a, b, c, d, M_offset_5,  5,  T[20]);
            d = GG(d, a, b, c, M_offset_10, 9,  T[21]);
            c = GG(c, d, a, b, M_offset_15, 14, T[22]);
            b = GG(b, c, d, a, M_offset_4,  20, T[23]);
            a = GG(a, b, c, d, M_offset_9,  5,  T[24]);
            d = GG(d, a, b, c, M_offset_14, 9,  T[25]);
            c = GG(c, d, a, b, M_offset_3,  14, T[26]);
            b = GG(b, c, d, a, M_offset_8,  20, T[27]);
            a = GG(a, b, c, d, M_offset_13, 5,  T[28]);
            d = GG(d, a, b, c, M_offset_2,  9,  T[29]);
            c = GG(c, d, a, b, M_offset_7,  14, T[30]);
            b = GG(b, c, d, a, M_offset_12, 20, T[31]);

            a = HH(a, b, c, d, M_offset_5,  4,  T[32]);
            d = HH(d, a, b, c, M_offset_8,  11, T[33]);
            c = HH(c, d, a, b, M_offset_11, 16, T[34]);
            b = HH(b, c, d, a, M_offset_14, 23, T[35]);
            a = HH(a, b, c, d, M_offset_1,  4,  T[36]);
            d = HH(d, a, b, c, M_offset_4,  11, T[37]);
            c = HH(c, d, a, b, M_offset_7,  16, T[38]);
            b = HH(b, c, d, a, M_offset_10, 23, T[39]);
            a = HH(a, b, c, d, M_offset_13, 4,  T[40]);
            d = HH(d, a, b, c, M_offset_0,  11, T[41]);
            c = HH(c, d, a, b, M_offset_3,  16, T[42]);
            b = HH(b, c, d, a, M_offset_6,  23, T[43]);
            a = HH(a, b, c, d, M_offset_9,  4,  T[44]);
            d = HH(d, a, b, c, M_offset_12, 11, T[45]);
            c = HH(c, d, a, b, M_offset_15, 16, T[46]);
            b = HH(b, c, d, a, M_offset_2,  23, T[47]);

            a = II(a, b, c, d, M_offset_0,  6,  T[48]);
            d = II(d, a, b, c, M_offset_7,  10, T[49]);
            c = II(c, d, a, b, M_offset_14, 15, T[50]);
            b = II(b, c, d, a, M_offset_5,  21, T[51]);
            a = II(a, b, c, d, M_offset_12, 6,  T[52]);
            d = II(d, a, b, c, M_offset_3,  10, T[53]);
            c = II(c, d, a, b, M_offset_10, 15, T[54]);
            b = II(b, c, d, a, M_offset_1,  21, T[55]);
            a = II(a, b, c, d, M_offset_8,  6,  T[56]);
            d = II(d, a, b, c, M_offset_15, 10, T[57]);
            c = II(c, d, a, b, M_offset_6,  15, T[58]);
            b = II(b, c, d, a, M_offset_13, 21, T[59]);
            a = II(a, b, c, d, M_offset_4,  6,  T[60]);
            d = II(d, a, b, c, M_offset_11, 10, T[61]);
            c = II(c, d, a, b, M_offset_2,  15, T[62]);
            b = II(b, c, d, a, M_offset_9,  21, T[63]);

            // Intermediate hash value
            H[0] = (H[0] + a) | 0;
            H[1] = (H[1] + b) | 0;
            H[2] = (H[2] + c) | 0;
            H[3] = (H[3] + d) | 0;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);

            var nBitsTotalH = Math.floor(nBitsTotal / 0x100000000);
            var nBitsTotalL = nBitsTotal;
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = (
                (((nBitsTotalH << 8)  | (nBitsTotalH >>> 24)) & 0x00ff00ff) |
                (((nBitsTotalH << 24) | (nBitsTotalH >>> 8))  & 0xff00ff00)
            );
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                (((nBitsTotalL << 8)  | (nBitsTotalL >>> 24)) & 0x00ff00ff) |
                (((nBitsTotalL << 24) | (nBitsTotalL >>> 8))  & 0xff00ff00)
            );

            data.sigBytes = (dataWords.length + 1) * 4;

            // Hash final blocks
            this._process();

            // Shortcuts
            var hash = this._hash;
            var H = hash.words;

            // Swap endian
            for (var i = 0; i < 4; i++) {
                // Shortcut
                var H_i = H[i];

                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                        (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
            }

            // Return final computed hash
            return hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });

    function FF(a, b, c, d, x, s, t) {
        var n = a + ((b & c) | (~b & d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    function GG(a, b, c, d, x, s, t) {
        var n = a + ((b & d) | (c & ~d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    function HH(a, b, c, d, x, s, t) {
        var n = a + (b ^ c ^ d) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    function II(a, b, c, d, x, s, t) {
        var n = a + (c ^ (b | ~d)) + x + t;
        return ((n << s) | (n >>> (32 - s))) + b;
    }

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.MD5('message');
     *     var hash = CryptoJS.MD5(wordArray);
     */
    C.MD5 = Hasher._createHelper(MD5);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacMD5(message, key);
     */
    C.HmacMD5 = Hasher._createHmacHelper(MD5);
}(Math));


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Reusable object
    var W = [];

    /**
     * SHA-1 hash algorithm.
     */
    var SHA1 = C_algo.SHA1 = Hasher.extend({
        _doReset: function () {
            this._hash = new WordArray.init([
                0x67452301, 0xefcdab89,
                0x98badcfe, 0x10325476,
                0xc3d2e1f0
            ]);
        },

        _doProcessBlock: function (M, offset) {
            // Shortcut
            var H = this._hash.words;

            // Working variables
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];
            var e = H[4];

            // Computation
            for (var i = 0; i < 80; i++) {
                if (i < 16) {
                    W[i] = M[offset + i] | 0;
                } else {
                    var n = W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16];
                    W[i] = (n << 1) | (n >>> 31);
                }

                var t = ((a << 5) | (a >>> 27)) + e + W[i];
                if (i < 20) {
                    t += ((b & c) | (~b & d)) + 0x5a827999;
                } else if (i < 40) {
                    t += (b ^ c ^ d) + 0x6ed9eba1;
                } else if (i < 60) {
                    t += ((b & c) | (b & d) | (c & d)) - 0x70e44324;
                } else /* if (i < 80) */ {
                    t += (b ^ c ^ d) - 0x359d3e2a;
                }

                e = d;
                d = c;
                c = (b << 30) | (b >>> 2);
                b = a;
                a = t;
            }

            // Intermediate hash value
            H[0] = (H[0] + a) | 0;
            H[1] = (H[1] + b) | 0;
            H[2] = (H[2] + c) | 0;
            H[3] = (H[3] + d) | 0;
            H[4] = (H[4] + e) | 0;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;

            // Hash final blocks
            this._process();

            // Return final computed hash
            return this._hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA1('message');
     *     var hash = CryptoJS.SHA1(wordArray);
     */
    C.SHA1 = Hasher._createHelper(SHA1);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA1(message, key);
     */
    C.HmacSHA1 = Hasher._createHmacHelper(SHA1);
}());


(function (Math) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Initialization and round constants tables
    var H = [];
    var K = [];

    // Compute constants
    (function () {
        function isPrime(n) {
            var sqrtN = Math.sqrt(n);
            for (var factor = 2; factor <= sqrtN; factor++) {
                if (!(n % factor)) {
                    return false;
                }
            }

            return true;
        }

        function getFractionalBits(n) {
            return ((n - (n | 0)) * 0x100000000) | 0;
        }

        var n = 2;
        var nPrime = 0;
        while (nPrime < 64) {
            if (isPrime(n)) {
                if (nPrime < 8) {
                    H[nPrime] = getFractionalBits(Math.pow(n, 1 / 2));
                }
                K[nPrime] = getFractionalBits(Math.pow(n, 1 / 3));

                nPrime++;
            }

            n++;
        }
    }());

    // Reusable object
    var W = [];

    /**
     * SHA-256 hash algorithm.
     */
    var SHA256 = C_algo.SHA256 = Hasher.extend({
        _doReset: function () {
            this._hash = new WordArray.init(H.slice(0));
        },

        _doProcessBlock: function (M, offset) {
            // Shortcut
            var H = this._hash.words;

            // Working variables
            var a = H[0];
            var b = H[1];
            var c = H[2];
            var d = H[3];
            var e = H[4];
            var f = H[5];
            var g = H[6];
            var h = H[7];

            // Computation
            for (var i = 0; i < 64; i++) {
                if (i < 16) {
                    W[i] = M[offset + i] | 0;
                } else {
                    var gamma0x = W[i - 15];
                    var gamma0  = ((gamma0x << 25) | (gamma0x >>> 7))  ^
                                    ((gamma0x << 14) | (gamma0x >>> 18)) ^
                                    (gamma0x >>> 3);

                    var gamma1x = W[i - 2];
                    var gamma1  = ((gamma1x << 15) | (gamma1x >>> 17)) ^
                                    ((gamma1x << 13) | (gamma1x >>> 19)) ^
                                    (gamma1x >>> 10);

                    W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16];
                }

                var ch  = (e & f) ^ (~e & g);
                var maj = (a & b) ^ (a & c) ^ (b & c);

                var sigma0 = ((a << 30) | (a >>> 2)) ^ ((a << 19) | (a >>> 13)) ^ ((a << 10) | (a >>> 22));
                var sigma1 = ((e << 26) | (e >>> 6)) ^ ((e << 21) | (e >>> 11)) ^ ((e << 7)  | (e >>> 25));

                var t1 = h + sigma1 + ch + K[i] + W[i];
                var t2 = sigma0 + maj;

                h = g;
                g = f;
                f = e;
                e = (d + t1) | 0;
                d = c;
                c = b;
                b = a;
                a = (t1 + t2) | 0;
            }

            // Intermediate hash value
            H[0] = (H[0] + a) | 0;
            H[1] = (H[1] + b) | 0;
            H[2] = (H[2] + c) | 0;
            H[3] = (H[3] + d) | 0;
            H[4] = (H[4] + e) | 0;
            H[5] = (H[5] + f) | 0;
            H[6] = (H[6] + g) | 0;
            H[7] = (H[7] + h) | 0;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = Math.floor(nBitsTotal / 0x100000000);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 15] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;

            // Hash final blocks
            this._process();

            // Return final computed hash
            return this._hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA256('message');
     *     var hash = CryptoJS.SHA256(wordArray);
     */
    C.SHA256 = Hasher._createHelper(SHA256);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA256(message, key);
     */
    C.HmacSHA256 = Hasher._createHmacHelper(SHA256);
}(Math));


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var C_enc = C.enc;

    /**
     * UTF-16 BE encoding strategy.
     */
    var Utf16BE = C_enc.Utf16 = C_enc.Utf16BE = {
        /**
         * Converts a word array to a UTF-16 BE string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-16 BE string.
         *
         * @static
         *
         * @example
         *
         *     var utf16String = CryptoJS.enc.Utf16.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var utf16Chars = [];
            for (var i = 0; i < sigBytes; i += 2) {
                var codePoint = (words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff;
                utf16Chars.push(String.fromCharCode(codePoint));
            }

            return utf16Chars.join('');
        },

        /**
         * Converts a UTF-16 BE string to a word array.
         *
         * @param {string} utf16Str The UTF-16 BE string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf16.parse(utf16String);
         */
        parse: function (utf16Str) {
            // Shortcut
            var utf16StrLength = utf16Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < utf16StrLength; i++) {
                words[i >>> 1] |= utf16Str.charCodeAt(i) << (16 - (i % 2) * 16);
            }

            return WordArray.create(words, utf16StrLength * 2);
        }
    };

    /**
     * UTF-16 LE encoding strategy.
     */
    C_enc.Utf16LE = {
        /**
         * Converts a word array to a UTF-16 LE string.
         *
         * @param {WordArray} wordArray The word array.
         *
         * @return {string} The UTF-16 LE string.
         *
         * @static
         *
         * @example
         *
         *     var utf16Str = CryptoJS.enc.Utf16LE.stringify(wordArray);
         */
        stringify: function (wordArray) {
            // Shortcuts
            var words = wordArray.words;
            var sigBytes = wordArray.sigBytes;

            // Convert
            var utf16Chars = [];
            for (var i = 0; i < sigBytes; i += 2) {
                var codePoint = swapEndian((words[i >>> 2] >>> (16 - (i % 4) * 8)) & 0xffff);
                utf16Chars.push(String.fromCharCode(codePoint));
            }

            return utf16Chars.join('');
        },

        /**
         * Converts a UTF-16 LE string to a word array.
         *
         * @param {string} utf16Str The UTF-16 LE string.
         *
         * @return {WordArray} The word array.
         *
         * @static
         *
         * @example
         *
         *     var wordArray = CryptoJS.enc.Utf16LE.parse(utf16Str);
         */
        parse: function (utf16Str) {
            // Shortcut
            var utf16StrLength = utf16Str.length;

            // Convert
            var words = [];
            for (var i = 0; i < utf16StrLength; i++) {
                words[i >>> 1] |= swapEndian(utf16Str.charCodeAt(i) << (16 - (i % 2) * 16));
            }

            return WordArray.create(words, utf16StrLength * 2);
        }
    };

    function swapEndian(word) {
        return ((word << 8) & 0xff00ff00) | ((word >>> 8) & 0x00ff00ff);
    }
}());


(function () {
    // Check if typed arrays are supported
    if (typeof ArrayBuffer != 'function') {
        return;
    }

    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;

    // Reference original init
    var superInit = WordArray.init;

    // Augment WordArray.init to handle typed arrays
    var subInit = WordArray.init = function (typedArray) {
        // Convert buffers to uint8
        if (typedArray instanceof ArrayBuffer) {
            typedArray = new Uint8Array(typedArray);
        }

        // Convert other array views to uint8
        if (
            typedArray instanceof Int8Array ||
            (typeof Uint8ClampedArray !== "undefined" && typedArray instanceof Uint8ClampedArray) ||
            typedArray instanceof Int16Array ||
            typedArray instanceof Uint16Array ||
            typedArray instanceof Int32Array ||
            typedArray instanceof Uint32Array ||
            typedArray instanceof Float32Array ||
            typedArray instanceof Float64Array
        ) {
            typedArray = new Uint8Array(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength);
        }

        // Handle Uint8Array
        if (typedArray instanceof Uint8Array) {
            // Shortcut
            var typedArrayByteLength = typedArray.byteLength;

            // Extract bytes
            var words = [];
            for (var i = 0; i < typedArrayByteLength; i++) {
                words[i >>> 2] |= typedArray[i] << (24 - (i % 4) * 8);
            }

            // Initialize this word array
            superInit.call(this, words, typedArrayByteLength);
        } else {
            // Else call normal init
            superInit.apply(this, arguments);
        }
    };

    subInit.prototype = WordArray;
}());


/** @preserve
(c) 2012 by Cédric Mesnil. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

    - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
    - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
*/

(function (Math) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_algo = C.algo;

    // Constants table
    var _zl = WordArray.create([
        0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15,
        7,  4, 13,  1, 10,  6, 15,  3, 12,  0,  9,  5,  2, 14, 11,  8,
        3, 10, 14,  4,  9, 15,  8,  1,  2,  7,  0,  6, 13, 11,  5, 12,
        1,  9, 11, 10,  0,  8, 12,  4, 13,  3,  7, 15, 14,  5,  6,  2,
        4,  0,  5,  9,  7, 12,  2, 10, 14,  1,  3,  8, 11,  6, 15, 13]);
    var _zr = WordArray.create([
        5, 14,  7,  0,  9,  2, 11,  4, 13,  6, 15,  8,  1, 10,  3, 12,
        6, 11,  3,  7,  0, 13,  5, 10, 14, 15,  8, 12,  4,  9,  1,  2,
        15,  5,  1,  3,  7, 14,  6,  9, 11,  8, 12,  2, 10,  0,  4, 13,
        8,  6,  4,  1,  3, 11, 15,  0,  5, 12,  2, 13,  9,  7, 10, 14,
        12, 15, 10,  4,  1,  5,  8,  7,  6,  2, 13, 14,  0,  3,  9, 11]);
    var _sl = WordArray.create([
            11, 14, 15, 12,  5,  8,  7,  9, 11, 13, 14, 15,  6,  7,  9,  8,
        7, 6,   8, 13, 11,  9,  7, 15,  7, 12, 15,  9, 11,  7, 13, 12,
        11, 13,  6,  7, 14,  9, 13, 15, 14,  8, 13,  6,  5, 12,  7,  5,
            11, 12, 14, 15, 14, 15,  9,  8,  9, 14,  5,  6,  8,  6,  5, 12,
        9, 15,  5, 11,  6,  8, 13, 12,  5, 12, 13, 14, 11,  8,  5,  6 ]);
    var _sr = WordArray.create([
        8,  9,  9, 11, 13, 15, 15,  5,  7,  7,  8, 11, 14, 14, 12,  6,
        9, 13, 15,  7, 12,  8,  9, 11,  7,  7, 12,  7,  6, 15, 13, 11,
        9,  7, 15, 11,  8,  6,  6, 14, 12, 13,  5, 14, 13, 13,  7,  5,
        15,  5,  8, 11, 14, 14,  6, 14,  6,  9, 12,  9, 12,  5, 15,  8,
        8,  5, 12,  9, 12,  5, 14,  6,  8, 13,  6,  5, 15, 13, 11, 11 ]);

    var _hl =  WordArray.create([ 0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E]);
    var _hr =  WordArray.create([ 0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000]);

    /**
     * RIPEMD160 hash algorithm.
     */
    var RIPEMD160 = C_algo.RIPEMD160 = Hasher.extend({
        _doReset: function () {
            this._hash  = WordArray.create([0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0]);
        },

        _doProcessBlock: function (M, offset) {

            // Swap endian
            for (var i = 0; i < 16; i++) {
                // Shortcuts
                var offset_i = offset + i;
                var M_offset_i = M[offset_i];

                // Swap
                M[offset_i] = (
                    (((M_offset_i << 8)  | (M_offset_i >>> 24)) & 0x00ff00ff) |
                    (((M_offset_i << 24) | (M_offset_i >>> 8))  & 0xff00ff00)
                );
            }
            // Shortcut
            var H  = this._hash.words;
            var hl = _hl.words;
            var hr = _hr.words;
            var zl = _zl.words;
            var zr = _zr.words;
            var sl = _sl.words;
            var sr = _sr.words;

            // Working variables
            var al, bl, cl, dl, el;
            var ar, br, cr, dr, er;

            ar = al = H[0];
            br = bl = H[1];
            cr = cl = H[2];
            dr = dl = H[3];
            er = el = H[4];
            // Computation
            var t;
            for (var i = 0; i < 80; i += 1) {
                t = (al +  M[offset+zl[i]])|0;
                if (i<16){
                t +=  f1(bl,cl,dl) + hl[0];
                } else if (i<32) {
                t +=  f2(bl,cl,dl) + hl[1];
                } else if (i<48) {
                t +=  f3(bl,cl,dl) + hl[2];
                } else if (i<64) {
                t +=  f4(bl,cl,dl) + hl[3];
                } else {// if (i<80) {
                t +=  f5(bl,cl,dl) + hl[4];
                }
                t = t|0;
                t =  rotl(t,sl[i]);
                t = (t+el)|0;
                al = el;
                el = dl;
                dl = rotl(cl, 10);
                cl = bl;
                bl = t;

                t = (ar + M[offset+zr[i]])|0;
                if (i<16){
                t +=  f5(br,cr,dr) + hr[0];
                } else if (i<32) {
                t +=  f4(br,cr,dr) + hr[1];
                } else if (i<48) {
                t +=  f3(br,cr,dr) + hr[2];
                } else if (i<64) {
                t +=  f2(br,cr,dr) + hr[3];
                } else {// if (i<80) {
                t +=  f1(br,cr,dr) + hr[4];
                }
                t = t|0;
                t =  rotl(t,sr[i]) ;
                t = (t+er)|0;
                ar = er;
                er = dr;
                dr = rotl(cr, 10);
                cr = br;
                br = t;
            }
            // Intermediate hash value
            t    = (H[1] + cl + dr)|0;
            H[1] = (H[2] + dl + er)|0;
            H[2] = (H[3] + el + ar)|0;
            H[3] = (H[4] + al + br)|0;
            H[4] = (H[0] + bl + cr)|0;
            H[0] =  t;
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
            dataWords[(((nBitsLeft + 64) >>> 9) << 4) + 14] = (
                (((nBitsTotal << 8)  | (nBitsTotal >>> 24)) & 0x00ff00ff) |
                (((nBitsTotal << 24) | (nBitsTotal >>> 8))  & 0xff00ff00)
            );
            data.sigBytes = (dataWords.length + 1) * 4;

            // Hash final blocks
            this._process();

            // Shortcuts
            var hash = this._hash;
            var H = hash.words;

            // Swap endian
            for (var i = 0; i < 5; i++) {
                // Shortcut
                var H_i = H[i];

                // Swap
                H[i] = (((H_i << 8)  | (H_i >>> 24)) & 0x00ff00ff) |
                        (((H_i << 24) | (H_i >>> 8))  & 0xff00ff00);
            }

            // Return final computed hash
            return hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        }
    });


    function f1(x, y, z) {
        return ((x) ^ (y) ^ (z));

    }

    function f2(x, y, z) {
        return (((x)&(y)) | ((~x)&(z)));
    }

    function f3(x, y, z) {
        return (((x) | (~(y))) ^ (z));
    }

    function f4(x, y, z) {
        return (((x) & (z)) | ((y)&(~(z))));
    }

    function f5(x, y, z) {
        return ((x) ^ ((y) |(~(z))));

    }

    function rotl(x,n) {
        return (x<<n) | (x>>>(32-n));
    }


    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.RIPEMD160('message');
     *     var hash = CryptoJS.RIPEMD160(wordArray);
     */
    C.RIPEMD160 = Hasher._createHelper(RIPEMD160);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacRIPEMD160(message, key);
     */
    C.HmacRIPEMD160 = Hasher._createHmacHelper(RIPEMD160);
}(Math));


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var C_enc = C.enc;
    var Utf8 = C_enc.Utf8;
    var C_algo = C.algo;

    /**
     * HMAC algorithm.
     */
    var HMAC = C_algo.HMAC = Base.extend({
        /**
         * Initializes a newly created HMAC.
         *
         * @param {Hasher} hasher The hash algorithm to use.
         * @param {WordArray|string} key The secret key.
         *
         * @example
         *
         *     var hmacHasher = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, key);
         */
        init: function (hasher, key) {
            // Init hasher
            hasher = this._hasher = new hasher.init();

            // Convert string to WordArray, else assume WordArray already
            if (typeof key == 'string') {
                key = Utf8.parse(key);
            }

            // Shortcuts
            var hasherBlockSize = hasher.blockSize;
            var hasherBlockSizeBytes = hasherBlockSize * 4;

            // Allow arbitrary length keys
            if (key.sigBytes > hasherBlockSizeBytes) {
                key = hasher.finalize(key);
            }

            // Clamp excess bits
            key.clamp();

            // Clone key for inner and outer pads
            var oKey = this._oKey = key.clone();
            var iKey = this._iKey = key.clone();

            // Shortcuts
            var oKeyWords = oKey.words;
            var iKeyWords = iKey.words;

            // XOR keys with pad constants
            for (var i = 0; i < hasherBlockSize; i++) {
                oKeyWords[i] ^= 0x5c5c5c5c;
                iKeyWords[i] ^= 0x36363636;
            }
            oKey.sigBytes = iKey.sigBytes = hasherBlockSizeBytes;

            // Set initial values
            this.reset();
        },

        /**
         * Resets this HMAC to its initial state.
         *
         * @example
         *
         *     hmacHasher.reset();
         */
        reset: function () {
            // Shortcut
            var hasher = this._hasher;

            // Reset
            hasher.reset();
            hasher.update(this._iKey);
        },

        /**
         * Updates this HMAC with a message.
         *
         * @param {WordArray|string} messageUpdate The message to append.
         *
         * @return {HMAC} This HMAC instance.
         *
         * @example
         *
         *     hmacHasher.update('message');
         *     hmacHasher.update(wordArray);
         */
        update: function (messageUpdate) {
            this._hasher.update(messageUpdate);

            // Chainable
            return this;
        },

        /**
         * Finalizes the HMAC computation.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} messageUpdate (Optional) A final message update.
         *
         * @return {WordArray} The HMAC.
         *
         * @example
         *
         *     var hmac = hmacHasher.finalize();
         *     var hmac = hmacHasher.finalize('message');
         *     var hmac = hmacHasher.finalize(wordArray);
         */
        finalize: function (messageUpdate) {
            // Shortcut
            var hasher = this._hasher;

            // Compute HMAC
            var innerHash = hasher.finalize(messageUpdate);
            hasher.reset();
            var hmac = hasher.finalize(this._oKey.clone().concat(innerHash));

            return hmac;
        }
    });
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    var C_algo = C.algo;
    var SHA1 = C_algo.SHA1;
    var HMAC = C_algo.HMAC;

    /**
     * Password-Based Key Derivation Function 2 algorithm.
     */
    var PBKDF2 = C_algo.PBKDF2 = Base.extend({
        /**
         * Configuration options.
         *
         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
         * @property {Hasher} hasher The hasher to use. Default: SHA1
         * @property {number} iterations The number of iterations to perform. Default: 1
         */
        cfg: Base.extend({
            keySize: 128/32,
            hasher: SHA1,
            iterations: 1
        }),

        /**
         * Initializes a newly created key derivation function.
         *
         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
         *
         * @example
         *
         *     var kdf = CryptoJS.algo.PBKDF2.create();
         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8 });
         *     var kdf = CryptoJS.algo.PBKDF2.create({ keySize: 8, iterations: 1000 });
         */
        init: function (cfg) {
            this.cfg = this.cfg.extend(cfg);
        },

        /**
         * Computes the Password-Based Key Derivation Function 2.
         *
         * @param {WordArray|string} password The password.
         * @param {WordArray|string} salt A salt.
         *
         * @return {WordArray} The derived key.
         *
         * @example
         *
         *     var key = kdf.compute(password, salt);
         */
        compute: function (password, salt) {
            // Shortcut
            var cfg = this.cfg;

            // Init HMAC
            var hmac = HMAC.create(cfg.hasher, password);

            // Initial values
            var derivedKey = WordArray.create();
            var blockIndex = WordArray.create([0x00000001]);

            // Shortcuts
            var derivedKeyWords = derivedKey.words;
            var blockIndexWords = blockIndex.words;
            var keySize = cfg.keySize;
            var iterations = cfg.iterations;

            // Generate key
            while (derivedKeyWords.length < keySize) {
                var block = hmac.update(salt).finalize(blockIndex);
                hmac.reset();

                // Shortcuts
                var blockWords = block.words;
                var blockWordsLength = blockWords.length;

                // Iterations
                var intermediate = block;
                for (var i = 1; i < iterations; i++) {
                    intermediate = hmac.finalize(intermediate);
                    hmac.reset();

                    // Shortcut
                    var intermediateWords = intermediate.words;

                    // XOR intermediate with block
                    for (var j = 0; j < blockWordsLength; j++) {
                        blockWords[j] ^= intermediateWords[j];
                    }
                }

                derivedKey.concat(block);
                blockIndexWords[0]++;
            }
            derivedKey.sigBytes = keySize * 4;

            return derivedKey;
        }
    });

    /**
     * Computes the Password-Based Key Derivation Function 2.
     *
     * @param {WordArray|string} password The password.
     * @param {WordArray|string} salt A salt.
     * @param {Object} cfg (Optional) The configuration options to use for this computation.
     *
     * @return {WordArray} The derived key.
     *
     * @static
     *
     * @example
     *
     *     var key = CryptoJS.PBKDF2(password, salt);
     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8 });
     *     var key = CryptoJS.PBKDF2(password, salt, { keySize: 8, iterations: 1000 });
     */
    C.PBKDF2 = function (password, salt, cfg) {
        return PBKDF2.create(cfg).compute(password, salt);
    };
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    var C_algo = C.algo;
    var MD5 = C_algo.MD5;

    /**
     * This key derivation function is meant to conform with EVP_BytesToKey.
     * www.openssl.org/docs/crypto/EVP_BytesToKey.html
     */
    var EvpKDF = C_algo.EvpKDF = Base.extend({
        /**
         * Configuration options.
         *
         * @property {number} keySize The key size in words to generate. Default: 4 (128 bits)
         * @property {Hasher} hasher The hash algorithm to use. Default: MD5
         * @property {number} iterations The number of iterations to perform. Default: 1
         */
        cfg: Base.extend({
            keySize: 128/32,
            hasher: MD5,
            iterations: 1
        }),

        /**
         * Initializes a newly created key derivation function.
         *
         * @param {Object} cfg (Optional) The configuration options to use for the derivation.
         *
         * @example
         *
         *     var kdf = CryptoJS.algo.EvpKDF.create();
         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8 });
         *     var kdf = CryptoJS.algo.EvpKDF.create({ keySize: 8, iterations: 1000 });
         */
        init: function (cfg) {
            this.cfg = this.cfg.extend(cfg);
        },

        /**
         * Derives a key from a password.
         *
         * @param {WordArray|string} password The password.
         * @param {WordArray|string} salt A salt.
         *
         * @return {WordArray} The derived key.
         *
         * @example
         *
         *     var key = kdf.compute(password, salt);
         */
        compute: function (password, salt) {
            // Shortcut
            var cfg = this.cfg;

            // Init hasher
            var hasher = cfg.hasher.create();

            // Initial values
            var derivedKey = WordArray.create();

            // Shortcuts
            var derivedKeyWords = derivedKey.words;
            var keySize = cfg.keySize;
            var iterations = cfg.iterations;

            // Generate key
            while (derivedKeyWords.length < keySize) {
                if (block) {
                    hasher.update(block);
                }
                var block = hasher.update(password).finalize(salt);
                hasher.reset();

                // Iterations
                for (var i = 1; i < iterations; i++) {
                    block = hasher.finalize(block);
                    hasher.reset();
                }

                derivedKey.concat(block);
            }
            derivedKey.sigBytes = keySize * 4;

            return derivedKey;
        }
    });

    /**
     * Derives a key from a password.
     *
     * @param {WordArray|string} password The password.
     * @param {WordArray|string} salt A salt.
     * @param {Object} cfg (Optional) The configuration options to use for this computation.
     *
     * @return {WordArray} The derived key.
     *
     * @static
     *
     * @example
     *
     *     var key = CryptoJS.EvpKDF(password, salt);
     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8 });
     *     var key = CryptoJS.EvpKDF(password, salt, { keySize: 8, iterations: 1000 });
     */
    C.EvpKDF = function (password, salt, cfg) {
        return EvpKDF.create(cfg).compute(password, salt);
    };
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var C_algo = C.algo;
    var SHA256 = C_algo.SHA256;

    /**
     * SHA-224 hash algorithm.
     */
    var SHA224 = C_algo.SHA224 = SHA256.extend({
        _doReset: function () {
            this._hash = new WordArray.init([
                0xc1059ed8, 0x367cd507, 0x3070dd17, 0xf70e5939,
                0xffc00b31, 0x68581511, 0x64f98fa7, 0xbefa4fa4
            ]);
        },

        _doFinalize: function () {
            var hash = SHA256._doFinalize.call(this);

            hash.sigBytes -= 4;

            return hash;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA224('message');
     *     var hash = CryptoJS.SHA224(wordArray);
     */
    C.SHA224 = SHA256._createHelper(SHA224);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA224(message, key);
     */
    C.HmacSHA224 = SHA256._createHmacHelper(SHA224);
}());


(function (undefined) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var X32WordArray = C_lib.WordArray;

    /**
     * x64 namespace.
     */
    var C_x64 = C.x64 = {};

    /**
     * A 64-bit word.
     */
    var X64Word = C_x64.Word = Base.extend({
        /**
         * Initializes a newly created 64-bit word.
         *
         * @param {number} high The high 32 bits.
         * @param {number} low The low 32 bits.
         *
         * @example
         *
         *     var x64Word = CryptoJS.x64.Word.create(0x00010203, 0x04050607);
         */
        init: function (high, low) {
            this.high = high;
            this.low = low;
        }

        /**
         * Bitwise NOTs this word.
         *
         * @return {X64Word} A new x64-Word object after negating.
         *
         * @example
         *
         *     var negated = x64Word.not();
         */
        // not: function () {
            // var high = ~this.high;
            // var low = ~this.low;

            // return X64Word.create(high, low);
        // },

        /**
         * Bitwise ANDs this word with the passed word.
         *
         * @param {X64Word} word The x64-Word to AND with this word.
         *
         * @return {X64Word} A new x64-Word object after ANDing.
         *
         * @example
         *
         *     var anded = x64Word.and(anotherX64Word);
         */
        // and: function (word) {
            // var high = this.high & word.high;
            // var low = this.low & word.low;

            // return X64Word.create(high, low);
        // },

        /**
         * Bitwise ORs this word with the passed word.
         *
         * @param {X64Word} word The x64-Word to OR with this word.
         *
         * @return {X64Word} A new x64-Word object after ORing.
         *
         * @example
         *
         *     var ored = x64Word.or(anotherX64Word);
         */
        // or: function (word) {
            // var high = this.high | word.high;
            // var low = this.low | word.low;

            // return X64Word.create(high, low);
        // },

        /**
         * Bitwise XORs this word with the passed word.
         *
         * @param {X64Word} word The x64-Word to XOR with this word.
         *
         * @return {X64Word} A new x64-Word object after XORing.
         *
         * @example
         *
         *     var xored = x64Word.xor(anotherX64Word);
         */
        // xor: function (word) {
            // var high = this.high ^ word.high;
            // var low = this.low ^ word.low;

            // return X64Word.create(high, low);
        // },

        /**
         * Shifts this word n bits to the left.
         *
         * @param {number} n The number of bits to shift.
         *
         * @return {X64Word} A new x64-Word object after shifting.
         *
         * @example
         *
         *     var shifted = x64Word.shiftL(25);
         */
        // shiftL: function (n) {
            // if (n < 32) {
                // var high = (this.high << n) | (this.low >>> (32 - n));
                // var low = this.low << n;
            // } else {
                // var high = this.low << (n - 32);
                // var low = 0;
            // }

            // return X64Word.create(high, low);
        // },

        /**
         * Shifts this word n bits to the right.
         *
         * @param {number} n The number of bits to shift.
         *
         * @return {X64Word} A new x64-Word object after shifting.
         *
         * @example
         *
         *     var shifted = x64Word.shiftR(7);
         */
        // shiftR: function (n) {
            // if (n < 32) {
                // var low = (this.low >>> n) | (this.high << (32 - n));
                // var high = this.high >>> n;
            // } else {
                // var low = this.high >>> (n - 32);
                // var high = 0;
            // }

            // return X64Word.create(high, low);
        // },

        /**
         * Rotates this word n bits to the left.
         *
         * @param {number} n The number of bits to rotate.
         *
         * @return {X64Word} A new x64-Word object after rotating.
         *
         * @example
         *
         *     var rotated = x64Word.rotL(25);
         */
        // rotL: function (n) {
            // return this.shiftL(n).or(this.shiftR(64 - n));
        // },

        /**
         * Rotates this word n bits to the right.
         *
         * @param {number} n The number of bits to rotate.
         *
         * @return {X64Word} A new x64-Word object after rotating.
         *
         * @example
         *
         *     var rotated = x64Word.rotR(7);
         */
        // rotR: function (n) {
            // return this.shiftR(n).or(this.shiftL(64 - n));
        // },

        /**
         * Adds this word with the passed word.
         *
         * @param {X64Word} word The x64-Word to add with this word.
         *
         * @return {X64Word} A new x64-Word object after adding.
         *
         * @example
         *
         *     var added = x64Word.add(anotherX64Word);
         */
        // add: function (word) {
            // var low = (this.low + word.low) | 0;
            // var carry = (low >>> 0) < (this.low >>> 0) ? 1 : 0;
            // var high = (this.high + word.high + carry) | 0;

            // return X64Word.create(high, low);
        // }
    });

    /**
     * An array of 64-bit words.
     *
     * @property {Array} words The array of CryptoJS.x64.Word objects.
     * @property {number} sigBytes The number of significant bytes in this word array.
     */
    var X64WordArray = C_x64.WordArray = Base.extend({
        /**
         * Initializes a newly created word array.
         *
         * @param {Array} words (Optional) An array of CryptoJS.x64.Word objects.
         * @param {number} sigBytes (Optional) The number of significant bytes in the words.
         *
         * @example
         *
         *     var wordArray = CryptoJS.x64.WordArray.create();
         *
         *     var wordArray = CryptoJS.x64.WordArray.create([
         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
         *     ]);
         *
         *     var wordArray = CryptoJS.x64.WordArray.create([
         *         CryptoJS.x64.Word.create(0x00010203, 0x04050607),
         *         CryptoJS.x64.Word.create(0x18191a1b, 0x1c1d1e1f)
         *     ], 10);
         */
        init: function (words, sigBytes) {
            words = this.words = words || [];

            if (sigBytes != undefined) {
                this.sigBytes = sigBytes;
            } else {
                this.sigBytes = words.length * 8;
            }
        },

        /**
         * Converts this 64-bit word array to a 32-bit word array.
         *
         * @return {CryptoJS.lib.WordArray} This word array's data as a 32-bit word array.
         *
         * @example
         *
         *     var x32WordArray = x64WordArray.toX32();
         */
        toX32: function () {
            // Shortcuts
            var x64Words = this.words;
            var x64WordsLength = x64Words.length;

            // Convert
            var x32Words = [];
            for (var i = 0; i < x64WordsLength; i++) {
                var x64Word = x64Words[i];
                x32Words.push(x64Word.high);
                x32Words.push(x64Word.low);
            }

            return X32WordArray.create(x32Words, this.sigBytes);
        },

        /**
         * Creates a copy of this word array.
         *
         * @return {X64WordArray} The clone.
         *
         * @example
         *
         *     var clone = x64WordArray.clone();
         */
        clone: function () {
            var clone = Base.clone.call(this);

            // Clone "words" array
            var words = clone.words = this.words.slice(0);

            // Clone each X64Word object
            var wordsLength = words.length;
            for (var i = 0; i < wordsLength; i++) {
                words[i] = words[i].clone();
            }

            return clone;
        }
    });
}());


(function (Math) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var Hasher = C_lib.Hasher;
    var C_x64 = C.x64;
    var X64Word = C_x64.Word;
    var C_algo = C.algo;

    // Constants tables
    var RHO_OFFSETS = [];
    var PI_INDEXES  = [];
    var ROUND_CONSTANTS = [];

    // Compute Constants
    (function () {
        // Compute rho offset constants
        var x = 1, y = 0;
        for (var t = 0; t < 24; t++) {
            RHO_OFFSETS[x + 5 * y] = ((t + 1) * (t + 2) / 2) % 64;

            var newX = y % 5;
            var newY = (2 * x + 3 * y) % 5;
            x = newX;
            y = newY;
        }

        // Compute pi index constants
        for (var x = 0; x < 5; x++) {
            for (var y = 0; y < 5; y++) {
                PI_INDEXES[x + 5 * y] = y + ((2 * x + 3 * y) % 5) * 5;
            }
        }

        // Compute round constants
        var LFSR = 0x01;
        for (var i = 0; i < 24; i++) {
            var roundConstantMsw = 0;
            var roundConstantLsw = 0;

            for (var j = 0; j < 7; j++) {
                if (LFSR & 0x01) {
                    var bitPosition = (1 << j) - 1;
                    if (bitPosition < 32) {
                        roundConstantLsw ^= 1 << bitPosition;
                    } else /* if (bitPosition >= 32) */ {
                        roundConstantMsw ^= 1 << (bitPosition - 32);
                    }
                }

                // Compute next LFSR
                if (LFSR & 0x80) {
                    // Primitive polynomial over GF(2): x^8 + x^6 + x^5 + x^4 + 1
                    LFSR = (LFSR << 1) ^ 0x71;
                } else {
                    LFSR <<= 1;
                }
            }

            ROUND_CONSTANTS[i] = X64Word.create(roundConstantMsw, roundConstantLsw);
        }
    }());

    // Reusable objects for temporary values
    var T = [];
    (function () {
        for (var i = 0; i < 25; i++) {
            T[i] = X64Word.create();
        }
    }());

    /**
     * SHA-3 hash algorithm.
     */
    var SHA3 = C_algo.SHA3 = Hasher.extend({
        /**
         * Configuration options.
         *
         * @property {number} outputLength
         *   The desired number of bits in the output hash.
         *   Only values permitted are: 224, 256, 384, 512.
         *   Default: 512
         */
        cfg: Hasher.cfg.extend({
            outputLength: 512
        }),

        _doReset: function () {
            var state = this._state = []
            for (var i = 0; i < 25; i++) {
                state[i] = new X64Word.init();
            }

            this.blockSize = (1600 - 2 * this.cfg.outputLength) / 32;
        },

        _doProcessBlock: function (M, offset) {
            // Shortcuts
            var state = this._state;
            var nBlockSizeLanes = this.blockSize / 2;

            // Absorb
            for (var i = 0; i < nBlockSizeLanes; i++) {
                // Shortcuts
                var M2i  = M[offset + 2 * i];
                var M2i1 = M[offset + 2 * i + 1];

                // Swap endian
                M2i = (
                    (((M2i << 8)  | (M2i >>> 24)) & 0x00ff00ff) |
                    (((M2i << 24) | (M2i >>> 8))  & 0xff00ff00)
                );
                M2i1 = (
                    (((M2i1 << 8)  | (M2i1 >>> 24)) & 0x00ff00ff) |
                    (((M2i1 << 24) | (M2i1 >>> 8))  & 0xff00ff00)
                );

                // Absorb message into state
                var lane = state[i];
                lane.high ^= M2i1;
                lane.low  ^= M2i;
            }

            // Rounds
            for (var round = 0; round < 24; round++) {
                // Theta
                for (var x = 0; x < 5; x++) {
                    // Mix column lanes
                    var tMsw = 0, tLsw = 0;
                    for (var y = 0; y < 5; y++) {
                        var lane = state[x + 5 * y];
                        tMsw ^= lane.high;
                        tLsw ^= lane.low;
                    }

                    // Temporary values
                    var Tx = T[x];
                    Tx.high = tMsw;
                    Tx.low  = tLsw;
                }
                for (var x = 0; x < 5; x++) {
                    // Shortcuts
                    var Tx4 = T[(x + 4) % 5];
                    var Tx1 = T[(x + 1) % 5];
                    var Tx1Msw = Tx1.high;
                    var Tx1Lsw = Tx1.low;

                    // Mix surrounding columns
                    var tMsw = Tx4.high ^ ((Tx1Msw << 1) | (Tx1Lsw >>> 31));
                    var tLsw = Tx4.low  ^ ((Tx1Lsw << 1) | (Tx1Msw >>> 31));
                    for (var y = 0; y < 5; y++) {
                        var lane = state[x + 5 * y];
                        lane.high ^= tMsw;
                        lane.low  ^= tLsw;
                    }
                }

                // Rho Pi
                for (var laneIndex = 1; laneIndex < 25; laneIndex++) {
                    // Shortcuts
                    var lane = state[laneIndex];
                    var laneMsw = lane.high;
                    var laneLsw = lane.low;
                    var rhoOffset = RHO_OFFSETS[laneIndex];

                    // Rotate lanes
                    if (rhoOffset < 32) {
                        var tMsw = (laneMsw << rhoOffset) | (laneLsw >>> (32 - rhoOffset));
                        var tLsw = (laneLsw << rhoOffset) | (laneMsw >>> (32 - rhoOffset));
                    } else /* if (rhoOffset >= 32) */ {
                        var tMsw = (laneLsw << (rhoOffset - 32)) | (laneMsw >>> (64 - rhoOffset));
                        var tLsw = (laneMsw << (rhoOffset - 32)) | (laneLsw >>> (64 - rhoOffset));
                    }

                    // Transpose lanes
                    var TPiLane = T[PI_INDEXES[laneIndex]];
                    TPiLane.high = tMsw;
                    TPiLane.low  = tLsw;
                }

                // Rho pi at x = y = 0
                var T0 = T[0];
                var state0 = state[0];
                T0.high = state0.high;
                T0.low  = state0.low;

                // Chi
                for (var x = 0; x < 5; x++) {
                    for (var y = 0; y < 5; y++) {
                        // Shortcuts
                        var laneIndex = x + 5 * y;
                        var lane = state[laneIndex];
                        var TLane = T[laneIndex];
                        var Tx1Lane = T[((x + 1) % 5) + 5 * y];
                        var Tx2Lane = T[((x + 2) % 5) + 5 * y];

                        // Mix rows
                        lane.high = TLane.high ^ (~Tx1Lane.high & Tx2Lane.high);
                        lane.low  = TLane.low  ^ (~Tx1Lane.low  & Tx2Lane.low);
                    }
                }

                // Iota
                var lane = state[0];
                var roundConstant = ROUND_CONSTANTS[round];
                lane.high ^= roundConstant.high;
                lane.low  ^= roundConstant.low;;
            }
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;
            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;
            var blockSizeBits = this.blockSize * 32;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x1 << (24 - nBitsLeft % 32);
            dataWords[((Math.ceil((nBitsLeft + 1) / blockSizeBits) * blockSizeBits) >>> 5) - 1] |= 0x80;
            data.sigBytes = dataWords.length * 4;

            // Hash final blocks
            this._process();

            // Shortcuts
            var state = this._state;
            var outputLengthBytes = this.cfg.outputLength / 8;
            var outputLengthLanes = outputLengthBytes / 8;

            // Squeeze
            var hashWords = [];
            for (var i = 0; i < outputLengthLanes; i++) {
                // Shortcuts
                var lane = state[i];
                var laneMsw = lane.high;
                var laneLsw = lane.low;

                // Swap endian
                laneMsw = (
                    (((laneMsw << 8)  | (laneMsw >>> 24)) & 0x00ff00ff) |
                    (((laneMsw << 24) | (laneMsw >>> 8))  & 0xff00ff00)
                );
                laneLsw = (
                    (((laneLsw << 8)  | (laneLsw >>> 24)) & 0x00ff00ff) |
                    (((laneLsw << 24) | (laneLsw >>> 8))  & 0xff00ff00)
                );

                // Squeeze state to retrieve hash
                hashWords.push(laneLsw);
                hashWords.push(laneMsw);
            }

            // Return final computed hash
            return new WordArray.init(hashWords, outputLengthBytes);
        },

        clone: function () {
            var clone = Hasher.clone.call(this);

            var state = clone._state = this._state.slice(0);
            for (var i = 0; i < 25; i++) {
                state[i] = state[i].clone();
            }

            return clone;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA3('message');
     *     var hash = CryptoJS.SHA3(wordArray);
     */
    C.SHA3 = Hasher._createHelper(SHA3);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA3(message, key);
     */
    C.HmacSHA3 = Hasher._createHmacHelper(SHA3);
}(Math));


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Hasher = C_lib.Hasher;
    var C_x64 = C.x64;
    var X64Word = C_x64.Word;
    var X64WordArray = C_x64.WordArray;
    var C_algo = C.algo;

    function X64Word_create() {
        return X64Word.create.apply(X64Word, arguments);
    }

    // Constants
    var K = [
        X64Word_create(0x428a2f98, 0xd728ae22), X64Word_create(0x71374491, 0x23ef65cd),
        X64Word_create(0xb5c0fbcf, 0xec4d3b2f), X64Word_create(0xe9b5dba5, 0x8189dbbc),
        X64Word_create(0x3956c25b, 0xf348b538), X64Word_create(0x59f111f1, 0xb605d019),
        X64Word_create(0x923f82a4, 0xaf194f9b), X64Word_create(0xab1c5ed5, 0xda6d8118),
        X64Word_create(0xd807aa98, 0xa3030242), X64Word_create(0x12835b01, 0x45706fbe),
        X64Word_create(0x243185be, 0x4ee4b28c), X64Word_create(0x550c7dc3, 0xd5ffb4e2),
        X64Word_create(0x72be5d74, 0xf27b896f), X64Word_create(0x80deb1fe, 0x3b1696b1),
        X64Word_create(0x9bdc06a7, 0x25c71235), X64Word_create(0xc19bf174, 0xcf692694),
        X64Word_create(0xe49b69c1, 0x9ef14ad2), X64Word_create(0xefbe4786, 0x384f25e3),
        X64Word_create(0x0fc19dc6, 0x8b8cd5b5), X64Word_create(0x240ca1cc, 0x77ac9c65),
        X64Word_create(0x2de92c6f, 0x592b0275), X64Word_create(0x4a7484aa, 0x6ea6e483),
        X64Word_create(0x5cb0a9dc, 0xbd41fbd4), X64Word_create(0x76f988da, 0x831153b5),
        X64Word_create(0x983e5152, 0xee66dfab), X64Word_create(0xa831c66d, 0x2db43210),
        X64Word_create(0xb00327c8, 0x98fb213f), X64Word_create(0xbf597fc7, 0xbeef0ee4),
        X64Word_create(0xc6e00bf3, 0x3da88fc2), X64Word_create(0xd5a79147, 0x930aa725),
        X64Word_create(0x06ca6351, 0xe003826f), X64Word_create(0x14292967, 0x0a0e6e70),
        X64Word_create(0x27b70a85, 0x46d22ffc), X64Word_create(0x2e1b2138, 0x5c26c926),
        X64Word_create(0x4d2c6dfc, 0x5ac42aed), X64Word_create(0x53380d13, 0x9d95b3df),
        X64Word_create(0x650a7354, 0x8baf63de), X64Word_create(0x766a0abb, 0x3c77b2a8),
        X64Word_create(0x81c2c92e, 0x47edaee6), X64Word_create(0x92722c85, 0x1482353b),
        X64Word_create(0xa2bfe8a1, 0x4cf10364), X64Word_create(0xa81a664b, 0xbc423001),
        X64Word_create(0xc24b8b70, 0xd0f89791), X64Word_create(0xc76c51a3, 0x0654be30),
        X64Word_create(0xd192e819, 0xd6ef5218), X64Word_create(0xd6990624, 0x5565a910),
        X64Word_create(0xf40e3585, 0x5771202a), X64Word_create(0x106aa070, 0x32bbd1b8),
        X64Word_create(0x19a4c116, 0xb8d2d0c8), X64Word_create(0x1e376c08, 0x5141ab53),
        X64Word_create(0x2748774c, 0xdf8eeb99), X64Word_create(0x34b0bcb5, 0xe19b48a8),
        X64Word_create(0x391c0cb3, 0xc5c95a63), X64Word_create(0x4ed8aa4a, 0xe3418acb),
        X64Word_create(0x5b9cca4f, 0x7763e373), X64Word_create(0x682e6ff3, 0xd6b2b8a3),
        X64Word_create(0x748f82ee, 0x5defb2fc), X64Word_create(0x78a5636f, 0x43172f60),
        X64Word_create(0x84c87814, 0xa1f0ab72), X64Word_create(0x8cc70208, 0x1a6439ec),
        X64Word_create(0x90befffa, 0x23631e28), X64Word_create(0xa4506ceb, 0xde82bde9),
        X64Word_create(0xbef9a3f7, 0xb2c67915), X64Word_create(0xc67178f2, 0xe372532b),
        X64Word_create(0xca273ece, 0xea26619c), X64Word_create(0xd186b8c7, 0x21c0c207),
        X64Word_create(0xeada7dd6, 0xcde0eb1e), X64Word_create(0xf57d4f7f, 0xee6ed178),
        X64Word_create(0x06f067aa, 0x72176fba), X64Word_create(0x0a637dc5, 0xa2c898a6),
        X64Word_create(0x113f9804, 0xbef90dae), X64Word_create(0x1b710b35, 0x131c471b),
        X64Word_create(0x28db77f5, 0x23047d84), X64Word_create(0x32caab7b, 0x40c72493),
        X64Word_create(0x3c9ebe0a, 0x15c9bebc), X64Word_create(0x431d67c4, 0x9c100d4c),
        X64Word_create(0x4cc5d4be, 0xcb3e42b6), X64Word_create(0x597f299c, 0xfc657e2a),
        X64Word_create(0x5fcb6fab, 0x3ad6faec), X64Word_create(0x6c44198c, 0x4a475817)
    ];

    // Reusable objects
    var W = [];
    (function () {
        for (var i = 0; i < 80; i++) {
            W[i] = X64Word_create();
        }
    }());

    /**
     * SHA-512 hash algorithm.
     */
    var SHA512 = C_algo.SHA512 = Hasher.extend({
        _doReset: function () {
            this._hash = new X64WordArray.init([
                new X64Word.init(0x6a09e667, 0xf3bcc908), new X64Word.init(0xbb67ae85, 0x84caa73b),
                new X64Word.init(0x3c6ef372, 0xfe94f82b), new X64Word.init(0xa54ff53a, 0x5f1d36f1),
                new X64Word.init(0x510e527f, 0xade682d1), new X64Word.init(0x9b05688c, 0x2b3e6c1f),
                new X64Word.init(0x1f83d9ab, 0xfb41bd6b), new X64Word.init(0x5be0cd19, 0x137e2179)
            ]);
        },

        _doProcessBlock: function (M, offset) {
            // Shortcuts
            var H = this._hash.words;

            var H0 = H[0];
            var H1 = H[1];
            var H2 = H[2];
            var H3 = H[3];
            var H4 = H[4];
            var H5 = H[5];
            var H6 = H[6];
            var H7 = H[7];

            var H0h = H0.high;
            var H0l = H0.low;
            var H1h = H1.high;
            var H1l = H1.low;
            var H2h = H2.high;
            var H2l = H2.low;
            var H3h = H3.high;
            var H3l = H3.low;
            var H4h = H4.high;
            var H4l = H4.low;
            var H5h = H5.high;
            var H5l = H5.low;
            var H6h = H6.high;
            var H6l = H6.low;
            var H7h = H7.high;
            var H7l = H7.low;

            // Working variables
            var ah = H0h;
            var al = H0l;
            var bh = H1h;
            var bl = H1l;
            var ch = H2h;
            var cl = H2l;
            var dh = H3h;
            var dl = H3l;
            var eh = H4h;
            var el = H4l;
            var fh = H5h;
            var fl = H5l;
            var gh = H6h;
            var gl = H6l;
            var hh = H7h;
            var hl = H7l;

            // Rounds
            for (var i = 0; i < 80; i++) {
                // Shortcut
                var Wi = W[i];

                // Extend message
                if (i < 16) {
                    var Wih = Wi.high = M[offset + i * 2]     | 0;
                    var Wil = Wi.low  = M[offset + i * 2 + 1] | 0;
                } else {
                    // Gamma0
                    var gamma0x  = W[i - 15];
                    var gamma0xh = gamma0x.high;
                    var gamma0xl = gamma0x.low;
                    var gamma0h  = ((gamma0xh >>> 1) | (gamma0xl << 31)) ^ ((gamma0xh >>> 8) | (gamma0xl << 24)) ^ (gamma0xh >>> 7);
                    var gamma0l  = ((gamma0xl >>> 1) | (gamma0xh << 31)) ^ ((gamma0xl >>> 8) | (gamma0xh << 24)) ^ ((gamma0xl >>> 7) | (gamma0xh << 25));

                    // Gamma1
                    var gamma1x  = W[i - 2];
                    var gamma1xh = gamma1x.high;
                    var gamma1xl = gamma1x.low;
                    var gamma1h  = ((gamma1xh >>> 19) | (gamma1xl << 13)) ^ ((gamma1xh << 3) | (gamma1xl >>> 29)) ^ (gamma1xh >>> 6);
                    var gamma1l  = ((gamma1xl >>> 19) | (gamma1xh << 13)) ^ ((gamma1xl << 3) | (gamma1xh >>> 29)) ^ ((gamma1xl >>> 6) | (gamma1xh << 26));

                    // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
                    var Wi7  = W[i - 7];
                    var Wi7h = Wi7.high;
                    var Wi7l = Wi7.low;

                    var Wi16  = W[i - 16];
                    var Wi16h = Wi16.high;
                    var Wi16l = Wi16.low;

                    var Wil = gamma0l + Wi7l;
                    var Wih = gamma0h + Wi7h + ((Wil >>> 0) < (gamma0l >>> 0) ? 1 : 0);
                    var Wil = Wil + gamma1l;
                    var Wih = Wih + gamma1h + ((Wil >>> 0) < (gamma1l >>> 0) ? 1 : 0);
                    var Wil = Wil + Wi16l;
                    var Wih = Wih + Wi16h + ((Wil >>> 0) < (Wi16l >>> 0) ? 1 : 0);

                    Wi.high = Wih;
                    Wi.low  = Wil;
                }

                var chh  = (eh & fh) ^ (~eh & gh);
                var chl  = (el & fl) ^ (~el & gl);
                var majh = (ah & bh) ^ (ah & ch) ^ (bh & ch);
                var majl = (al & bl) ^ (al & cl) ^ (bl & cl);

                var sigma0h = ((ah >>> 28) | (al << 4))  ^ ((ah << 30)  | (al >>> 2)) ^ ((ah << 25) | (al >>> 7));
                var sigma0l = ((al >>> 28) | (ah << 4))  ^ ((al << 30)  | (ah >>> 2)) ^ ((al << 25) | (ah >>> 7));
                var sigma1h = ((eh >>> 14) | (el << 18)) ^ ((eh >>> 18) | (el << 14)) ^ ((eh << 23) | (el >>> 9));
                var sigma1l = ((el >>> 14) | (eh << 18)) ^ ((el >>> 18) | (eh << 14)) ^ ((el << 23) | (eh >>> 9));

                // t1 = h + sigma1 + ch + K[i] + W[i]
                var Ki  = K[i];
                var Kih = Ki.high;
                var Kil = Ki.low;

                var t1l = hl + sigma1l;
                var t1h = hh + sigma1h + ((t1l >>> 0) < (hl >>> 0) ? 1 : 0);
                var t1l = t1l + chl;
                var t1h = t1h + chh + ((t1l >>> 0) < (chl >>> 0) ? 1 : 0);
                var t1l = t1l + Kil;
                var t1h = t1h + Kih + ((t1l >>> 0) < (Kil >>> 0) ? 1 : 0);
                var t1l = t1l + Wil;
                var t1h = t1h + Wih + ((t1l >>> 0) < (Wil >>> 0) ? 1 : 0);

                // t2 = sigma0 + maj
                var t2l = sigma0l + majl;
                var t2h = sigma0h + majh + ((t2l >>> 0) < (sigma0l >>> 0) ? 1 : 0);

                // Update working variables
                hh = gh;
                hl = gl;
                gh = fh;
                gl = fl;
                fh = eh;
                fl = el;
                el = (dl + t1l) | 0;
                eh = (dh + t1h + ((el >>> 0) < (dl >>> 0) ? 1 : 0)) | 0;
                dh = ch;
                dl = cl;
                ch = bh;
                cl = bl;
                bh = ah;
                bl = al;
                al = (t1l + t2l) | 0;
                ah = (t1h + t2h + ((al >>> 0) < (t1l >>> 0) ? 1 : 0)) | 0;
            }

            // Intermediate hash value
            H0l = H0.low  = (H0l + al);
            H0.high = (H0h + ah + ((H0l >>> 0) < (al >>> 0) ? 1 : 0));
            H1l = H1.low  = (H1l + bl);
            H1.high = (H1h + bh + ((H1l >>> 0) < (bl >>> 0) ? 1 : 0));
            H2l = H2.low  = (H2l + cl);
            H2.high = (H2h + ch + ((H2l >>> 0) < (cl >>> 0) ? 1 : 0));
            H3l = H3.low  = (H3l + dl);
            H3.high = (H3h + dh + ((H3l >>> 0) < (dl >>> 0) ? 1 : 0));
            H4l = H4.low  = (H4l + el);
            H4.high = (H4h + eh + ((H4l >>> 0) < (el >>> 0) ? 1 : 0));
            H5l = H5.low  = (H5l + fl);
            H5.high = (H5h + fh + ((H5l >>> 0) < (fl >>> 0) ? 1 : 0));
            H6l = H6.low  = (H6l + gl);
            H6.high = (H6h + gh + ((H6l >>> 0) < (gl >>> 0) ? 1 : 0));
            H7l = H7.low  = (H7l + hl);
            H7.high = (H7h + hh + ((H7l >>> 0) < (hl >>> 0) ? 1 : 0));
        },

        _doFinalize: function () {
            // Shortcuts
            var data = this._data;
            var dataWords = data.words;

            var nBitsTotal = this._nDataBytes * 8;
            var nBitsLeft = data.sigBytes * 8;

            // Add padding
            dataWords[nBitsLeft >>> 5] |= 0x80 << (24 - nBitsLeft % 32);
            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 30] = Math.floor(nBitsTotal / 0x100000000);
            dataWords[(((nBitsLeft + 128) >>> 10) << 5) + 31] = nBitsTotal;
            data.sigBytes = dataWords.length * 4;

            // Hash final blocks
            this._process();

            // Convert hash to 32-bit word array before returning
            var hash = this._hash.toX32();

            // Return final computed hash
            return hash;
        },

        clone: function () {
            var clone = Hasher.clone.call(this);
            clone._hash = this._hash.clone();

            return clone;
        },

        blockSize: 1024/32
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA512('message');
     *     var hash = CryptoJS.SHA512(wordArray);
     */
    C.SHA512 = Hasher._createHelper(SHA512);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA512(message, key);
     */
    C.HmacSHA512 = Hasher._createHmacHelper(SHA512);
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_x64 = C.x64;
    var X64Word = C_x64.Word;
    var X64WordArray = C_x64.WordArray;
    var C_algo = C.algo;
    var SHA512 = C_algo.SHA512;

    /**
     * SHA-384 hash algorithm.
     */
    var SHA384 = C_algo.SHA384 = SHA512.extend({
        _doReset: function () {
            this._hash = new X64WordArray.init([
                new X64Word.init(0xcbbb9d5d, 0xc1059ed8), new X64Word.init(0x629a292a, 0x367cd507),
                new X64Word.init(0x9159015a, 0x3070dd17), new X64Word.init(0x152fecd8, 0xf70e5939),
                new X64Word.init(0x67332667, 0xffc00b31), new X64Word.init(0x8eb44a87, 0x68581511),
                new X64Word.init(0xdb0c2e0d, 0x64f98fa7), new X64Word.init(0x47b5481d, 0xbefa4fa4)
            ]);
        },

        _doFinalize: function () {
            var hash = SHA512._doFinalize.call(this);

            hash.sigBytes -= 16;

            return hash;
        }
    });

    /**
     * Shortcut function to the hasher's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     *
     * @return {WordArray} The hash.
     *
     * @static
     *
     * @example
     *
     *     var hash = CryptoJS.SHA384('message');
     *     var hash = CryptoJS.SHA384(wordArray);
     */
    C.SHA384 = SHA512._createHelper(SHA384);

    /**
     * Shortcut function to the HMAC's object interface.
     *
     * @param {WordArray|string} message The message to hash.
     * @param {WordArray|string} key The secret key.
     *
     * @return {WordArray} The HMAC.
     *
     * @static
     *
     * @example
     *
     *     var hmac = CryptoJS.HmacSHA384(message, key);
     */
    C.HmacSHA384 = SHA512._createHmacHelper(SHA384);
}());


/**
 * Cipher core components.
 */
CryptoJS.lib.Cipher || (function (undefined) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var Base = C_lib.Base;
    var WordArray = C_lib.WordArray;
    var BufferedBlockAlgorithm = C_lib.BufferedBlockAlgorithm;
    var C_enc = C.enc;
    var Utf8 = C_enc.Utf8;
    var Base64 = C_enc.Base64;
    var C_algo = C.algo;
    var EvpKDF = C_algo.EvpKDF;

    /**
     * Abstract base cipher template.
     *
     * @property {number} keySize This cipher's key size. Default: 4 (128 bits)
     * @property {number} ivSize This cipher's IV size. Default: 4 (128 bits)
     * @property {number} _ENC_XFORM_MODE A constant representing encryption mode.
     * @property {number} _DEC_XFORM_MODE A constant representing decryption mode.
     */
    var Cipher = C_lib.Cipher = BufferedBlockAlgorithm.extend({
        /**
         * Configuration options.
         *
         * @property {WordArray} iv The IV to use for this operation.
         */
        cfg: Base.extend(),

        /**
         * Creates this cipher in encryption mode.
         *
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {Cipher} A cipher instance.
         *
         * @static
         *
         * @example
         *
         *     var cipher = CryptoJS.algo.AES.createEncryptor(keyWordArray, { iv: ivWordArray });
         */
        createEncryptor: function (key, cfg) {
            return this.create(this._ENC_XFORM_MODE, key, cfg);
        },

        /**
         * Creates this cipher in decryption mode.
         *
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {Cipher} A cipher instance.
         *
         * @static
         *
         * @example
         *
         *     var cipher = CryptoJS.algo.AES.createDecryptor(keyWordArray, { iv: ivWordArray });
         */
        createDecryptor: function (key, cfg) {
            return this.create(this._DEC_XFORM_MODE, key, cfg);
        },

        /**
         * Initializes a newly created cipher.
         *
         * @param {number} xformMode Either the encryption or decryption transormation mode constant.
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @example
         *
         *     var cipher = CryptoJS.algo.AES.create(CryptoJS.algo.AES._ENC_XFORM_MODE, keyWordArray, { iv: ivWordArray });
         */
        init: function (xformMode, key, cfg) {
            // Apply config defaults
            this.cfg = this.cfg.extend(cfg);

            // Store transform mode and key
            this._xformMode = xformMode;
            this._key = key;

            // Set initial values
            this.reset();
        },

        /**
         * Resets this cipher to its initial state.
         *
         * @example
         *
         *     cipher.reset();
         */
        reset: function () {
            // Reset data buffer
            BufferedBlockAlgorithm.reset.call(this);

            // Perform concrete-cipher logic
            this._doReset();
        },

        /**
         * Adds data to be encrypted or decrypted.
         *
         * @param {WordArray|string} dataUpdate The data to encrypt or decrypt.
         *
         * @return {WordArray} The data after processing.
         *
         * @example
         *
         *     var encrypted = cipher.process('data');
         *     var encrypted = cipher.process(wordArray);
         */
        process: function (dataUpdate) {
            // Append
            this._append(dataUpdate);

            // Process available blocks
            return this._process();
        },

        /**
         * Finalizes the encryption or decryption process.
         * Note that the finalize operation is effectively a destructive, read-once operation.
         *
         * @param {WordArray|string} dataUpdate The final data to encrypt or decrypt.
         *
         * @return {WordArray} The data after final processing.
         *
         * @example
         *
         *     var encrypted = cipher.finalize();
         *     var encrypted = cipher.finalize('data');
         *     var encrypted = cipher.finalize(wordArray);
         */
        finalize: function (dataUpdate) {
            // Final data update
            if (dataUpdate) {
                this._append(dataUpdate);
            }

            // Perform concrete-cipher logic
            var finalProcessedData = this._doFinalize();

            return finalProcessedData;
        },

        keySize: 128/32,

        ivSize: 128/32,

        _ENC_XFORM_MODE: 1,

        _DEC_XFORM_MODE: 2,

        /**
         * Creates shortcut functions to a cipher's object interface.
         *
         * @param {Cipher} cipher The cipher to create a helper for.
         *
         * @return {Object} An object with encrypt and decrypt shortcut functions.
         *
         * @static
         *
         * @example
         *
         *     var AES = CryptoJS.lib.Cipher._createHelper(CryptoJS.algo.AES);
         */
        _createHelper: (function () {
            function selectCipherStrategy(key) {
                if (typeof key == 'string') {
                    return PasswordBasedCipher;
                } else {
                    return SerializableCipher;
                }
            }

            return function (cipher) {
                return {
                    encrypt: function (message, key, cfg) {
                        return selectCipherStrategy(key).encrypt(cipher, message, key, cfg);
                    },

                    decrypt: function (ciphertext, key, cfg) {
                        return selectCipherStrategy(key).decrypt(cipher, ciphertext, key, cfg);
                    }
                };
            };
        }())
    });

    /**
     * Abstract base stream cipher template.
     *
     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 1 (32 bits)
     */
    var StreamCipher = C_lib.StreamCipher = Cipher.extend({
        _doFinalize: function () {
            // Process partial blocks
            var finalProcessedBlocks = this._process(!!'flush');

            return finalProcessedBlocks;
        },

        blockSize: 1
    });

    /**
     * Mode namespace.
     */
    var C_mode = C.mode = {};

    /**
     * Abstract base block cipher mode template.
     */
    var BlockCipherMode = C_lib.BlockCipherMode = Base.extend({
        /**
         * Creates this mode for encryption.
         *
         * @param {Cipher} cipher A block cipher instance.
         * @param {Array} iv The IV words.
         *
         * @static
         *
         * @example
         *
         *     var mode = CryptoJS.mode.CBC.createEncryptor(cipher, iv.words);
         */
        createEncryptor: function (cipher, iv) {
            return this.Encryptor.create(cipher, iv);
        },

        /**
         * Creates this mode for decryption.
         *
         * @param {Cipher} cipher A block cipher instance.
         * @param {Array} iv The IV words.
         *
         * @static
         *
         * @example
         *
         *     var mode = CryptoJS.mode.CBC.createDecryptor(cipher, iv.words);
         */
        createDecryptor: function (cipher, iv) {
            return this.Decryptor.create(cipher, iv);
        },

        /**
         * Initializes a newly created mode.
         *
         * @param {Cipher} cipher A block cipher instance.
         * @param {Array} iv The IV words.
         *
         * @example
         *
         *     var mode = CryptoJS.mode.CBC.Encryptor.create(cipher, iv.words);
         */
        init: function (cipher, iv) {
            this._cipher = cipher;
            this._iv = iv;
        }
    });

    /**
     * Cipher Block Chaining mode.
     */
    var CBC = C_mode.CBC = (function () {
        /**
         * Abstract base CBC mode.
         */
        var CBC = BlockCipherMode.extend();

        /**
         * CBC encryptor.
         */
        CBC.Encryptor = CBC.extend({
            /**
             * Processes the data block at offset.
             *
             * @param {Array} words The data words to operate on.
             * @param {number} offset The offset where the block starts.
             *
             * @example
             *
             *     mode.processBlock(data.words, offset);
             */
            processBlock: function (words, offset) {
                // Shortcuts
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;

                // XOR and encrypt
                xorBlock.call(this, words, offset, blockSize);
                cipher.encryptBlock(words, offset);

                // Remember this block to use with next block
                this._prevBlock = words.slice(offset, offset + blockSize);
            }
        });

        /**
         * CBC decryptor.
         */
        CBC.Decryptor = CBC.extend({
            /**
             * Processes the data block at offset.
             *
             * @param {Array} words The data words to operate on.
             * @param {number} offset The offset where the block starts.
             *
             * @example
             *
             *     mode.processBlock(data.words, offset);
             */
            processBlock: function (words, offset) {
                // Shortcuts
                var cipher = this._cipher;
                var blockSize = cipher.blockSize;

                // Remember this block to use with next block
                var thisBlock = words.slice(offset, offset + blockSize);

                // Decrypt and XOR
                cipher.decryptBlock(words, offset);
                xorBlock.call(this, words, offset, blockSize);

                // This block becomes the previous block
                this._prevBlock = thisBlock;
            }
        });

        function xorBlock(words, offset, blockSize) {
            // Shortcut
            var iv = this._iv;

            // Choose mixing block
            if (iv) {
                var block = iv;

                // Remove IV for subsequent blocks
                this._iv = undefined;
            } else {
                var block = this._prevBlock;
            }

            // XOR blocks
            for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= block[i];
            }
        }

        return CBC;
    }());

    /**
     * Padding namespace.
     */
    var C_pad = C.pad = {};

    /**
     * PKCS #5/7 padding strategy.
     */
    var Pkcs7 = C_pad.Pkcs7 = {
        /**
         * Pads data using the algorithm defined in PKCS #5/7.
         *
         * @param {WordArray} data The data to pad.
         * @param {number} blockSize The multiple that the data should be padded to.
         *
         * @static
         *
         * @example
         *
         *     CryptoJS.pad.Pkcs7.pad(wordArray, 4);
         */
        pad: function (data, blockSize) {
            // Shortcut
            var blockSizeBytes = blockSize * 4;

            // Count padding bytes
            var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

            // Create padding word
            var paddingWord = (nPaddingBytes << 24) | (nPaddingBytes << 16) | (nPaddingBytes << 8) | nPaddingBytes;

            // Create padding
            var paddingWords = [];
            for (var i = 0; i < nPaddingBytes; i += 4) {
                paddingWords.push(paddingWord);
            }
            var padding = WordArray.create(paddingWords, nPaddingBytes);

            // Add padding
            data.concat(padding);
        },

        /**
         * Unpads data that had been padded using the algorithm defined in PKCS #5/7.
         *
         * @param {WordArray} data The data to unpad.
         *
         * @static
         *
         * @example
         *
         *     CryptoJS.pad.Pkcs7.unpad(wordArray);
         */
        unpad: function (data) {
            // Get number of padding bytes from last byte
            var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

            // Remove padding
            data.sigBytes -= nPaddingBytes;
        }
    };

    /**
     * Abstract base block cipher template.
     *
     * @property {number} blockSize The number of 32-bit words this cipher operates on. Default: 4 (128 bits)
     */
    var BlockCipher = C_lib.BlockCipher = Cipher.extend({
        /**
         * Configuration options.
         *
         * @property {Mode} mode The block mode to use. Default: CBC
         * @property {Padding} padding The padding strategy to use. Default: Pkcs7
         */
        cfg: Cipher.cfg.extend({
            mode: CBC,
            padding: Pkcs7
        }),

        reset: function () {
            // Reset cipher
            Cipher.reset.call(this);

            // Shortcuts
            var cfg = this.cfg;
            var iv = cfg.iv;
            var mode = cfg.mode;

            // Reset block mode
            if (this._xformMode == this._ENC_XFORM_MODE) {
                var modeCreator = mode.createEncryptor;
            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                var modeCreator = mode.createDecryptor;
                // Keep at least one block in the buffer for unpadding
                this._minBufferSize = 1;
            }

            if (this._mode && this._mode.__creator == modeCreator) {
                this._mode.init(this, iv && iv.words);
            } else {
                this._mode = modeCreator.call(mode, this, iv && iv.words);
                this._mode.__creator = modeCreator;
            }
        },

        _doProcessBlock: function (words, offset) {
            this._mode.processBlock(words, offset);
        },

        _doFinalize: function () {
            // Shortcut
            var padding = this.cfg.padding;

            // Finalize
            if (this._xformMode == this._ENC_XFORM_MODE) {
                // Pad data
                padding.pad(this._data, this.blockSize);

                // Process final blocks
                var finalProcessedBlocks = this._process(!!'flush');
            } else /* if (this._xformMode == this._DEC_XFORM_MODE) */ {
                // Process final blocks
                var finalProcessedBlocks = this._process(!!'flush');

                // Unpad data
                padding.unpad(finalProcessedBlocks);
            }

            return finalProcessedBlocks;
        },

        blockSize: 128/32
    });

    /**
     * A collection of cipher parameters.
     *
     * @property {WordArray} ciphertext The raw ciphertext.
     * @property {WordArray} key The key to this ciphertext.
     * @property {WordArray} iv The IV used in the ciphering operation.
     * @property {WordArray} salt The salt used with a key derivation function.
     * @property {Cipher} algorithm The cipher algorithm.
     * @property {Mode} mode The block mode used in the ciphering operation.
     * @property {Padding} padding The padding scheme used in the ciphering operation.
     * @property {number} blockSize The block size of the cipher.
     * @property {Format} formatter The default formatting strategy to convert this cipher params object to a string.
     */
    var CipherParams = C_lib.CipherParams = Base.extend({
        /**
         * Initializes a newly created cipher params object.
         *
         * @param {Object} cipherParams An object with any of the possible cipher parameters.
         *
         * @example
         *
         *     var cipherParams = CryptoJS.lib.CipherParams.create({
         *         ciphertext: ciphertextWordArray,
         *         key: keyWordArray,
         *         iv: ivWordArray,
         *         salt: saltWordArray,
         *         algorithm: CryptoJS.algo.AES,
         *         mode: CryptoJS.mode.CBC,
         *         padding: CryptoJS.pad.PKCS7,
         *         blockSize: 4,
         *         formatter: CryptoJS.format.OpenSSL
         *     });
         */
        init: function (cipherParams) {
            this.mixIn(cipherParams);
        },

        /**
         * Converts this cipher params object to a string.
         *
         * @param {Format} formatter (Optional) The formatting strategy to use.
         *
         * @return {string} The stringified cipher params.
         *
         * @throws Error If neither the formatter nor the default formatter is set.
         *
         * @example
         *
         *     var string = cipherParams + '';
         *     var string = cipherParams.toString();
         *     var string = cipherParams.toString(CryptoJS.format.OpenSSL);
         */
        toString: function (formatter) {
            return (formatter || this.formatter).stringify(this);
        }
    });

    /**
     * Format namespace.
     */
    var C_format = C.format = {};

    /**
     * OpenSSL formatting strategy.
     */
    var OpenSSLFormatter = C_format.OpenSSL = {
        /**
         * Converts a cipher params object to an OpenSSL-compatible string.
         *
         * @param {CipherParams} cipherParams The cipher params object.
         *
         * @return {string} The OpenSSL-compatible string.
         *
         * @static
         *
         * @example
         *
         *     var openSSLString = CryptoJS.format.OpenSSL.stringify(cipherParams);
         */
        stringify: function (cipherParams) {
            // Shortcuts
            var ciphertext = cipherParams.ciphertext;
            var salt = cipherParams.salt;

            // Format
            if (salt) {
                var wordArray = WordArray.create([0x53616c74, 0x65645f5f]).concat(salt).concat(ciphertext);
            } else {
                var wordArray = ciphertext;
            }

            return wordArray.toString(Base64);
        },

        /**
         * Converts an OpenSSL-compatible string to a cipher params object.
         *
         * @param {string} openSSLStr The OpenSSL-compatible string.
         *
         * @return {CipherParams} The cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var cipherParams = CryptoJS.format.OpenSSL.parse(openSSLString);
         */
        parse: function (openSSLStr) {
            // Parse base64
            var ciphertext = Base64.parse(openSSLStr);

            // Shortcut
            var ciphertextWords = ciphertext.words;

            // Test for salt
            if (ciphertextWords[0] == 0x53616c74 && ciphertextWords[1] == 0x65645f5f) {
                // Extract salt
                var salt = WordArray.create(ciphertextWords.slice(2, 4));

                // Remove salt from ciphertext
                ciphertextWords.splice(0, 4);
                ciphertext.sigBytes -= 16;
            }

            return CipherParams.create({ ciphertext: ciphertext, salt: salt });
        }
    };

    /**
     * A cipher wrapper that returns ciphertext as a serializable cipher params object.
     */
    var SerializableCipher = C_lib.SerializableCipher = Base.extend({
        /**
         * Configuration options.
         *
         * @property {Formatter} format The formatting strategy to convert cipher param objects to and from a string. Default: OpenSSL
         */
        cfg: Base.extend({
            format: OpenSSLFormatter
        }),

        /**
         * Encrypts a message.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {WordArray|string} message The message to encrypt.
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {CipherParams} A cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key);
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv });
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher.encrypt(CryptoJS.algo.AES, message, key, { iv: iv, format: CryptoJS.format.OpenSSL });
         */
        encrypt: function (cipher, message, key, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Encrypt
            var encryptor = cipher.createEncryptor(key, cfg);
            var ciphertext = encryptor.finalize(message);

            // Shortcut
            var cipherCfg = encryptor.cfg;

            // Create and return serializable cipher params
            return CipherParams.create({
                ciphertext: ciphertext,
                key: key,
                iv: cipherCfg.iv,
                algorithm: cipher,
                mode: cipherCfg.mode,
                padding: cipherCfg.padding,
                blockSize: cipher.blockSize,
                formatter: cfg.format
            });
        },

        /**
         * Decrypts serialized ciphertext.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
         * @param {WordArray} key The key.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {WordArray} The plaintext.
         *
         * @static
         *
         * @example
         *
         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, key, { iv: iv, format: CryptoJS.format.OpenSSL });
         *     var plaintext = CryptoJS.lib.SerializableCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, key, { iv: iv, format: CryptoJS.format.OpenSSL });
         */
        decrypt: function (cipher, ciphertext, key, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Convert string to CipherParams
            ciphertext = this._parse(ciphertext, cfg.format);

            // Decrypt
            var plaintext = cipher.createDecryptor(key, cfg).finalize(ciphertext.ciphertext);

            return plaintext;
        },

        /**
         * Converts serialized ciphertext to CipherParams,
         * else assumed CipherParams already and returns ciphertext unchanged.
         *
         * @param {CipherParams|string} ciphertext The ciphertext.
         * @param {Formatter} format The formatting strategy to use to parse serialized ciphertext.
         *
         * @return {CipherParams} The unserialized ciphertext.
         *
         * @static
         *
         * @example
         *
         *     var ciphertextParams = CryptoJS.lib.SerializableCipher._parse(ciphertextStringOrParams, format);
         */
        _parse: function (ciphertext, format) {
            if (typeof ciphertext == 'string') {
                return format.parse(ciphertext, this);
            } else {
                return ciphertext;
            }
        }
    });

    /**
     * Key derivation function namespace.
     */
    var C_kdf = C.kdf = {};

    /**
     * OpenSSL key derivation function.
     */
    var OpenSSLKdf = C_kdf.OpenSSL = {
        /**
         * Derives a key and IV from a password.
         *
         * @param {string} password The password to derive from.
         * @param {number} keySize The size in words of the key to generate.
         * @param {number} ivSize The size in words of the IV to generate.
         * @param {WordArray|string} salt (Optional) A 64-bit salt to use. If omitted, a salt will be generated randomly.
         *
         * @return {CipherParams} A cipher params object with the key, IV, and salt.
         *
         * @static
         *
         * @example
         *
         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32);
         *     var derivedParams = CryptoJS.kdf.OpenSSL.execute('Password', 256/32, 128/32, 'saltsalt');
         */
        execute: function (password, keySize, ivSize, salt) {
            // Generate random salt
            if (!salt) {
                salt = WordArray.random(64/8);
            }

            // Derive key and IV
            var key = EvpKDF.create({ keySize: keySize + ivSize }).compute(password, salt);

            // Separate key and IV
            var iv = WordArray.create(key.words.slice(keySize), ivSize * 4);
            key.sigBytes = keySize * 4;

            // Return params
            return CipherParams.create({ key: key, iv: iv, salt: salt });
        }
    };

    /**
     * A serializable cipher wrapper that derives the key from a password,
     * and returns ciphertext as a serializable cipher params object.
     */
    var PasswordBasedCipher = C_lib.PasswordBasedCipher = SerializableCipher.extend({
        /**
         * Configuration options.
         *
         * @property {KDF} kdf The key derivation function to use to generate a key and IV from a password. Default: OpenSSL
         */
        cfg: SerializableCipher.cfg.extend({
            kdf: OpenSSLKdf
        }),

        /**
         * Encrypts a message using a password.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {WordArray|string} message The message to encrypt.
         * @param {string} password The password.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {CipherParams} A cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password');
         *     var ciphertextParams = CryptoJS.lib.PasswordBasedCipher.encrypt(CryptoJS.algo.AES, message, 'password', { format: CryptoJS.format.OpenSSL });
         */
        encrypt: function (cipher, message, password, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Derive key and other params
            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize);

            // Add IV to config
            cfg.iv = derivedParams.iv;

            // Encrypt
            var ciphertext = SerializableCipher.encrypt.call(this, cipher, message, derivedParams.key, cfg);

            // Mix in derived params
            ciphertext.mixIn(derivedParams);

            return ciphertext;
        },

        /**
         * Decrypts serialized ciphertext using a password.
         *
         * @param {Cipher} cipher The cipher algorithm to use.
         * @param {CipherParams|string} ciphertext The ciphertext to decrypt.
         * @param {string} password The password.
         * @param {Object} cfg (Optional) The configuration options to use for this operation.
         *
         * @return {WordArray} The plaintext.
         *
         * @static
         *
         * @example
         *
         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, formattedCiphertext, 'password', { format: CryptoJS.format.OpenSSL });
         *     var plaintext = CryptoJS.lib.PasswordBasedCipher.decrypt(CryptoJS.algo.AES, ciphertextParams, 'password', { format: CryptoJS.format.OpenSSL });
         */
        decrypt: function (cipher, ciphertext, password, cfg) {
            // Apply config defaults
            cfg = this.cfg.extend(cfg);

            // Convert string to CipherParams
            ciphertext = this._parse(ciphertext, cfg.format);

            // Derive key and other params
            var derivedParams = cfg.kdf.execute(password, cipher.keySize, cipher.ivSize, ciphertext.salt);

            // Add IV to config
            cfg.iv = derivedParams.iv;

            // Decrypt
            var plaintext = SerializableCipher.decrypt.call(this, cipher, ciphertext, derivedParams.key, cfg);

            return plaintext;
        }
    });
}());


/**
 * Cipher Feedback block mode.
 */
CryptoJS.mode.CFB = (function () {
    var CFB = CryptoJS.lib.BlockCipherMode.extend();

    CFB.Encryptor = CFB.extend({
        processBlock: function (words, offset) {
            // Shortcuts
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;

            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

            // Remember this block to use with next block
            this._prevBlock = words.slice(offset, offset + blockSize);
        }
    });

    CFB.Decryptor = CFB.extend({
        processBlock: function (words, offset) {
            // Shortcuts
            var cipher = this._cipher;
            var blockSize = cipher.blockSize;

            // Remember this block to use with next block
            var thisBlock = words.slice(offset, offset + blockSize);

            generateKeystreamAndEncrypt.call(this, words, offset, blockSize, cipher);

            // This block becomes the previous block
            this._prevBlock = thisBlock;
        }
    });

    function generateKeystreamAndEncrypt(words, offset, blockSize, cipher) {
        // Shortcut
        var iv = this._iv;

        // Generate keystream
        if (iv) {
            var keystream = iv.slice(0);

            // Remove IV for subsequent blocks
            this._iv = undefined;
        } else {
            var keystream = this._prevBlock;
        }
        cipher.encryptBlock(keystream, 0);

        // Encrypt
        for (var i = 0; i < blockSize; i++) {
            words[offset + i] ^= keystream[i];
        }
    }

    return CFB;
}());


/**
 * Electronic Codebook block mode.
 */
CryptoJS.mode.ECB = (function () {
    var ECB = CryptoJS.lib.BlockCipherMode.extend();

    ECB.Encryptor = ECB.extend({
        processBlock: function (words, offset) {
            this._cipher.encryptBlock(words, offset);
        }
    });

    ECB.Decryptor = ECB.extend({
        processBlock: function (words, offset) {
            this._cipher.decryptBlock(words, offset);
        }
    });

    return ECB;
}());


/**
 * ANSI X.923 padding strategy.
 */
CryptoJS.pad.AnsiX923 = {
    pad: function (data, blockSize) {
        // Shortcuts
        var dataSigBytes = data.sigBytes;
        var blockSizeBytes = blockSize * 4;

        // Count padding bytes
        var nPaddingBytes = blockSizeBytes - dataSigBytes % blockSizeBytes;

        // Compute last byte position
        var lastBytePos = dataSigBytes + nPaddingBytes - 1;

        // Pad
        data.clamp();
        data.words[lastBytePos >>> 2] |= nPaddingBytes << (24 - (lastBytePos % 4) * 8);
        data.sigBytes += nPaddingBytes;
    },

    unpad: function (data) {
        // Get number of padding bytes from last byte
        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

        // Remove padding
        data.sigBytes -= nPaddingBytes;
    }
};


/**
 * ISO 10126 padding strategy.
 */
CryptoJS.pad.Iso10126 = {
    pad: function (data, blockSize) {
        // Shortcut
        var blockSizeBytes = blockSize * 4;

        // Count padding bytes
        var nPaddingBytes = blockSizeBytes - data.sigBytes % blockSizeBytes;

        // Pad
        data.concat(CryptoJS.lib.WordArray.random(nPaddingBytes - 1)).
                concat(CryptoJS.lib.WordArray.create([nPaddingBytes << 24], 1));
    },

    unpad: function (data) {
        // Get number of padding bytes from last byte
        var nPaddingBytes = data.words[(data.sigBytes - 1) >>> 2] & 0xff;

        // Remove padding
        data.sigBytes -= nPaddingBytes;
    }
};


/**
 * ISO/IEC 9797-1 Padding Method 2.
 */
CryptoJS.pad.Iso97971 = {
    pad: function (data, blockSize) {
        // Add 0x80 byte
        data.concat(CryptoJS.lib.WordArray.create([0x80000000], 1));

        // Zero pad the rest
        CryptoJS.pad.ZeroPadding.pad(data, blockSize);
    },

    unpad: function (data) {
        // Remove zero padding
        CryptoJS.pad.ZeroPadding.unpad(data);

        // Remove one more byte -- the 0x80 byte
        data.sigBytes--;
    }
};


/**
 * Output Feedback block mode.
 */
CryptoJS.mode.OFB = (function () {
    var OFB = CryptoJS.lib.BlockCipherMode.extend();

    var Encryptor = OFB.Encryptor = OFB.extend({
        processBlock: function (words, offset) {
            // Shortcuts
            var cipher = this._cipher
            var blockSize = cipher.blockSize;
            var iv = this._iv;
            var keystream = this._keystream;

            // Generate keystream
            if (iv) {
                keystream = this._keystream = iv.slice(0);

                // Remove IV for subsequent blocks
                this._iv = undefined;
            }
            cipher.encryptBlock(keystream, 0);

            // Encrypt
            for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= keystream[i];
            }
        }
    });

    OFB.Decryptor = Encryptor;

    return OFB;
}());


/**
 * A noop padding strategy.
 */
CryptoJS.pad.NoPadding = {
    pad: function () {
    },

    unpad: function () {
    }
};


(function (undefined) {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var CipherParams = C_lib.CipherParams;
    var C_enc = C.enc;
    var Hex = C_enc.Hex;
    var C_format = C.format;

    var HexFormatter = C_format.Hex = {
        /**
         * Converts the ciphertext of a cipher params object to a hexadecimally encoded string.
         *
         * @param {CipherParams} cipherParams The cipher params object.
         *
         * @return {string} The hexadecimally encoded string.
         *
         * @static
         *
         * @example
         *
         *     var hexString = CryptoJS.format.Hex.stringify(cipherParams);
         */
        stringify: function (cipherParams) {
            return cipherParams.ciphertext.toString(Hex);
        },

        /**
         * Converts a hexadecimally encoded ciphertext string to a cipher params object.
         *
         * @param {string} input The hexadecimally encoded string.
         *
         * @return {CipherParams} The cipher params object.
         *
         * @static
         *
         * @example
         *
         *     var cipherParams = CryptoJS.format.Hex.parse(hexString);
         */
        parse: function (input) {
            var ciphertext = Hex.parse(input);
            return CipherParams.create({ ciphertext: ciphertext });
        }
    };
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var BlockCipher = C_lib.BlockCipher;
    var C_algo = C.algo;

    // Lookup tables
    var SBOX = [];
    var INV_SBOX = [];
    var SUB_MIX_0 = [];
    var SUB_MIX_1 = [];
    var SUB_MIX_2 = [];
    var SUB_MIX_3 = [];
    var INV_SUB_MIX_0 = [];
    var INV_SUB_MIX_1 = [];
    var INV_SUB_MIX_2 = [];
    var INV_SUB_MIX_3 = [];

    // Compute lookup tables
    (function () {
        // Compute double table
        var d = [];
        for (var i = 0; i < 256; i++) {
            if (i < 128) {
                d[i] = i << 1;
            } else {
                d[i] = (i << 1) ^ 0x11b;
            }
        }

        // Walk GF(2^8)
        var x = 0;
        var xi = 0;
        for (var i = 0; i < 256; i++) {
            // Compute sbox
            var sx = xi ^ (xi << 1) ^ (xi << 2) ^ (xi << 3) ^ (xi << 4);
            sx = (sx >>> 8) ^ (sx & 0xff) ^ 0x63;
            SBOX[x] = sx;
            INV_SBOX[sx] = x;

            // Compute multiplication
            var x2 = d[x];
            var x4 = d[x2];
            var x8 = d[x4];

            // Compute sub bytes, mix columns tables
            var t = (d[sx] * 0x101) ^ (sx * 0x1010100);
            SUB_MIX_0[x] = (t << 24) | (t >>> 8);
            SUB_MIX_1[x] = (t << 16) | (t >>> 16);
            SUB_MIX_2[x] = (t << 8)  | (t >>> 24);
            SUB_MIX_3[x] = t;

            // Compute inv sub bytes, inv mix columns tables
            var t = (x8 * 0x1010101) ^ (x4 * 0x10001) ^ (x2 * 0x101) ^ (x * 0x1010100);
            INV_SUB_MIX_0[sx] = (t << 24) | (t >>> 8);
            INV_SUB_MIX_1[sx] = (t << 16) | (t >>> 16);
            INV_SUB_MIX_2[sx] = (t << 8)  | (t >>> 24);
            INV_SUB_MIX_3[sx] = t;

            // Compute next counter
            if (!x) {
                x = xi = 1;
            } else {
                x = x2 ^ d[d[d[x8 ^ x2]]];
                xi ^= d[d[xi]];
            }
        }
    }());

    // Precomputed Rcon lookup
    var RCON = [0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];

    /**
     * AES block cipher algorithm.
     */
    var AES = C_algo.AES = BlockCipher.extend({
        _doReset: function () {
            // Skip reset of nRounds has been set before and key did not change
            if (this._nRounds && this._keyPriorReset === this._key) {
                return;
            }

            // Shortcuts
            var key = this._keyPriorReset = this._key;
            var keyWords = key.words;
            var keySize = key.sigBytes / 4;

            // Compute number of rounds
            var nRounds = this._nRounds = keySize + 6;

            // Compute number of key schedule rows
            var ksRows = (nRounds + 1) * 4;

            // Compute key schedule
            var keySchedule = this._keySchedule = [];
            for (var ksRow = 0; ksRow < ksRows; ksRow++) {
                if (ksRow < keySize) {
                    keySchedule[ksRow] = keyWords[ksRow];
                } else {
                    var t = keySchedule[ksRow - 1];

                    if (!(ksRow % keySize)) {
                        // Rot word
                        t = (t << 8) | (t >>> 24);

                        // Sub word
                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];

                        // Mix Rcon
                        t ^= RCON[(ksRow / keySize) | 0] << 24;
                    } else if (keySize > 6 && ksRow % keySize == 4) {
                        // Sub word
                        t = (SBOX[t >>> 24] << 24) | (SBOX[(t >>> 16) & 0xff] << 16) | (SBOX[(t >>> 8) & 0xff] << 8) | SBOX[t & 0xff];
                    }

                    keySchedule[ksRow] = keySchedule[ksRow - keySize] ^ t;
                }
            }

            // Compute inv key schedule
            var invKeySchedule = this._invKeySchedule = [];
            for (var invKsRow = 0; invKsRow < ksRows; invKsRow++) {
                var ksRow = ksRows - invKsRow;

                if (invKsRow % 4) {
                    var t = keySchedule[ksRow];
                } else {
                    var t = keySchedule[ksRow - 4];
                }

                if (invKsRow < 4 || ksRow <= 4) {
                    invKeySchedule[invKsRow] = t;
                } else {
                    invKeySchedule[invKsRow] = INV_SUB_MIX_0[SBOX[t >>> 24]] ^ INV_SUB_MIX_1[SBOX[(t >>> 16) & 0xff]] ^
                                                INV_SUB_MIX_2[SBOX[(t >>> 8) & 0xff]] ^ INV_SUB_MIX_3[SBOX[t & 0xff]];
                }
            }
        },

        encryptBlock: function (M, offset) {
            this._doCryptBlock(M, offset, this._keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX);
        },

        decryptBlock: function (M, offset) {
            // Swap 2nd and 4th rows
            var t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;

            this._doCryptBlock(M, offset, this._invKeySchedule, INV_SUB_MIX_0, INV_SUB_MIX_1, INV_SUB_MIX_2, INV_SUB_MIX_3, INV_SBOX);

            // Inv swap 2nd and 4th rows
            var t = M[offset + 1];
            M[offset + 1] = M[offset + 3];
            M[offset + 3] = t;
        },

        _doCryptBlock: function (M, offset, keySchedule, SUB_MIX_0, SUB_MIX_1, SUB_MIX_2, SUB_MIX_3, SBOX) {
            // Shortcut
            var nRounds = this._nRounds;

            // Get input, add round key
            var s0 = M[offset]     ^ keySchedule[0];
            var s1 = M[offset + 1] ^ keySchedule[1];
            var s2 = M[offset + 2] ^ keySchedule[2];
            var s3 = M[offset + 3] ^ keySchedule[3];

            // Key schedule row counter
            var ksRow = 4;

            // Rounds
            for (var round = 1; round < nRounds; round++) {
                // Shift rows, sub bytes, mix columns, add round key
                var t0 = SUB_MIX_0[s0 >>> 24] ^ SUB_MIX_1[(s1 >>> 16) & 0xff] ^ SUB_MIX_2[(s2 >>> 8) & 0xff] ^ SUB_MIX_3[s3 & 0xff] ^ keySchedule[ksRow++];
                var t1 = SUB_MIX_0[s1 >>> 24] ^ SUB_MIX_1[(s2 >>> 16) & 0xff] ^ SUB_MIX_2[(s3 >>> 8) & 0xff] ^ SUB_MIX_3[s0 & 0xff] ^ keySchedule[ksRow++];
                var t2 = SUB_MIX_0[s2 >>> 24] ^ SUB_MIX_1[(s3 >>> 16) & 0xff] ^ SUB_MIX_2[(s0 >>> 8) & 0xff] ^ SUB_MIX_3[s1 & 0xff] ^ keySchedule[ksRow++];
                var t3 = SUB_MIX_0[s3 >>> 24] ^ SUB_MIX_1[(s0 >>> 16) & 0xff] ^ SUB_MIX_2[(s1 >>> 8) & 0xff] ^ SUB_MIX_3[s2 & 0xff] ^ keySchedule[ksRow++];

                // Update state
                s0 = t0;
                s1 = t1;
                s2 = t2;
                s3 = t3;
            }

            // Shift rows, sub bytes, add round key
            var t0 = ((SBOX[s0 >>> 24] << 24) | (SBOX[(s1 >>> 16) & 0xff] << 16) | (SBOX[(s2 >>> 8) & 0xff] << 8) | SBOX[s3 & 0xff]) ^ keySchedule[ksRow++];
            var t1 = ((SBOX[s1 >>> 24] << 24) | (SBOX[(s2 >>> 16) & 0xff] << 16) | (SBOX[(s3 >>> 8) & 0xff] << 8) | SBOX[s0 & 0xff]) ^ keySchedule[ksRow++];
            var t2 = ((SBOX[s2 >>> 24] << 24) | (SBOX[(s3 >>> 16) & 0xff] << 16) | (SBOX[(s0 >>> 8) & 0xff] << 8) | SBOX[s1 & 0xff]) ^ keySchedule[ksRow++];
            var t3 = ((SBOX[s3 >>> 24] << 24) | (SBOX[(s0 >>> 16) & 0xff] << 16) | (SBOX[(s1 >>> 8) & 0xff] << 8) | SBOX[s2 & 0xff]) ^ keySchedule[ksRow++];

            // Set output
            M[offset]     = t0;
            M[offset + 1] = t1;
            M[offset + 2] = t2;
            M[offset + 3] = t3;
        },

        keySize: 256/32
    });

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.AES.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.AES.decrypt(ciphertext, key, cfg);
     */
    C.AES = BlockCipher._createHelper(AES);
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var WordArray = C_lib.WordArray;
    var BlockCipher = C_lib.BlockCipher;
    var C_algo = C.algo;

    // Permuted Choice 1 constants
    var PC1 = [
        57, 49, 41, 33, 25, 17, 9,  1,
        58, 50, 42, 34, 26, 18, 10, 2,
        59, 51, 43, 35, 27, 19, 11, 3,
        60, 52, 44, 36, 63, 55, 47, 39,
        31, 23, 15, 7,  62, 54, 46, 38,
        30, 22, 14, 6,  61, 53, 45, 37,
        29, 21, 13, 5,  28, 20, 12, 4
    ];

    // Permuted Choice 2 constants
    var PC2 = [
        14, 17, 11, 24, 1,  5,
        3,  28, 15, 6,  21, 10,
        23, 19, 12, 4,  26, 8,
        16, 7,  27, 20, 13, 2,
        41, 52, 31, 37, 47, 55,
        30, 40, 51, 45, 33, 48,
        44, 49, 39, 56, 34, 53,
        46, 42, 50, 36, 29, 32
    ];

    // Cumulative bit shift constants
    var BIT_SHIFTS = [1,  2,  4,  6,  8,  10, 12, 14, 15, 17, 19, 21, 23, 25, 27, 28];

    // SBOXes and round permutation constants
    var SBOX_P = [
        {
            0x0: 0x808200,
            0x10000000: 0x8000,
            0x20000000: 0x808002,
            0x30000000: 0x2,
            0x40000000: 0x200,
            0x50000000: 0x808202,
            0x60000000: 0x800202,
            0x70000000: 0x800000,
            0x80000000: 0x202,
            0x90000000: 0x800200,
            0xa0000000: 0x8200,
            0xb0000000: 0x808000,
            0xc0000000: 0x8002,
            0xd0000000: 0x800002,
            0xe0000000: 0x0,
            0xf0000000: 0x8202,
            0x8000000: 0x0,
            0x18000000: 0x808202,
            0x28000000: 0x8202,
            0x38000000: 0x8000,
            0x48000000: 0x808200,
            0x58000000: 0x200,
            0x68000000: 0x808002,
            0x78000000: 0x2,
            0x88000000: 0x800200,
            0x98000000: 0x8200,
            0xa8000000: 0x808000,
            0xb8000000: 0x800202,
            0xc8000000: 0x800002,
            0xd8000000: 0x8002,
            0xe8000000: 0x202,
            0xf8000000: 0x800000,
            0x1: 0x8000,
            0x10000001: 0x2,
            0x20000001: 0x808200,
            0x30000001: 0x800000,
            0x40000001: 0x808002,
            0x50000001: 0x8200,
            0x60000001: 0x200,
            0x70000001: 0x800202,
            0x80000001: 0x808202,
            0x90000001: 0x808000,
            0xa0000001: 0x800002,
            0xb0000001: 0x8202,
            0xc0000001: 0x202,
            0xd0000001: 0x800200,
            0xe0000001: 0x8002,
            0xf0000001: 0x0,
            0x8000001: 0x808202,
            0x18000001: 0x808000,
            0x28000001: 0x800000,
            0x38000001: 0x200,
            0x48000001: 0x8000,
            0x58000001: 0x800002,
            0x68000001: 0x2,
            0x78000001: 0x8202,
            0x88000001: 0x8002,
            0x98000001: 0x800202,
            0xa8000001: 0x202,
            0xb8000001: 0x808200,
            0xc8000001: 0x800200,
            0xd8000001: 0x0,
            0xe8000001: 0x8200,
            0xf8000001: 0x808002
        },
        {
            0x0: 0x40084010,
            0x1000000: 0x4000,
            0x2000000: 0x80000,
            0x3000000: 0x40080010,
            0x4000000: 0x40000010,
            0x5000000: 0x40084000,
            0x6000000: 0x40004000,
            0x7000000: 0x10,
            0x8000000: 0x84000,
            0x9000000: 0x40004010,
            0xa000000: 0x40000000,
            0xb000000: 0x84010,
            0xc000000: 0x80010,
            0xd000000: 0x0,
            0xe000000: 0x4010,
            0xf000000: 0x40080000,
            0x800000: 0x40004000,
            0x1800000: 0x84010,
            0x2800000: 0x10,
            0x3800000: 0x40004010,
            0x4800000: 0x40084010,
            0x5800000: 0x40000000,
            0x6800000: 0x80000,
            0x7800000: 0x40080010,
            0x8800000: 0x80010,
            0x9800000: 0x0,
            0xa800000: 0x4000,
            0xb800000: 0x40080000,
            0xc800000: 0x40000010,
            0xd800000: 0x84000,
            0xe800000: 0x40084000,
            0xf800000: 0x4010,
            0x10000000: 0x0,
            0x11000000: 0x40080010,
            0x12000000: 0x40004010,
            0x13000000: 0x40084000,
            0x14000000: 0x40080000,
            0x15000000: 0x10,
            0x16000000: 0x84010,
            0x17000000: 0x4000,
            0x18000000: 0x4010,
            0x19000000: 0x80000,
            0x1a000000: 0x80010,
            0x1b000000: 0x40000010,
            0x1c000000: 0x84000,
            0x1d000000: 0x40004000,
            0x1e000000: 0x40000000,
            0x1f000000: 0x40084010,
            0x10800000: 0x84010,
            0x11800000: 0x80000,
            0x12800000: 0x40080000,
            0x13800000: 0x4000,
            0x14800000: 0x40004000,
            0x15800000: 0x40084010,
            0x16800000: 0x10,
            0x17800000: 0x40000000,
            0x18800000: 0x40084000,
            0x19800000: 0x40000010,
            0x1a800000: 0x40004010,
            0x1b800000: 0x80010,
            0x1c800000: 0x0,
            0x1d800000: 0x4010,
            0x1e800000: 0x40080010,
            0x1f800000: 0x84000
        },
        {
            0x0: 0x104,
            0x100000: 0x0,
            0x200000: 0x4000100,
            0x300000: 0x10104,
            0x400000: 0x10004,
            0x500000: 0x4000004,
            0x600000: 0x4010104,
            0x700000: 0x4010000,
            0x800000: 0x4000000,
            0x900000: 0x4010100,
            0xa00000: 0x10100,
            0xb00000: 0x4010004,
            0xc00000: 0x4000104,
            0xd00000: 0x10000,
            0xe00000: 0x4,
            0xf00000: 0x100,
            0x80000: 0x4010100,
            0x180000: 0x4010004,
            0x280000: 0x0,
            0x380000: 0x4000100,
            0x480000: 0x4000004,
            0x580000: 0x10000,
            0x680000: 0x10004,
            0x780000: 0x104,
            0x880000: 0x4,
            0x980000: 0x100,
            0xa80000: 0x4010000,
            0xb80000: 0x10104,
            0xc80000: 0x10100,
            0xd80000: 0x4000104,
            0xe80000: 0x4010104,
            0xf80000: 0x4000000,
            0x1000000: 0x4010100,
            0x1100000: 0x10004,
            0x1200000: 0x10000,
            0x1300000: 0x4000100,
            0x1400000: 0x100,
            0x1500000: 0x4010104,
            0x1600000: 0x4000004,
            0x1700000: 0x0,
            0x1800000: 0x4000104,
            0x1900000: 0x4000000,
            0x1a00000: 0x4,
            0x1b00000: 0x10100,
            0x1c00000: 0x4010000,
            0x1d00000: 0x104,
            0x1e00000: 0x10104,
            0x1f00000: 0x4010004,
            0x1080000: 0x4000000,
            0x1180000: 0x104,
            0x1280000: 0x4010100,
            0x1380000: 0x0,
            0x1480000: 0x10004,
            0x1580000: 0x4000100,
            0x1680000: 0x100,
            0x1780000: 0x4010004,
            0x1880000: 0x10000,
            0x1980000: 0x4010104,
            0x1a80000: 0x10104,
            0x1b80000: 0x4000004,
            0x1c80000: 0x4000104,
            0x1d80000: 0x4010000,
            0x1e80000: 0x4,
            0x1f80000: 0x10100
        },
        {
            0x0: 0x80401000,
            0x10000: 0x80001040,
            0x20000: 0x401040,
            0x30000: 0x80400000,
            0x40000: 0x0,
            0x50000: 0x401000,
            0x60000: 0x80000040,
            0x70000: 0x400040,
            0x80000: 0x80000000,
            0x90000: 0x400000,
            0xa0000: 0x40,
            0xb0000: 0x80001000,
            0xc0000: 0x80400040,
            0xd0000: 0x1040,
            0xe0000: 0x1000,
            0xf0000: 0x80401040,
            0x8000: 0x80001040,
            0x18000: 0x40,
            0x28000: 0x80400040,
            0x38000: 0x80001000,
            0x48000: 0x401000,
            0x58000: 0x80401040,
            0x68000: 0x0,
            0x78000: 0x80400000,
            0x88000: 0x1000,
            0x98000: 0x80401000,
            0xa8000: 0x400000,
            0xb8000: 0x1040,
            0xc8000: 0x80000000,
            0xd8000: 0x400040,
            0xe8000: 0x401040,
            0xf8000: 0x80000040,
            0x100000: 0x400040,
            0x110000: 0x401000,
            0x120000: 0x80000040,
            0x130000: 0x0,
            0x140000: 0x1040,
            0x150000: 0x80400040,
            0x160000: 0x80401000,
            0x170000: 0x80001040,
            0x180000: 0x80401040,
            0x190000: 0x80000000,
            0x1a0000: 0x80400000,
            0x1b0000: 0x401040,
            0x1c0000: 0x80001000,
            0x1d0000: 0x400000,
            0x1e0000: 0x40,
            0x1f0000: 0x1000,
            0x108000: 0x80400000,
            0x118000: 0x80401040,
            0x128000: 0x0,
            0x138000: 0x401000,
            0x148000: 0x400040,
            0x158000: 0x80000000,
            0x168000: 0x80001040,
            0x178000: 0x40,
            0x188000: 0x80000040,
            0x198000: 0x1000,
            0x1a8000: 0x80001000,
            0x1b8000: 0x80400040,
            0x1c8000: 0x1040,
            0x1d8000: 0x80401000,
            0x1e8000: 0x400000,
            0x1f8000: 0x401040
        },
        {
            0x0: 0x80,
            0x1000: 0x1040000,
            0x2000: 0x40000,
            0x3000: 0x20000000,
            0x4000: 0x20040080,
            0x5000: 0x1000080,
            0x6000: 0x21000080,
            0x7000: 0x40080,
            0x8000: 0x1000000,
            0x9000: 0x20040000,
            0xa000: 0x20000080,
            0xb000: 0x21040080,
            0xc000: 0x21040000,
            0xd000: 0x0,
            0xe000: 0x1040080,
            0xf000: 0x21000000,
            0x800: 0x1040080,
            0x1800: 0x21000080,
            0x2800: 0x80,
            0x3800: 0x1040000,
            0x4800: 0x40000,
            0x5800: 0x20040080,
            0x6800: 0x21040000,
            0x7800: 0x20000000,
            0x8800: 0x20040000,
            0x9800: 0x0,
            0xa800: 0x21040080,
            0xb800: 0x1000080,
            0xc800: 0x20000080,
            0xd800: 0x21000000,
            0xe800: 0x1000000,
            0xf800: 0x40080,
            0x10000: 0x40000,
            0x11000: 0x80,
            0x12000: 0x20000000,
            0x13000: 0x21000080,
            0x14000: 0x1000080,
            0x15000: 0x21040000,
            0x16000: 0x20040080,
            0x17000: 0x1000000,
            0x18000: 0x21040080,
            0x19000: 0x21000000,
            0x1a000: 0x1040000,
            0x1b000: 0x20040000,
            0x1c000: 0x40080,
            0x1d000: 0x20000080,
            0x1e000: 0x0,
            0x1f000: 0x1040080,
            0x10800: 0x21000080,
            0x11800: 0x1000000,
            0x12800: 0x1040000,
            0x13800: 0x20040080,
            0x14800: 0x20000000,
            0x15800: 0x1040080,
            0x16800: 0x80,
            0x17800: 0x21040000,
            0x18800: 0x40080,
            0x19800: 0x21040080,
            0x1a800: 0x0,
            0x1b800: 0x21000000,
            0x1c800: 0x1000080,
            0x1d800: 0x40000,
            0x1e800: 0x20040000,
            0x1f800: 0x20000080
        },
        {
            0x0: 0x10000008,
            0x100: 0x2000,
            0x200: 0x10200000,
            0x300: 0x10202008,
            0x400: 0x10002000,
            0x500: 0x200000,
            0x600: 0x200008,
            0x700: 0x10000000,
            0x800: 0x0,
            0x900: 0x10002008,
            0xa00: 0x202000,
            0xb00: 0x8,
            0xc00: 0x10200008,
            0xd00: 0x202008,
            0xe00: 0x2008,
            0xf00: 0x10202000,
            0x80: 0x10200000,
            0x180: 0x10202008,
            0x280: 0x8,
            0x380: 0x200000,
            0x480: 0x202008,
            0x580: 0x10000008,
            0x680: 0x10002000,
            0x780: 0x2008,
            0x880: 0x200008,
            0x980: 0x2000,
            0xa80: 0x10002008,
            0xb80: 0x10200008,
            0xc80: 0x0,
            0xd80: 0x10202000,
            0xe80: 0x202000,
            0xf80: 0x10000000,
            0x1000: 0x10002000,
            0x1100: 0x10200008,
            0x1200: 0x10202008,
            0x1300: 0x2008,
            0x1400: 0x200000,
            0x1500: 0x10000000,
            0x1600: 0x10000008,
            0x1700: 0x202000,
            0x1800: 0x202008,
            0x1900: 0x0,
            0x1a00: 0x8,
            0x1b00: 0x10200000,
            0x1c00: 0x2000,
            0x1d00: 0x10002008,
            0x1e00: 0x10202000,
            0x1f00: 0x200008,
            0x1080: 0x8,
            0x1180: 0x202000,
            0x1280: 0x200000,
            0x1380: 0x10000008,
            0x1480: 0x10002000,
            0x1580: 0x2008,
            0x1680: 0x10202008,
            0x1780: 0x10200000,
            0x1880: 0x10202000,
            0x1980: 0x10200008,
            0x1a80: 0x2000,
            0x1b80: 0x202008,
            0x1c80: 0x200008,
            0x1d80: 0x0,
            0x1e80: 0x10000000,
            0x1f80: 0x10002008
        },
        {
            0x0: 0x100000,
            0x10: 0x2000401,
            0x20: 0x400,
            0x30: 0x100401,
            0x40: 0x2100401,
            0x50: 0x0,
            0x60: 0x1,
            0x70: 0x2100001,
            0x80: 0x2000400,
            0x90: 0x100001,
            0xa0: 0x2000001,
            0xb0: 0x2100400,
            0xc0: 0x2100000,
            0xd0: 0x401,
            0xe0: 0x100400,
            0xf0: 0x2000000,
            0x8: 0x2100001,
            0x18: 0x0,
            0x28: 0x2000401,
            0x38: 0x2100400,
            0x48: 0x100000,
            0x58: 0x2000001,
            0x68: 0x2000000,
            0x78: 0x401,
            0x88: 0x100401,
            0x98: 0x2000400,
            0xa8: 0x2100000,
            0xb8: 0x100001,
            0xc8: 0x400,
            0xd8: 0x2100401,
            0xe8: 0x1,
            0xf8: 0x100400,
            0x100: 0x2000000,
            0x110: 0x100000,
            0x120: 0x2000401,
            0x130: 0x2100001,
            0x140: 0x100001,
            0x150: 0x2000400,
            0x160: 0x2100400,
            0x170: 0x100401,
            0x180: 0x401,
            0x190: 0x2100401,
            0x1a0: 0x100400,
            0x1b0: 0x1,
            0x1c0: 0x0,
            0x1d0: 0x2100000,
            0x1e0: 0x2000001,
            0x1f0: 0x400,
            0x108: 0x100400,
            0x118: 0x2000401,
            0x128: 0x2100001,
            0x138: 0x1,
            0x148: 0x2000000,
            0x158: 0x100000,
            0x168: 0x401,
            0x178: 0x2100400,
            0x188: 0x2000001,
            0x198: 0x2100000,
            0x1a8: 0x0,
            0x1b8: 0x2100401,
            0x1c8: 0x100401,
            0x1d8: 0x400,
            0x1e8: 0x2000400,
            0x1f8: 0x100001
        },
        {
            0x0: 0x8000820,
            0x1: 0x20000,
            0x2: 0x8000000,
            0x3: 0x20,
            0x4: 0x20020,
            0x5: 0x8020820,
            0x6: 0x8020800,
            0x7: 0x800,
            0x8: 0x8020000,
            0x9: 0x8000800,
            0xa: 0x20800,
            0xb: 0x8020020,
            0xc: 0x820,
            0xd: 0x0,
            0xe: 0x8000020,
            0xf: 0x20820,
            0x80000000: 0x800,
            0x80000001: 0x8020820,
            0x80000002: 0x8000820,
            0x80000003: 0x8000000,
            0x80000004: 0x8020000,
            0x80000005: 0x20800,
            0x80000006: 0x20820,
            0x80000007: 0x20,
            0x80000008: 0x8000020,
            0x80000009: 0x820,
            0x8000000a: 0x20020,
            0x8000000b: 0x8020800,
            0x8000000c: 0x0,
            0x8000000d: 0x8020020,
            0x8000000e: 0x8000800,
            0x8000000f: 0x20000,
            0x10: 0x20820,
            0x11: 0x8020800,
            0x12: 0x20,
            0x13: 0x800,
            0x14: 0x8000800,
            0x15: 0x8000020,
            0x16: 0x8020020,
            0x17: 0x20000,
            0x18: 0x0,
            0x19: 0x20020,
            0x1a: 0x8020000,
            0x1b: 0x8000820,
            0x1c: 0x8020820,
            0x1d: 0x20800,
            0x1e: 0x820,
            0x1f: 0x8000000,
            0x80000010: 0x20000,
            0x80000011: 0x800,
            0x80000012: 0x8020020,
            0x80000013: 0x20820,
            0x80000014: 0x20,
            0x80000015: 0x8020000,
            0x80000016: 0x8000000,
            0x80000017: 0x8000820,
            0x80000018: 0x8020820,
            0x80000019: 0x8000020,
            0x8000001a: 0x8000800,
            0x8000001b: 0x0,
            0x8000001c: 0x20800,
            0x8000001d: 0x820,
            0x8000001e: 0x20020,
            0x8000001f: 0x8020800
        }
    ];

    // Masks that select the SBOX input
    var SBOX_MASK = [
        0xf8000001, 0x1f800000, 0x01f80000, 0x001f8000,
        0x0001f800, 0x00001f80, 0x000001f8, 0x8000001f
    ];

    /**
     * DES block cipher algorithm.
     */
    var DES = C_algo.DES = BlockCipher.extend({
        _doReset: function () {
            // Shortcuts
            var key = this._key;
            var keyWords = key.words;

            // Select 56 bits according to PC1
            var keyBits = [];
            for (var i = 0; i < 56; i++) {
                var keyBitPos = PC1[i] - 1;
                keyBits[i] = (keyWords[keyBitPos >>> 5] >>> (31 - keyBitPos % 32)) & 1;
            }

            // Assemble 16 subkeys
            var subKeys = this._subKeys = [];
            for (var nSubKey = 0; nSubKey < 16; nSubKey++) {
                // Create subkey
                var subKey = subKeys[nSubKey] = [];

                // Shortcut
                var bitShift = BIT_SHIFTS[nSubKey];

                // Select 48 bits according to PC2
                for (var i = 0; i < 24; i++) {
                    // Select from the left 28 key bits
                    subKey[(i / 6) | 0] |= keyBits[((PC2[i] - 1) + bitShift) % 28] << (31 - i % 6);

                    // Select from the right 28 key bits
                    subKey[4 + ((i / 6) | 0)] |= keyBits[28 + (((PC2[i + 24] - 1) + bitShift) % 28)] << (31 - i % 6);
                }

                // Since each subkey is applied to an expanded 32-bit input,
                // the subkey can be broken into 8 values scaled to 32-bits,
                // which allows the key to be used without expansion
                subKey[0] = (subKey[0] << 1) | (subKey[0] >>> 31);
                for (var i = 1; i < 7; i++) {
                    subKey[i] = subKey[i] >>> ((i - 1) * 4 + 3);
                }
                subKey[7] = (subKey[7] << 5) | (subKey[7] >>> 27);
            }

            // Compute inverse subkeys
            var invSubKeys = this._invSubKeys = [];
            for (var i = 0; i < 16; i++) {
                invSubKeys[i] = subKeys[15 - i];
            }
        },

        encryptBlock: function (M, offset) {
            this._doCryptBlock(M, offset, this._subKeys);
        },

        decryptBlock: function (M, offset) {
            this._doCryptBlock(M, offset, this._invSubKeys);
        },

        _doCryptBlock: function (M, offset, subKeys) {
            // Get input
            this._lBlock = M[offset];
            this._rBlock = M[offset + 1];

            // Initial permutation
            exchangeLR.call(this, 4,  0x0f0f0f0f);
            exchangeLR.call(this, 16, 0x0000ffff);
            exchangeRL.call(this, 2,  0x33333333);
            exchangeRL.call(this, 8,  0x00ff00ff);
            exchangeLR.call(this, 1,  0x55555555);

            // Rounds
            for (var round = 0; round < 16; round++) {
                // Shortcuts
                var subKey = subKeys[round];
                var lBlock = this._lBlock;
                var rBlock = this._rBlock;

                // Feistel function
                var f = 0;
                for (var i = 0; i < 8; i++) {
                    f |= SBOX_P[i][((rBlock ^ subKey[i]) & SBOX_MASK[i]) >>> 0];
                }
                this._lBlock = rBlock;
                this._rBlock = lBlock ^ f;
            }

            // Undo swap from last round
            var t = this._lBlock;
            this._lBlock = this._rBlock;
            this._rBlock = t;

            // Final permutation
            exchangeLR.call(this, 1,  0x55555555);
            exchangeRL.call(this, 8,  0x00ff00ff);
            exchangeRL.call(this, 2,  0x33333333);
            exchangeLR.call(this, 16, 0x0000ffff);
            exchangeLR.call(this, 4,  0x0f0f0f0f);

            // Set output
            M[offset] = this._lBlock;
            M[offset + 1] = this._rBlock;
        },

        keySize: 64/32,

        ivSize: 64/32,

        blockSize: 64/32
    });

    // Swap bits across the left and right words
    function exchangeLR(offset, mask) {
        var t = ((this._lBlock >>> offset) ^ this._rBlock) & mask;
        this._rBlock ^= t;
        this._lBlock ^= t << offset;
    }

    function exchangeRL(offset, mask) {
        var t = ((this._rBlock >>> offset) ^ this._lBlock) & mask;
        this._lBlock ^= t;
        this._rBlock ^= t << offset;
    }

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.DES.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.DES.decrypt(ciphertext, key, cfg);
     */
    C.DES = BlockCipher._createHelper(DES);

    /**
     * Triple-DES block cipher algorithm.
     */
    var TripleDES = C_algo.TripleDES = BlockCipher.extend({
        _doReset: function () {
            // Shortcuts
            var key = this._key;
            var keyWords = key.words;

            // Create DES instances
            this._des1 = DES.createEncryptor(WordArray.create(keyWords.slice(0, 2)));
            this._des2 = DES.createEncryptor(WordArray.create(keyWords.slice(2, 4)));
            this._des3 = DES.createEncryptor(WordArray.create(keyWords.slice(4, 6)));
        },

        encryptBlock: function (M, offset) {
            this._des1.encryptBlock(M, offset);
            this._des2.decryptBlock(M, offset);
            this._des3.encryptBlock(M, offset);
        },

        decryptBlock: function (M, offset) {
            this._des3.decryptBlock(M, offset);
            this._des2.encryptBlock(M, offset);
            this._des1.decryptBlock(M, offset);
        },

        keySize: 192/32,

        ivSize: 64/32,

        blockSize: 64/32
    });

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.TripleDES.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.TripleDES.decrypt(ciphertext, key, cfg);
     */
    C.TripleDES = BlockCipher._createHelper(TripleDES);
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var StreamCipher = C_lib.StreamCipher;
    var C_algo = C.algo;

    /**
     * RC4 stream cipher algorithm.
     */
    var RC4 = C_algo.RC4 = StreamCipher.extend({
        _doReset: function () {
            // Shortcuts
            var key = this._key;
            var keyWords = key.words;
            var keySigBytes = key.sigBytes;

            // Init sbox
            var S = this._S = [];
            for (var i = 0; i < 256; i++) {
                S[i] = i;
            }

            // Key setup
            for (var i = 0, j = 0; i < 256; i++) {
                var keyByteIndex = i % keySigBytes;
                var keyByte = (keyWords[keyByteIndex >>> 2] >>> (24 - (keyByteIndex % 4) * 8)) & 0xff;

                j = (j + S[i] + keyByte) % 256;

                // Swap
                var t = S[i];
                S[i] = S[j];
                S[j] = t;
            }

            // Counters
            this._i = this._j = 0;
        },

        _doProcessBlock: function (M, offset) {
            M[offset] ^= generateKeystreamWord.call(this);
        },

        keySize: 256/32,

        ivSize: 0
    });

    function generateKeystreamWord() {
        // Shortcuts
        var S = this._S;
        var i = this._i;
        var j = this._j;

        // Generate keystream word
        var keystreamWord = 0;
        for (var n = 0; n < 4; n++) {
            i = (i + 1) % 256;
            j = (j + S[i]) % 256;

            // Swap
            var t = S[i];
            S[i] = S[j];
            S[j] = t;

            keystreamWord |= S[(S[i] + S[j]) % 256] << (24 - n * 8);
        }

        // Update counters
        this._i = i;
        this._j = j;

        return keystreamWord;
    }

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.RC4.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.RC4.decrypt(ciphertext, key, cfg);
     */
    C.RC4 = StreamCipher._createHelper(RC4);

    /**
     * Modified RC4 stream cipher algorithm.
     */
    var RC4Drop = C_algo.RC4Drop = RC4.extend({
        /**
         * Configuration options.
         *
         * @property {number} drop The number of keystream words to drop. Default 192
         */
        cfg: RC4.cfg.extend({
            drop: 192
        }),

        _doReset: function () {
            RC4._doReset.call(this);

            // Drop
            for (var i = this.cfg.drop; i > 0; i--) {
                generateKeystreamWord.call(this);
            }
        }
    });

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.RC4Drop.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.RC4Drop.decrypt(ciphertext, key, cfg);
     */
    C.RC4Drop = StreamCipher._createHelper(RC4Drop);
}());


/** @preserve
 * Counter block mode compatible with  Dr Brian Gladman fileenc.c
 * derived from CryptoJS.mode.CTR
 * Jan Hruby jhruby.web@gmail.com
 */
CryptoJS.mode.CTRGladman = (function () {
    var CTRGladman = CryptoJS.lib.BlockCipherMode.extend();

    function incWord(word)
    {
        if (((word >> 24) & 0xff) === 0xff) { //overflow
        var b1 = (word >> 16)&0xff;
        var b2 = (word >> 8)&0xff;
        var b3 = word & 0xff;

        if (b1 === 0xff) // overflow b1
        {
        b1 = 0;
        if (b2 === 0xff)
        {
            b2 = 0;
            if (b3 === 0xff)
            {
                b3 = 0;
            }
            else
            {
                ++b3;
            }
        }
        else
        {
            ++b2;
        }
        }
        else
        {
        ++b1;
        }

        word = 0;
        word += (b1 << 16);
        word += (b2 << 8);
        word += b3;
        }
        else
        {
        word += (0x01 << 24);
        }
        return word;
    }

    function incCounter(counter)
    {
        if ((counter[0] = incWord(counter[0])) === 0)
        {
            // encr_data in fileenc.c from  Dr Brian Gladman's counts only with DWORD j < 8
            counter[1] = incWord(counter[1]);
        }
        return counter;
    }

    var Encryptor = CTRGladman.Encryptor = CTRGladman.extend({
        processBlock: function (words, offset) {
            // Shortcuts
            var cipher = this._cipher
            var blockSize = cipher.blockSize;
            var iv = this._iv;
            var counter = this._counter;

            // Generate keystream
            if (iv) {
                counter = this._counter = iv.slice(0);

                // Remove IV for subsequent blocks
                this._iv = undefined;
            }

            incCounter(counter);

            var keystream = counter.slice(0);
            cipher.encryptBlock(keystream, 0);

            // Encrypt
            for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= keystream[i];
            }
        }
    });

    CTRGladman.Decryptor = Encryptor;

    return CTRGladman;
}());




(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var StreamCipher = C_lib.StreamCipher;
    var C_algo = C.algo;

    // Reusable objects
    var S  = [];
    var C_ = [];
    var G  = [];

    /**
     * Rabbit stream cipher algorithm
     */
    var Rabbit = C_algo.Rabbit = StreamCipher.extend({
        _doReset: function () {
            // Shortcuts
            var K = this._key.words;
            var iv = this.cfg.iv;

            // Swap endian
            for (var i = 0; i < 4; i++) {
                K[i] = (((K[i] << 8)  | (K[i] >>> 24)) & 0x00ff00ff) |
                        (((K[i] << 24) | (K[i] >>> 8))  & 0xff00ff00);
            }

            // Generate initial state values
            var X = this._X = [
                K[0], (K[3] << 16) | (K[2] >>> 16),
                K[1], (K[0] << 16) | (K[3] >>> 16),
                K[2], (K[1] << 16) | (K[0] >>> 16),
                K[3], (K[2] << 16) | (K[1] >>> 16)
            ];

            // Generate initial counter values
            var C = this._C = [
                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
            ];

            // Carry bit
            this._b = 0;

            // Iterate the system four times
            for (var i = 0; i < 4; i++) {
                nextState.call(this);
            }

            // Modify the counters
            for (var i = 0; i < 8; i++) {
                C[i] ^= X[(i + 4) & 7];
            }

            // IV setup
            if (iv) {
                // Shortcuts
                var IV = iv.words;
                var IV_0 = IV[0];
                var IV_1 = IV[1];

                // Generate four subvectors
                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

                // Modify counter values
                C[0] ^= i0;
                C[1] ^= i1;
                C[2] ^= i2;
                C[3] ^= i3;
                C[4] ^= i0;
                C[5] ^= i1;
                C[6] ^= i2;
                C[7] ^= i3;

                // Iterate the system four times
                for (var i = 0; i < 4; i++) {
                    nextState.call(this);
                }
            }
        },

        _doProcessBlock: function (M, offset) {
            // Shortcut
            var X = this._X;

            // Iterate the system
            nextState.call(this);

            // Generate four keystream words
            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

            for (var i = 0; i < 4; i++) {
                // Swap endian
                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
                        (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

                // Encrypt
                M[offset + i] ^= S[i];
            }
        },

        blockSize: 128/32,

        ivSize: 64/32
    });

    function nextState() {
        // Shortcuts
        var X = this._X;
        var C = this._C;

        // Save old counter values
        for (var i = 0; i < 8; i++) {
            C_[i] = C[i];
        }

        // Calculate new counter values
        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

        // Calculate the g-values
        for (var i = 0; i < 8; i++) {
            var gx = X[i] + C[i];

            // Construct high and low argument for squaring
            var ga = gx & 0xffff;
            var gb = gx >>> 16;

            // Calculate high and low result of squaring
            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

            // High XOR low
            G[i] = gh ^ gl;
        }

        // Calculate new state values
        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
    }

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.Rabbit.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.Rabbit.decrypt(ciphertext, key, cfg);
     */
    C.Rabbit = StreamCipher._createHelper(Rabbit);
}());


/**
 * Counter block mode.
 */
CryptoJS.mode.CTR = (function () {
    var CTR = CryptoJS.lib.BlockCipherMode.extend();

    var Encryptor = CTR.Encryptor = CTR.extend({
        processBlock: function (words, offset) {
            // Shortcuts
            var cipher = this._cipher
            var blockSize = cipher.blockSize;
            var iv = this._iv;
            var counter = this._counter;

            // Generate keystream
            if (iv) {
                counter = this._counter = iv.slice(0);

                // Remove IV for subsequent blocks
                this._iv = undefined;
            }
            var keystream = counter.slice(0);
            cipher.encryptBlock(keystream, 0);

            // Increment counter
            counter[blockSize - 1] = (counter[blockSize - 1] + 1) | 0

            // Encrypt
            for (var i = 0; i < blockSize; i++) {
                words[offset + i] ^= keystream[i];
            }
        }
    });

    CTR.Decryptor = Encryptor;

    return CTR;
}());


(function () {
    // Shortcuts
    var C = CryptoJS;
    var C_lib = C.lib;
    var StreamCipher = C_lib.StreamCipher;
    var C_algo = C.algo;

    // Reusable objects
    var S  = [];
    var C_ = [];
    var G  = [];

    /**
     * Rabbit stream cipher algorithm.
     *
     * This is a legacy version that neglected to convert the key to little-endian.
     * This error doesn't affect the cipher's security,
     * but it does affect its compatibility with other implementations.
     */
    var RabbitLegacy = C_algo.RabbitLegacy = StreamCipher.extend({
        _doReset: function () {
            // Shortcuts
            var K = this._key.words;
            var iv = this.cfg.iv;

            // Generate initial state values
            var X = this._X = [
                K[0], (K[3] << 16) | (K[2] >>> 16),
                K[1], (K[0] << 16) | (K[3] >>> 16),
                K[2], (K[1] << 16) | (K[0] >>> 16),
                K[3], (K[2] << 16) | (K[1] >>> 16)
            ];

            // Generate initial counter values
            var C = this._C = [
                (K[2] << 16) | (K[2] >>> 16), (K[0] & 0xffff0000) | (K[1] & 0x0000ffff),
                (K[3] << 16) | (K[3] >>> 16), (K[1] & 0xffff0000) | (K[2] & 0x0000ffff),
                (K[0] << 16) | (K[0] >>> 16), (K[2] & 0xffff0000) | (K[3] & 0x0000ffff),
                (K[1] << 16) | (K[1] >>> 16), (K[3] & 0xffff0000) | (K[0] & 0x0000ffff)
            ];

            // Carry bit
            this._b = 0;

            // Iterate the system four times
            for (var i = 0; i < 4; i++) {
                nextState.call(this);
            }

            // Modify the counters
            for (var i = 0; i < 8; i++) {
                C[i] ^= X[(i + 4) & 7];
            }

            // IV setup
            if (iv) {
                // Shortcuts
                var IV = iv.words;
                var IV_0 = IV[0];
                var IV_1 = IV[1];

                // Generate four subvectors
                var i0 = (((IV_0 << 8) | (IV_0 >>> 24)) & 0x00ff00ff) | (((IV_0 << 24) | (IV_0 >>> 8)) & 0xff00ff00);
                var i2 = (((IV_1 << 8) | (IV_1 >>> 24)) & 0x00ff00ff) | (((IV_1 << 24) | (IV_1 >>> 8)) & 0xff00ff00);
                var i1 = (i0 >>> 16) | (i2 & 0xffff0000);
                var i3 = (i2 << 16)  | (i0 & 0x0000ffff);

                // Modify counter values
                C[0] ^= i0;
                C[1] ^= i1;
                C[2] ^= i2;
                C[3] ^= i3;
                C[4] ^= i0;
                C[5] ^= i1;
                C[6] ^= i2;
                C[7] ^= i3;

                // Iterate the system four times
                for (var i = 0; i < 4; i++) {
                    nextState.call(this);
                }
            }
        },

        _doProcessBlock: function (M, offset) {
            // Shortcut
            var X = this._X;

            // Iterate the system
            nextState.call(this);

            // Generate four keystream words
            S[0] = X[0] ^ (X[5] >>> 16) ^ (X[3] << 16);
            S[1] = X[2] ^ (X[7] >>> 16) ^ (X[5] << 16);
            S[2] = X[4] ^ (X[1] >>> 16) ^ (X[7] << 16);
            S[3] = X[6] ^ (X[3] >>> 16) ^ (X[1] << 16);

            for (var i = 0; i < 4; i++) {
                // Swap endian
                S[i] = (((S[i] << 8)  | (S[i] >>> 24)) & 0x00ff00ff) |
                        (((S[i] << 24) | (S[i] >>> 8))  & 0xff00ff00);

                // Encrypt
                M[offset + i] ^= S[i];
            }
        },

        blockSize: 128/32,

        ivSize: 64/32
    });

    function nextState() {
        // Shortcuts
        var X = this._X;
        var C = this._C;

        // Save old counter values
        for (var i = 0; i < 8; i++) {
            C_[i] = C[i];
        }

        // Calculate new counter values
        C[0] = (C[0] + 0x4d34d34d + this._b) | 0;
        C[1] = (C[1] + 0xd34d34d3 + ((C[0] >>> 0) < (C_[0] >>> 0) ? 1 : 0)) | 0;
        C[2] = (C[2] + 0x34d34d34 + ((C[1] >>> 0) < (C_[1] >>> 0) ? 1 : 0)) | 0;
        C[3] = (C[3] + 0x4d34d34d + ((C[2] >>> 0) < (C_[2] >>> 0) ? 1 : 0)) | 0;
        C[4] = (C[4] + 0xd34d34d3 + ((C[3] >>> 0) < (C_[3] >>> 0) ? 1 : 0)) | 0;
        C[5] = (C[5] + 0x34d34d34 + ((C[4] >>> 0) < (C_[4] >>> 0) ? 1 : 0)) | 0;
        C[6] = (C[6] + 0x4d34d34d + ((C[5] >>> 0) < (C_[5] >>> 0) ? 1 : 0)) | 0;
        C[7] = (C[7] + 0xd34d34d3 + ((C[6] >>> 0) < (C_[6] >>> 0) ? 1 : 0)) | 0;
        this._b = (C[7] >>> 0) < (C_[7] >>> 0) ? 1 : 0;

        // Calculate the g-values
        for (var i = 0; i < 8; i++) {
            var gx = X[i] + C[i];

            // Construct high and low argument for squaring
            var ga = gx & 0xffff;
            var gb = gx >>> 16;

            // Calculate high and low result of squaring
            var gh = ((((ga * ga) >>> 17) + ga * gb) >>> 15) + gb * gb;
            var gl = (((gx & 0xffff0000) * gx) | 0) + (((gx & 0x0000ffff) * gx) | 0);

            // High XOR low
            G[i] = gh ^ gl;
        }

        // Calculate new state values
        X[0] = (G[0] + ((G[7] << 16) | (G[7] >>> 16)) + ((G[6] << 16) | (G[6] >>> 16))) | 0;
        X[1] = (G[1] + ((G[0] << 8)  | (G[0] >>> 24)) + G[7]) | 0;
        X[2] = (G[2] + ((G[1] << 16) | (G[1] >>> 16)) + ((G[0] << 16) | (G[0] >>> 16))) | 0;
        X[3] = (G[3] + ((G[2] << 8)  | (G[2] >>> 24)) + G[1]) | 0;
        X[4] = (G[4] + ((G[3] << 16) | (G[3] >>> 16)) + ((G[2] << 16) | (G[2] >>> 16))) | 0;
        X[5] = (G[5] + ((G[4] << 8)  | (G[4] >>> 24)) + G[3]) | 0;
        X[6] = (G[6] + ((G[5] << 16) | (G[5] >>> 16)) + ((G[4] << 16) | (G[4] >>> 16))) | 0;
        X[7] = (G[7] + ((G[6] << 8)  | (G[6] >>> 24)) + G[5]) | 0;
    }

    /**
     * Shortcut functions to the cipher's object interface.
     *
     * @example
     *
     *     var ciphertext = CryptoJS.RabbitLegacy.encrypt(message, key, cfg);
     *     var plaintext  = CryptoJS.RabbitLegacy.decrypt(ciphertext, key, cfg);
     */
    C.RabbitLegacy = StreamCipher._createHelper(RabbitLegacy);
}());


/**
 * Zero padding strategy.
 */
CryptoJS.pad.ZeroPadding = {
    pad: function (data, blockSize) {
        // Shortcut
        var blockSizeBytes = blockSize * 4;

        // Pad
        data.clamp();
        data.sigBytes += blockSizeBytes - ((data.sigBytes % blockSizeBytes) || blockSizeBytes);
    },

    unpad: function (data) {
        // Shortcut
        var dataWords = data.words;

        // Unpad
        var i = data.sigBytes - 1;
        while (!((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
            i--;
        }
        data.sigBytes = i + 1;
    }
};
var l = {
    md5: function(e) {
        return CryptoJS.MD5(e).toString()
    },
    k: function(e) {
        var l = this.md5("www.maomaozu.com".replace(/\./g, "_"));
        return l = 0 == e ? l.substring(0, 16) : l.substring(16, 32)
    },
    e: function(e, l) {
        return e = CryptoJS.enc.Utf8.parse(e),
        l = CryptoJS.enc.Utf8.parse(l),
        CryptoJS.AES.encrypt(l, e, {
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
            iv: e
        }).toString()
    },
    d: function(e, l) {
        e = CryptoJS.enc.Utf8.parse(e);
        var a = CryptoJS.AES.decrypt(l, e, {
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
            iv: e
        });
        return CryptoJS.enc.Utf8.stringify(a).toString()
    },
    aes_encrypt: function(e) {
        return this.e(this.k(0), e)
    },
    aes_decrypt: function(e) {
        var l = this.k(0).split("").reverse().join("");
        return this.d(l, e)
    },
    token_parse: function(e) {
        var l = this.d(this.k(1), e);
        return "" != l && JSON.parse(l)
    },
    token_serial: function(e) {
        return e = JSON.stringify(e),
        this.e(this.k(1), e)
    }
}
var aaa = JSON.stringify({Type:0,page:5,expire:1576744587351})
var bbb = "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"
function encrypt(data) {
    return l.aes_encrypt(data)
}
function decrypt(response) {
    return l.aes_decrypt(response)
}
console.log(encrypt(aaa))
console.log(decrypt(bbb))
