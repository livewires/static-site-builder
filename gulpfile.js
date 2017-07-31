const autoprefixer  = require('gulp-autoprefixer');
const del           = require('del');
const gulp          = require('gulp');
const markdown      = require('metalsmith-markdown');
const metalsmith    = require('gulp-metalsmith');
const sass          = require('gulp-sass');
const sassGlob      = require('gulp-sass-glob');
const liveServer    = require('live-server');
const source        = require('vinyl-source-stream');
const sourcemaps    = require('gulp-sourcemaps');
const surge         = require('gulp-surge');
const templates     = require('metalsmith-templates');

// Paths
const paths = {
  src: `${__dirname}/src`,
  content: `${__dirname}/content`,
  templates: `${__dirname}/templates`,
  dest: `${__dirname}/build`
};

// Deploy location:
const surgeURL = 'https://lw-dev.surge.sh';

//---
// Empty temp folders
function clean() {
  return del([paths.dest]);
}

function server() {
  var params = {
    port: 8080,
    root: "build",
    open: false,
    wait: 500, 
    logLevel: 2
  };
  liveServer.start(params);
}

function style() {
  // Look at replacing a lot of this with postCSS
  return gulp.src(`${paths.src}/**/*.scss`)
    .pipe(sassGlob())
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: 'compressed'
    }).on('error', swallowError))
    .pipe(autoprefixer())
    .pipe(sourcemaps.write('./'))
    .pipe(gulp.dest(`${paths.dest}/assets/`));
}

function img() {
  return gulp.src(`${paths.src}/img/**/*`)
    .pipe(gulp.dest(`${paths.dest}/img`));
}

function swallowError (error) {
  console.log(error.toString())
  this.emit('end')
}

function metal() {
  return gulp.src(`${paths.content}/**`)
    .pipe(metalsmith({
      use: [
        markdown(),
        templates({
          engine: 'handlebars',
          partials: {
            header: 'partials/_header',
            footer: 'partials/_footer'
          }
        })
      ]
    }))
    .pipe(gulp.dest(paths.dest));
}

//---
// Deploy to surge
function deploy() {
  return surge({
    project: paths.dest,
    domain: surgeURL
  });
}

//---
// Watch
function watch() {
  server();
  gulp.watch([`${paths.src}/**/*.scss`], style);
  gulp.watch([`${paths.src}/img/**/*`], img);
  gulp.watch([`${paths.content}/**/*.md`, `${paths.templates}/**`], metal);
}

const compile = gulp.series(clean, gulp.parallel(style, img, metal));
// const linter = gulp.series(sassLinter, jsLinter);

gulp.task('dev', gulp.series(compile, watch));
gulp.task('deploy', gulp.series(compile, deploy));
// gulp.task('deploy', gulp.series(linter, compile, staticBuild, deploy));
// gulp.task('dist', gulp.series(linter, compile, buildDistAssets, staticBuild, deploy, clean));
// gulp.task('lint', gulp.series(linter));
