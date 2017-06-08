var schedule = require('node-schedule');
var KrakenClient = require('kraken-api');
var api_key = 'JDlNj5hdQHQtN/gqZAK5rgi8YEy1wnd834/0wj0YXr+xGaMzT1KDEcaF';
var private_key = 'SipBiPsXAGayhfHr8bQJ8Thfr4YeaEcnfVtDV41zdBmWNMxNsYFjtIauMxBS+99XdxHY/TtqzxEWdatIJQ0Yxw==';
var kraken = new KrakenClient(api_key, private_key);
var ProgressBar = require('progress');

var admin = require('firebase-admin');
var serviceAccount = require("./admin_config.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://bitcoin-kraken.firebaseio.com"
});
var minute = 60 * 1000;
var justStartedWait = 15 * 26;
var minutes = 15;
var longTime = minutes * 26 * minute;
var shortTime = minutes * 12 * minute;
var signalTime = minutes * 9 * minute;
var MA = require('./moving-average');
var lt = MA(longTime);
var st = MA(shortTime);
var sigT = MA(signalTime);

var order = -1;
var justStartedWait = 60;
var justStarted = false;

var db = admin.database();
var ref = db.ref("kraken");
var OHLCRef = ref.child("OHLC");
var kraken_rule = {
    pair: 'XBTUSD'
};
ref.child("since").on("value", function (data) {
    kraken_rule.since = data.val();
});

ref.child("data").once("value", function (data) {
    console.log("Count Started");
    var length = Object.keys(data.val()).length;
    var total = {
        total: 0
    };
    var bar = new ProgressBar('[:bar] :current/:total :elapseds ETA::etas', {
        total: length,
        width: 20
    });
    ref.update({
        data_size: length
    });
    //console.log(data.val());
    for (var key in data.val()) {
        bar.tick();
        bar.render();
        var dateKey = new Date(key * 1000);
        if(dateKey.getMinutes() % minutes == 0)
        {
            lt.push(formatDateTime(key), data.val()[key], minutes);
            st.push(formatDateTime(key), data.val()[key], minutes);
            sigT.push(formatDateTime(key), st.movingAverage() - lt.movingAverage(), minutes);
        }
        // console.log("Time: " + formatDateTime(key));
        // console.log("MACD: " + (st.movingAverage()-lt.movingAverage()));
        // console.log("Signal: " + sigT.movingAverage());
        // console.log("Histogram: " + ((st.movingAverage()-lt.movingAverage())-sigT.movingAverage()))
        // console.log("Close: " + data.val()[key]);
        // console.log();
        if (bar.complete) {
            console.log('\ncomplete\n');
        }
    }
})
kraken.api('OHLC', kraken_rule, function (error, data) {
    if (error) {
        console.log("OHLC Once")
        console.log(error);
    } else {
        //console.log(data.result);
        //add to database
        console.log("OHLC Started");
        addToDatabase(data.result.XXBTZUSD);
        ref.update({
            since: data.result.last
        });
    }
});
// ref.child("since").once("value", function(data) {
//   console.log("Started");
//     //kraken_rule.since = data.val();

//     }
//   });
// });


function formatDateTime(input) {
    return input * 1000;
};

function formatDateTime2(input) {
    var date = new Date(input * 1000).toTimeString().split(' ')[0].split(':');
    return date[0] + ":" + date[1];
    return input * 1000;
};



var rule = new schedule.RecurrenceRule();
var last_rule = false;
var last_close = 0;
var new_data = 0;
rule.second = 5;
//ref.child("since").set(null);
//ref.child("data").set(null);
var scheduled_func = schedule.scheduleJob(rule, function () {
    if(justStartedWait != 0) justStartedWait--;
    else justStarted = false;
    kraken.api('OHLC', kraken_rule, function (error, data) {
        if (error) {
            console.log("OHLC Scheduled")
            console.log(error);
        } else {
            new_data = data.result.XXBTZUSD[data.result.XXBTZUSD.length - 1];

            //console.log("The time is " + formatDateTime(new_data[0]) + " at interval 1");
            //console.log("New close is " + new_data[4] + " and is " + ((new_data[4]-last_close)/last_close).toPrecision(4) + "%");
            //console.log(data.result);
            //display(new_data[0], new_data[4]);
            //moving average
            lt.push(formatDateTime(new_data[0]), new_data[4], minutes);
            st.push(formatDateTime(new_data[0]), new_data[4], minutes);
            var MACD = st.movingAverage() - lt.movingAverage();
            sigT.push(formatDateTime(new_data[0]), MACD, minutes);
            var hist = MACD - sigT.movingAverage();
            //calculateLongOrderVolume();
            //check buy or sell
            var buySell = checkOrder(MACD, hist);
            if (buySell == 1) console.log("LONG");
            else if (buySell == 2) console.log("SHORT");
            else if (buySell == -2) console.log("CLOSE");
            if (!(buySell == 0 || buySell == -1)) display(new_data[0], new_data[4]);
            else display2(new_data[0], new_data[4]);
            //switch buy or sell or close

            //add to database
            addToDatabase(data.result.XXBTZUSD);
            ref.update({
                since: data.result.last
            });


        }
    });
});

var display = function (time, close) {

    console.log("Time: " + formatDateTime2(time));
    console.log("26 Day: " + lt.movingAverage() + " 12 Day: " + st.movingAverage());
    console.log("MACD: " + (st.movingAverage() - lt.movingAverage()));
    console.log("Signal: " + sigT.movingAverage());
    console.log("Histogram: " + ((st.movingAverage() - lt.movingAverage()) - sigT.movingAverage()))
    console.log("Close: " + close + " and is " + ((close - last_close) / last_close).toPrecision(4) + "% with last close at " + last_close);
    console.log();
    last_close = close;
}
var display2 = function (time, close) {

    console.log(formatDateTime2(time) + " MACD: " +
        (st.movingAverage() - lt.movingAverage()).toPrecision(4) +
        "\tSignal: " + sigT.movingAverage().toPrecision(4) +
        "\tHistogram: " + ((st.movingAverage() - lt.movingAverage()) - sigT.movingAverage()).toPrecision(4) +
        "\tClose: " + close);
}

var addToDatabase = function (data) {
        //for loop
        for (var i = 0; i < data.length; i++) {
            var time = {};
            time[data[i][0]] = data[i][4];
            ref.child("data").update(time);
            ref.child("data_size").once("value", function (data) {
                ref.update({
                    data_size: data.val() + 1
                });
            });
        }
    }
    //0 no order, -1 hold, 1 long, 2 short, -2 close
var checkOrder = function (MACD, hist) {
    //if histo is positive and MACD is positive, and there is no order, buy
    if (hist > 0.05 && MACD > 0.05 && order == -1 && !justStarted) {
        order = 0;
        return 1;
    }
    //else if histo is neg and MACD is neg and there is no order, short
    else if (hist < -0.05 && MACD < -0.05 && order == -1 && !justStarted) {
        order = 1;
        return 2;
    }
    //else if any of above and there is an order, stay
    else if ((((hist > 0 && MACD > 0) || (hist < 0 && MACD < 0) || MACD > 1 || MACD < -1) && order != -1 && !justStarted)) {
        return -1;
    } else if (order == -1)
        return 0;
    //else close order
    else {
        justStarted = false;
        order = -1;
        return -2;
    }

}

var longOrder = function (balance, currency, cost) {
    var longOrderRule = {pair: "XBTUSD", 
                         type: "buy",
                        ordertype: "market",
                        leverage: 2};
    var volume = calculateLongOrderVolume();
    longOrderRule.volume = volume;
    kraken.api('AddOrder', longOrderRule, function (error, data) {
        
    })
}

var calculateLongOrderVolume = function() {
    //get balance
    kraken.api('Balance', null, function(error, data) {
        if(error){
            console.log("TradeBalance");
            console.log(error);
        }else{
            console.log(data);
            console.log(data.USD);
        }
    })
    //get price
    //return balance/price
}

var shortOrder = function (balance, currency, cost) {

}

var closeLongOrder = function () {
    var longOrderRule = {pair: "XBTUSD", 
                         type: sell,
                        ordertype: market,
                        leverage: 2,
                        volume: 0};
    kraken.api('AddOrder', longOrderRule, function (error, data) {
        
    })
}

var closeShortOrder = function () {

}