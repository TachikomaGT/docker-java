'use strict';

const // Gulp modules
    gulp = require('gulp'),
    through = require('through2'),
    File = require('vinyl');

const // Node modules
    fs = require('fs'),
    path = require('path');

const // Template engine
    Mustache = require('mustache');

gulp.task('build-dockerfiles', function () {

    /**
     * Takes root directory and builds Dockerfile's based on a docker.json config inside separates directories and it's templates
     * @param config task config
     */
    function buildDockerDir(config) {
        return through.obj(function (file, encoding, callback) {

            // Check if passed file is a Dockerfile directory with config inside
            if (file.stat.isDirectory() && fs.existsSync(path.join(file.path, config.settingsName))) {

                const dockerDir = file.path;
                console.info("Found docker dir: " + dockerDir);

                const current = JSON.parse(fs.readFileSync(path.join(dockerDir, config.settingsName), 'UTF-8'));
                const templatePath = path.join(config.templateDir, current.template + '.' + config.templateExt);
                const template = fs.readFileSync(templatePath, 'UTF-8');
                const rendered = Mustache.render(template, current.settings);

                // pass to pipeline
                this.push(new File({
                    cwd: file.cwd,
                    base: file.base,
                    path: path.join(dockerDir, "Dockerfile"),
                    contents: new Buffer(rendered)
                }));
            }

            callback();
        });
    }

    const settings = {
        settingsName: 'docker.json',            // Docker file template configuration
        templateDir: './dockerfile-templates/', // Directory with templates
        templateExt: 'dcfg'                     // Template file extension
    };

    return gulp.src('*')
        .pipe(buildDockerDir(settings))
        .pipe(gulp.dest('./'));
});

gulp.task('default', ['build-dockerfiles']);
