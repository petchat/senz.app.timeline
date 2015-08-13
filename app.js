// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var path = require('path')
var app = express();

app.set('view engine', 'ejs');
//app.use(express.static(__dirname + '../public'));
app.use(express.static(__dirname + '/public'));

var mapHtml = 'cloud/views/new_map.ejs'

// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function (req, res) {
    res.render('hello', {message: 'Congrats, you just set up your app!'});
});

app.get('/yesterday/:uid', function (req, res) {
    var today = new Date()
    var yesterday = new Date(today.setDate(today.getDate() - 1))
    var startEnd = tsStartEnd(yesterday)
    var uid = req.params.uid

    console.log('uid:', uid)

    var data = {
        'data': {
            'tsStart': startEnd[0],
            'tsEnd': startEnd[1],
            'uid': uid
        }
    }

    res.sendfile(path.resolve(mapHtml))
    res.render('new_map', data)
});

app.get('/range/:ts_start/:ts_end', function (req, res) {
    console.log('ts_start:', req.param['ts_start'])
    console.log('ts_end:', req.param['ts_end'])

    res.sendfile('public/new_map.ejs')

})


var server = app.listen(9111, '0.0.0.0', function () {

    var host = server.address().address
    var port = server.address().port;

    console.log('Example app listening at http://%s:%s', host, port);
});


var tsStartEnd = function (date) {
//        var start = _.clone(date)
    var start = new Date(date.getTime());

    start.setHours(0)
    start.setMinutes(0)
    start.setSeconds(0)

    var tsStart = start.getTime()

//        var end = _.clone(date)
    var end = new Date(date.getTime())
    end.setHours(23)
    end.setMinutes(59)
    end.setSeconds(59)

    var tsEnd = end.getTime()

    return [tsStart, tsEnd]
}