# https://music.163.com/#/song?id=1384026889  网易云音乐评论
# https://music.163.com/weapi/v1/resource/comments/R_SO_4_1384026889?csrf_token=  api链接

import requests, json, random, base64
from Crypto.Cipher import AES
import rsa


class Encrypt():
    """
    该类为参考的这篇文章：https://www.52pojie.cn/forum.php?mod=viewthread&tid=874374
    主要用于对应JS中的RSAKeyPair的RSA加密，每次对相同明文加密后的密文都是相同的，原因为NoPadding
    """
    def __init__(self, e, n):
        self.e = e
        self.n = n

    def encrypt(self, message):
        ee = int(self.e, 16)
        nn = int(self.n, 16)
        rsa_pubkey = rsa.PublicKey(e=ee, n=nn)
        crypto = self._encrypt(message.encode(), rsa_pubkey)
        return crypto.hex()

    def _pad_for_encryption(self, message, target_length):
        message = message[::-1]
        max_msglength = target_length - 11
        msglength = len(message)

        padding = b''
        padding_length = target_length - msglength - 3

        for i in range(padding_length):
            padding += b'\x00'

        return b''.join([b'\x00\x00',padding,b'\x00',message])

    def _encrypt(self, message, pub_key):
        keylength = rsa.common.byte_size(pub_key.n)
        padded = self._pad_for_encryption(message, keylength)

        payload = rsa.transform.bytes2int(padded)
        encrypted = rsa.core.encrypt_int(payload, pub_key.e, pub_key.n)
        block = rsa.transform.int2bytes(encrypted, keylength)

        return block


# 以下均为自己改写部分
def USE_RSA(message):
    e = "010001"
    n = "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7"
    en = Encrypt(e, n)
    return en.encrypt(message)


def USE_AES(content, k):
    k = k.encode("utf-8")
    iv = "0102030405060708".encode("utf-8")
    pad = lambda s: s + (16 - len(s)%16) * chr(16 - len(s)%16)
    # JS中没有指定padding，则默认即为Pkcs7填充
    content = pad(content).encode("utf-8")
    cipher = AES.new(k, AES.MODE_CBC, iv)
    cipher_text = cipher.encrypt(content)
    enc = base64.b64encode(cipher_text).decode("utf-8")
    return enc


def encrypt(params):
    params = json.dumps(params)
    a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
    b = "".join(random.sample(a, 16))
    h = {}
    h["params"] = USE_AES(params, "0CoJUm6Qyw8W8jud")
    h["params"] = USE_AES(h["params"], b)
    h["encSecKey"] = USE_RSA(b)
    return h


def get_page(page):
    params = {
        "csrf_token": "",
        "limit": "20",  # 每页限制个数
        "offset": str(page * 20),  # 控制翻页，每次增加20
        "rid": "R_SO_4_1384026889",  # R_SO_4_ 加上歌曲id
        "total": "true" if i == 0 else "false",  # 只有第1页为true，后面均为false
    }
    url = "https://music.163.com/weapi/v1/resource/comments/R_SO_4_1384026889?csrf_token="
    try:
        response = requests.post(url, headers=headers, data=encrypt(params))
        if response.status_code == 200:
            return response.json()
        else:
            print("爬取失败:", response.status_code)
            return None
    except Exception as e:
        print("ERROR:", e)
        return None


def parse_page(response):
    if response:
        comments = response["comments"]
        for comment in comments:
            content = comment["content"]
            nickname = comment["user"]["nickname"]
            print(nickname + "：" + content + "\n")


if __name__ == "__main__":
    headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    }
    for i in range(3):
        html = get_page(i)
        parse_page(html)

