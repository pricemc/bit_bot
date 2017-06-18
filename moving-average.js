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


        var previous;
        var previousValue;
        var ret = {};
        var previousTime;


        ret.push =
            function push(time, value, interval) {
                if (!previous) ma = value;
                previous = ma;

                var a = (2 / (timespan / interval + 1));
                //ma = ((value - previous) * a) + previous;
                if (time > previousTime) ma = value * a + (1 - a) * previous;
                //console.log(ma);
                previousTime = time;
            };


        // Exponential Moving Average

        ret.movingAverage =
            function movingAverage() {
                return ma;
            };

        return ret;

    };
