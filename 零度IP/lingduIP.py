from hashlib import md5
import time, requests, execjs


def token(page, num):
    token = str(page) + str(num) + str(int(time.time()))
    return md5(token.encode()).hexdigest()


def decrypt(a):
    with open("lingduIP.js", "r", encoding="utf-8") as f:
        ctx = execjs.compile(f.read())
    result = ctx.call("get_ip", a)
    return result


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


for i in decrypt(get_one_page()):
    print(i)
