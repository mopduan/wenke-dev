exports = module.exports = function () {
    const less = require('gulp-less');
    const postcss = require('gulp-postcss');
    const autoprefixer = require('autoprefixer');
    const rename = require('gulp-rename');
    const gulp = require('gulp');

    function buildApp() {
        gulp.src(['src/**/*', '!src/style{,/**}', '!src/app.less'], { base: 'src' })
            .pipe(gulp.dest('dist')).on('end', function () {
                console.log('build:app complete!');
            });
    }



    function buildStyle() {
        return gulp.src(['src/app.less'], { base: 'src' })
            .pipe(less())
            .pipe(postcss([autoprefixer(['iOS >= 7', 'Android >= 4.1'])]))
            .pipe(rename(function (path) {
                path.extname = '.wxss';
            }))
            .pipe(gulp.dest('dist')).on('end', function () {
                console.log('build:style complete!');
            });
    }


    function gulpWatch() {
        gulp.watch(['src/**/*'], ['build:style', 'build:app']).on('change', function () {
            console.log('files change...');
        });
    }


    //gulp.task('default', gulp.parallel('build:style', 'build:app', 'watch'));
    gulp.parallel(buildStyle, buildApp, gulpWatch)();
}