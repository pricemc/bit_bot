var twit = require('twit');
var config = require('./config.js');
var sentiment = require('sentiment');
var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

var Twitter = new twit(config);
var num = 0;
var sentimentNum = 0;
var seconds = 60;
var start = ops = frequency = 0
var sentimentArr = [];
var tracking = ['bitcoin'];
var public_html = __dirname + "/public_html";

server.listen(80);

app.get('/', function(req,res) {
	res.sendFile(public_html + '/index.html');
})

io.on('connection', function (socket) {
  socket.on('connected', function (data) {
  	console.log("Starting")
    stream.on('tweet', function (tweet) {
  //sentimentNum += sentiment(tweet.text).score;
  //num++;
  sentimentArr.push(sentiment(tweet.text).score);
  while(sentimentArr.length > frequency) sentimentArr.shift();
  sentimentNum = 0;
  onOp();
  for (var i = sentimentArr.length - 1; i >= 0; i--) {
  	sentimentNum += sentimentArr[i] * (i/sentimentArr.length);
  }
  //console.dir(tweet);
  console.log(sentimentArr[sentimentArr.length-1]+ "\t" + sentimentNum/frequency + "\t" + tweet.text);
});
  });
});

var stream = Twitter.stream('statuses/filter', {track: tracking});



onOp = function() {
    if (!start) {
    	start = new Date
    	ops = 0;
    }
    frequency = ++ops / (new Date - start) * 1000 * seconds
}