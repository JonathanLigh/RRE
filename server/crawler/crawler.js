var https = require('https');
var querystring = require('querystring')

var client_id = 'KWV3tzhr2r5XGA'; // app clientID
var secret_key = 'WEfEcM-72OLkL69yRDmLgrTmQUU'; // app clientSecret

module.exports = {
    getAuthToken: function() {
        var postData = { //the POST request's body data
            grant_type: 'client_credentials',
            username: client_id,
            password: secret_key
        };

        var postBody = querystring.stringify(postData);

        var options = {
            host: 'www.reddit.com',
            path: '/api/v1/access_token',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                    //'Content-Length': postBody.length
            },
        };

        var req = https.request(options, function(res) {
            console.log('STATUS: ' + res.statusCode);
            console.log('HEADERS: ' + JSON.stringify(res.headers));

            // Buffer the body entirely for processing as a whole.
            var bodyChunks = [];
            res.on('data', function(chunk) {
                // You can process streamed parts here...
                bodyChunks.push(chunk);
            }).on('end', function() {
                var body = Buffer.concat(bodyChunks);
                console.log('BODY: ' + body);
                // ...and/or process the entire body here.
            })
        });

        req.on('error', function(e) {
            console.log('ERROR: ' + e.message);
        });

        req.write(postBody);
        req.end();
    },
    httpGet: function() {
        var token_ // variable will store the token
        var tokenUrl = "https://www.reddit.com/api/v1/access_token"; // Your application token endpoint
        var request = new XMLHttpRequest();

        function getToken(url, clientID, clientSecret) {
            var key;
            request.open("POST", url, true);
            request.setRequestHeader("Content-type", "application/json");
            request.send("grant_type=client_credentials&client_id=" +
                clientID + "&" + "client_secret=" + clientSecret); // specify the credentials to receive the token on request
            request.onreadystatechange = function() {
                if (request.readyState == request.DONE) {
                    var response = request.responseText;
                    var obj = JSON.parse(response);
                    console.log(obj);
                    key = obj.access_token; //store the value of the accesstoken
                    token_ = key; // store token in your global variable "token_" or you could simply return the value of the access token from the function
                }
            }
        }
        // Get the token
        getToken(tokenUrl, client_id, secret_key);
        console.log(token_);
    },
    /*testXHR: function() {
        xhr.get({
            url: "https://www.reddit.com/r/overwatch/about"
        }, function(err, resp, body) {
            var toReturn;
            toReturn.test = "ABC";
            toReturn.x = resp;
            toReturn.y = body;
            toReturn.e = err;
            return toReturn;
        });
        return {
            idk: "123"
        };
    },*/
    test: function() {
        console.log('hello');
    },
    simpleValue: 'also works'
};

require('make-runnable');
