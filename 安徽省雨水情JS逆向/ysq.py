# http://yc.wswj.net/ahsxx/LOL/public/public.html 安徽省雨水情监视
import random
import execjs
import requests
import json


headers = {
    "User-Agent":"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.70 Safari/537.36",
}
data = {
    "name":"GetSwInfo",
    "time":"202001171000",
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
data = ctx.call("resultDecode", data_json)
data = json.loads(data)
print(data[:2])  # 数据共有2000多个，这里只展示两个
