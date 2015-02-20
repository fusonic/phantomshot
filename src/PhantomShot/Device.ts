/// <reference path="../all.d.ts" />

module PhantomShot {
    export class Device {
        devicePixelRatio: number;
        height: number;
        width: number;

        constructor(config: IDevice) {
            this.devicePixelRatio = (config.devicePixelRatio ? config.devicePixelRatio : 1);
            this.height = config.height;
            this.width = config.width;
        }

        getViewportSize(): Size {
            return {
                height: this.height * this.devicePixelRatio,
                width: this.width * this.devicePixelRatio
            };
        }
    }
}
