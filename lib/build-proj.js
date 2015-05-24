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
var cwd = process.cwd();

var getFile = function(file) {
	return fs.readFileSync(file);
};

var copyFile = function(to, from) {
	fs.writeFileSync(to, getFile(from));
};

module.exports = function() {
	var configFile = fs.readJsonSync(config);
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
				src: [bootstrappingDir + 'mutation-summary.js', temp + 'tectonic.js'],
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
		}
	});

	grunt.registerTask('bootstrapping', function() {
		fs.removeSync(temp);
		fs.mkdirsSync(temp);
		copyFile(temp + 'lib.es6.d.ts', root + 'core/lib.es6.d.ts');
		copyFile(temp + 'index.html', root + 'core/playground/index.html');
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

	grunt.tasks([
		'bootstrapping',
		'concat:ts',
		'ts',
		'concat:js',
		//'babel',
		//'sourcemapcombine'
	], {}, function() {
		grunt.log.ok('Done running tasks.');
	});
};