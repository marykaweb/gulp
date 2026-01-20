// Gulp
const { src, dest, watch, series, parallel } = require('gulp');

// Plugins
const browserSync = require('browser-sync').create();
const fileInclude = require('gulp-file-include');
const gulpSass = require('gulp-sass')(require('sass'));
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const concat = require('gulp-concat');
const terser = require('gulp-terser');
const babel = require('gulp-babel');
const imagemin = require('gulp-imagemin');
const webp = require('gulp-webp');
const newer = require('gulp-newer');
const svgSprite = require('gulp-svg-sprite');
const del = require('del');
const ttf2woff2 = require('gulp-ttf2woff2');

// Paths
const paths = {
    html: 'src/html/*.html',
    scss: 'src/scss/style.scss',
    js: 'src/js/*.js',
    images: 'src/img/**/*.*',
    svg: 'src/svg/*.svg',
    fonts: 'src/fonts/*.ttf'
};

// ========================
//        HTML
// ========================
function html() {
    return src(paths.html)
        .pipe(fileInclude())
        .pipe(dest('dist'))
        .pipe(browserSync.stream());
}

// ========================
//        FONTS
// ========================
function fonts() {
    return src(paths.fonts)
        .pipe(ttf2woff2())
        .pipe(dest('dist/fonts'));
}

// ========================
//        STYLES
// ========================
function styles() {
    return src(paths.scss)
        .pipe(gulpSass({
            includePaths: ['node_modules']
        }).on('error', gulpSass.logError))
        .pipe(autoprefixer({ cascade: false }))
        .pipe(cleanCSS({
            level: {
                1: { specialComments: 0 },
                2: { restructureRules: false }
            }
        }))
        .pipe(dest('dist/css'))
        .pipe(browserSync.stream());
}

// ========================
//     VENDOR SCRIPTS
// ========================
function vendorScripts() {
    return src([
        'node_modules/jquery/dist/jquery.min.js',
        'node_modules/popper.js/dist/umd/popper.js',     // ❗ не минифицированная версия
        'node_modules/bootstrap/dist/js/bootstrap.js'     // ❗ без .min.js для корректного Popper
    ])
        .pipe(concat('vendor.js'))
        .pipe(dest('dist/js'));
}

// ========================
//       CUSTOM SCRIPTS
// ========================
function appScripts() {
    return src(paths.js)
        .pipe(babel({ presets: ['@babel/preset-env'] }))
        .pipe(terser())
        .pipe(concat('main.js'))
        .pipe(dest('dist/js'))
        .pipe(browserSync.stream());
}

// Объединяем в одну задачу
const scripts = parallel(vendorScripts, appScripts);

// ========================
//        IMAGES
// ========================
function images() {
    return src(paths.images)
        .pipe(newer('dist/img'))
        .pipe(imagemin())
        .pipe(dest('dist/img'));
}

// WebP
function webpImages() {
    return src(paths.images)
        .pipe(newer('dist/img'))
        .pipe(webp())
        .pipe(dest('dist/img'));
}

// ========================
//        SVG SPRITE
// ========================
function sprite() {
    return src(paths.svg)
        .pipe(svgSprite({
            mode: { stack: { sprite: '../sprite.svg' } }
        }))
        .pipe(dest('dist/img'));
}

// ========================
//          CLEAN
// ========================
function clean() {
    return del(['dist']);
}

// ========================
//          SERVER
// ========================
function serve() {
    browserSync.init({
        server: { baseDir: 'dist' },
        notify: false
    });

    watch('src/html/**/*.html', html);
    watch('src/scss/**/*.scss', styles);
    watch('src/js/**/*.js', appScripts);
    watch('src/img/**/*.*', images);
    watch('src/svg/*.svg', sprite);
    watch('src/fonts/*.ttf', fonts);
}

// ========================
//         EXPORTS
// ========================
exports.html = html;
exports.styles = styles;
exports.scripts = scripts;
exports.images = images;
exports.webpImages = webpImages;
exports.sprite = sprite;
exports.fonts = fonts;
exports.clean = clean;

exports.build = series(
    clean,
    parallel(html, styles, scripts, images, webpImages, sprite, fonts)
);

exports.default = series(
    clean,
    parallel(html, styles, scripts, images, webpImages, sprite, fonts),
    serve
);
