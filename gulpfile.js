const { src, dest, watch, parallel, series } = require('gulp');
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const sass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const newer = require('gulp-newer');
const del = require('del');
const svgSprite = require('gulp-svg-sprite');
const { deleteAsync } = require('del');

// HTML
function html() {
    return src('src/html/*.html')
        .pipe(fileInclude())
        .pipe(dest('dist'))
        .pipe(browserSync.stream());
}

// SCSS
function styles() {
    return src('src/scss/style.scss')
        .pipe(
            sass({
                includePaths: [
                    'node_modules',
                ]
            }).on('error', sass.logError)
        )
        .pipe(sass.sync().on('error', sass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(
            cleanCSS({
              level: {
                1: {
                  specialComments: 0
                },
                2: {
                  restructureRules: false
                }
              }
            })
          )
        .pipe(dest('dist/css'))
        .pipe(browserSync.stream());
}

// JS
function scripts() {
    return src([
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/popper.js/dist/umd/popper.min.js',
        'node_modules/bootstrap/dist/js/bootstrap.min.js',
        'src/js/*.js'
    ])
        .pipe(babel({ presets: ['@babel/preset-env'] }))
        .pipe(concat('main.js'))
        .pipe(uglify())
        .pipe(dest('dist/js'))
        .pipe(browserSync.stream());
}

// Images
function images() {
    return src('src/img/**/*.*')
        .pipe(newer('dist/img'))
        .pipe(imagemin())
        .pipe(dest('dist/img'));
}

// Webp
function webpImages() {
    return src('src/img/**/*.*')
        .pipe(newer('dist/img'))
        .pipe(webp())
        .pipe(dest('dist/img'));
}

// SVG Sprite
function sprite() {
    return src('src/svg/*.svg')
        .pipe(svgSprite({
            mode: {
                stack: { sprite: '../sprite.svg' }
            }
        }))
        .pipe(dest('dist/img'));
}

// Clean
function clean() {
    return deleteAsync(['dist']);
}

// Live Server
function serve() {
    browserSync.init({
        server: { baseDir: 'dist' },
        notify: false
    });

    watch('src/html/**/*.html', html);
    watch('src/scss/**/*.scss', styles);
    watch('src/js/**/*.js', scripts);
    watch('src/img/**/*.*', images);
    watch('src/svg/*.svg', sprite);
}

exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.webpImages = webpImages;
exports.sprite = sprite;
exports.clean = clean;

exports.build = series(clean, parallel(html, styles, scripts, images, webpImages, sprite));
exports.default = series(clean, parallel(html, styles, scripts, images, webpImages, sprite), serve);
