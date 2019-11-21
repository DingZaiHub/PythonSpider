# https://user.lu.com/user/login 陆金所

import requests, time, execjs, os
from PIL import Image



def encrypt():
    with open("ljs.js", "r", encoding="utf-8") as f:
        ctx = execjs.compile(f.read())
    result = ctx.call("aaa", "Aa123456")
    return result


def code():
    url = "https://user.lu.com/user/captcha/captcha.jpg?source=login&_=" + str(int(time.time()*1000))
    res = requests.get(url, headers=headers)
    with open("code.jpg", "wb") as f:
        f.write(res.content)
    img = Image.open("code.jpg")
    img.show()
    code = input("请输入验证码：")
    os.remove("code.jpg")
    return code


headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
    "cookie": "_g=m_79ef08da-be6d-4310-9862-821451a1bff7; IMVC=c11a350dfd50488ba846afe8eb149699"
}

data = {
  'isTrust': 'Y',
  'password': encrypt(),
  'userName': '17109324198',
  'validNum': '',
}

while True:
    response = requests.post('https://user.lu.com/user/login', headers=headers, data=data)
    print(response.json())
    if "VCODE" in response.json()["resultMsg"]:
        time.sleep(1.5)
        data["validNum"] = code()
    else:
        break

