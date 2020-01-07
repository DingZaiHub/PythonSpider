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


def USE_RSA(message):
    e = "010001"
    n = "00e0b509f6259df8642dbc35662901477df22677ec152b5ff68ace615bb7b725152b3ab17a876aea8a5aa76d2e417629ec4ee341f56135fccf695280104e0312ecbda92557c93870114af6c9d05c4f7f0c3685b7a46bee255932575cce10b424d813cfe4875d3e82047b97ddef52741d546b8e289dc6935b3ece0462db0a22b8e7"
    en = Encrypt(e, n)
    return en.encrypt(message)


print(USE_RSA("111111"))
