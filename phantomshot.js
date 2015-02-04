var fs = require('fs');
var system = require("system");
var webpage = require("webpage");

var page = webpage.create();

function takeScreenshot(shot, callback)
{
    // Viewport
    page.viewportSize = {
        width: shot.screen.width * shot.screen.ratio,
        height: shot.screen.height * shot.screen.ratio
    };

    // Clipping
    page.clipRect = {
        top: typeof(shot.clip.top) == "undefined" ? 0 : shot.clip.top * shot.screen.ratio,
        left: typeof(shot.clip.left) == "undefined" ? 0 : shot.clip.left * shot.screen.ratio,
        width: (typeof(shot.clip.width) == "undefined" ? shot.screen.width : shot.clip.width) * shot.screen.ratio,
        height: (typeof(shot.clip.height) == "undefined" ? shot.screen.height : shot.clip.height) * shot.screen.ratio
    };

    // Open page + render
    page.open(
        shot.url,
        function(result) {
            // https://filippo.io/taking-retina-screenshots-with-phantomjs/
            if (shot.screen.ratio == 2) {
                page.evaluate(function() {
                    document.body.style.webkitTransform = "scale(2)";
                    document.body.style.webkitTransformOrigin = "0% 0%";
                    document.body.style.width = "50%";
                });
            } else if (shot.screen.ratio == 3) {
                page.evaluate(function() {
                    document.body.style.webkitTransform = "scale(3)";
                    document.body.style.webkitTransformOrigin = "0% 0%";
                    document.body.style.width = "33.3333333333%";
                });
            }

            if (result == "success") {
                window.setTimeout(function() {
                    var renderResult = page.render(shot.filename);
                    callback(renderResult);
                }, 1000);
            } else {
                callback(false);
            }
        }
    );
}

function takeAllScreenshots(config, callback)
{
    console.info("Now taking screenshots");

    var shotKeys = Object.keys(config.shots);
    var currentShot = 0;

    function processShot()
    {
        var thisKey = shotKeys[currentShot];
        var thisScreen = config.screens[config.shots[thisKey].screen];
        var thisClip = typeof(config.shots[thisKey].clip) == "undefined" ? { } : config.shots[thisKey].clip;

        var thisShot = {
            url: config.baseUrl + config.shots[thisKey].url,
            screen: thisScreen,
            filename: config.outDir + "/" + thisKey + "." + config.format,
            clip: thisClip
        };

        takeScreenshot(thisShot, function(result) {
            if (result) {
                console.info((currentShot + 1) + ". SUCCESS: " + thisKey + " (" + thisShot.url + ")");
            } else {
                console.error((currentShot + 1) + ". ERROR: " + thisKey + " (" + thisShot.url + ")");
            }

            if (currentShot == shotKeys.length - 1) {
                callback();
            } else {
                currentShot++;
                processShot();
            }
        });
    }

    processShot();
}

if (system.args.length !== 2) {
    console.error("Usage: phantomjs phantomshot.js [path-to-config-file]");
    phantom.exit();
}

// Read config
console.info("Reading config from " + system.args[1]);
var data = fs.read(system.args[1]);
var config = JSON.parse(data);

// Loading status
var loading = false;
page.onLoadStarted = function() {
    loading = true;
};
page.onLoadFinished = function() {
    loading = false;
};

if (typeof(config.login) == "undefined") {
    takeAllScreenshots(config, function() {
        phantom.exit();
    });
} else {
    page.open(
        config.baseUrl + config.login.url,
        function(result) {
            console.log("Opened login page");
            page.injectJs(config.login.script);

            var interval = window.setInterval(function() {
                if (!loading) {
                    window.clearInterval(interval);
                    takeAllScreenshots(config, function() {
                        phantom.exit();
                    });
                }
            }, 50);
        }
    );
}
