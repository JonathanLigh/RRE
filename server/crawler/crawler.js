var http = require('http');

module.exports = {
    textHTTP: function() {
        var options = {
            host: 'www.reddit.com',
            path: '/r/overwatch/about',
            method: 'GET'
        };

        var req = http.request(options, function(res) {
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
    },
    /*httpGet: function() {
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open(
            "GET",
            "https://www.reddit.com/r/overwatch/about",
            false); // false for synchronous request
        xmlHttp.send(null);
        return xmlHttp.responseText;
    },*/
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
