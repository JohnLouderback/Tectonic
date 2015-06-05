var exec = require('child_process').exec;
var fs = require('fs-extra');
var grunt = require('grunt');
var sorcery = require( 'sorcery' );

var root = __dirname + '/../';
var core = root + 'core/';
var bootstrappingDir = core + 'bootstrapping/';
var temp = root + 'temp/';
var config = root + 'TectonicConfig.json';
var guiClass = root + 'core/App.ts';
var cwd = process.cwd() + '/';
var userConfig = cwd + 'TectonicConfig.json';

var getFile = function(file) {
	return fs.readFileSync(file);
};

var copyFile = function(to, from, overwrite) {
	var overwrite = overwrite || true;
	if (!fs.existsSync(to) || overwrite) {
		fs.writeFileSync(to, getFile(from));
	} else {
		console.log('Did not write "' + to + '" because it already exists');
	}
};

module.exports = function() {
	var configFile = fs.readJsonSync(config);
	var userConfigFile = fs.readJsonSync(userConfig);
	var concatTS = [];
	process.chdir(root);

	grunt.task.init = function() {};

	grunt.initConfig({
		// Contatanation task
		concat: {
			options: {
				separator: '\n////////////////////////////////\n',
				sourceMap: true
			},
			//  Typescript concatanation
			ts: {
				src: concatTS,
				dest: temp + 'tectonic.ts'
			},
			js: {
				src: [bootstrappingDir + 'polyfills.js', bootstrappingDir + 'mutation-summary.js', temp + 'tectonic.js'],
				dest: temp + 'tectonic.js'
			}
		},
		// Tyepscript compilation
		ts: {
			options: {
				declaration: true,
				compiler: root + 'node_modules/typescript/bin/tsc',
				target: 'es5'
			},
			default : {
				src: [temp + 'tectonic.ts']
			}
		},
		babel: {
			options: {
				sourceMap: true,
				//inputSourceMap: temp + 'tectonic.js.map',
				stage: 0
			},
			dist: {
				files: {
					src: temp + 'tectonic.js',
					dest: temp + 'tectonic.js'
				}
			}
		},
		copy: {
			temp: {
				expand: true,
				cwd: temp,
				src: '*',
				dest: cwd + 'tectonic/'
			},
			modules: {
				expand: true,
				cwd: core + 'modules',
				src: '**/*',
				dest: temp + 'modules/'
			}
		},
		browserify: {
			dist: {
				cwd: core + 'modules',
				files: {
					'**/*': '**/*'
				},
				src: temp + 'tectonic.js',
				dest: temp + 'tectonic.js'
			}
		}
	});

	grunt.registerTask('bootstrapping', function() {
		fs.removeSync(temp);
		fs.mkdirsSync(temp);
		copyFile(temp + 'lib.es6.d.ts', core + 'lib.es6.d.ts');
		copyFile(temp + 'playground.html', core + 'playground/index.html');
		concatTS.push(
			guiClass,
			bootstrappingDir + 'header.ts',
			core + 'Utils.ts',
			core + 'Dom.ts',
			core + 'Pipes.ts'
		);
		configFile.components.forEach(function(component){
			concatTS.push(core + 'components/' + component);
		});
		userConfigFile.components.forEach(function(component){
			concatTS.push(cwd + 'components/' + component);
		});
		concatTS.push(bootstrappingDir + 'footer.ts');
		console.log(concatTS);
	});

	grunt.registerTask('sourcemapcombine', function() {
		var done = this.async();
		var chain = sorcery.loadSync(temp + 'tectonic.ts');
		chain.write(temp + 'output.js').then(function(){
			console.log('test');
			done();
		});
	});

	grunt.loadNpmTasks("grunt-ts");
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks("grunt-babel");
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-browserify');

	grunt.tasks([
		'bootstrapping',
		'concat:ts',
		'ts',
		'concat:js',
		'copy:modules',
		//'browserify',
		'copy:temp',
		//'babel',
		//'sourcemapcombine'
	], {}, function() {
		grunt.log.ok('Done running tasks.');
	});
};