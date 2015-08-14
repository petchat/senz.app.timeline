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

app.get('/uid/:uid/yesterday', function (req, res) {
    var today = new Date()
    var yesterday = new Date(today.setDate(today.getDate() - 1))
    var startEnd = tsStartEnd(yesterday)

    console.log('uid:', uid)

    var data = {
        'data': {
            'tsStart': startEnd[0],
            'tsEnd': startEnd[1],
            'uid': req.params.uid
        }
    }

    //res.sendfile(path.resolve(mapHtml))
    res.render('new_map', data)
});


app.get('/uid/:uid/date/:datestr/show_evidence/:show_evidence/convert/:convert', function (req, res) {

    var date = new Date(req.params.datestr)
    var startEnd = tsStartEnd(date)

    var data = {
        'data': {
            'tsStart': startEnd[0],
            'tsEnd': startEnd[1],
            'uid': req.params.uid,
            'showEvidence': req.params.show_evidence == 'true',
            'convert': req.params.convert == 'true'
        }
    }


    console.log(data)

    res.render('new_map', data)
})


app.get('/uid/:uid/range/:ts_start/:ts_end', function (req, res) {

    var data = {
        'data': {
            'tsStart': parseInt(req.params.ts_start),
            'tsEnd': parseInt(req.params.ts_end),
            'uid': req.params.uid
        }
    }

    console.log(data)

    //res.sendfile('public/new_map.ejs')
    res.render('new_map', data)
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