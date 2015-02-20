var gulp = require('gulp');
var ts = require('gulp-typescript');
var concat = require('gulp-concat');
var sourcemaps = require('gulp-sourcemaps');

gulp.task('build', function() {
    var tsResult = gulp.src('src/phantomshot.ts')
        .pipe(sourcemaps.init()) // This means sourcemaps will be generated
        .pipe(ts({
            sortOutput: true
        }));

    return tsResult.js
        .pipe(concat('phantomshot.js')) // You can use other plugins that also support gulp-sourcemaps
        .pipe(sourcemaps.write()) // Now the sourcemaps are added to the .js file
        .pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
    gulp.start('build');
    gulp.watch('./src/**/*.ts', ['build']);
});
