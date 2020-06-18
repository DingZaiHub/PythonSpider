# 使用说明

### 注意：我这里只补了两套代码的环境，BOSS实际有几套不知道，补不动了，一天一变...

1.npm需安装express和body-parser，具体自行了解

2.将3个文件放于同一文件夹，cd到该目录，命令行运行
```javascript
node index.js
```

3.运行boss.py开始食用


### 由于pyexecjs运行会报以下错误，因此这里使用接口调用。
```python
execjs._exceptions.ProcessExitedWithNonZeroStatus: (1, "{\n  cookie: '0df7%2B9kAOY%2BdFeUde5p9NCZKtB2NXE6tIvdOfT25tAHJMiCiwrE0IJoOog04oQNba8nW0DAyd%2BjPCVgIUn3%2FXaXxYW5iqK9j1Mr%2FLAxG3sSH%2BhiM4UpIzn5XpYncEehEHLf1'\n}\n",.....
```
### 实际为process赋值为undefined的原因，导致execjs库无法读取process
