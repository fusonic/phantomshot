/// <reference path="../all.d.ts" />

module PhantomShot {
    export class PhantomShot {

        private filesystem: FileSystem = require("fs");
        private system: System = require("system");
        private webpage = require("webpage");

        private configurationPath: string;
        private configuration: IConfiguration;
        private page: WebPage;

        private defaultTimeout: number = 10 * 1000;

        private isLoading: boolean;
        private finishedCallback: (result: number) => void;

        constructor(configFilePath: string) {
            this.configurationPath = configFilePath;
            this.page = this.webpage.create();

            // Set up loading state
            this.page.onLoadStarted = () => {
                this.isLoading = true;
            };
            this.page.onLoadFinished = (status: string) => {
                this.isLoading = false;
            };
        }

        run(finishedCallback: (result: number) => void): void {
            // Save finishedCallback
            this.finishedCallback = finishedCallback;

            // First do some preparation stuff
            this.readConfigFile(this.configurationPath);

            // Login
            if (this.configuration.login) {
                this.loginAndTakeScreenshots();
            } else {
                this.takeScreenshots();
            }
        }

        private buildFullUrl(path: string): string {
            return this.configuration.baseUrl + path;
        }

        private loginAndTakeScreenshots(): void {
            this.page.open(
                this.buildFullUrl(this.configuration.login.url),
                (result: string) => {

                    if (result == "success") {
                        console.log("Opened login page");
                        PhantomShot.evaluateJavaScript(this.page, this.configuration.login.inject);

                        // Now wait until page load has finished (user JS should trigger referral)
                        var timeout = window.setTimeout(() => {
                            console.error("Login timed out");
                            this.finishedCallback(1);
                        }, this.defaultTimeout);
                        var interval = window.setInterval(() => {
                            if (!this.isLoading) {
                                window.clearTimeout(timeout);
                                window.clearInterval(interval);
                                this.takeScreenshots();
                            }
                        });
                    } else {
                        console.error("Login failed");
                        this.finishedCallback(1);
                    }

                }
            );
        }

        public static evaluateJavaScript(page: WebPage, code: string): void {
            var tmpScriptName = "phantomjs" + Math.round(Math.random() * 1000) + ".js";
            var fs = require("fs");
            fs.write(tmpScriptName, code);
            page.injectJs(tmpScriptName);
            fs.remove(tmpScriptName);
        }

        private getDeviceById(id: string): Device {
            for (var i = 0; i < this.configuration.devices.length; i++) {
                if (this.configuration.devices[i].id == id) {
                    return new Device(this.configuration.devices[i]);
                }
            }
        }

        private getTargetFilename(config: Screenshot): string {
            return this.configuration.outDir + "/" + config.id + ".png";
        }

        private takeScreenshot(config: Screenshot, callback: (result: boolean) => void): void {
            var page = this.page;

            var timeout = window.setTimeout(() => {
                try {
                    page.close();
                    callback(false);
                } catch (ex) {}
            }, this.defaultTimeout);

            page.viewportSize = config.device.getViewportSize();

            page.open(
                config.url,
                (result: string) => {
                    if (result == "success") {
                        // Inject javascript code
                        if (config.inject) {
                            try {
                                PhantomShot.evaluateJavaScript(page, config.inject);
                            } catch (ex) {
                                console.error("Error executing JavaScript code");
                                console.error(ex);
                                callback(false);
                            }
                        }

                        window.setTimeout(() => {
                            // Get the target rectangle
                            try {
                                var rectangle = config.getTargetRectangle(page);
                                page.clipRect = rectangle;
                            } catch (ex) {
                                console.error(ex);
                                callback(false);
                            }

                            // Render the page
                            page.render(this.getTargetFilename(config));

                            // Clear timeout
                            window.clearTimeout(timeout);

                            // Finish shot
                            callback(true);
                        }, config.delay ? config.delay : 0);
                    } else {
                        callback(false);
                    }
                }
            );
        }

        private takeScreenshots(): void {

            // Current shot counter since we're processing the queue asynchronously.
            var currentShot = 0;

            var processShot = () => {

                var config = this.configuration.shots[currentShot];

                // Instantiate basic screenshot class
                var screenshot = new Screenshot();
                screenshot.id = config.id;
                screenshot.inject = config.inject;
                screenshot.url = this.buildFullUrl(config.url);
                screenshot.device = this.getDeviceById(config.device);
                screenshot.delay = config.delay;

                // Element or region mode
                if (config.element) {
                    screenshot.element = config.element;
                } else {
                    screenshot.region = new Rectangle(screenshot.device, config.region);
                }

                // Take the screenshot and loop to next one
                this.takeScreenshot(
                    screenshot,
                    (result: boolean) => {
                        console.info((currentShot + 1) + ". " + (result ? "SUCCESS" : "ERROR") + ": " + screenshot.id + " (" + screenshot.url + ")")

                        if (currentShot == this.configuration.shots.length - 1) {
                            this.finishedCallback(0);
                        } else {
                            currentShot++;
                            processShot();
                        }
                    }
                );
            };

            // Start processing
            processShot();
        }

        private readConfigFile(path: string) {
            // Read config
            console.info("Reading config from " + path);
            var data = this.filesystem.read(path);
            this.configuration = JSON.parse(data);

            if (this.configuration.timeout) {
                this.defaultTimeout = this.configuration.timeout * 1000;
            }
        }
    }
}
