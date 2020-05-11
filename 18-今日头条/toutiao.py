# https://www.toutiao.com/ch/news_hot/
import requests


session = requests.Session()
ua = 'Mozilla/5.0 (Windows NT 6.1; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4142.0 Safari/537.36'
headers = {
    'referer': 'https://www.toutiao.com',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
    'user-agent': ua,
    'x-requested-with': 'XMLHttpRequest',
    'accept': 'text/javascript, text/html, application/xml, text/xml, */*',
    'accept-language': 'zh-CN,zh;q=0.9',
    'content-type': 'application/x-www-form-urlencoded',
}
data = {
    # 热点，其它需要作相应修改。JS文件同样需要修改
    "category": "news_hot",
    "userAgent": ua,
    "max_behot": 0
}
for i in range(5):
    # 这里仅获取前5页
    param = requests.post("http://127.0.0.1:8919/get_param", data=data).json()
    url = "https://www.toutiao.com/api/pc/feed/"
    res = session.get(url, params=param, headers=headers)
    result = res.json()
    print(result)
    print("已获取第" + str(i+1) + "页")
    if not result['has_more']:
        data["max_behot"] = result['next']['max_behot_time']
    else:
        break
