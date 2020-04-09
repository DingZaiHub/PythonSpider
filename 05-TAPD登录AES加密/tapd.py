# https://www.tapd.cn/cloud_logins/login  TAPD登录

import execjs, requests, json


def encrypt(content):
    with open("tapd.js", "r", encoding='utf8') as f:
        ctx = execjs.compile(f.read())
    datas = json.loads(ctx.call("aes", content))
    return datas


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    'Referer': 'https://www.tapd.cn/cloud_logins/login'
}

datas = encrypt("Aa123456")
data = {
    'data[Login][ref]': 'https://www.tapd.cn/my_worktable',
    'data[Login][encrypt_key]': datas['encrypt_key'],
    'data[Login][encrypt_iv]': datas['encrypt_iv'],
    'data[Login][site]': 'TAPD',
    'data[Login][via]': 'encrypt_password',
    'data[Login][email]': '17109324205',
    'data[Login][password]': datas['password'],
    'data[Login][code]': '',  # 验证码，一般正确的账号密码不需要
    'data[Login][login]': 'login',
    'dsc_token': datas['dsc_token'],
}
response = requests.post('https://www.tapd.cn/cloud_logins/login', headers=headers, data=data)
# print(response.text)

if "退出登录" in response.text:
    print("登录成功")
else:
    print("登录失败")
