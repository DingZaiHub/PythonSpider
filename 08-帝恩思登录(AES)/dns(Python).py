# https://www.dns.com/login.html  帝恩思登录

from Crypto.Cipher import AES
import base64, requests, re


def encrypt(content):
    # k:密钥，iv:偏移量，content:需加密的内容
    k = iv = "1234567890abcDEF"
    k = k.encode("utf-8")
    iv = iv.encode("utf-8")
    pad = lambda s: s + (16 - len(s)%16) * chr(0)
    # AES加密时，明文长度需为16的倍数。这里的pad用来填充，chr(0)表示为ZeroPadding，在最后填充0
    content = pad(content).encode("utf-8")
    cipher = AES.new(k, AES.MODE_CBC, iv)  # CBC模式加密
    cipher_text = cipher.encrypt(content)
    enc = base64.b64encode(cipher_text).decode("utf-8")
    print(enc)
    return enc


def get_token():
    url = "https://www.dns.com/login.html"
    res = s.get(url, headers=headers)
    pattern = re.compile(r'var csrfToken = "(.*?)";', re.S)
    result = re.findall(pattern, res.text)
    result = result[0] if result else ''
    print(result)
    return result


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',

}
s = requests.Session()
data = {
    '_token': get_token(),
    'password': encrypt("Aa123456"),
    'email': encrypt("17109324198"),
}

s.post('https://www.dns.com/login', headers=headers, data=data)  # 登录
response = s.get("https://www.dns.com/dashboard", headers=headers)  # 获取用户名
pattern = re.compile(r'<a href="https://www.dns.com/member/account" class="">(.*?)</a>')
result = re.findall(pattern, response.text)
result = result[0] if result else '获取失败'
print(result)
