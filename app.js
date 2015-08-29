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

    console.log('uid:', req.params.uid)

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

app.get('/phone/:phone', function (req, res) {
    console.log('phone:', req.params.phone)

    var data = {
        'phone': req.params.phone
    }

    res.render('local_map', data)
})

app.get('/basestation/start/:start/end/:end', function (req, res) {
    var data = {
        'data' : {
            'start': req.params.start,
            'end': req.params.end
        }
    }

    console.log('base station, data:', data)

    res.render('base_station', data)

})

app.get('/basestation/date/:date', function (req, res) {

    var date = new Date(req.params.date)
    var startEnd = tsStartEnd(date)


    var data = {
        'data': {
            'start': startEnd[0]/1000,
            'end': startEnd[1]/1000
        }
    }

    res.render('base_station', data)

})


var server = app.listen(9111, '0.0.0.0', function () {

    var host = server.address().address
    var port = server.address().port;

    console.log('Example app listen g at http://%s:%s', host, port);
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