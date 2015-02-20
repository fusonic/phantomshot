/// <reference path="../all.d.ts" />

module PhantomShot {
    export class PhantomShot {

        private filesystem: FileSystem = require("fs");
        private system: System = require("system");
        private webpage = require("webpage");

        private configurationPath: string;
        private configuration: IConfiguration;
        private page: WebPage;

        private isLoading: boolean;
        private finishedCallback: () => void;

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

        run(finishedCallback: () => void): void {
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
            return this.configuration.baseUrl + "/" + path;
        }

        private loginAndTakeScreenshots(): void {
            this.page.open(
                this.buildFullUrl(this.configuration.login.url),
                (result: string) => {

                    console.log("Opened login page");
                    PhantomShot.evaluateJavaScript(this.page, this.configuration.login.inject);

                    // Now wait until page load has finished (user JS should trigger referral)
                    var interval = window.setInterval(() => {
                        if (!this.isLoading) {
                            window.clearInterval(interval);
                            this.takeScreenshots();
                        }
                    });
                }
            );
        }

        public static evaluateJavaScript(page: WebPage, code: string): void {
            var fs = require("fs");
            fs.write("tmpscript.js", code);
            page.injectJs("tmpscript.js");
            fs.remove("tmpscript.js");
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

            page.viewportSize = config.device.getViewportSize();

            page.open(
                config.url,
                (result: string) => {
                    if (result == "success") {
                        var rectangle = config.getTargetRectangle(page);
                        page.clipRect = rectangle;
                        page.render(this.getTargetFilename(config));
                        callback(true);
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
                screenshot.url = this.buildFullUrl(config.url);
                screenshot.device = this.getDeviceById(config.device);

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
                            this.finishedCallback();
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
        }
    }
}
