# https://www.aqistudy.cn/historydata/daydata.php?city=%E5%8C%97%E4%BA%AC&month=201312  空气质量历史数据

import requests, execjs, json, re


session = requests.Session()
headers = {
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.100 Safari/537.36',
}


def fetch(url, method, data=None):
    if method == 'GET':
        try:
            res = session.get(url, headers=headers)
            if res.status_code == 200:
                return res.text
            else:
                print('获取网页源代码失败！', res.status_code)
                return None
        except Exception as e:
            print('获取网页源代码失败！', e)
            return None
    
    if method == 'POST':
        try:
            res = session.post(url, headers=headers, data=data)
            if res.status_code == 200:
                return res.text
            else:
                print('获取网页源代码失败！', res.status_code)
                return None
        except Exception as e:
            print('获取网页源代码失败！', e)
            return None


def get_encrypt_url(city, month):
    # 获取网页加密链接，用于获取eval代码
    url = 'https://www.aqistudy.cn/historydata/daydata.php?city=%s&month=%s' % (city, month)
    header = headers
    res = fetch(url, 'GET')
    if res:
        pattern = re.compile(r'<script type="text/javascript" src="(resource/js/encrypt.*?)"></script>', re.S)
        result = re.findall(pattern, res)[0]
        result = 'https://www.aqistudy.cn/historydata/' + result
        # print(result)
        return result


def get_js_code(eval_str):
    # 将eval代码还原成正常js代码
    js = eval_str.replace("eval", "function get_js() {return ") + ";}"
    ctx = execjs.compile(js)
    return ctx.eval('get_js()')


def get_param(city, month, js_code):
    # 匹配出获取加密参数的函数名、post参数名，并生成加密参数
    # 返回form data

    # 匹配函数名
    pattern = re.compile(r'{var param=(.*?)\(method,object\);')
    get_param_func = re.findall(pattern, js_code)[0]

    # 匹配参数名
    pattern = re.compile(r',data:{(.*?):param}')
    param_name = re.findall(pattern, js_code)[0]

    # 构造传参并执行js
    obj = {
        "city": city,
        "month": month
    }
    js = f'{get_param_func}("GETDAYDATA", {obj})'
    param = {param_name: ctx.eval(js)}
    return param


def get_data(data, js_code):
    # 匹配出解密函数名并调用，将post请求的密文解密成json格式
    pattern = re.compile(r'function\(data\){data=(.*?)\(data\);')
    get_data_func = re.findall(pattern, js_code)[0]
    return json.loads(ctx.call(get_data_func, data))


encrypt_url = get_encrypt_url('北京', "201312")
eval_str = fetch(encrypt_url, 'GET')
js_code = get_js_code(eval_str)
with open('aqi.js', 'r', encoding='utf8') as f:
    ctx = execjs.compile(f.read() + '\n' + js_code)

param = get_param('北京', "201312", js_code)
print('post参数：', param)

url = 'https://www.aqistudy.cn/historydata/api/historyapi.php'
res = fetch(url, 'POST', data=param)
print('返回的密文：', res)
print('解密：', get_data(res, js_code))
