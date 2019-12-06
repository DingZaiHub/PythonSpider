# https://music.163.com/#/song?id=1384026889  网易云音乐评论
# https://music.163.com/weapi/v1/resource/comments/R_SO_4_1384026889?csrf_token=  api链接

import requests, execjs, json


def encrypt(params):
    with open("music163.js", "r", encoding="utf-8") as f:
        ctx = execjs.compile(f.read())
    result = json.loads(ctx.call("encrypt", json.dumps(params)))
    return result


def get_page(page):
    params = {
        "csrf_token": "",
        "limit": "20",  # 每页限制个数
        "offset": str(page * 20),  # 控制翻页，每次增加20
        "rid": "R_SO_4_1384026889",  # R_SO_4_ 加上歌曲id
        "total": "true" if i == 0 else "false",  # 只有第1页为true，后面均为false
    }
    url = "https://music.163.com/weapi/v1/resource/comments/R_SO_4_1384026889?csrf_token="
    try:
        response = requests.post(url, headers=headers, data=encrypt(params))
        if response.status_code == 200:
            return response.json()
        else:
            print("爬取失败:", response.status_code)
            return None
    except Exception as e:
        print("ERROR:", e)
        return None


def parse_page(response):
    if response:
        comments = response["comments"]
        for comment in comments:
            content = comment["content"]
            nickname = comment["user"]["nickname"]
            print(nickname + "：" + content + "\n")


if __name__ == "__main__":
    headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    }
    for i in range(3):
        html = get_page(i)
        parse_page(html)
        
        
