# https://cj.eloancn.com/user/login 翼龙贷 登录

import execjs, requests, random


def encryptByDES():
    with open("yld.js", "r", encoding="utf-8") as f:
        ctx = execjs.compile(f.read())
    result = ctx.call("encryptByDES", "111111")
    return result


url = "https://cj.eloancn.com/pcgway/login/v1/02"
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
    'Referer': 'https://cj.eloancn.com/user/login?service=https%3A%2F%2Fcj.eloancn.com%2Fpcgway%2Fapp001%2Fv1%2F02%3Fret%3DaHR0cHM6Ly9jai5lbG9hbmNuLmNvbQ%3D%3D&v=1574315466719',
}
data = {
    "version": str(random.random()),
    "platform": "5",
    "username": "13800000000",
    "password": encryptByDES(),
    "service": "https://cj.eloancn.com/pcgway/app001/v1/02?ret=aHR0cHM6Ly9jai5lbG9hbmNuLmNvbQ==",
}
res = requests.post(url, headers=headers, data=data)
print(res.json())
