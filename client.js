
var fs = require("fs");
var Twitter = require('twitter');
var mongoose = require('mongoose');
var util = require('util');

var twitter = new Twitter({
  consumer_key: "DXOdJmAOCaGNWYExSEnUl4gUH",
  consumer_secret: "vl2qjRONh8N6jkU9ZLxyP7bDxFdmyHlClYxC7prcP9j1empEbE",
  access_token_key: "31862927-9sYkrlidwy0BAEcw44bVXCb0D8XDjnwZBzTYTTSBG",
  access_token_secret: "b7bzvCEA63xYD4w3P1XN5YaEd3wxhDzmbPn8kwSETVaH2"
});


//_________*** Twitter Stream ***_________//
twitter.stream('statuses/filter', {track: '@discofingers #stop, @discofingers #go, @discofingers #continue'},  function(stream){
    stream.on('data',retweetSorter);        //retweetSorter invoked automatically upon new tweet in stream. 
    stream.on('error', function(error) {
        console.log(error);
    });
});


//_________*** MongoDB ***_________//

mongoose.connect('mongodb://foundrymatrix:foundrymatrix@ds048537.mongolab.com:48537/stopgocontinue');

var Schema = mongoose.Schema;

var tweetsSchema = new Schema({
      id: String,
      textBody: String,
      retweetCount: Number,
      originalTweeter: String,
      hashtag: String,
      timeCreated: Number,
}); 

var TweetCollection = mongoose.model('TweetCollection', tweetsSchema);


//_________*** Deciding whether a new tweet (suggestion) or retweet (vote) ***_________//

function retweetSorter(tweet) {
    if(tweet.retweeted_status == undefined){   //i.e. is a new tweet
        regexFormatter(tweet);
    }
    else {                                      // i.e. is a vote
        fetchRT(tweet);
     };
};


//_________*** If New Tweet ***_________//

function regexFormatter (tweet){
    var tweetText = tweet.text;
    var regex = /\S*#(?:\[[^\]]+\]|\S+)/g;
    var formatter = regex.exec(tweetText);
    suggestionCreate(tweet,formatter)
};



function suggestionCreate(tweet,formatter){
    var textBody = tweet.text;
    var id = tweet.id;
    var retweetCount = 0;
    var originalTweeter = tweet.user.name;
    var voters = [];
    var hashtag = formatter[0];
    var timeCreated = tweet.timestamp_ms;
    var idNumber = tweet.id;


    new_tweet = new TweetCollection({
        id: id,
        textBody: textBody,
        retweetCount: retweetCount,
        originalTweeter: originalTweeter,
        hashtag: hashtag,
        timeCreated: timeCreated
    });

    new_tweet.save(function(err){
        console.log("saved new tweet " + id);
        if (err) {console.log(err)};
    });
}


//_________*** If Retweet ***_________//

function fetchRT(tweet) {
    var id = tweet.retweeted_status.id;
    var rt_count = tweet.retweeted_status.retweet_count;
    updateInfo(id,rt_count);
    console.log("tweet " + id + " has been updated with a count of " + rt_count);
}


function updateInfo(id,rt_count){
    TweetCollection.findOneAndUpdate({ id: id}, {$set: {retweetCount:rt_count } } ,function(err){
      if(err){console.log(err)};
    });
}


//_________*** Fetching Tweets from the Database ***_________//

function serveTweets(response){
    TweetCollection.find({}, function(err,tweets){
      
        var stopGroup = [];
        var goGroup = [];
        var continueGroup = [];

        tweets.forEach(function(tweet){
            if (tweet.hashtag=='#stop') {
                stopGroup.push(tweet);
            } else if (tweet.hashtag=='#go') {
                goGroup.push(tweet);
            } else if (tweet.hashtag=='#continue') {
                continueGroup.push(tweet);
            } else {
                throw "Error - hashtag isn't stop go or continue";
            }
        });

        var storedTweets = {
            stop : stopGroup,
            go : goGroup,
            cont: continueGroup
        }

        response.writeHead(200, {"Content-Type": "application/javascript"});
        response.end(JSON.stringify(storedTweets));
        console.log("response sent");

    });
}


exports.serveTweets = serveTweets;







