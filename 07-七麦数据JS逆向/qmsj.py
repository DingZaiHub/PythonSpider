# https://www.qimai.cn/rank  七麦数据

import requests, execjs, json, time


with open("qmsj.js", "r", encoding="utf-8") as f:
    ctx = execjs.compile(f.read())

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
}
url = 'https://api.qimai.cn/rank/indexPlus/brand_id/1'  # 最后的数字，1：免费榜；0：付费榜；2：畅销榜
params = {
    # params为筛选条件，可选项
    'brand': 'all',  # 榜单类型
    'genre': '5000',  # 子分类类型
    'device': 'iphone',  # 设备
    'country': 'cn',  # 国家
    'date': time.strftime("%Y-%m-%d", time.localtime()),  # 日期，这里默认以当天，可自行改成(2019-12-12)格式
    'page': '1',  # 页码
}
params["analysis"] = ctx.call("analysis", url, json.dumps(params))  # 如没有params，只需要传入url即可
response = requests.get(url, headers=headers, params=params)
print(response.json())
