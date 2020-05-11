var express = require('express')
var app = express()
var sign = require('./toutiao')  // 导入toutiao模块，并命名为sign
var bodyParser = require('body-parser');  // 导入请求体解析器
app.use(bodyParser());

// 开启get_cookie路由
app.post('/get_param', function(req, res) {
    // 获取请求的真实IP
	var ip = req.headers['x-real-ip'] ? req.headers['x-real-ip'] : req.ip.replace(/::ffff:/, '');
	// 获取请求时间
	var time = new Date().toString().replace(/\+0800.*/, '');
	// 打印请求时间、IP、方法、路由
	console.log('INFO:', time, ip, req.method, req.originalUrl, '200 OK!');
	// 获取POST请求的formdata
	let result = req.body;
	// 取出formdata中的category
	let category = result.category;
	// 取出formdata中的userAgent
	let userAgent = result.userAgent;
	// 取出formdata中的userAgent
	let max_behot = result.max_behot;
	// 调用toutiao模块中的get_param方法，该方法需要提前module.exports导出
	var param = sign.get_param(category, userAgent, max_behot);
	// 设置响应头，如果不设置，通过asyncio_requests请求的res.json()会报错，因为它是根据响应头解析json数据
	// 而requests可以直接使用res.json()解析，因为它是根据响应信息解析
	res.set('Content-Type', 'application/json')
	// 将JSON后的数据返回客户端
	res.send(JSON.stringify(param));
});



// 监听8919端口，所有人均可访问
app.listen(8919, () => {
	console.log("开启服务，端口8919", new Date().toString().replace(/\+0800.*/, ''))
})


