// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var path = require('path')
var app = express();
var mongoose = require('mongoose');
var Schema = mongoose.Schema

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

    //due to strongloop problem, need to read data from backend then send to front

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
        'data': {
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
            'start': startEnd[0] / 1000,
            'end': startEnd[1] / 1000
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

var getUPoiEvi = function (uid) {
    var av = null
    var mo = null
    var promise = new AV.Promise()

    getMoUPoiEvi(upois).then(function (data) {
        mo = data
        return getAvUPoiEvi(upois)
    }).then(function (data) {
        av = data
        promise.resolve({'av': av, 'mo': mo})
    })

    return promise
}

var getMoUPoiEvi = function (upois) {
    var promise = new AV.Promise()

    var upoiids = []
    for (var i = 0; i < upois.length; i++) {
        upoiids.push(upois[i].id)
    }

    var where = '{"where": {"u_poi_id": {"inq": ' + JSON.stringify(upoiids) + '}}}'
    var path = 'http://119.254.111.40:3000/api/MarkedUserLocation?filter=' + where

    $.getJSON(path, function (data) {
        if (data) {
            promise.resolve(data)
        } else {
            promise.reject('load failed:', path)
        }
    })

    return promise

}

var getAvUPoiEvi = function (upois) {

    MUL.find({
        'u_poi_id': {
            $in: ['563af44160b25a751b806488', '563af445ddb2160c6a2b1e63']
        }
    }).then(function (data) {
        console.log(data)
    })
}

var testfind = function () {

    where = {u_poi_id: '563af44160b25a751b806488'}

    MUL.find(where, function (err, data) {
        console.log('err:', err)
        console.log('data:', data)
    })
}

var testall = function() {

    var q = MUL.find().limit(2)
    q.exec(function (e, d) {
        console.log('e:', e)
        console.log('d:', d)
    })

    var q = UL.find().limit(2)
    q.exec(function (e, d) {
        console.log('e:', e)
        console.log('d:', d)
    })
    
}

//Lets connect to our database using the DB server URL.
mongoose.connect('mongodb://senzhub:Senz2everyone@119.254.111.40/RefinedLog')

/**
 * Lets define our Model for User entity. This model represents a collection in the database.
 * We define the possible schema of User document and data types of each field.
 * */
//var User = mongoose.model('User', {name: String, roles: Array, age: Number})
var MulSchema = {

    u_poi_id: String
    //"user_location": {
    //    "ref": "UserLocation",
    //    type: Schema.Types.ObjectId
    //},
    //"u_poi_visit_id": String,
    //"location": {
    //    "lat": Number,
    //    "lng": Number
    //},
    //"timestamp": Number
}

var ULSchema = {
    'user_id': String
}

var MUL = mongoose.model('MarkedUserLocation', MulSchema)
var UL = mongoose.model('UserLocation', ULSchema)

testall()