import requests, execjs, time, json


headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36"
}
with open("maomaozu.js", "r", encoding="utf-8") as f:
    ctx = execjs.compile(f.read())


def encrypt(data):
    result = json.dumps(data)
    result = ctx.call("encrypt", result)
    return result


def decrypt(response):
    result = ctx.call("decrypt", response)
    return json.loads(result)


def get_page(page):
    data = {
        "Type": 0,
        "page": page,
        "expire": int(time.time()*1000)
    }
    data = encrypt(data)
    print(data)
    url = "https://www.maomaozu.com/index/build.json"
    res = requests.post(url, headers=headers, data=data)
    result = decrypt(res.text)
    print(result)


get_page(5)
