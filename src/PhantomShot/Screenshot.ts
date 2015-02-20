/// <reference path="../all.d.ts" />

module PhantomShot {
    export class Screenshot {
        id: string;
        device: Device;
        url: string;
        inject: string;
        region: Rectangle;
        element: string;

        getTargetRectangle(page: WebPage): Rectangle {
            if (this.region) {
                return this.region;
            } else {
                // Inject target element selector via evaluateJavascript() since evaluate() is executed within
                // the page and cannot access variables in the current scope.
                PhantomShot.evaluateJavaScript(page, "window.phantomShotTargetElement = " + JSON.stringify(this.element) + ";");
                return page.evaluate(function() {
                    return {
                        top: 0,
                        left: 0,
                        width: 300,
                        height: 300
                    };
                });
            }
        }
    }
}