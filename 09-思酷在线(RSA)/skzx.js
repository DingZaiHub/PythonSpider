//RAS2048密码加密
var RAS = {
    rasEncrypt: function (password) {
        var nonce = "";  //随机8号数以上
        for (var i = 0; i < 6; i++) {  //6位随机数，用以加在时间戳后面。
            nonce += Math.floor(Math.random() * 10);
        }
        nonce = new Date().getTime() + nonce;  //时间戳，用来生成订单号。

        //转换成需要的格式
        var data = {
            text: password,
            timestamp: new Date().getTime(),
            nonce: nonce
        };

        // var host = window.location.host;
        //公钥：生产环境，包括：标品、中特独立部署、NBCB独立部署或其他独立部署；
        var Key = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApQUOaXuFw6ecagtlJQ6a7lnxTSLtTFVQ/Sf0iA/P45zX44AshFFG3iGzcNiTPTepGMGuoLm1LYzdT1s8NrVQ+qgmSAOSN9x//hcJdjSdh2vXVwDDANIryw0fxmsdRbNjPsUvL4j8vulRulPpUhy2v5/LyxyDWOzOjG2IftZxbFXsc2yLohpC1h1vUADAF50D1eUm2ilJXNCNWrofjwFiK2J1Q3h6TUW7ZJhwtFCm3DoUIAK2WU7XOAt/rMJopULbU1ThL+UdUydDEzLBEDIjD8SS3E9NcILatGuc7xr8re+KPLqdiL7Nmmvbb9toJq39fnbYeNrBUlKSJPfRo8HG7QIDAQAB';
        var Code = '_SCHO_ENC_:V1:RSA:ZSXYPROD0001:';
        //公钥：测试环境，包括：本地测试，BETA测试
        // var Key = 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA10AjU2HIhIb9hnjsRkHvPUVT91pl9fR9VKn/F/JbwrNlDZQOnd0AXpIM9tiHX2hK2aoV0MS4pTPWpAyC722fdwcupvDquRSlfU7TRI6mRPXo9ALHEUYIA2Bnpt0lU8VcP61EVOdEqAdtA1law/6Z9O4c1nHaDBblx3R9Sr7Lw3KJj6P2pRM/eNCrMDxw2PRf886UWSbJLKlvx0kxoox7LlAInToUqU1ofWNf0FlF+A6kd1wZhil1Iha9NS8z7UfMx92jxh9RtGWFK0gredeKFR1S7lAKjnW1bUzjrWvPmiEl4UJsQoS7krDN6skb8SLwga4QYUU3ua8GCRZBPZJ4QQIDAQAB';
        // var Code = '_SCHO_ENC_:V1:RSA:ZSXYDEV0001:';

        //-----BEGIN PUBLIC KEY-----和-----END PUBLIC KEY-----，是占位符，替换公钥时要保留
        var rsaPublicKey = KEYUTIL.getKey("-----BEGIN PUBLIC KEY-----" + Key + "-----END PUBLIC KEY-----");

        //加密的明文
        var hexStr = KJUR.crypto.Cipher.encrypt(JSON.stringify(data), rsaPublicKey, "RSA");

        //输出的密文
        return Code + RAS.hexToBase64(hexStr);
    },
    // Hex to Base64
    hexToBase64: function (str) {
        return String.fromCharCode.apply(null,
            str.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" "));
    }
};

