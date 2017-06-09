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
                if (previous && time > previousTime) {

//                    var a = (2 / (timespan + 1)) * interval;
//                    ma = (value - previous) * a + previous;
//                    console.log(value);
//                    console.log(previous);
//                    console.log(value-previous);
//                    console.log(ma);
//                    previous = ma;
                    var a = (2/ (timespan + 1)) * interval;
                    ma = a * previousValue + (1-a) *previous;
                    previousValue = value;
                    previous = ma;
                    previousTime = time;
                } else if (!previous) {
                    previous = value;
                    previousTime = time;
                }
            };


        // Exponential Moving Average

        ret.movingAverage =
            function movingAverage() {
                return ma;
            };

        return ret;

    };