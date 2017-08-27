// @file
// Gulpfile.

'use strict';

// Fixes max listeners.
process.stdin.setMaxListeners(0);

var gulp = require('gulp');
var twig = require('gulp-twig');
var sass = require('gulp-sass');
var rename = require('gulp-rename');
var source = require('vinyl-source-stream');
var browserify = require('browserify');
var babelify = require('babelify');
var shell = require('gulp-shell');
var lame = require('lame');
var projects = require('./config/projects');
var cmd = require('./config/cmd');

// Patch in name finding ability.
// @see https://stackoverflow.com/questions/27161903/how-to-get-task-name-inside-task-in-gulp
gulp.Gulp.prototype.__runTask = gulp.Gulp.prototype._runTask;
gulp.Gulp.prototype._runTask = function(task) {
  this.currentTask = task;
  this.__runTask(task);
};

// Build tasks.
var projectTasks = [];
for (var i in projects) {
  var audio = [],
  audioConfig = (
    projects[i].hasOwnProperty('audioConfig') ?
    projects[i].audioConfig :
    {}
  );
  for (var a in projects[i].sounds) {
    var task = 'audio.' + i + '.' + a;
    gulp.task(task, function() {
      var bits = this.currentTask.name.split('.'),
      projectId = bits[1],
      audioId = bits[2],
      audioName = projects[projectId].sounds[audioId].source,
      audioModes = {};
      audioModes[lame.MONO] = 'm';
      audioModes[lame.STEREO] = 's';
      audioModes[lame.JOINTSTEREO] = 'j';
      audioModes[lame.DUALMONO] = 'd';
      return gulp.src('./src/samples/' + projectId + '/' + audioName)
      .pipe(shell([
        cmd.lame + ' -S ' +
          ' -b ' + audioConfig.bitRate +
          ' -m ' + audioModes[audioConfig.mode] +
          ' --resample ' + (audioConfig.outSampleRate / 1000) +
          ' <%= file.path %>' +
          ' ./build/' + i + '/' + audioId + '.mp3'
      ]));
      // .pipe(rename())
      // .pipe(gulp.dest('./build/' + i));
    });
    audio.push(task);
  }

  gulp.task('project.' + i + '.html', function() {
    var bits = this.currentTask.name.split('.'),
    projectId = bits[1];
    return gulp.src('./src/project.html')
    .pipe(twig({
      data: {
        project_id: projectId,
        project: projects[projectId]
      },
      filters: [
        {
          name: 'escaped_json',
          func: function(input) {
            return Buffer.from(
              !!input ?
              JSON.stringify(input) : 
              'null'
            ).toString('base64');
          }
        }
      ]
    }))
    .pipe(rename(i + '.html'))
    .pipe(gulp.dest('./build'));
  });
  gulp.task('project.' + i + '.audio', audio);
  gulp.task('project.' + i, [
    'project.' + i + '.html',
    'project.' + i + '.audio'
  ]);
  projectTasks.push('project.' + i);
}

gulp.task('css', function() {
  return gulp.src('./src/sass/index.scss')
  .pipe(sass())
  .pipe(rename('app.css'))
  .pipe(gulp.dest('./build'));
});

gulp.task('js', function() {
  return browserify({
    entries: ['./src/js/index.js'],
    extensions: ['.js']
  })
  .transform(babelify, {
    presets: ['flow', 'env']
  })
  .bundle()
  .pipe(source('app.js'))
  .pipe(gulp.dest('./build'));
});

gulp.task('index.html', function() {
  return gulp.src('./src/index.html')
  .pipe(twig({
    data: {
      projects: projects
    }
  }))
  .pipe(rename('index.html'))
  .pipe(gulp.dest('./build'));
});

gulp.task('build', ['css', 'js', 'index.html'].concat(projectTasks));
gulp.task('default', ['build']);
