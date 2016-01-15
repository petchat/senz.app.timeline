// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var bodyParser = require("body-parser");
var _ = require("underscore");
var app = express();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AV = require('avoscloud-sdk');
var timelineId = 'pin72fr1iaxb7sus6newp250a4pl2n5i36032ubrck4bej81';
var timelineKey = 'qs4o5iiywp86eznvok4tmhul360jczk7y67qj0ywbcq35iia';
AV.initialize(timelineId, timelineKey);

// TODO
var logId = '9ra69chz8rbbl77mlplnl4l2pxyaclm612khhytztl8b1f9o';
var logKey = '1zohz2ihxp9dhqamhfpeaer8nh1ewqd9uephe9ztvkka544b';
AV.initialize(logId, logKey);
// 该语句应该只声明一次
//var Log = AV.Object.extend('Log');

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));

var mapHtml = 'cloud/views/new_map.ejs';

// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function (req, res) {
    res.json({
        DateTime: new Date().toLocaleString(),
        Date: new Date().toLocaleDateString(),
        Time: new Date().toLocaleTimeString()
    });
});

app.get('/index', function (req, res) {
    var data = {
        date: new Date().pattern('yyyy-MM-dd')
    };
    res.render('index', data);
});

app.get('/query', function (req, res) {
    // 获取参数
    var startDate = req.query.startDate;
    var endDate = req.query.endDate;
    var userId = req.query.userId;
    // 处理参数
    var TSArray = getTS(new Date(startDate), new Date(endDate));
    var startTS = TSArray[0];
    var endTS = TSArray[1];
    console.log('startTS:' + startTS + '|endTS:' + endTS);
    // 返回数据
    res.json({startTS: startTS, endTS: endTS, userId: userId});
});

app.get('/uid/:uid/date/:datestr/show_evidence/:show_evidence/convert/:convert', function (req, res) {

    var date = new Date(req.params.datestr);
    var startEnd = getTS(date);
    var tsStart = startEnd[0];
    var tsEnd = startEnd[1];
    var uid = req.params.uid;
    var showEvidence = req.params.show_evidence == 'true';
    var convert = req.params.convert == 'true';

    var promises = [];
    promises.push(getMoUserLocation(uid, tsStart, tsEnd));
    promises.push(getAvUserEvent(uid, tsStart, tsEnd));
    promises.push(getAvUserActivity(uid, tsStart, tsEnd));
    promises.push(getMoHomeOfficeStatus(uid, tsStart, tsEnd));
    return AV.Promise.all(promises)
        .then(function (results) {
            var data = {
                'data': {
                    'tsStart': tsStart,
                    'tsEnd': tsEnd,
                    'uid': uid,
                    'showEvidence': showEvidence,
                    'convert': convert,
                    'userLocation': results[0],
                    'userEvent': results[1],
                    'userActivity': results[2],
                    'homeOfficeStatus': results[3]
                }
            };

            res.render('new_map', data);
        })
});


app.get('/trace/uid/:uid', function (req, res) {
    var uid = req.params.uid;
    return getAvHomeOfficeUtrace(uid)
        .then(function (results) {
            var level = {"best": 1, "good": 2, "ok": 3};
            var label_level_ho = 5, trace_ho = null, home_ho = null, office_ho = null;
            var label_level_oh = 5, trace_oh = null, home_oh = null, office_oh = null;
            results.forEach(function (obj) {
                if (obj._serverData.trace_label == "H2O" && level[obj._serverData.handed_label] < label_level_ho) {
                    label_level_ho = level[obj._serverData.handed_label];
                    trace_ho = obj._serverData.trace;
                    home_ho = obj._serverData.home;
                    office_ho = obj._serverData.office;
                }
                if (obj._serverData.trace_label == "O2H" && level[obj._serverData.handed_label] < label_level_oh) {
                    label_level_oh = level[obj._serverData.handed_label];
                    trace_oh = obj._serverData.trace.reverse();
                    home_oh = obj._serverData.home;
                    office_oh = obj._serverData.office;
                }
            });
            var data = {
                'data': {
                    'trace_ho': trace_ho,
                    'home_ho': home_ho,
                    'office_ho': office_ho,

                    'trace_oh': trace_oh,
                    'home_oh': home_oh,
                    'office_oh': office_oh,
                    'handed_label_ho': label_level_ho == 1 ? "best" : label_level_ho == 2
                        ? "good" : label_level_ho == 3 ? "ok" : "other",
                    'handed_label_oh': label_level_oh == 1 ? "best" : label_level_oh == 2
                        ? "good" : label_level_oh == 3 ? "ok" : "other"
                }
            };
            res.render('trace_map', data);
        });
});

app.get('/uid/:uid/range/:ts_start/:ts_end', function (req, res) {

    var data = {
        'data': {
            'tsStart': parseInt(req.params.ts_start),
            'tsEnd': parseInt(req.params.ts_end),
            'uid': req.params.uid
        }
    };

    console.log(data);

    //res.sendfile('public/new_map.ejs')
    res.render('new_map', data)
});

app.get('/phone/:phone', function (req, res) {
    console.log('phone:', req.params.phone);

    var data = {
        'phone': req.params.phone
    };

    res.render('local_map', data)
});

app.get('/basestation/start/:start/end/:end', function (req, res) {
    var data = {
        'data': {
            'start': req.params.start,
            'end': req.params.end
        }
    };

    console.log('base station, data:', data);

    res.render('base_station', data)

});

app.get('/basestation/date/:date', function (req, res) {

    var date = new Date(req.params.date);
    var startEnd = getTS(date);


    var data = {
        'data': {
            'start': startEnd[0] / 1000,
            'end': startEnd[1] / 1000
        }
    };

    res.render('base_station', data)

});

var server = app.listen(9111, 'localhost', function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Example app listen g at http://%s:%s', host, port);
});


// Utils
var getTS = function (date) {
    var start = new Date(date.getTime());
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    var startTS = start.getTime();

    var end = new Date(date.getTime());
    end.setHours(23);
    end.setMinutes(59);
    end.setSeconds(59);
    var endTS = end.getTime();

    return [startTS, endTS];
};

var getTS = function (start, end) {
    var start = new Date(start.getTime());
    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);
    var startTS = start.getTime();

    var end = new Date(end.getTime());
    end.setHours(23);
    end.setMinutes(59);
    end.setSeconds(59);
    var endTS = end.getTime();

    return [startTS, endTS];
};

Date.prototype.pattern = function (fmt) {
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours() % 12 == 0 ? 12 : this.getHours() % 12, //小时
        "H+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    var week = {
        "0": "/u65e5",
        "1": "/u4e00",
        "2": "/u4e8c",
        "3": "/u4e09",
        "4": "/u56db",
        "5": "/u4e94",
        "6": "/u516d"
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    if (/(E+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? "/u661f/u671f" : "/u5468") : "") + week[this.getDay() + ""]);
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
};

// DAO
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

var _AvfindAll = function (query) {
    return query.count().then(
        function (count) {
            var promises = [];
            var pages = Math.ceil(count / 1000);
            for (var i = 0; i <= pages; i++) {
                var _query = _.clone(query);
                _query.limit(1000);
                _query.skip(i * 1000);
                promises.push(_query.find());
            }
            return AV.Promise.all(promises);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function (results) {
            var rebuid_result = [];
            results.forEach(function (result_list) {
                result_list.forEach(function (list_item) {
                    rebuid_result.push(list_item);
                });
            });
            return AV.Promise.as(rebuid_result);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    );
};

var getMoUserLocation = function (uid, tsStart, tsEnd) {
    var where = {
        timestamp: {$gt: tsStart, $lt: tsEnd},
        user_id: uid
    };

    var query = UL.find(where).select({poiProbLv1: 0, poiProbLv2: 0});

    return moGetAll(query, 0, [])
};

var getMoUserEvent = function (uid, tsStart, tsEnd) {
    var where = {
        timestamp: {$gt: tsStart, $lt: tsEnd},
        user_id: uid
    };

    var query = UE.find(where);
    return moGetAll(query, 0, [])
};

var getAvUserEvent = function (uid, tsStart, tsEnd) {
    var UserEvent = AV.Object.extend("UserEvent");
    var query = new AV.Query(UserEvent);
    var user = AV.Object.createWithoutData("_User", uid);
    query.lessThan("end_datetime", new Date(tsEnd));
    query.greaterThan("start_datetime", new Date(tsStart));
    query.equalTo("user", user);
    return _AvfindAll(query)
};

var getAvHomeOfficeUtrace = function (uid) {
    var HomeOfficeUtrace = AV.Object.extend("HomeOfficeUtrace");
    var query = new AV.Query(HomeOfficeUtrace);
    var user = AV.Object.createWithoutData("_User", uid);
    query.equalTo("user", user);
    return _AvfindAll(query);
};

var getAvUserActivity = function (uid, tsStart, tsEnd) {
    var UserActivity = AV.Object.extend("UserActivity");
    var query = new AV.Query(UserActivity);

    query.lessThan("time_range_end", new Date(tsEnd));
    query.greaterThan("time_range_start", new Date(tsStart));
    query.equalTo("user_id", uid);
    return _AvfindAll(query)
};

var getAvHomeOfficeStatus = function (uid, tsStart, tsEnd) {
    var HomeOfficeStatus = AV.Object.extend("HomeOfficeStatus");
    var query = new AV.Query(HomeOfficeStatus);
    var user = AV.Object.createWithoutData("_User", uid);
    query.lessThan("expire", tsEnd);
    query.greaterThan("timestamp", tsStart);
    query.equalTo("user", user);
    return _AvfindAll(query);
};

var getMoHomeOfficeStatus = function (uid, tsStart, tsEnd) {
    var where = {
        timestamp: {$gt: tsStart},
        expire: {$lt: tsEnd},
        user_id: uid,
        algo_type: "offline"
    };

    var query = HO.find(where);

    return moGetAll(query, 0, []);
};

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

mongoose.connect('mongodb://senzhub:Senz2everyone@119.254.111.40/RefinedLog')

var MulSchema = new Schema({
    u_poi_id: String
});

var ULSchema = new Schema({
    'user_id': String
});

var HOSchema = new Schema({
    'user_id': String
});

var MUL = mongoose.model('MarkedUserLocation', MulSchema, 'MarkedUserLocation');
var UL = mongoose.model('UserLocation', ULSchema, 'UserLocation');
var UE = mongoose.model('UserEvent', ULSchema, 'UserEvent');
var HO = mongoose.model('HomeOfficeStatus', HOSchema, 'HomeOfficeStatus');

var moGetAll = function (query) {

    var limit = 100

    var result = []

    var _rec = function (query, skip) {
        return query.skip(skip).exec(function (e, d) {
            if (e) {
                console.log('get all fucked', e)
            } else {
                if (d.length == 0) {
                    return result
                } else {
                    result.push(d)
                    return _rec(query, skip + limit)
                }
            }
        })
    }

    return _rec(query, 0)
};

var getLog = function (installationId, startDateStr, endDateStr) {
    var installation = {
        __type: 'Pointer',
        className: '_Installation',
        objectId: installationId
    };
    var query = new AV.Query('Log');
    query.equalTo('installation', installation);
    query.greaterThanOrEqualTo('createdAt', new Date(startDateStr));
    query.lessThanOrEqualTo('createdAt', new Date(endDateStr));
    query.select('type', 'timestamp');
    _findAll(query).then(function (result) {
        // 转换数据
        var data = [];
        for (var i in result) {
            data.push({
                id: result[i].id,
                type: result[i].attributes.type,
                time: new Date(result[i].attributes.timestamp).pattern('yyyy-MM-dd hh:mm:ss')
            });
        }
        return AV.Promise.all(data);
    }).then(function (data) {
        var location = [];
        var sensor = [];
        var motion = [];
        var other = [];

        console.log('data[0]:' + data[0].time);

        // 清洗数据
        for (var i in data) {
            switch (data[i].type) {
                case 'location':
                    location.push(data[i]);
                    break;
                case 'sensor':
                    sensor.push(data[i]);
                    break;
                case 'motionLog':
                    motion.push(data[i]);
                    break;
                default :
                    other.push(data[i]);
            }
        }
        console.log('location.length:' + location.length);
        console.log('sensor.length:' + sensor.length);
        console.log('motion.length:' + motion.length);
        console.log('other.length:' + other.length);


    })
};

var _findAll = function (query) {
    return query.count().then(
        function (count) {
            var promises = [];
            var pages = Math.ceil(count / 1000);
            for (var i = 0; i <= pages; i++) {
                var _query = _.clone(query);
                _query.limit(1000);
                _query.skip(i * 1000);
                promises.push(_query.find());
            }
            return AV.Promise.all(promises);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    ).then(
        function (results) {
            var rebuid_result = [];
            results.forEach(function (result_list) {
                result_list.forEach(function (list_item) {
                    rebuid_result.push(list_item);
                });
            });
            return AV.Promise.as(rebuid_result);
        },
        function (error) {
            return AV.Promise.error(error);
        }
    );
};

function test() {
    console.log('test');
    getLog('5RSndlIk9gxpwndcdOXLLeUjGNzGCaKN', '2016-01-15 00:00:00', '2016-01-15 23:59:59');

    //var ts = 1452775368728;
    //console.log(new Date(ts).pattern('yyyy-MM-dd hh:mm:ss'));
}

test();