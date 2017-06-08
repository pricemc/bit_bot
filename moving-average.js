var exp = Math.exp;
var pow = Math.pow;
var E = Math.E;

function squared(n) {
    return Math.pow(n, 2);
}

exports =
    module.exports =
    function MovingAverage(timespan) {
        if (typeof timespan != 'number')
            throw new Error('must provide a timespan to the moving average constructor');

        if (timespan <= 0)
            throw new Error('must provide a timespan > 0 to the moving average constructor');

        var ma; // moving average
        var intervalMA;
        var interval = false;


        var previousTime;
        var ret = {};


        ret.push =
            function push(time, value, interval) {
                if (previousTime) {

                    var a = (2 / ((timespan / 1000 / 60 / interval) + 1));
                    ma = (value - ma) * a + ma;
                    if (new Date(time).getMinutes() % interval == 0) {
                        intervalMA = ma;
                    }
                    
                    //console.log((value - intervalMA) * a);

                    //console.log(isFinite(ma));


                } else {
                    ma = value;
                    intervalMA = 0;
                    //console.log(intervalMA);
                }
                previousTime = time;
            };


        // Exponential Moving Average

        ret.movingAverage =
            function movingAverage() {
                return ma;
            };

        return ret;

    };