/// <reference path="../all.d.ts" />

module PhantomShot {
    export interface IScreenshot {
        id: string;
        url: string;
        delay?: number;
        device: string;
        region?: IRegion;
        element?: string;
        inject?: string;
    }
}
