var exec = require('child_process').exec;
var fs = require('fs-extra');
var grunt = require('grunt');

var root = __dirname + '/../';
var temp = root + 'temp/';
var config = root + 'TectonicConfig.json';
var guiClass = root + 'core/Gui.ts';

var getFile = function(file) {
	return fs.readFileSync(file);
};

module.exports = function() {
	var configFile = fs.readJsonSync(config);
	var concatTS = "";
	fs.removeSync(temp);
	fs.mkdirsSync(temp);
	configFile.components.forEach(function(component){
		concatTS += '\n\n' + getFile(root + 'core/components/' + component);
	});
	concatTS = getFile(guiClass) + '\n\nmodule Gui {\n' + getFile(root + 'core/Utils.ts') + '\n' + getFile(root + 'core/Dom.ts') + '\n' + getFile(root + 'core/Pipes.ts') + concatTS + '\n}\n' + getFile(root + 'core/bootstrapping/footer.js');
	fs.writeFile(temp + 'tectonic.ts', concatTS, function (err,data) {
		if (err) {
			return console.log(err);
		}
		exec('tsc --target es6 --declaration ' + temp + 'tectonic.ts', function(error, stdout, stderr) {
			console.log('stdout: ' + stdout);
			console.log('stderr: ' + stderr);
			if (error !== null) {
				console.log('exec error: ' + error);
			}
			var tectonicJS = getFile(temp + 'tectonic.js');
			tectonicJS = '"use strict";\n\n' + getFile(root + 'core/bootstrapping/mutation-summary.js') + tectonicJS + '';
			tectonicJS.replace(/include\s?\(\s?('|")(.*?)\1\s?\)\s?;?/gi, function(str, quote, filename){
				return filename;
			});
			fs.writeFileSync(temp + 'tectonic.js', tectonicJS);
			fs.writeFileSync(temp + 'index.html', getFile(root + 'core/playground/index.html'));
		});
	});


};