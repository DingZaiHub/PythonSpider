# http://yc.wswj.net/ahsxx/LOL/public/public.html 安徽省雨水情监视
import random
import execjs
import requests
import base64
import json


headers = {
    "User-Agent":"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
}
data = {
    "name":"GetSwInfo",
    "time":"201911061100",
    "fresh":0,
    "waterEncode":"true",
}

with open("ysq.js", "r") as f:
    ctx = execjs.compile(f.read())
    
for k,v in data.items():
    data[k] = ctx.call("waterEncode", v)
    
data["random"] = random.random()
# print(data)

url = "http://yc.wswj.net/ahsxx/service/PublicBusinessHandler.ashx"
res = requests.post(url, data=data, headers=headers)
data_json = res.json()["data"]
# print(res.json()["respMsg"])

result = ctx.call("resultDecode", data_json)
result = base64.b64decode(result.encode("utf-8")).decode("utf-8")
result = json.loads(result)
print(result[0])  # 数据共有2000多个，这里只展示一个
