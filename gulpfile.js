var gulp = require("gulp");
var ts = require("gulp-typescript");
var concat = require("gulp-concat");
var sourcemaps = require("gulp-sourcemaps");
var uglify = require("gulp-uglifyjs");

gulp.task("build", function() {
    var tsResult = gulp.src("src/**/*.ts")
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(ts({
            sortOutput: true
        }));

    return tsResult.js
        .pipe(concat("phantomshot.js"))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest("dist"))
        .pipe(uglify("phantomshot.min.js"))
        .pipe(gulp.dest("dist"));
});

gulp.task("watch", function() {
    gulp.start("build");
    gulp.watch("./src/**/*.ts", ["build"]);
});
