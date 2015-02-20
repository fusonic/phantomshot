/// <reference path="../all.d.ts" />

module PhantomShot {
    export interface IDevice
    {
        id: string;
        width?: number;
        height?: number;
        devicePixelRatio?: number;
    }
}
