var gulp        = require('gulp'),
    plumber     = require('gulp-plumber'),
    sourcemaps  = require('gulp-sourcemaps'),
    vinylPaths  = require('vinyl-paths'),
    rename      = require('gulp-rename'),
    browserSync = require('browser-sync'),
    reload      = browserSync.reload,
    cssmin      = require('gulp-minify-css'),
    imagemin    = require('gulp-imagemin'),
    size        = require('gulp-size'),
    concat      = require('gulp-concat'),
    del         = require('del'),
    uglify      = require('gulp-uglify'),
    pngquant    = require('imagemin-pngquant'),
    notify      = require('gulp-notify'),
    minifyHTML  = require('gulp-minify-html');

    runSequence = require('run-sequence');

var bases = {
    app:  'src/',
    dist: 'dist/',
};

var displayError = function(error) {
  // Initial building up of the error
  var errorString = '[' + error.plugin.error.bold + ']';
  errorString += ' ' + error.message.replace("\n",''); // Removes new line at the end

  // If the error contains the filename or line number add it to the string
  if(error.fileName)
      errorString += ' in ' + error.fileName;

  if(error.lineNumber)
      errorString += ' on line ' + error.lineNumber.bold;

  // This will output an error like the following:
  // [gulp-sass] error message in file_name on line 1
  console.error(errorString);
}

var onError = function(err) {
  notify.onError({
    title:    "Gulp",
    subtitle: "Failure!",
    message:  "Error: <%= error.message %>",
    sound:    "Basso"
  })(err);
  this.emit('end');
};

// BUILD SUBTASKS
// ---------------

gulp.task('clean:dist', function() {
  return gulp.src(bases.dist)
    .pipe(vinylPaths(del));
});

gulp.task('styles', function() {
  return gulp.src(bases.app + 'css/**/*.css')
    .pipe(plumber({errorHandler: onError}))
    .pipe(sourcemaps.init())
    .pipe(concat('styles.css'))
    //.pipe(rename('styles.css'))
    .pipe(gulp.dest(bases.dist + 'css'))
    .pipe(cssmin())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(bases.dist + 'css'))
    .pipe(reload({stream:true}))
});

gulp.task('browser-sync', function() {
  browserSync({
    server: {
      baseDir: bases.dist
    }
  });
});

gulp.task('copy', function() {

  // copy modernizr to dist directly
  gulp.src(bases.app + 'js/libs/modernizr.js')
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist + 'js/libs'))
    .pipe(reload({stream:true}));

  // copy icons to dist directly
  gulp.src(bases.app + 'icons/**/*.*')
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));

  // copy html to dist directly
  gulp.src(bases.app + '**/*.html')
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));

  // copy meta files to dist directly
  gulp.src([bases.app + '*.xml', bases.app + '*.txt'])
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));

});

gulp.task('js-app', function() {
  gulp.src(bases.app + 'js/*.js')
    .pipe(uglify())
    .pipe(size({ gzip: true, showFiles: true }))
    .pipe(concat('app.js'))
    .pipe(gulp.dest(bases.dist + 'js'))
    .pipe(reload({stream:true}));
});

gulp.task('minify-html', function() {
  var opts = {
    comments:true,
    spare:true
  };

  gulp.src(bases.app + './*.html')
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest(bases.dist))
    .pipe(reload({stream:true}));
});

gulp.task('watch', function() {
  gulp.watch(bases.app + 'css/**/*.css', ['styles']);
  gulp.watch(bases.app + './*.html', ['minify-html']);
  gulp.watch(bases.app + 'img/*', ['imagemin']);
});

gulp.task('imagemin', function() {
  return gulp.src(bases.app + 'img/*')
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(bases.dist + 'img'));
});

// BUILD TASKS
// ------------

gulp.task('default', function(done) {
  runSequence('clean:dist', 
    'browser-sync', 
    'js-app', 
    'imagemin', 
    'styles', 
    'copy', 
    'watch', 
    done);
});

gulp.task('build', 
    function(done) {
  runSequence('clean:dist', 
    'js-app', 
    'js-libs', 
    'imagemin', 
    'minify-html', 
    'styles', 
    'copy', 
    done);
});
