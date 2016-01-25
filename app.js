// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var bodyParser = require("body-parser");
var _ = require("underscore");
var app = express();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var requestPromise = require('request-promise');

var AV = require('avoscloud-sdk');
var timelineId = 'pin72fr1iaxb7sus6newp250a4pl2n5i36032ubrck4bej81';
var timelineKey = 'qs4o5iiywp86eznvok4tmhul360jczk7y67qj0ywbcq35iia';
AV.initialize(timelineId, timelineKey);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({extended: false}));

var mapHtml = 'cloud/views/new_map.ejs';

// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function (req, res) {
    var result = {
        Time: new Date().pattern('yyyy-MM-dd HH:mm;ss')
    };
    res.json(result);
});

app.get('/index', function (req, res) {
    var data = {
        date: new Date().pattern('yyyy-MM-dd'),
        datas: [{
            name: '张亨洋',
            userId: '569ccda100b04bbf1ee10b4a',
            installationId: 'RlX6tbryE7tj58NFo8b7mLpbCQjg27EK'
        }, {
            name: '冯小平',
            userId: '5684fa9e00b009a31af7efcb',
            installationId: 'aoXQRUGjNb25HyG8J3wfIB9APjWp6mOe'
        }, {
            name: '涂腾飞',
            userId: '568a0ca200b01b9f2c08f53d',
            installationId: 'ynnAdkuvdolGEsxhUYIpyL70nJGVDX7b'
        }, {
            name: '刘九思',
            userId: '5684d18200b068a2a955aefc',
            installationId: 'ntK466fF6qCfJeYLwGYJ8od5L8n1gwXD'
        }, {
            name: '郭志毅',
            userId: '5624d68460b2b199f7628914',
            installationId: 'clCdNs1Yd9B0o8oGkkro3s9N1kTpxBVf'
        }, {
            name: '杨蕊',
            userId: '5604e5ce60b2521fb8eb240a',
            installationId: 'K36siTgM8StOW3W5YXguFa2GK2X6kMMx'
        }, {
            name: '徐以彬',
            userId: '56406b4a00b0ee7f57b5c3a3',
            installationId: 'CpMjyBI2oGAjJDfQiehPnzDchlmAWxzA'
        }, {
            name: '贾晨宇',
            userId: '5689cd6d60b2e57ba2c05e4c',
            installationId: 'FXiPOQjv2stL1FAuDieWmSwjlanVEGmf'
        }, {
            name: '张弓',
            userId: '564575ac60b20fc9b99d8d9d',
            installationId: '4Y5KKBtB7TuPrAiQd14xE1EarhJu0EQ0'
        }, {
            name: '贺佳玮',
            userId: '558a5ee7e4b0acec6b941e96',
            installationId: 'sFlPo3d40EXFvQ4sBiqMQ2sPJwf0XnbU'
        }, {
            name: '刘丽',
            userId: '55f788f4ddb25bb7713125ef',
            installationId: 'lq1V2vWODJMDOoplWPHMH3HLFJuJW6kL'
        }, {
            name: '张子帅',
            userId: '55c1e2d900b0ee7fd66e8ea3',
            installationId: 'ipAujsbPwifG5EMPcec9gCXeVSFyp2EN'
        }, {
            name: '李轲',
            userId: '5653c88e00b0e772838cd61b',
            installationId: 'k5luekqGhj9JUYnG7jIJRIPL5tNn0czA'
        }, {
            name: '豆豆',
            userId: '5682580d00b0f9a1f22748c7',
            installationId: 'yKJpjUD6ouU8oUnX3Sq8BO03AWrW4QQy'
        }, {
            name: '梦欣',
            userId: '5684d3d660b2b60f65d84285',
            installationId: 'h8CQnD4g3VtojKIdymYEcRAIMidOH6wG'
        }]
    };
    res.render('index', data);
});

app.get('/query', function (req, res) {
    // 获取参数
    var date = req.query.date;
    var installationId = req.query.installationId;
    var userId = req.query.userId;
    // 处理参数
    startTS = new Date(date + ' 00:00:00').getTime();
    endTS = new Date(date + ' 00:00:00').DateAdd('d', 1).getTime();

    console.log('startTS:' + startTS + '|endTS:' + endTS);
    console.log('installationId:' + installationId + '|userId:' + userId);

    getTotalData(installationId, userId, startTS, endTS, function (data) {
        console.log(data);
        res.json(data);
    });
});

app.get('/detail/:detail', function (req, res) {
    // 获取参数
    var detail = req.params.detail;
    var date = req.query.date;
    var installationId = req.query.installationId;
    var userId = req.query.userId;
    // 处理参数
    startTS = new Date(date + ' 00:00:00').getTime();
    endTS = new Date(date + ' 00:00:00').DateAdd('d', 1).getTime();

    var data = {
        userId: userId,
        installationId: installationId,
        datas: []
    };
    switch (detail) {
        case 'userEventDetail':
            getUserEventDetails(userId, startTS, endTS)
                .then(function (result) {
                    console.log('count:' + result.length);
                    result.forEach(function (d) {
                        var d0 = JSON.parse(JSON.stringify(d));
                        data.datas.push({
                            id: d0._id,
                            startTime: new Date(d0.startTime).pattern('yyyy-MM-dd HH:mm:ss'),
                            timestamp: new Date(d0.timestamp).pattern('yyyy-MM-dd HH:mm:ss'),
                            data_quality: d0.data_quality,
                            event: d0.event,
                            level2_event: d0.level2_event,
                        });
                    });
                    //console.log(data);
                    res.render(detail, data);
                });
            break;
        case 'userLocationDetail':
            // 请求数据
            getUserLocationDetails(userId, startTS, endTS)
                .then(function (result) {
                    console.log('count:' + result.length);
                    result.forEach(function (d) {
                        var d0 = JSON.parse(JSON.stringify(d));
                        data.datas.push({
                            id: d0._id,
                            timestamp: new Date(d0.timestamp).pattern('yyyy-MM-dd HH:mm:ss'),
                            recent_poi_title: d0.pois.pois[0].title,
                            location: d0.location
                        });
                    });
                    //console.log(data);
                    res.render(detail, data);
                });
            break;
        case 'homeOfficeStatusDetail':
            // 请求数据
            getHomeOfficeStatusDetails(userId, startTS, endTS)
                .then(function (result) {
                    console.log('count:' + result.length);
                    var query = [];
                    result.forEach(function (d) {
                        var d0 = JSON.parse(JSON.stringify(d));
                        data.datas.push({
                            ul_id: d0.user_location_id,
                            created_time: new Date(d0.createdTs).pattern('yyyy-MM-dd HH:mm:ss'),
                            timestamp: d0.timestamp,
                            timestamp_time: new Date(d0.timestamp).pattern('yyyy-MM-dd HH:mm:ss'),
                            status: d0.status,
                            diff: (d0.createdTs - d0.timestamp)
                        });
                        query.push(getUserLocationDetailsById(d0.user_location_id));
                    });
                    AV.Promise.all(query).then(function (result1) {
                        for (var i = 0; i < result1.length; i++) {
                            data.datas[i].ul_timestamp = result1[i][0].get('timestamp');
                            data.datas[i].ul_created_time = new Date(result1[i][0].get('createdTs')).pattern('yyyy-MM-dd HH:mm:ss');
                        }
                        res.render(detail, data);
                    })
                });
            break;
    }
});

app.get('/uid/:uid/date/:datestr/show_evidence/:show_evidence/convert/:convert', function (req, res) {

    console.log(req.params.datestr);
    var date = new Date(req.params.datestr);
    var startEnd = getTS(date);
    var tsStart = startEnd[0];
    var tsEnd = startEnd[1];
    var uid = req.params.uid;
    var showEvidence = req.params.show_evidence == 'true';
    var convert = req.params.convert == 'true';

    var promises = [];
    promises.push(getMoUserLocation(uid, tsStart, tsEnd));
    promises.push(getMoUserEvent(uid, tsStart, tsEnd));
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

var server = app.listen(9111, '0.0.0.0', function () {

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

Date.prototype.DateAdd = function (strInterval, Number) {
    var dtTmp = this;
    switch (strInterval) {
        case 's' :
            return new Date(Date.parse(dtTmp) + (1000 * Number));
        case 'n' :
            return new Date(Date.parse(dtTmp) + (60000 * Number));
        case 'h' :
            return new Date(Date.parse(dtTmp) + (3600000 * Number));
        case 'd' :
            return new Date(Date.parse(dtTmp) + (86400000 * Number));
        case 'w' :
            return new Date(Date.parse(dtTmp) + ((86400000 * 7) * Number));
        case 'q' :
            return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + Number * 3, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
        case 'm' :
            return new Date(dtTmp.getFullYear(), (dtTmp.getMonth()) + Number, dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
        case 'y' :
            return new Date((dtTmp.getFullYear() + Number), dtTmp.getMonth(), dtTmp.getDate(), dtTmp.getHours(), dtTmp.getMinutes(), dtTmp.getSeconds());
    }
}

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

var _AvFindAll = function (query) {
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
        start_datetime: {$gte: new Date(tsStart)},
        end_datetime: {$lte: new Date(tsEnd)},
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
    return _AvFindAll(query)
};

var getAvHomeOfficeUtrace = function (uid) {
    var HomeOfficeUtrace = AV.Object.extend("HomeOfficeUtrace");
    var query = new AV.Query(HomeOfficeUtrace);
    var user = AV.Object.createWithoutData("_User", uid);
    query.equalTo("user", user);
    return _AvFindAll(query);
};

var getAvUserActivity = function (uid, tsStart, tsEnd) {
    var UserActivity = AV.Object.extend("UserActivity");
    var query = new AV.Query(UserActivity);

    query.lessThan("time_range_end", new Date(tsEnd));
    query.greaterThan("time_range_start", new Date(tsStart));
    query.equalTo("user_id", uid);
    return _AvFindAll(query)
};

var getAvHomeOfficeStatus = function (uid, tsStart, tsEnd) {
    var HomeOfficeStatus = AV.Object.extend("HomeOfficeStatus");
    var query = new AV.Query(HomeOfficeStatus);
    var user = AV.Object.createWithoutData("_User", uid);
    query.lessThan("expire", tsEnd);
    query.greaterThan("timestamp", tsStart);
    query.equalTo("user", user);
    return _AvFindAll(query);
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

var getTotalData = function (installationId, userId, startTS, endTS, callback) {
    // query arrays
    var queryLocationFunctionArray = [];
    var queryMotionFunctionArray = [];
    var queryEventFunctionArray = [];
    var queryHomeOfficeFunctionArray = [];
    // flag
    var logFlag = false;
    var userLocationFlag = false;
    var userMotionFlag = false;
    var userEventFlag = false;
    var homeOfficeStatusFlag = false;
    // result
    var resultData = {
        category: ['location', 'sensor', 'motion', 'other'],
        xAxis: [],
        location: [],
        sensor: [],
        motion: [],
        other: [],
        userLocation: [],
        userMotion: [],
        userEvent: [],
        homeOfficeStatus: []
    };
    // timeline赋值
    for (var i = 0; i <= 23; i++) {
        resultData.xAxis.push(i);
        resultData.location.push(0);
        resultData.sensor.push(0);
        resultData.motion.push(0);
        resultData.other.push(0);
    }

    if (installationId != '') {
        // 请求leancloud数据
        getLog(installationId, startTS, endTS, function (result) {
            // 时间切分
            for (var i = 0; i < result.location.length; i++) {
                var hour = new Date(result.location[i].timestamp).getHours();
                resultData.location[hour]++;
            }
            for (var i = 0; i < result.sensor.length; i++) {
                var hour = new Date(result.sensor[i].timestamp).getHours();
                resultData.sensor[hour]++;
            }
            for (var i = 0; i < result.motion.length; i++) {
                var hour = new Date(result.motion[i].timestamp).getHours();
                resultData.motion[hour]++;
            }
            for (var i = 0; i < result.other.length; i++) {
                var hour = new Date(result.other[i].timestamp).getHours();
                resultData.other[hour]++;
            }
            logFlag = true;
            check();
        });
    } else {
        logFlag = true;
        check();
    }

    if (userId != '') {
        for (var i = 0; i < (endTS - startTS) / 3600000; i++) {
            var oneHour = 3600000;
            queryLocationFunctionArray[i] = getUserLocationCountPerHour(userId, startTS + i * oneHour, startTS + (i + 1) * oneHour);
            queryMotionFunctionArray[i] = getUserMotionCountPerHour(userId, startTS + i * oneHour, startTS + (i + 1) * oneHour);
            queryEventFunctionArray[i] = getUserEventCountPerHour(userId, startTS + i * oneHour, startTS + (i + 1) * oneHour);
            queryHomeOfficeFunctionArray[i] = getHomeOfficeStatusCountPerHour(userId, startTS + i * oneHour, startTS + (i + 1) * oneHour);
        }

        AV.Promise.all(queryLocationFunctionArray).then(function (data) {
            data.forEach(function (d) {
                resultData.userLocation.push(JSON.parse(d).count);
            });
            userLocationFlag = true;
            check();
        });

        AV.Promise.all(queryMotionFunctionArray).then(function (data) {
            data.forEach(function (d) {
                resultData.userMotion.push(JSON.parse(d).count);
            });
            userMotionFlag = true;
            check();
        });

        AV.Promise.all(queryEventFunctionArray).then(function (data) {
            data.forEach(function (d) {
                resultData.userEvent.push(JSON.parse(d).count);
            });
            userEventFlag = true;
            check();
        });

        AV.Promise.all(queryHomeOfficeFunctionArray).then(function (data) {
            data.forEach(function (d) {
                resultData.homeOfficeStatus.push(JSON.parse(d).count);
            });
            homeOfficeStatusFlag = true;
            check();
        });

    } else {
        userLocationFlag = userMotionFlag = userEventFlag = true;
        check();
    }

    function check() {
        if (userLocationFlag && userMotionFlag && logFlag && userEventFlag && homeOfficeStatusFlag) {
            callback(resultData);
        }
    }
}

var getLog = function (installationId, startTS, endTS, callback) {
    var installation = {
        __type: 'Pointer',
        className: '_Installation',
        objectId: installationId
    };
    var query = new AV.Query('Log');
    query.equalTo('installation', installation);
    query.greaterThanOrEqualTo('timestamp', startTS);
    query.lessThan('timestamp', endTS);
    query.select('type', 'timestamp');
    _AvFindAll(query).then(function (result) {
        // 转换数据
        var data = [];
        for (var i in result) {
            data.push({
                id: result[i].id,
                type: result[i].attributes.type,
                timestamp: result[i].attributes.timestamp
            });
        }
        return AV.Promise.all(data);
    }).then(function (data) {
            var location = [];
            var sensor = [];
            var motion = [];
            var other = [];
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
            // 回调
            callback({
                category: ['location', 'sensor', 'motion', 'other'],
                location: location,
                sensor: sensor,
                motion: motion,
                other: other
            });
        }
    )
};

var getUserLocationCountPerHour = function (userId, startTS, endTS) {
    var url = 'http://api.trysenz.com/RefinedLog/api/UserLocations/count?' +
        'where[user_id]=' + userId + '&where[and][0][timestamp][gt]=' + startTS + '&where[and][1][timestamp][lt]=' + endTS;

    return requestPromise(url);
}

var getUserMotionCountPerHour = function (userId, startTS, endTS) {
    var url = 'http://api.trysenz.com/RefinedLog/api/UserMotions/count?' +
        'where[user_id]=' + userId + '&where[and][0][timestamp][gt]=' + startTS + '&where[and][1][timestamp][lt]=' + endTS;

    return requestPromise(url);
}

var getUserEventCountPerHour = function (userId, startTS, endTS) {
    var url = 'http://api.trysenz.com/RefinedLog/api/UserEvents/count?' +
        'where[user_id]=' + userId + '&where[and][0][timestamp][gt]=' + startTS + '&where[and][1][timestamp][lt]=' + endTS;

    return requestPromise(url);
}

var getHomeOfficeStatusCountPerHour = function (userId, startTS, endTS) {
    var url = 'http://api.trysenz.com/RefinedLog/api/HomeOfficeStatuses/count?' +
        'where[user_id]=' + userId + '&where[and][0][timestamp][gt]=' + startTS + '&where[and][1][timestamp][lt]=' + endTS;

    return requestPromise(url);
}

var getUserLocationDetails = function (userId, startTS, endTS) {
    var where = {
        timestamp: {$gte: startTS, $lt: endTS},
        user_id: userId
    };
    console.log(where);

    //var query = UL.find(where).select({poiProbLv1: 0, poiProbLv2: 0});
    var query = UL.find(where);

    return moGetAll(query, 0, []);
};

var getUserEventDetails = function (userId, startTS, endTS) {
    var where = {
        timestamp: {$gte: startTS, $lt: endTS},
        user_id: userId
    };
    console.log(where);

    var query = UE.find(where);

    return moGetAll(query, 0, []);
};

var getHomeOfficeStatusDetails = function (userId, startTS, endTS) {
    var where = {
        timestamp: {$gte: startTS, $lt: endTS},
        user_id: userId
    };
    console.log(where);

    var query = HO.find(where).populate('location');

    return moGetAll(query, 0, []);
};
var getUserLocationDetailsById = function (id) {
    var where = {
        _id: id
    };

    var query = UL.find(where);

    return moGetAll(query, 0, []);
};

function test() {
    console.log('test');

    var userId = '5689cf3700b09aa2fdd88d3b';
    var installationId = 'p95f3qTptXDhs2W9USx1MTi7Cc9N6zbW';
    var startTS = 1453651200000;
    var endTS = 1453737600000;

}

//test();