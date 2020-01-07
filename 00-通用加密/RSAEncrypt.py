import rsa


def encrypt(content):
    e = "10001"
    # 指数
    n = "00833c4af965ff7a8409f8b5d5a83d87f2f19d7c1eb40dc59a98d2346cbb145046b2c6facc25b5cc363443f0f7ebd9524b7c1e1917bf7d849212339f6c1d3711b115ecb20f0c89fc2182a985ea28cbb4adf6a321ff7e715ba9b8d7261d1c140485df3b705247a70c28c9068caabbedbf9510dada6d13d99e57642b853a73406817"
    # 模量
    e = int(e, 16)  # 转成16进制
    n = int(n, 16)
    publickey = rsa.PublicKey(e=e, n=n)
    m = rsa.encrypt(content.encode(), publickey)
    return m.hex()


print(encrypt("111111"))
