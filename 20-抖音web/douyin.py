import requests, re, execjs, sys
from lxml import etree


douyin_font = {
    " &#xe603; ": "0", " &#xe60d; ": "0", " &#xe616; ": "0",
    " &#xe602; ": "1", " &#xe60e; ": "1", " &#xe618; ": "1",
    " &#xe605; ": "2", " &#xe610; ": "2", " &#xe617; ": "2",
    " &#xe604; ": "3", " &#xe611; ": "3", " &#xe61a; ": "3",
    " &#xe606; ": "4", " &#xe60c; ": "4", " &#xe619; ": "4",
    " &#xe607; ": "5", " &#xe60f; ": "5", " &#xe61b; ": "5",
    " &#xe608; ": "6", " &#xe612; ": "6", " &#xe61f; ": "6",
    " &#xe60a; ": "7", " &#xe613; ": "7", " &#xe61c; ": "7",
    " &#xe60b; ": "8", " &#xe614; ": "8", " &#xe61d; ": "8",
    " &#xe609; ": "9", " &#xe615; ": "9", " &#xe61e; ": "9",
}
UA = 'Mozilla/5.0 (Windows NT 6.1; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4014.0 Safari/537.36'
headers = {
    'User-Agent': UA,
}


def num_replace(text):
    # 主页字体反爬
    for key, value in douyin_font.items():
        if key in text:
            text = text.replace(key, value)
    return text


def get_index(uid):
    # 获取主页源码，uid如 102064772608
    url = "https://www.amemv.com/share/user/%s" % uid
    # url = "https://www.iesdouyin.com/share/user/%s" % uid  
    try:
        res = requests.get(url, headers=headers)
        if res.status_code == 200 and "dytk: " in res.text:
            html = num_replace(res.text)
            return html
        else:
            print("获取主页失败：", res.status_code)
            if res.status_code == 200:
                print("未请求到主页源码，请重新发起请求！")
            sys.exit()
            return None
    except Exception as e:
        print("获取主页失败：", e)
        sys.exit()
        return None


def parse_index(res):
    # 解析主页，获取dytk、tac、昵称、抖音ID、认证信息、签名、关注数、粉丝数、赞数、作品数、喜欢数
    dytk = re.findall("dytk: '(.*?)'", res, re.S)[0]
    tac = re.findall("<script>tac='(.*?)'</script>", res, re.S)[0]
    html = etree.HTML(res)
    nickname = html.xpath('//p[@class="nickname"]/text()')[0]
    douyin_ID = "".join(html.xpath('//p[@class="shortid"]/i/text()'))
    verify_info = html.xpath('//div[@class="verify-info"]//text()')
    verify_info = verify_info[0].strip() if verify_info else "无"
    signature = html.xpath('//p[@class="signature"]/text()')[0]
    focus_num = "".join(html.xpath('//span[@class="focus block"]//i/text()'))
    follower_num = "".join(html.xpath('//span[@class="follower block"]/span[1]//text()')).strip()
    liked_num = "".join(html.xpath('//span[@class="liked-num block"]/span[1]//text()')).strip()
    user_tab = "".join(html.xpath('//div[@class="user-tab active tab get-list"]/span/i/text()'))
    like_tab = "".join(html.xpath('//div[@class="like-tab tab get-list"]/span/i/text()'))
    return {
        "nickname": nickname,
        "douyin_ID": douyin_ID,
        "verify_info": verify_info,
        "signature": signature,
        "focus_num": focus_num,
        "follower_num": follower_num,
        "liked_num": liked_num,
        "user_tab": user_tab,
        "like_tab": like_tab,
    }, tac, dytk


def get_sign(uid, tac, ua):
    # 获取_signature
    result = ctx.call("get_sign", uid, tac, ua)
    print("\n_signature:", result)
    return result


def get_aweme_list(uid, dytk, _signature):
    # 发起ajax请求，获取数据
    params = {
        'user_id': uid,
        'sec_uid': '',
        'count': "21",
        'max_cursor': "0",
        'aid': "1128",
        '_signature': _signature,
        'dytk': dytk
    }
    try:
        response = requests.get('https://www.iesdouyin.com/web/api/v2/aweme/post/', headers=headers, params=params)
        if response.json()["aweme_list"]:
            # print(response.json())
            return response.json()
        else:
            print(response.json())
            return False
    except Exception as e:
        print(e)
        return False


def download(url, name):
    # 下载视频
    header = {
        "user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 9_2 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13C75 Safari/601.1"
    }
    # url = "https://aweme.snssdk.com/aweme/v1/play/?video_id=v0200fe30000bj2iv7hum7li82bk34pg&line=0&ratio=540p&media_type=4&vr_type=0&improve_bitrate=0&is_play_url=1"
    try:
        res = requests.get(url, headers=header)
        if res.status_code == 200:
            with open(name + ".mp4", "wb") as f:
                f.write(res.content)
                print("下载完成!")
        else:
            print("下载失败:", res.status_code)
    except Exception as e:
        print("下载失败:", e)


def main(uid):
    # 1. 获取主页源码
    index = get_index(uid)
    # 2. 解析出主页信息及tac、dytk关键字段
    info, tac, dytk = parse_index(index)
    print("主页信息:", info)
    print("\ntac:", tac)
    print("\ndytk:", dytk)
    # 3. 获取_signature
    _signature = get_sign(uid, tac, UA)
    # 4. 携带_signature发起ajax请求，获取数据
    aweme_list = get_aweme_list(uid, dytk, _signature)
    if aweme_list:
        # 5. 提取第一个无水印视频下载链接
        play_addr = aweme_list['aweme_list'][0]['video']['play_addr']['url_list'][0]
        # 6. 下载视频
        download(play_addr, "抖音短视频")




if __name__ == "__main__":
    with open("douyin.js", "r", encoding="utf-8") as f:
        ctx = execjs.compile(f.read())

    uid = "102064772608"
    main(uid)
    
