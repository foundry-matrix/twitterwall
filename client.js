
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


// _________*** Twitter Stream ***_________//
twitter.stream('statuses/filter', {track: '#makeasongbritish'},  function(stream){
    stream.on('data',regexFormatter);        //regexFormatter invoked automatically upon new tweet in stream. 
    stream.on('error', function(error) {
        console.log("error with the twitter stream");
    });
});


//_________*** MongoDB ***_________//

mongoose.connect('mongodb://gregaubs:gregaubs@ds052837.mongolab.com:52837/twitterwall');

var Schema = mongoose.Schema;

var tweetsSchema = new Schema({
      id: String,
      textBody: String,
      retweetCount: Number,
      originalTweeter: String,
      hashtag: String,
      timeCreated: Number,
      profileImageUrl: String,
      createdAt: String,
}); 

var TweetCollection = mongoose.model('TweetCollection', tweetsSchema);


//_________*** When a New Tweet Comes In ***_________//

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
    var hashtag = formatter[0];
    var timeCreated = tweet.timestamp_ms;
    var profileImageUrl  = tweet.user.profile_image_url_https;
    var createdAt = tweet.created_at;


    new_tweet = new TweetCollection({
        id: id,
        textBody: textBody,
        retweetCount: retweetCount,
        originalTweeter: originalTweeter,
        hashtag: hashtag,
        timeCreated: timeCreated,
        profileImageUrl : profileImageUrl,
        createdAt : createdAt,
    });

    new_tweet.save(function(err){
        console.log("saved new tweet " + id);
        if (err) {console.log(err)};
    });
}




//_________*** Fetching Tweets from the Database ***_________//

function serveTweets(response){
    TweetCollection.find({}, function(err,tweets){
      

        response.writeHead(200, {"Content-Type": "application/javascript"});
        response.end(JSON.stringify(tweets));
        console.log("response sent");

    });
}


exports.serveTweets = serveTweets;







