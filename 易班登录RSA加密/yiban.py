# https://www.yiban.cn/login  易班 登录网址
# 验证账号：17109324198  密码：Aa123456

import requests, re, os, base64, time
from PIL import Image
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_v1_5


def encrypt(a, keys):
    # 构造密码
    if keys:
        rsakey = RSA.importKey(keys)
        cipher = PKCS1_v1_5.new(rsakey)
        cipher_text = cipher.encrypt(a.encode("utf-8"))
        return str(base64.b64encode(cipher_text), encoding="utf-8")
    else:
        return ""


def get_keystime():
    # 获取网页中的公钥、keys-time、cookies
    # 公钥必须与keys-time对应，否则无法登录
    url = "https://www.yiban.cn/login"
    res = requests.get(url , headers=headers)
    pattern = re.compile(r"data-keys-time='(.*?)'", re.S)
    result = re.findall(pattern, res.text)
    result = result[0] if result else ''
    pattern = re.compile(r"data-keys='(.*?)'", re.S)
    keys = re.findall(pattern, res.text)
    keys = keys[0] if keys else ''
    cookies = res.cookies
    return result, keys, cookies


def get_captcha():
    # 获取图形验证码
    url = "https://www.yiban.cn/captcha/index"
    res = requests.get(url, headers=headers, cookies=cookies)
    with open("code.png", "wb") as f:
        f.write(res.content)
    img = Image.open("code.png")
    print("即将展示验证码，查看后输入！")
    time.sleep(2)
    img.show()
    code = input("请输入图片验证码：")
    os.remove("code.png")
    return code


def login():
    # 登录
    while True:
        url = "https://www.yiban.cn/login/doLoginAjax"        
        response = requests.post(url, headers=headers, data=data, cookies=cookies)
        if "请输入图形验证码" in response.json()["message"]:
            data["captcha"] = get_captcha()
            continue
        if "图片验证码错误" in response.json()["message"]:
            print("图片验证码错误,请重新输入！")
            data["captcha"] = get_captcha()
            continue
        return response.json()


headers = {
    'x-requested-with': 'XMLHttpRequest',
    'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
}
keys_time, keys, cookies = get_keystime()
account = input("请输入账号：")
password = input("请输入密码：")
data = {
    'account': account,
    'password': encrypt(password, keys),
    'captcha': "",
    'keysTime': keys_time,
}

print(login())

