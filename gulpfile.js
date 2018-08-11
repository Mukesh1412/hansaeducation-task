"use strict";
var gulp = require('gulp');
var nodemon = require('gulp-nodemon');
var config = require('config');
var runSequence = require('run-sequence');

gulp.task('nodemon', function (cb) {
    var started = false;
    return nodemon({
        script: 'server.js',
        ext: 'js json',
        env: { "NODE_ENV": "development" },
        ignore: [
            'src/',
            'dist/',
            'node_modules/'
        ],
        watch: ['./src/assets','./restapp/config','./restapp/routes', './restapp/models','./restapp/services','./restapp/scoring_services','./restapp/utils', 'server.js'],
        stdout: true,
        readable: true
    }).on('start', function () {
        // to avoid nodemon being started multiple times
        if (!started) {
            cb();
            started = true;
        }
    });
});


gulp.task('default', function () {
    console.log(process.env.NODE_ENV);
    var env = process.env.NODE_ENV;
    if (!env) {
        env = 'development';
    }
    if (env === 'development') {
        runSequence('nodemon');
    } else {
    }
}); 