/*The MIT License (MIT)

Copyright (c) 2015 Felix Epp

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.*/

//Get iTunes
var app = Application('iTunes');
app.includeStandardAdditions = true;
//app.activate();

//Change this to true for debugging through Notification System instead of console output
var internal = false; //Not working, because internally only applet is working and this again throws a violation error
var debug = function(msg){
  if(internal) {
    app.displayNotification(msg);
  }
  else {
    console.log(msg);
  }
}

/**
 * Create a LastFm API Request from a set of options
 */
var api = 'd90f32372891a7ba621058cafe2b467a'; //Please be responsible with my api key, if you try something new request your own
var user = '' //hard set your username
var cApp;

var sendRequest = function(options){
  var url = "http://ws.audioscrobbler.com/2.0/";
  var i = 0;
  for (var k in options) {
    if (options.hasOwnProperty(k)) {
       url += (i ? "&" : "?") + k + "=" + options[k];
       i++;
    }
  }

  if (cApp === undefined) {
    var cApp = Application.currentApplication();
    cApp.includeStandardAdditions = true;
  }
  console.log(url);
  return JSON.parse(cApp.doShellScript("curl \"" + encodeURI(url) + "\""));
}

/**
 * Main Loop
 */
var sel = app.selection();
if (!sel.length) {
  app.displayAlert('No tracks selected!');
}
else {

  //Ask for user and check if exists
  if (user === '') {
    user = app.displayDialog('What is your LastFM username ?', { defaultAnswer: '', withTitle: 'LastFm Username' }).textReturned;
  }
  var userx = sendRequest({
    method  : 'user.getInfo',
    api_key : api,
    user    : user,
    format  : 'json'
  });
  if (userx.error != undefined) {
    app.displayAlert('Error LastFm User: ' + userx.message)
  }
  else {
    //Iterate over Selection
    var aTrack, i, len;
    for (i = 0, len = sel.length; i < len; i++) {
      aTrack = sel[i];

      //Request TrackInfo from LastFM (switch for iTunes Script Build)
      var response = sendRequest({
        method   : 'track.getInfo',
        api_key  : api,
        artist   : aTrack.artist(),
        track    : aTrack.name(),
        username : user,
        format   : 'json'
      });

      //Check for error in response
      if (response.error != undefined) {
        debug('Error: ' + response.message);
      }
      else if (response.track.userplaycount === undefined){
        debug(aTrack.artist() + ' - ' + aTrack.name() + ' was never scrobbled by ' + user);
      }
      else {
        var playCount = response.track.userplaycount;

        //Set the playcount if higher
        if (aTrack.playedCount() < playCount) {
          debug('Set ' + aTrack.artist() + ' - ' + aTrack.name() + ' from ' + aTrack.playedCount() + ' to ' + playCount + ' plays');
          aTrack.playedCount = playCount;
        }
        //Leave playcount as is
        else {
          debug( aTrack.artist() + ' - ' + aTrack.name() + ' chilled at ' + aTrack.playedCount() + ' >= ' + playCount);
        }
      }
    }
  }
}