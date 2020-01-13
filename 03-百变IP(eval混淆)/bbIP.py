import requests, execjs
from lxml import etree


def decrypt(content):
    result = ctx.call("ddip", content)
    return result


def get_page():
    headers = {
        'user-agent': 'Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/78.0.3904.108 Safari/537.36',
    }
    try:
        response = requests.get('https://www.baibianip.com/home/free.html', headers=headers)
        if response.status_code == 200:
            return response.text
        else:
            print("爬取失败：", response.status_code)
            return None
    except Exception as e:
        print("爬取失败：", e)
        return None


def parse_page(response):
    html = etree.HTML(response)
    trs = html.xpath("//table[@class='table table-striped table-bordered']/tbody/tr")
    for tr in trs:
        IP = decrypt(tr.xpath("./td[1]/script/text()")[0].split("'")[1])
        port = tr.xpath("./td[2]/text()")[0].strip()
        country = tr.xpath("./td[3]/text()")[0].strip()
        province = tr.xpath("./td[4]/text()")[0].strip()
        kind = tr.xpath("./td[5]/text()")[0].strip()
        https = tr.xpath("./td[6]/text()")[0].strip()
        response_delay = tr.xpath("./td[7]/text()")[0].strip()
        baidu_delay = tr.xpath("./td[8]/text()")[0].strip()
        transfer_rate = tr.xpath("./td[9]/text()")[0].strip()
        availability_rate = tr.xpath("./td[10]/text()")[0].strip()
        last_verify = tr.xpath("./td[11]/text()")[0].strip()
        yield {
            "IP": IP,
            "端口": port,
            "国家": country,
            "省份": province,
            "匿名类型": kind,
            "HTPPS": https,
            "响应延时": response_delay,
            "百度耗时": baidu_delay,
            "传输速度": transfer_rate,
            "可用率": availability_rate,
            "最后验证": last_verify,
        }


if __name__ == "__main__":
    with open("bbIP.js", "r", encoding="utf-8") as f:
        ctx = execjs.compile(f.read())
    html = get_page()
    if html:
        for info in parse_page(html):
            print(info)
