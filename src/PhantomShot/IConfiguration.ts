/// <reference path="../all.d.ts" />

module PhantomShot {
    export interface IConfiguration {
        baseUrl: string;
        format: string;
        outDir: string;
        devices: IDevice[];
        shots: IScreenshot[];
        login: ILogin;
    }
}
