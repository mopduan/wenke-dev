const gulp = require('gulp');
const less = require('gulp-less');
const postcss = require('gulp-postcss');
const autoprefixer = require('autoprefixer');
const rename = require('gulp-rename');

gulp.task('build:app', function () {
    gulp.src(['src/**/*', '!src/style{,/**}', '!src/app.less'], { base: 'src' })
        .pipe(gulp.dest('dist'));
});

gulp.task('build:style', function () {
    console.log('');

    return gulp.src(['src/app.less'], { base: 'src' })
        .pipe(less())
        .pipe(postcss([autoprefixer(['iOS >= 7', 'Android >= 4.1'])]))
        .pipe(rename(function (path) {
            path.extname = '.wxss';
        }))
        .pipe(gulp.dest('dist'))
});

gulp.task('watch', function () {
    gulp.watch(['src/**/*'], ['build:style', 'build:app'], function () {
        console.log(arguments)
    });
});

gulp.task('default', ['build:style', 'build:app', 'watch']);
gulp.start();