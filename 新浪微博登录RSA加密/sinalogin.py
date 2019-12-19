import requests, base64, time, execjs, json, re


class SinaLogin():
    # 新浪微博登录
    def __init__(self):
        self.s = requests.Session()
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36',
        }
        with open("sinalogin.js", "r", encoding="utf-8") as f:
            self.ctx = execjs.compile(f.read())
        self.username = input("请输入账号：")
        self.password = input("请输入密码：")
    
    def main(self):
        # 主要运行函数，即运行逻辑
        me = self.prelogin()
        if me:
            token = self.token_or_res(me)
            if token:
                if "crossdomain2.php" not in token:
                    mobile = self.encrypt_mobile(token)
                    self.sendcode(token, mobile)
                    redirect_url = self.confirm(token, mobile)
                    arrURL = self.redirect(redirect_url=redirect_url)
                else:
                    arrURL = self.redirect(res=token)
                self.login(arrURL)

    def prelogin(self):
        # 预登陆，用于获取登录参数nonce、rsakv等
        params = (
            ('entry', 'weibo'),
            ('su', base64.b64encode(self.username.encode()).decode()),
            ('rsakt', 'mod'),
            ('client', 'ssologin.js(v1.4.19)'),
            ('_', int(time.time()*1000)),
        )
        url = 'https://login.sina.com.cn/sso/prelogin.php'
        try:
            response = self.s.get(url, headers=self.headers, params=params)
            if response.status_code == 200:
                print("me:", response.json())
                return response.json()
            else:
                print("Prelogin failed:", response.status_code)
                return 0
        except Exception as e:
            print("Prelogin failed:", e)
            return 0

    def encrypt(self, me):
        # 获取加密密码
        me = json.dumps(me)
        result = self.ctx.call("encrypt", me, self.password)
        return result

    def token_or_res(self, me):
        # POST提交登录，若微博开启双重验证，需要先获取手机验证码。没有开启则直接跳转到新浪通行证
        params = (
            ('client', 'ssologin.js(v1.4.19)'),
        )
        data = {
            'entry': 'weibo',
            'gateway': '1',
            'from': '',
            'savestate': '0',
            'qrcode_flag': 'false',
            'useticket': '1',
            'pagerefer': '',
            'vsnf': '1',
            'su': base64.b64encode(self.username.encode()).decode(),
            'service': 'miniblog',
            'servertime': me["servertime"],
            'nonce': me["nonce"],
            'pwencode': 'rsa2',
            'rsakv': me["rsakv"],
            'sp': self.encrypt(me),
            'sr': '1536*864',
            'encoding': 'UTF-8',
            'prelt': '39',
            'url': 'https://www.weibo.com/ajaxlogin.php?framelogin=1&callback=parent.sinaSSOController.feedBackUrlCallBack',
            'returntype': 'META'
        }
        url = 'https://login.sina.com.cn/sso/login.php'
        response = self.s.post(url, headers=self.headers, params=params, data=data)
        response.encoding = response.apparent_encoding
        if "crossdomain2.php" in response.text:
            # 没有开启双重验证，无需手机验证码，直接获取通行证
            return response.text
        elif "retcode=101" in response.text:
            # 用户名或密码错误
            print("用户名或密码错误!")
            return None
        else:
            # 开启双重验证，需要手机验证码，获取token值
            pattern = re.compile(r'token%3D(.*?)"', re.S)
            result = re.findall(pattern, response.text)
            result = result[-1] if result else ""
            print("token:", result)
            return result

    def encrypt_mobile(self, token):
        # 用token值获取encrypt_mobile值，用于发送和确认短信验证码
        url = "https://login.sina.com.cn/protection/index?token={}&callback_url=https%3A%2F%2Fweibo.com".format(token)
        res = self.s.get(url, headers=self.headers)
        pattern = re.compile(r'name="encrypt_mobile".*?value="(.*?)"', re.S)
        result = re.findall(pattern, res.text)
        result = result[0] if result else ""
        print("encrypt_mobile:", result)
        return result

    def sendcode(self, token, encrypt_mobile):
        # 发送短信验证码
        url = "https://login.sina.com.cn/protection/mobile/sendcode?token=" + token
        data = {"encrypt_mobile": encrypt_mobile}
        res = self.s.post(url, headers=self.headers, data=data)
        print("sendcode:", res.json())
        if res.json()["msg"] == "succ":
            print("已发送短信验证码，请查看后在下方输入：")
        else:
            print("未成功发送短信验证码，请参考上方错误代码！")

    def confirm(self, token, encrypt_mobile):
        # 确认短信验证码
        while True:
            code = input()
            url = "https://login.sina.com.cn/protection/mobile/confirm?token=" + token
            data = {
                "encrypt_mobile": encrypt_mobile,
                "code": code
            }
            res = self.s.post(url, headers=self.headers, data=data)
            print("confirm:", res.json())
            if "验证码错误或已过期" in res.json()["msg"]:
                print("验证码错误或已过期，请在下方重新输入：")
                continue
            else:
                redirect_url = res.json()["data"]["redirect_url"]
                return redirect_url

    def redirect(self, redirect_url=None, res=None):
        # 请求通行证，获取跳转链接
        if res == None:
            res = self.s.get(redirect_url, headers=self.headers).text
        pattern = re.compile(r'location.replace\("(.*?)"\)', re.S)
        result = re.findall(pattern, res)
        if result:
            print("新浪通行证:", result[0])
            res = self.s.get(result[0], headers=self.headers)
            pattern = re.compile(r'"arrURL":\["(.*?)"', re.S)
            arrURL = re.findall(pattern, res.text)
            arrURL = arrURL[0] if arrURL else ""
            print("arrURL:", arrURL)
            return arrURL

    def login(self, arrURL):
        # 请求跳转链接，获取uniqueid，并请求主页进行登陆
        arrURL = arrURL.replace("\\", "")
        res = self.s.get(arrURL, headers=self.headers)
        data = json.loads(res.text.strip()[1:-2])
        if data["result"] == True:
            uniqueid = data["userinfo"]["uniqueid"]
            print("uniqueid:", uniqueid)
            url = "https://www.weibo.com/u/{}/home?wvr=5&sudaref=login.sina.com.cn".format(uniqueid)
            res = self.s.get(url, headers=self.headers)
            print(res.text)
            print("登录成功！")
        else:
            print("获取uniqueid失败！")


log = SinaLogin()
log.main()
