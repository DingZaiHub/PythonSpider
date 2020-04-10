# http://study.study2win.net/wx/register.html  注册地址
# http://study.study2win.net/wx/login.html  登录地址

from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5
import time, math, random, json, base64, requests


def get_json(a):
    nonce = ""
    for i in range(6):
        nonce += str(math.floor(random.random() * 10))
    nonce = str(int(time.time()*1000)) + nonce
    data = {
        "text":a,
        "timestamp":int(time.time()*1000),
        "nonce":nonce
    }
    return json.dumps(data)


def rsa_encrypt(a):
    key = "MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApQUOaXuFw6ecagtlJQ6a7lnxTSLtTFVQ/Sf0iA/P45zX44AshFFG3iGzcNiTPTepGMGuoLm1LYzdT1s8NrVQ+qgmSAOSN9x//hcJdjSdh2vXVwDDANIryw0fxmsdRbNjPsUvL4j8vulRulPpUhy2v5/LyxyDWOzOjG2IftZxbFXsc2yLohpC1h1vUADAF50D1eUm2ilJXNCNWrofjwFiK2J1Q3h6TUW7ZJhwtFCm3DoUIAK2WU7XOAt/rMJopULbU1ThL+UdUydDEzLBEDIjD8SS3E9NcILatGuc7xr8re+KPLqdiL7Nmmvbb9toJq39fnbYeNrBUlKSJPfRo8HG7QIDAQAB"
    publickey = """-----BEGIN PUBLIC KEY-----
    {key}
    -----END PUBLIC KEY-----""".format(key=key)

    rsakey = RSA.importKey(publickey)
    cipher = PKCS1_v1_5.new(rsakey)
    cipher_text = cipher.encrypt(get_json(a).encode("utf-8"))
    return '_SCHO_ENC_:V1:RSA:ZSXYPROD0001:' + str(base64.b64encode(cipher_text), encoding="utf-8")


url = "https://study.study2win.net/front/login/unp"
data = {
    "orgCode":"SAAS",
    "password":rsa_encrypt("111111"),
    "svcCode":"client:009",
    "username":rsa_encrypt("15800000000"),
}
# print(data)
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
    'Referer': 'http://study.study2win.net/wx/login.html',
    'Origin': 'https://study.study2win.net',
    'Content-Type': 'application/json',
}
res = requests.post(url, headers=headers, data=json.dumps(data))
print(res.json())
