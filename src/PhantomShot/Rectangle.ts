/// <reference path="../all.d.ts" />

module PhantomShot {
    export class Rectangle implements IRegion, ClipRect {
        top: number;
        left: number;
        width: number;
        height: number;

        constructor(device: Device, config?: IRegion) {
            this.top = (config && config.top ? config.top : 0);
            this.left = (config && config.left ? config.left : 0);
            this.width = (config && config.width ? config.width : device.width);
            this.height = (config && config.height ? config.height : device.height);
        }
    }
}
