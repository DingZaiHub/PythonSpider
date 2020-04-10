# https://nyloner.cn/proxy  零度IP

import base64
from hashlib import md5
import time, requests, json


def token(page, num):
    token = str(page) + str(num) + str(int(time.time()))
    return md5(token.encode()).hexdigest()


def decode_str(scHZjLUh1):
    # JS的fromCharCode函数为Python的chr函数，JS的charCodeAt函数为Python的ord函数
    scHZjLUh1 = str(base64.b64decode(scHZjLUh1), encoding="utf-8")
    key = "nyloner"
    length = len(key)
    code = ""
    for i in range(len(scHZjLUh1)):
        coeFYlqUm2 = i % length
        code += chr(ord(scHZjLUh1[i]) ^ ord(key[coeFYlqUm2]))
    return json.loads(str(base64.b64decode(code), encoding="utf-8"))


def get_one_page():
    page = 1
    num = 15
    url = "https://nyloner.cn/proxy?page={}&num={}&token={}&t={}".format(page, num, token(page, num), int(time.time()))
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36",
        "Cookie": "sessionid=uhuxzch7g7bxiv9okm5p93fn7qh0pss3"
    }
    res = requests.get(url, headers=headers)
    ip_list = res.json()["list"]
    return ip_list


for i in decode_str(get_one_page()):
    print(i)
