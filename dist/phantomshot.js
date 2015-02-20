/// <reference path="../all.d.ts" />
var PhantomShot;
(function (PhantomShot) {
    var Device = (function () {
        function Device(config) {
            this.devicePixelRatio = (config.devicePixelRatio ? config.devicePixelRatio : 1);
            this.height = config.height;
            this.width = config.width;
        }
        Device.prototype.getViewportSize = function () {
            return {
                height: this.height * this.devicePixelRatio,
                width: this.width * this.devicePixelRatio
            };
        };
        return Device;
    })();
    PhantomShot.Device = Device;
})(PhantomShot || (PhantomShot = {}));

/// <reference path="../all.d.ts" />

/// <reference path="../all.d.ts" />

/// <reference path="../all.d.ts" />

/// <reference path="../all.d.ts" />

/// <reference path="../all.d.ts" />

/// <reference path="../all.d.ts" />
var PhantomShot;
(function (_PhantomShot) {
    var PhantomShot = (function () {
        function PhantomShot(configFilePath) {
            var _this = this;
            this.filesystem = require("fs");
            this.system = require("system");
            this.webpage = require("webpage");
            this.configurationPath = configFilePath;
            this.page = this.webpage.create();
            // Set up loading state
            this.page.onLoadStarted = function () {
                _this.isLoading = true;
            };
            this.page.onLoadFinished = function (status) {
                _this.isLoading = false;
            };
        }
        PhantomShot.prototype.run = function (finishedCallback) {
            // Save finishedCallback
            this.finishedCallback = finishedCallback;
            // First do some preparation stuff
            this.readConfigFile(this.configurationPath);
            // Login
            if (this.configuration.login) {
                this.loginAndTakeScreenshots();
            }
            else {
                this.takeScreenshots();
            }
        };
        PhantomShot.prototype.buildFullUrl = function (path) {
            return this.configuration.baseUrl + "/" + path;
        };
        PhantomShot.prototype.loginAndTakeScreenshots = function () {
            var _this = this;
            this.page.open(this.buildFullUrl(this.configuration.login.url), function (result) {
                console.log("Opened login page");
                console.log(_this.configuration.login.inject);
                PhantomShot.evaluateJavaScript(_this.page, _this.configuration.login.inject);
                console.log("injected");
                // Now wait until page load has finished (user JS should trigger referral)
                var interval = window.setInterval(function () {
                    if (!_this.isLoading) {
                        window.clearInterval(interval);
                        _this.takeScreenshots();
                    }
                });
            });
        };
        PhantomShot.evaluateJavaScript = function (page, code) {
            var fs = require("fs");
            fs.write("tmpscript.js", code);
            page.injectJs("tmpscript.js");
            fs.remove("tmpscript.js");
        };
        PhantomShot.prototype.getDeviceById = function (id) {
            for (var i = 0; i < this.configuration.devices.length; i++) {
                if (this.configuration.devices[i].id == id) {
                    return new _PhantomShot.Device(this.configuration.devices[i]);
                }
            }
        };
        PhantomShot.prototype.getTargetFilename = function (config) {
            return this.configuration.outDir + "/" + config.id + ".png";
        };
        PhantomShot.prototype.takeScreenshot = function (config, callback) {
            var _this = this;
            var page = this.page;
            page.viewportSize = config.device.getViewportSize();
            page.open(config.url, function (result) {
                if (result == "success") {
                    var rectangle = config.getTargetRectangle(page);
                    page.clipRect = rectangle;
                    page.render(_this.getTargetFilename(config));
                    callback(true);
                }
                else {
                    callback(false);
                }
            });
        };
        PhantomShot.prototype.takeScreenshots = function () {
            var _this = this;
            // Current shot counter since we're processing the queue asynchronously.
            var currentShot = 0;
            var processShot = function () {
                var config = _this.configuration.shots[currentShot];
                // Instantiate basic screenshot class
                var screenshot = new _PhantomShot.Screenshot();
                screenshot.id = config.id;
                screenshot.url = _this.buildFullUrl(config.url);
                screenshot.device = _this.getDeviceById(config.device);
                // Element or region mode
                if (config.element) {
                    screenshot.element = config.element;
                }
                else {
                    screenshot.region = new _PhantomShot.Rectangle(screenshot.device, config.region);
                }
                // Take the screenshot and loop to next one
                _this.takeScreenshot(screenshot, function (result) {
                    console.info((currentShot + 1) + ". " + (result ? "SUCCESS" : "ERROR") + ": " + screenshot.id + " (" + screenshot.url + ")");
                    if (currentShot == _this.configuration.shots.length - 1) {
                        _this.finishedCallback();
                    }
                    else {
                        currentShot++;
                        processShot();
                    }
                });
            };
            // Start processing
            processShot();
        };
        PhantomShot.prototype.readConfigFile = function (path) {
            // Read config
            console.info("Reading config from " + path);
            var data = this.filesystem.read(path);
            this.configuration = JSON.parse(data);
        };
        return PhantomShot;
    })();
    _PhantomShot.PhantomShot = PhantomShot;
})(PhantomShot || (PhantomShot = {}));

/// <reference path="../all.d.ts" />
var PhantomShot;
(function (PhantomShot) {
    var Rectangle = (function () {
        function Rectangle(device, config) {
            this.top = (config && config.top ? config.top : 0);
            this.left = (config && config.left ? config.left : 0);
            this.width = (config && config.width ? config.width : device.width);
            this.height = (config && config.height ? config.height : device.height);
        }
        return Rectangle;
    })();
    PhantomShot.Rectangle = Rectangle;
})(PhantomShot || (PhantomShot = {}));

/// <reference path="../all.d.ts" />
var PhantomShot;
(function (PhantomShot) {
    var Screenshot = (function () {
        function Screenshot() {
        }
        Screenshot.prototype.getTargetRectangle = function (page) {
            if (this.region) {
                return this.region;
            }
            else {
                // Inject target element selector via evaluateJavascript() since evaluate() is executed within
                // the page and cannot access variables in the current scope.
                PhantomShot.PhantomShot.evaluateJavaScript(page, "window.phantomShotTargetElement = " + JSON.stringify(this.element) + ";");
                return page.evaluate(function () {
                    return {
                        top: 0,
                        left: 0,
                        width: 300,
                        height: 300
                    };
                });
            }
        };
        return Screenshot;
    })();
    PhantomShot.Screenshot = Screenshot;
})(PhantomShot || (PhantomShot = {}));

/// <reference path="all.d.ts" />
var system = require("system");
/*

var fs = require('fs');
var webpage = require("webpage");

var page = webpage.create();

function takeScreenshot(shot, callback)
{
    // Viewport
    page.viewportSize = {
        width: shot.device.width * shot.device.ratio,
        height: shot.device.height * shot.device.ratio
    };

    // Clipping
    page.clipRect = {
        top: typeof(shot.clip.top) == "undefined" ? 0 : shot.clip.top * shot.device.ratio,
        left: typeof(shot.clip.left) == "undefined" ? 0 : shot.clip.left * shot.device.ratio,
        width: (typeof(shot.clip.width) == "undefined" ? shot.device.width : shot.clip.width) * shot.device.ratio,
        height: (typeof(shot.clip.height) == "undefined" ? shot.device.height : shot.clip.height) * shot.device.ratio
    };

    // Open page + render
    page.open(
        shot.url,
        function(result) {
            // https://filippo.io/taking-retina-screenshots-with-phantomjs/
            if (shot.device.ratio == 2) {
                page.evaluate(function() {
                    document.body.style.webkitTransform = "scale(2)";
                    document.body.style.webkitTransformOrigin = "0% 0%";
                    document.body.style.width = "50%";
                });
            } else if (shot.device.ratio == 3) {
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
        var thisScreen = config.screens[config.shots[thisKey].device];
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
*/
var phantomShot = new PhantomShot.PhantomShot(system.args[1]);
phantomShot.run(function () {
    phantom.exit();
});

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi92YXIvd3d3L3BoYW50b21zaG90L1BoYW50b21TaG90L0RldmljZS50cyIsIi92YXIvd3d3L3BoYW50b21zaG90L1BoYW50b21TaG90L0lDb25maWd1cmF0aW9uLnRzIiwiL3Zhci93d3cvcGhhbnRvbXNob3QvUGhhbnRvbVNob3QvSURldmljZS50cyIsIi92YXIvd3d3L3BoYW50b21zaG90L1BoYW50b21TaG90L0lMb2dpbi50cyIsIi92YXIvd3d3L3BoYW50b21zaG90L1BoYW50b21TaG90L0lSZWdpb24udHMiLCIvdmFyL3d3dy9waGFudG9tc2hvdC9QaGFudG9tU2hvdC9JU2NyZWVuc2hvdC50cyIsIi92YXIvd3d3L3BoYW50b21zaG90L1BoYW50b21TaG90L1BoYW50b21TaG90LnRzIiwiL3Zhci93d3cvcGhhbnRvbXNob3QvUGhhbnRvbVNob3QvUmVjdGFuZ2xlLnRzIiwiL3Zhci93d3cvcGhhbnRvbXNob3QvUGhhbnRvbVNob3QvU2NyZWVuc2hvdC50cyIsIi92YXIvd3d3L3BoYW50b21zaG90L3BoYW50b21zaG90LnRzIl0sIm5hbWVzIjpbIlBoYW50b21TaG90IiwiUGhhbnRvbVNob3QuRGV2aWNlIiwiUGhhbnRvbVNob3QuRGV2aWNlLmNvbnN0cnVjdG9yIiwiUGhhbnRvbVNob3QuRGV2aWNlLmdldFZpZXdwb3J0U2l6ZSIsIlBoYW50b21TaG90LlBoYW50b21TaG90IiwiUGhhbnRvbVNob3QuUGhhbnRvbVNob3QuY29uc3RydWN0b3IiLCJQaGFudG9tU2hvdC5QaGFudG9tU2hvdC5ydW4iLCJQaGFudG9tU2hvdC5QaGFudG9tU2hvdC5idWlsZEZ1bGxVcmwiLCJQaGFudG9tU2hvdC5QaGFudG9tU2hvdC5sb2dpbkFuZFRha2VTY3JlZW5zaG90cyIsIlBoYW50b21TaG90LlBoYW50b21TaG90LmV2YWx1YXRlSmF2YVNjcmlwdCIsIlBoYW50b21TaG90LlBoYW50b21TaG90LmdldERldmljZUJ5SWQiLCJQaGFudG9tU2hvdC5QaGFudG9tU2hvdC5nZXRUYXJnZXRGaWxlbmFtZSIsIlBoYW50b21TaG90LlBoYW50b21TaG90LnRha2VTY3JlZW5zaG90IiwiUGhhbnRvbVNob3QuUGhhbnRvbVNob3QudGFrZVNjcmVlbnNob3RzIiwiUGhhbnRvbVNob3QuUGhhbnRvbVNob3QucmVhZENvbmZpZ0ZpbGUiLCJQaGFudG9tU2hvdC5SZWN0YW5nbGUiLCJQaGFudG9tU2hvdC5SZWN0YW5nbGUuY29uc3RydWN0b3IiLCJQaGFudG9tU2hvdC5TY3JlZW5zaG90IiwiUGhhbnRvbVNob3QuU2NyZWVuc2hvdC5jb25zdHJ1Y3RvciIsIlBoYW50b21TaG90LlNjcmVlbnNob3QuZ2V0VGFyZ2V0UmVjdGFuZ2xlIl0sIm1hcHBpbmdzIjoiQUFBQSxvQ0FBb0M7QUFFcEMsSUFBTyxXQUFXLENBbUJqQjtBQW5CRCxXQUFPLFdBQVcsRUFBQyxDQUFDO0lBQ2hCQSxJQUFhQSxNQUFNQTtRQUtmQyxTQUxTQSxNQUFNQSxDQUtIQSxNQUFlQTtZQUN2QkMsSUFBSUEsQ0FBQ0EsZ0JBQWdCQSxHQUFHQSxDQUFDQSxNQUFNQSxDQUFDQSxnQkFBZ0JBLEdBQUdBLE1BQU1BLENBQUNBLGdCQUFnQkEsR0FBR0EsQ0FBQ0EsQ0FBQ0EsQ0FBQ0E7WUFDaEZBLElBQUlBLENBQUNBLE1BQU1BLEdBQUdBLE1BQU1BLENBQUNBLE1BQU1BLENBQUNBO1lBQzVCQSxJQUFJQSxDQUFDQSxLQUFLQSxHQUFHQSxNQUFNQSxDQUFDQSxLQUFLQSxDQUFDQTtRQUM5QkEsQ0FBQ0E7UUFFREQsZ0NBQWVBLEdBQWZBO1lBQ0lFLE1BQU1BLENBQUNBO2dCQUNIQSxNQUFNQSxFQUFFQSxJQUFJQSxDQUFDQSxNQUFNQSxHQUFHQSxJQUFJQSxDQUFDQSxnQkFBZ0JBO2dCQUMzQ0EsS0FBS0EsRUFBRUEsSUFBSUEsQ0FBQ0EsS0FBS0EsR0FBR0EsSUFBSUEsQ0FBQ0EsZ0JBQWdCQTthQUM1Q0EsQ0FBQ0E7UUFDTkEsQ0FBQ0E7UUFDTEYsYUFBQ0E7SUFBREEsQ0FqQkFELEFBaUJDQyxJQUFBRDtJQWpCWUEs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VyxDQUFDLFdBQVcsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUM7QUFDOUQsV0FBVyxDQUFDLEdBQUcsQ0FBQztJQUFRLE9BQU8sQ0FBQyxJQUFJLEVBQUUsQ0FBQztBQUFDLENBQUMsQ0FBQyxDQUFDIiwiZmlsZSI6InBoYW50b21zaG90LmpzIiwic291cmNlc0NvbnRlbnQiOlsiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2FsbC5kLnRzXCIgLz5cblxubW9kdWxlIFBoYW50b21TaG90IHtcbiAgICBleHBvcnQgY2xhc3MgRGV2aWNlIHtcbiAgICAgICAgZGV2aWNlUGl4ZWxSYXRpbzogbnVtYmVyO1xuICAgICAgICBoZWlnaHQ6IG51bWJlcjtcbiAgICAgICAgd2lkdGg6IG51bWJlcjtcblxuICAgICAgICBjb25zdHJ1Y3Rvcihjb25maWc6IElEZXZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMuZGV2aWNlUGl4ZWxSYXRpbyA9IChjb25maWcuZGV2aWNlUGl4ZWxSYXRpbyA/IGNvbmZpZy5kZXZpY2VQaXhlbFJhdGlvIDogMSk7XG4gICAgICAgICAgICB0aGlzLmhlaWdodCA9IGNvbmZpZy5oZWlnaHQ7XG4gICAgICAgICAgICB0aGlzLndpZHRoID0gY29uZmlnLndpZHRoO1xuICAgICAgICB9XG5cbiAgICAgICAgZ2V0Vmlld3BvcnRTaXplKCk6IFNpemUge1xuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IHRoaXMuaGVpZ2h0ICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvLFxuICAgICAgICAgICAgICAgIHdpZHRoOiB0aGlzLndpZHRoICogdGhpcy5kZXZpY2VQaXhlbFJhdGlvXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2FsbC5kLnRzXCIgLz5cblxubW9kdWxlIFBoYW50b21TaG90IHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIElDb25maWd1cmF0aW9uIHtcbiAgICAgICAgYmFzZVVybDogc3RyaW5nO1xuICAgICAgICBmb3JtYXQ6IHN0cmluZztcbiAgICAgICAgb3V0RGlyOiBzdHJpbmc7XG4gICAgICAgIGRldmljZXM6IElEZXZpY2VbXTtcbiAgICAgICAgc2hvdHM6IElTY3JlZW5zaG90W107XG4gICAgICAgIGxvZ2luOiBJTG9naW47XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2FsbC5kLnRzXCIgLz5cblxubW9kdWxlIFBoYW50b21TaG90IHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIElEZXZpY2VcbiAgICB7XG4gICAgICAgIGlkOiBzdHJpbmc7XG4gICAgICAgIHdpZHRoPzogbnVtYmVyO1xuICAgICAgICBoZWlnaHQ/OiBudW1iZXI7XG4gICAgICAgIGRldmljZVBpeGVsUmF0aW8/OiBudW1iZXI7XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2FsbC5kLnRzXCIgLz5cblxubW9kdWxlIFBoYW50b21TaG90IHtcbiAgICBleHBvcnQgaW50ZXJmYWNlIElMb2dpbiB7XG4gICAgICAgIHVybDogc3RyaW5nO1xuICAgICAgICBpbmplY3Q6IHN0cmluZztcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYWxsLmQudHNcIiAvPlxuXG5tb2R1bGUgUGhhbnRvbVNob3Qge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVJlZ2lvbiB7XG4gICAgICAgIHRvcD86IG51bWJlcjtcbiAgICAgICAgbGVmdD86IG51bWJlcjtcbiAgICAgICAgd2lkdGg/OiBudW1iZXI7XG4gICAgICAgIGhlaWdodD86IG51bWJlcjtcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYWxsLmQudHNcIiAvPlxuXG5tb2R1bGUgUGhhbnRvbVNob3Qge1xuICAgIGV4cG9ydCBpbnRlcmZhY2UgSVNjcmVlbnNob3Qge1xuICAgICAgICBpZDogc3RyaW5nO1xuICAgICAgICB1cmw6IHN0cmluZztcbiAgICAgICAgZGV2aWNlOiBzdHJpbmc7XG4gICAgICAgIHJlZ2lvbj86IElSZWdpb247XG4gICAgICAgIGVsZW1lbnQ/OiBzdHJpbmc7XG4gICAgICAgIGluamVjdD86IHN0cmluZztcbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYWxsLmQudHNcIiAvPlxuXG5tb2R1bGUgUGhhbnRvbVNob3Qge1xuICAgIGV4cG9ydCBjbGFzcyBQaGFudG9tU2hvdCB7XG5cbiAgICAgICAgcHJpdmF0ZSBmaWxlc3lzdGVtOiBGaWxlU3lzdGVtID0gcmVxdWlyZShcImZzXCIpO1xuICAgICAgICBwcml2YXRlIHN5c3RlbTogU3lzdGVtID0gcmVxdWlyZShcInN5c3RlbVwiKTtcbiAgICAgICAgcHJpdmF0ZSB3ZWJwYWdlID0gcmVxdWlyZShcIndlYnBhZ2VcIik7XG5cbiAgICAgICAgcHJpdmF0ZSBjb25maWd1cmF0aW9uUGF0aDogc3RyaW5nO1xuICAgICAgICBwcml2YXRlIGNvbmZpZ3VyYXRpb246IElDb25maWd1cmF0aW9uO1xuICAgICAgICBwcml2YXRlIHBhZ2U6IFdlYlBhZ2U7XG5cbiAgICAgICAgcHJpdmF0ZSBpc0xvYWRpbmc6IGJvb2xlYW47XG4gICAgICAgIHByaXZhdGUgZmluaXNoZWRDYWxsYmFjazogKCkgPT4gdm9pZDtcblxuICAgICAgICBjb25zdHJ1Y3Rvcihjb25maWdGaWxlUGF0aDogc3RyaW5nKSB7XG4gICAgICAgICAgICB0aGlzLmNvbmZpZ3VyYXRpb25QYXRoID0gY29uZmlnRmlsZVBhdGg7XG4gICAgICAgICAgICB0aGlzLnBhZ2UgPSB0aGlzLndlYnBhZ2UuY3JlYXRlKCk7XG5cbiAgICAgICAgICAgIC8vIFNldCB1cCBsb2FkaW5nIHN0YXRlXG4gICAgICAgICAgICB0aGlzLnBhZ2Uub25Mb2FkU3RhcnRlZCA9ICgpID0+IHtcbiAgICAgICAgICAgICAgICB0aGlzLmlzTG9hZGluZyA9IHRydWU7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5wYWdlLm9uTG9hZEZpbmlzaGVkID0gKHN0YXR1czogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgdGhpcy5pc0xvYWRpbmcgPSBmYWxzZTtcbiAgICAgICAgICAgIH07XG4gICAgICAgIH1cblxuICAgICAgICBydW4oZmluaXNoZWRDYWxsYmFjazogKCkgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICAgICAgLy8gU2F2ZSBmaW5pc2hlZENhbGxiYWNrXG4gICAgICAgICAgICB0aGlzLmZpbmlzaGVkQ2FsbGJhY2sgPSBmaW5pc2hlZENhbGxiYWNrO1xuXG4gICAgICAgICAgICAvLyBGaXJzdCBkbyBzb21lIHByZXBhcmF0aW9uIHN0dWZmXG4gICAgICAgICAgICB0aGlzLnJlYWRDb25maWdGaWxlKHRoaXMuY29uZmlndXJhdGlvblBhdGgpO1xuXG4gICAgICAgICAgICAvLyBMb2dpblxuICAgICAgICAgICAgaWYgKHRoaXMuY29uZmlndXJhdGlvbi5sb2dpbikge1xuICAgICAgICAgICAgICAgIHRoaXMubG9naW5BbmRUYWtlU2NyZWVuc2hvdHMoKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy50YWtlU2NyZWVuc2hvdHMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgYnVpbGRGdWxsVXJsKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5jb25maWd1cmF0aW9uLmJhc2VVcmwgKyBcIi9cIiArIHBhdGg7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIGxvZ2luQW5kVGFrZVNjcmVlbnNob3RzKCk6IHZvaWQge1xuICAgICAgICAgICAgdGhpcy5wYWdlLm9wZW4oXG4gICAgICAgICAgICAgICAgdGhpcy5idWlsZEZ1bGxVcmwodGhpcy5jb25maWd1cmF0aW9uLmxvZ2luLnVybCksXG4gICAgICAgICAgICAgICAgKHJlc3VsdDogc3RyaW5nKSA9PiB7XG5cbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJPcGVuZWQgbG9naW4gcGFnZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2codGhpcy5jb25maWd1cmF0aW9uLmxvZ2luLmluamVjdCk7XG4gICAgICAgICAgICAgICAgICAgIFBoYW50b21TaG90LmV2YWx1YXRlSmF2YVNjcmlwdCh0aGlzLnBhZ2UsIHRoaXMuY29uZmlndXJhdGlvbi5sb2dpbi5pbmplY3QpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImluamVjdGVkXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIE5vdyB3YWl0IHVudGlsIHBhZ2UgbG9hZCBoYXMgZmluaXNoZWQgKHVzZXIgSlMgc2hvdWxkIHRyaWdnZXIgcmVmZXJyYWwpXG4gICAgICAgICAgICAgICAgICAgIHZhciBpbnRlcnZhbCA9IHdpbmRvdy5zZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIXRoaXMuaXNMb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgd2luZG93LmNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMudGFrZVNjcmVlbnNob3RzKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwdWJsaWMgc3RhdGljIGV2YWx1YXRlSmF2YVNjcmlwdChwYWdlOiBXZWJQYWdlLCBjb2RlOiBzdHJpbmcpOiB2b2lkIHtcbiAgICAgICAgICAgIHZhciBmcyA9IHJlcXVpcmUoXCJmc1wiKTtcbiAgICAgICAgICAgIGZzLndyaXRlKFwidG1wc2NyaXB0LmpzXCIsIGNvZGUpO1xuICAgICAgICAgICAgcGFnZS5pbmplY3RKcyhcInRtcHNjcmlwdC5qc1wiKTtcbiAgICAgICAgICAgIGZzLnJlbW92ZShcInRtcHNjcmlwdC5qc1wiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0RGV2aWNlQnlJZChpZDogc3RyaW5nKTogRGV2aWNlIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jb25maWd1cmF0aW9uLmRldmljZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5jb25maWd1cmF0aW9uLmRldmljZXNbaV0uaWQgPT0gaWQpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIG5ldyBEZXZpY2UodGhpcy5jb25maWd1cmF0aW9uLmRldmljZXNbaV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgZ2V0VGFyZ2V0RmlsZW5hbWUoY29uZmlnOiBTY3JlZW5zaG90KTogc3RyaW5nIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmNvbmZpZ3VyYXRpb24ub3V0RGlyICsgXCIvXCIgKyBjb25maWcuaWQgKyBcIi5wbmdcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgdGFrZVNjcmVlbnNob3QoY29uZmlnOiBTY3JlZW5zaG90LCBjYWxsYmFjazogKHJlc3VsdDogYm9vbGVhbikgPT4gdm9pZCk6IHZvaWQge1xuICAgICAgICAgICAgdmFyIHBhZ2UgPSB0aGlzLnBhZ2U7XG5cbiAgICAgICAgICAgIHBhZ2Uudmlld3BvcnRTaXplID0gY29uZmlnLmRldmljZS5nZXRWaWV3cG9ydFNpemUoKTtcblxuICAgICAgICAgICAgcGFnZS5vcGVuKFxuICAgICAgICAgICAgICAgIGNvbmZpZy51cmwsXG4gICAgICAgICAgICAgICAgKHJlc3VsdDogc3RyaW5nKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgPT0gXCJzdWNjZXNzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciByZWN0YW5nbGUgPSBjb25maWcuZ2V0VGFyZ2V0UmVjdGFuZ2xlKHBhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcGFnZS5jbGlwUmVjdCA9IHJlY3RhbmdsZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHBhZ2UucmVuZGVyKHRoaXMuZ2V0VGFyZ2V0RmlsZW5hbWUoY29uZmlnKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKGZhbHNlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBwcml2YXRlIHRha2VTY3JlZW5zaG90cygpOiB2b2lkIHtcblxuICAgICAgICAgICAgLy8gQ3VycmVudCBzaG90IGNvdW50ZXIgc2luY2Ugd2UncmUgcHJvY2Vzc2luZyB0aGUgcXVldWUgYXN5bmNocm9ub3VzbHkuXG4gICAgICAgICAgICB2YXIgY3VycmVudFNob3QgPSAwO1xuXG4gICAgICAgICAgICB2YXIgcHJvY2Vzc1Nob3QgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgICAgICB2YXIgY29uZmlnID0gdGhpcy5jb25maWd1cmF0aW9uLnNob3RzW2N1cnJlbnRTaG90XTtcblxuICAgICAgICAgICAgICAgIC8vIEluc3RhbnRpYXRlIGJhc2ljIHNjcmVlbnNob3QgY2xhc3NcbiAgICAgICAgICAgICAgICB2YXIgc2NyZWVuc2hvdCA9IG5ldyBTY3JlZW5zaG90KCk7XG4gICAgICAgICAgICAgICAgc2NyZWVuc2hvdC5pZCA9IGNvbmZpZy5pZDtcbiAgICAgICAgICAgICAgICBzY3JlZW5zaG90LnVybCA9IHRoaXMuYnVpbGRGdWxsVXJsKGNvbmZpZy51cmwpO1xuICAgICAgICAgICAgICAgIHNjcmVlbnNob3QuZGV2aWNlID0gdGhpcy5nZXREZXZpY2VCeUlkKGNvbmZpZy5kZXZpY2UpO1xuXG4gICAgICAgICAgICAgICAgLy8gRWxlbWVudCBvciByZWdpb24gbW9kZVxuICAgICAgICAgICAgICAgIGlmIChjb25maWcuZWxlbWVudCkge1xuICAgICAgICAgICAgICAgICAgICBzY3JlZW5zaG90LmVsZW1lbnQgPSBjb25maWcuZWxlbWVudDtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzY3JlZW5zaG90LnJlZ2lvbiA9IG5ldyBSZWN0YW5nbGUoc2NyZWVuc2hvdC5kZXZpY2UsIGNvbmZpZy5yZWdpb24pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIFRha2UgdGhlIHNjcmVlbnNob3QgYW5kIGxvb3AgdG8gbmV4dCBvbmVcbiAgICAgICAgICAgICAgICB0aGlzLnRha2VTY3JlZW5zaG90KFxuICAgICAgICAgICAgICAgICAgICBzY3JlZW5zaG90LFxuICAgICAgICAgICAgICAgICAgICAocmVzdWx0OiBib29sZWFuKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oKGN1cnJlbnRTaG90ICsgMSkgKyBcIi4gXCIgKyAocmVzdWx0ID8gXCJTVUNDRVNTXCIgOiBcIkVSUk9SXCIpICsgXCI6IFwiICsgc2NyZWVuc2hvdC5pZCArIFwiIChcIiArIHNjcmVlbnNob3QudXJsICsgXCIpXCIpXG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjdXJyZW50U2hvdCA9PSB0aGlzLmNvbmZpZ3VyYXRpb24uc2hvdHMubGVuZ3RoIC0gMSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMuZmluaXNoZWRDYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50U2hvdCsrO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHByb2Nlc3NTaG90KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgLy8gU3RhcnQgcHJvY2Vzc2luZ1xuICAgICAgICAgICAgcHJvY2Vzc1Nob3QoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByaXZhdGUgcmVhZENvbmZpZ0ZpbGUocGF0aDogc3RyaW5nKSB7XG4gICAgICAgICAgICAvLyBSZWFkIGNvbmZpZ1xuICAgICAgICAgICAgY29uc29sZS5pbmZvKFwiUmVhZGluZyBjb25maWcgZnJvbSBcIiArIHBhdGgpO1xuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLmZpbGVzeXN0ZW0ucmVhZChwYXRoKTtcbiAgICAgICAgICAgIHRoaXMuY29uZmlndXJhdGlvbiA9IEpTT04ucGFyc2UoZGF0YSk7XG4gICAgICAgIH1cbiAgICB9XG59XG4iLCIvLy8gPHJlZmVyZW5jZSBwYXRoPVwiLi4vYWxsLmQudHNcIiAvPlxuXG5tb2R1bGUgUGhhbnRvbVNob3Qge1xuICAgIGV4cG9ydCBjbGFzcyBSZWN0YW5nbGUgaW1wbGVtZW50cyBJUmVnaW9uLCBDbGlwUmVjdCB7XG4gICAgICAgIHRvcDogbnVtYmVyO1xuICAgICAgICBsZWZ0OiBudW1iZXI7XG4gICAgICAgIHdpZHRoOiBudW1iZXI7XG4gICAgICAgIGhlaWdodDogbnVtYmVyO1xuXG4gICAgICAgIGNvbnN0cnVjdG9yKGRldmljZTogRGV2aWNlLCBjb25maWc/OiBJUmVnaW9uKSB7XG4gICAgICAgICAgICB0aGlzLnRvcCA9IChjb25maWcgJiYgY29uZmlnLnRvcCA/IGNvbmZpZy50b3AgOiAwKTtcbiAgICAgICAgICAgIHRoaXMubGVmdCA9IChjb25maWcgJiYgY29uZmlnLmxlZnQgPyBjb25maWcubGVmdCA6IDApO1xuICAgICAgICAgICAgdGhpcy53aWR0aCA9IChjb25maWcgJiYgY29uZmlnLndpZHRoID8gY29uZmlnLndpZHRoIDogZGV2aWNlLndpZHRoKTtcbiAgICAgICAgICAgIHRoaXMuaGVpZ2h0ID0gKGNvbmZpZyAmJiBjb25maWcuaGVpZ2h0ID8gY29uZmlnLmhlaWdodCA6IGRldmljZS5oZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxufVxuIiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cIi4uL2FsbC5kLnRzXCIgLz5cblxubW9kdWxlIFBoYW50b21TaG90IHtcbiAgICBleHBvcnQgY2xhc3MgU2NyZWVuc2hvdCB7XG4gICAgICAgIGlkOiBzdHJpbmc7XG4gICAgICAgIGRldmljZTogRGV2aWNlO1xuICAgICAgICB1cmw6IHN0cmluZztcbiAgICAgICAgaW5qZWN0OiBzdHJpbmc7XG4gICAgICAgIHJlZ2lvbjogUmVjdGFuZ2xlO1xuICAgICAgICBlbGVtZW50OiBzdHJpbmc7XG5cbiAgICAgICAgZ2V0VGFyZ2V0UmVjdGFuZ2xlKHBhZ2U6IFdlYlBhZ2UpOiBSZWN0YW5nbGUge1xuICAgICAgICAgICAgaWYgKHRoaXMucmVnaW9uKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMucmVnaW9uO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBJbmplY3QgdGFyZ2V0IGVsZW1lbnQgc2VsZWN0b3IgdmlhIGV2YWx1YXRlSmF2YXNjcmlwdCgpIHNpbmNlIGV2YWx1YXRlKCkgaXMgZXhlY3V0ZWQgd2l0aGluXG4gICAgICAgICAgICAgICAgLy8gdGhlIHBhZ2UgYW5kIGNhbm5vdCBhY2Nlc3MgdmFyaWFibGVzIGluIHRoZSBjdXJyZW50IHNjb3BlLlxuICAgICAgICAgICAgICAgIFBoYW50b21TaG90LmV2YWx1YXRlSmF2YVNjcmlwdChwYWdlLCBcIndpbmRvdy5waGFudG9tU2hvdFRhcmdldEVsZW1lbnQgPSBcIiArIEpTT04uc3RyaW5naWZ5KHRoaXMuZWxlbWVudCkgKyBcIjtcIik7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhZ2UuZXZhbHVhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0b3A6IDAsXG4gICAgICAgICAgICAgICAgICAgICAgICBsZWZ0OiAwLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2lkdGg6IDMwMCxcbiAgICAgICAgICAgICAgICAgICAgICAgIGhlaWdodDogMzAwXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59IiwiLy8vIDxyZWZlcmVuY2UgcGF0aD1cImFsbC5kLnRzXCIgLz5cblxudmFyIHN5c3RlbSA9IHJlcXVpcmUoXCJzeXN0ZW1cIik7XG5cbi8qXG5cbnZhciBmcyA9IHJlcXVpcmUoJ2ZzJyk7XG52YXIgd2VicGFnZSA9IHJlcXVpcmUoXCJ3ZWJwYWdlXCIpO1xuXG52YXIgcGFnZSA9IHdlYnBhZ2UuY3JlYXRlKCk7XG5cbmZ1bmN0aW9uIHRha2VTY3JlZW5zaG90KHNob3QsIGNhbGxiYWNrKVxue1xuICAgIC8vIFZpZXdwb3J0XG4gICAgcGFnZS52aWV3cG9ydFNpemUgPSB7XG4gICAgICAgIHdpZHRoOiBzaG90LmRldmljZS53aWR0aCAqIHNob3QuZGV2aWNlLnJhdGlvLFxuICAgICAgICBoZWlnaHQ6IHNob3QuZGV2aWNlLmhlaWdodCAqIHNob3QuZGV2aWNlLnJhdGlvXG4gICAgfTtcblxuICAgIC8vIENsaXBwaW5nXG4gICAgcGFnZS5jbGlwUmVjdCA9IHtcbiAgICAgICAgdG9wOiB0eXBlb2Yoc2hvdC5jbGlwLnRvcCkgPT0gXCJ1bmRlZmluZWRcIiA/IDAgOiBzaG90LmNsaXAudG9wICogc2hvdC5kZXZpY2UucmF0aW8sXG4gICAgICAgIGxlZnQ6IHR5cGVvZihzaG90LmNsaXAubGVmdCkgPT0gXCJ1bmRlZmluZWRcIiA/IDAgOiBzaG90LmNsaXAubGVmdCAqIHNob3QuZGV2aWNlLnJhdGlvLFxuICAgICAgICB3aWR0aDogKHR5cGVvZihzaG90LmNsaXAud2lkdGgpID09IFwidW5kZWZpbmVkXCIgPyBzaG90LmRldmljZS53aWR0aCA6IHNob3QuY2xpcC53aWR0aCkgKiBzaG90LmRldmljZS5yYXRpbyxcbiAgICAgICAgaGVpZ2h0OiAodHlwZW9mKHNob3QuY2xpcC5oZWlnaHQpID09IFwidW5kZWZpbmVkXCIgPyBzaG90LmRldmljZS5oZWlnaHQgOiBzaG90LmNsaXAuaGVpZ2h0KSAqIHNob3QuZGV2aWNlLnJhdGlvXG4gICAgfTtcblxuICAgIC8vIE9wZW4gcGFnZSArIHJlbmRlclxuICAgIHBhZ2Uub3BlbihcbiAgICAgICAgc2hvdC51cmwsXG4gICAgICAgIGZ1bmN0aW9uKHJlc3VsdCkge1xuICAgICAgICAgICAgLy8gaHR0cHM6Ly9maWxpcHBvLmlvL3Rha2luZy1yZXRpbmEtc2NyZWVuc2hvdHMtd2l0aC1waGFudG9tanMvXG4gICAgICAgICAgICBpZiAoc2hvdC5kZXZpY2UucmF0aW8gPT0gMikge1xuICAgICAgICAgICAgICAgIHBhZ2UuZXZhbHVhdGUoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUud2Via2l0VHJhbnNmb3JtID0gXCJzY2FsZSgyKVwiO1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLndlYmtpdFRyYW5zZm9ybU9yaWdpbiA9IFwiMCUgMCVcIjtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS53aWR0aCA9IFwiNTAlXCI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHNob3QuZGV2aWNlLnJhdGlvID09IDMpIHtcbiAgICAgICAgICAgICAgICBwYWdlLmV2YWx1YXRlKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnN0eWxlLndlYmtpdFRyYW5zZm9ybSA9IFwic2NhbGUoMylcIjtcbiAgICAgICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5zdHlsZS53ZWJraXRUcmFuc2Zvcm1PcmlnaW4gPSBcIjAlIDAlXCI7XG4gICAgICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuc3R5bGUud2lkdGggPSBcIjMzLjMzMzMzMzMzMzMlXCI7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChyZXN1bHQgPT0gXCJzdWNjZXNzXCIpIHtcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHJlbmRlclJlc3VsdCA9IHBhZ2UucmVuZGVyKHNob3QuZmlsZW5hbWUpO1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayhyZW5kZXJSZXN1bHQpO1xuICAgICAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayhmYWxzZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICApO1xufVxuXG5mdW5jdGlvbiB0YWtlQWxsU2NyZWVuc2hvdHMoY29uZmlnLCBjYWxsYmFjaylcbntcbiAgICBjb25zb2xlLmluZm8oXCJOb3cgdGFraW5nIHNjcmVlbnNob3RzXCIpO1xuXG4gICAgdmFyIHNob3RLZXlzID0gT2JqZWN0LmtleXMoY29uZmlnLnNob3RzKTtcbiAgICB2YXIgY3VycmVudFNob3QgPSAwO1xuXG4gICAgZnVuY3Rpb24gcHJvY2Vzc1Nob3QoKVxuICAgIHtcbiAgICAgICAgdmFyIHRoaXNLZXkgPSBzaG90S2V5c1tjdXJyZW50U2hvdF07XG4gICAgICAgIHZhciB0aGlzU2NyZWVuID0gY29uZmlnLnNjcmVlbnNbY29uZmlnLnNob3RzW3RoaXNLZXldLmRldmljZV07XG4gICAgICAgIHZhciB0aGlzQ2xpcCA9IHR5cGVvZihjb25maWcuc2hvdHNbdGhpc0tleV0uY2xpcCkgPT0gXCJ1bmRlZmluZWRcIiA/IHsgfSA6IGNvbmZpZy5zaG90c1t0aGlzS2V5XS5jbGlwO1xuXG4gICAgICAgIHZhciB0aGlzU2hvdCA9IHtcbiAgICAgICAgICAgIHVybDogY29uZmlnLmJhc2VVcmwgKyBjb25maWcuc2hvdHNbdGhpc0tleV0udXJsLFxuICAgICAgICAgICAgc2NyZWVuOiB0aGlzU2NyZWVuLFxuICAgICAgICAgICAgZmlsZW5hbWU6IGNvbmZpZy5vdXREaXIgKyBcIi9cIiArIHRoaXNLZXkgKyBcIi5cIiArIGNvbmZpZy5mb3JtYXQsXG4gICAgICAgICAgICBjbGlwOiB0aGlzQ2xpcFxuICAgICAgICB9O1xuXG4gICAgICAgIHRha2VTY3JlZW5zaG90KHRoaXNTaG90LCBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmluZm8oKGN1cnJlbnRTaG90ICsgMSkgKyBcIi4gU1VDQ0VTUzogXCIgKyB0aGlzS2V5ICsgXCIgKFwiICsgdGhpc1Nob3QudXJsICsgXCIpXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKChjdXJyZW50U2hvdCArIDEpICsgXCIuIEVSUk9SOiBcIiArIHRoaXNLZXkgKyBcIiAoXCIgKyB0aGlzU2hvdC51cmwgKyBcIilcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjdXJyZW50U2hvdCA9PSBzaG90S2V5cy5sZW5ndGggLSAxKSB7XG4gICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY3VycmVudFNob3QrKztcbiAgICAgICAgICAgICAgICBwcm9jZXNzU2hvdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBwcm9jZXNzU2hvdCgpO1xufVxuXG5pZiAoc3lzdGVtLmFyZ3MubGVuZ3RoICE9PSAyKSB7XG4gICAgY29uc29sZS5lcnJvcihcIlVzYWdlOiBwaGFudG9tanMgcGhhbnRvbXNob3QuanMgW3BhdGgtdG8tY29uZmlnLWZpbGVdXCIpO1xuICAgIHBoYW50b20uZXhpdCgpO1xufVxuXG4vLyBSZWFkIGNvbmZpZ1xuY29uc29sZS5pbmZvKFwiUmVhZGluZyBjb25maWcgZnJvbSBcIiArIHN5c3RlbS5hcmdzWzFdKTtcbnZhciBkYXRhID0gZnMucmVhZChzeXN0ZW0uYXJnc1sxXSk7XG52YXIgY29uZmlnID0gSlNPTi5wYXJzZShkYXRhKTtcblxuLy8gTG9hZGluZyBzdGF0dXNcbnZhciBsb2FkaW5nID0gZmFsc2U7XG5wYWdlLm9uTG9hZFN0YXJ0ZWQgPSBmdW5jdGlvbigpIHtcbiAgICBsb2FkaW5nID0gdHJ1ZTtcbn07XG5wYWdlLm9uTG9hZEZpbmlzaGVkID0gZnVuY3Rpb24oKSB7XG4gICAgbG9hZGluZyA9IGZhbHNlO1xufTtcblxuaWYgKHR5cGVvZihjb25maWcubG9naW4pID09IFwidW5kZWZpbmVkXCIpIHtcbiAgICB0YWtlQWxsU2NyZWVuc2hvdHMoY29uZmlnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgcGhhbnRvbS5leGl0KCk7XG4gICAgfSk7XG59IGVsc2Uge1xuICAgIHBhZ2Uub3BlbihcbiAgICAgICAgY29uZmlnLmJhc2VVcmwgKyBjb25maWcubG9naW4udXJsLFxuICAgICAgICBmdW5jdGlvbihyZXN1bHQpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiT3BlbmVkIGxvZ2luIHBhZ2VcIik7XG4gICAgICAgICAgICBwYWdlLmluamVjdEpzKGNvbmZpZy5sb2dpbi5zY3JpcHQpO1xuXG4gICAgICAgICAgICB2YXIgaW50ZXJ2YWwgPSB3aW5kb3cuc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCFsb2FkaW5nKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5jbGVhckludGVydmFsKGludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgdGFrZUFsbFNjcmVlbnNob3RzKGNvbmZpZywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBwaGFudG9tLmV4aXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICB9XG4gICAgKTtcbn1cbiovXG5cbnZhciBwaGFudG9tU2hvdCA9IG5ldyBQaGFudG9tU2hvdC5QaGFudG9tU2hvdChzeXN0ZW0uYXJnc1sxXSk7XG5waGFudG9tU2hvdC5ydW4oKCkgPT4geyBwaGFudG9tLmV4aXQoKTsgfSk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=