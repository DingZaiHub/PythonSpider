import requests, execjs
from lxml import etree


headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; ) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4014.0 Safari/537.36',
}
with open("hffc.js", "r", encoding="utf-8") as f:
    ctx = execjs.compile(f.read())


def get_detail_url(id, iptstamp):
    reurl = ctx.call("get_url", id, iptstamp)
    url = "http://60.173.254.126" + reurl
    return url


def get_index():
    url = "http://60.173.254.126/"
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            return resp.text
        else:
            print("爬取主页失败：", resp.status_code)
            return None
    except Exception as e:
        print("爬取主页失败：", e)
        return None


def parse_index(resp):
    html = etree.HTML(resp)
    iptstamp = html.xpath("//input[@id='iptstamp']/@value")[0]
    # print(iptstamp)
    communities = html.xpath("//div[@class='beian_se2_1 mt20']//a")
    for community in communities:
        name = community.xpath("text()")[0]
        id = community.xpath("@id")[0]
        yield {
            "name": name,
            "id": id,
            "url":get_detail_url(id, iptstamp)
        }


def get_detail_page(url):
    try:
        resp = requests.get(url, headers=headers)
        if resp.status_code == 200:
            return resp.text
        else:
            print("爬取详情页失败：", resp.status_code)
            return None
    except Exception as e:
        print("爬取详情页失败：", e)
        return None


def parse_detail_page(resp):
    # 懒得写了...
    if resp:
        print(resp)


if __name__ == "__main__":
    index_resp = get_index()
    if index_resp:
        for detail in parse_index(index_resp)[:2]:
            # 这里仅展示2页，可将切片去掉，解析全部
            detail_resp = get_detail_page(detail["url"])
            parse_detail_page(detail_resp)
