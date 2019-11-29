# https://www.dns.com/login.html  帝恩思登录

import base64, requests, re, execjs


def encrypt(content):
    with open("dns.js", "r") as f:
        ctx = execjs.compile(f.read())
    enc = ctx.call("aes", content)
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
