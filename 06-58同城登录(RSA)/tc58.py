# http://passport.58.com/login  58同城登录
import time, execjs, re, os
import requests
from PIL import Image


def get_password(a):
    # 获取加密后的密文
    with open("tc58.js", "r") as f:
        ctx = execjs.compile(f.read())
    password = ctx.call("encryptString", a)
    return password
    

def dologin(data1):
    # 执行登录
    while True:
        url = 'https://passport.58.com/58/login/pc/dologin'
        response = s.post(url, headers=headers, data=data1)
        if "请输入图片验证码" in response.text:
            pattern = re.compile(r'"vcodekey":"(.*?)",', re.S)
            vcodekey = re.findall(pattern, response.text)[0]
            validcode = get_code(vcodekey)
            data1["vcodekey"] = vcodekey
            data1["validcode"] = validcode
        elif "需要验证手机号" in response.text:
            pattern = re.compile(r'"warnkey":"(.*?)",', re.S)
            warnkey = re.findall(pattern, response.text)[0]
            pattern = re.compile(r'"path":"(.*?)",', re.S)
            path = re.findall(pattern, response.text)[0]
            token, codetype, mobile, tokencode = get_params(warnkey, path)
            mobilecode = get_phone_code(token, codetype, mobile, warnkey, path)
            result = mobile_login(mobilecode, token, tokencode)
            return result
        else:
            return response.text


def mobile_login(mobilecode, tokencode, token):
    # 需要手机验证码时的登录请求
    url = "http://passport.58.com/58/mobile/pc/login"
    params = (
        ('mobile', get_password(username)),
        ('mobilecode', mobilecode),
        ('source', '58-default-pc'),
        ('path', 'https%3A%2F%2Fmy.58.com%2Fpro%2Fmyseekjob%2F11%2F%3Fpts%3D' + str(int(time.time()*1000))),
        ('domain', '58.com'),
        ('isremember', 'false'),
        ('tokencode', tokencode),
        ('token', token),
        ('finger2', 'zh-CN|24|1.25|4|1536_864|1536_826|-480|1|1|1|undefined|1|unknown|Win32|unknown|3|false|false|false|false|false|0_false_false|d41d8cd98f00b204e9800998ecf8427e|86c75e61215ed0736aa38d1a4dadb102'),
        ('fingerprint', 'iMaJiSCrQD0j5Ie2T8tinSg6oh02-zDe'),  # 可以写死
        ('psdk-d', 'jsdk'),
        ('psdk-v', '1.0.2'),
    )
    response = s.get(url, params=params, headers=headers)
    return response.text


def get_phone_code(token, codetype, mobile, warnkey, path):
    # 获取手机验证码
    url = "https://passport.58.com/sec/58/mobile/getcode"
    params = (
        ('path', path),
        ('mobile', get_password(mobile)),
        ('codetype', codetype),
        ('token', token),
        ('warnkey', warnkey),
        ('voicetype', '0'),
        ('source', '58-default-pc'),
        ('psdk-d', 'jsdk'),
        ('psdk-v', '1.0.2'),
    )
    response = s.get(url, headers=headers, params=params)
    if "动态码已发送" in response.text:
        mobilecode = input("请输入手机验证码：")
        return mobilecode


def get_params(warnkey, path):
    # 获取手机验证码时需要的参数
    url = "https://passport.58.com/sec/58/frontend/pc/warndata"
    params = (
        ('source', '58-default-pc'),
        ('path', path),
        ('warnkey', warnkey),
        ('psdk-d', 'jsdk'),
        ('psdk-v', '1.0.2'),
    )
    response = s.get(url, headers=headers, params=params)
    token = response.json()["data"]["token"]
    codetype = response.json()["data"]["codetype"]
    mobile = response.json()["data"]["mobile"]
    tokencode = response.json()["data"]["tokencode"]
    return token, codetype, mobile, tokencode


def get_code(vcodekey):
    # 获取图片验证码
    url = "https://passport.58.com/sec/58/validcode/get?vcodekey={}&time={}".format(vcodekey, str(int(time.time()*1000)))
    response = s.get(url, headers=headers)
    with open("code.jpg", "wb") as f:
        f.write(response.content)
    img = Image.open("code.jpg")
    img.show()
    os.remove("code.jpg")
    validcode = input("请输入图片验证码:")
    return validcode


headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.97 Safari/537.36',
    'referer': 'https://passport.58.com/login/?path=https%3A//hz.58.com/searchjob/%3Fspm%3D116138685575.zhaopin_baidu%26utm_source%3D12345&PGTID=0d302409-0004-f026-99d0-d5d7983ad769&ClickID=5',
}

s = requests.Session()
username = input("请输入账号：")
password = input("请输入密码：")
data = {
  'username': username,
  'password': get_password(password),
  'finger2': 'zh-CN|24|1.25|4|1536_864|1536_826|-480|1|1|1|undefined|1|unknown|Win32|unknown|3|false|false|false|false|false|0_false_false|d41d8cd98f00b204e9800998ecf8427e|86c75e61215ed0736aa38d1a4dadb102',
}

print(dologin(data))
