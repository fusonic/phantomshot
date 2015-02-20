/// <reference path="all.d.ts" />

var system = require("system");

var phantomShot = new PhantomShot.PhantomShot(system.args[1]);
phantomShot.run(() => { phantom.exit(); });
