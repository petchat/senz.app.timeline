// 在 Cloud code 里初始化 Express 框架
var express = require('express');
var _ = require("underscore");
var app = express();
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var AV = require('avoscloud-sdk');
var timelineId = 'pin72fr1iaxb7sus6newp250a4pl2n5i36032ubrck4bej81';
var timelineKey = 'qs4o5iiywp86eznvok4tmhul360jczk7y67qj0ywbcq35iia';
AV.initialize(timelineId, timelineKey);

app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

var mapHtml = 'cloud/views/new_map.ejs';

// 使用 Express 路由 API 服务 /hello 的 HTTP GET 请求
app.get('/hello', function (req, res) {
    res.json({hello:'ok'});
});

app.get('/uid/:uid/date/:datestr/show_evidence/:show_evidence/convert/:convert', function (req, res) {

    var date = new Date(req.params.datestr);
    var startEnd = tsStartEnd(date);
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

            res.render('new_map', data)
        })
});


app.get('/trace/uid/:uid', function(req, res){
    var uid = req.params.uid;
    return getAvHomeOfficeUtrace(uid)
        .then(function(results) {
            var level = {"best": 1, "good": 2, "ok": 3};
            var label_level_ho = 5, trace_ho = null, home_ho=null, office_ho=null;
            var label_level_oh = 5,trace_oh = null, home_oh = null, office_oh = null;
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
                    'handed_label_ho': label_level_ho == 1 ? "best": label_level_ho == 2
                        ? "good" : label_level_ho == 3 ? "ok" : "other",
                    'handed_label_oh': label_level_oh == 1 ? "best": label_level_oh == 2
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
    var startEnd = tsStartEnd(date);


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


// DAO
var tsStartEnd = function (date) {
    var start = new Date(date.getTime());

    start.setHours(0);
    start.setMinutes(0);
    start.setSeconds(0);

    var tsStart = start.getTime();

//        var end = _.clone(date)
    var end = new Date(date.getTime());
    end.setHours(23);
    end.setMinutes(59);
    end.setSeconds(59);

    var tsEnd = end.getTime();

    return [tsStart, tsEnd]
};

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

var getAvHomeOfficeUtrace = function(uid){
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

var getMoHomeOfficeStatus = function(uid, tsStart, tsEnd){
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
