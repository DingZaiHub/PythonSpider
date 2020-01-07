import re, execjs


def change(s):
    """
    替换函数，js文件中写法如下：
    function change(s) {
        return '"' + eval(s) + '"'
    }
    """
    value = s.group('value')
    return ctx.call("change", value)


with open("替换方法.js", "r", encoding="utf-8") as fb:
    # 提取出解密函数的文件
    ctx = execjs.compile(fb.read())

with open("替换前.js", "r", encoding="utf-8") as f:
    # 需要替换的文件
    word = f.read()

# 下面的_0x44c0和单引号或者双引号，根据原来的代码相应修改
pattern = re.compile(r"(?P<value>_0x56ae\('.*?', '.*?'\))", re.S)
word = re.sub(pattern, change, word)

with open("替换后.js", "w", encoding="utf-8") as f:
    # 替换后的文件
    f.write(word)
    print("替换完成")
