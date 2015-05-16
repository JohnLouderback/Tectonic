var stdio = require('stdio');
var clr = require('cli-color');
var fs = require("fs");
var jf = require('jsonfile');

var newProjConfig = {
	name: "",
	components: [
		"example.ts"
	]
};

// Colors
var info = clr.green;
var infoHighlight = clr.green.underline;
var error = clr.red;
var errorHighlight = clr.red.underline;

var newProjSteps = {
	step1: function(projName) {
		if(projName && /^[\w.-]+$/.test(projName)) {
			newProjConfig.name = projName;
			console.log(info('Creating new project directory "') + infoHighlight(projName) + info('".'));
			if(!fs.existsSync("./" + projName)){
				fs.mkdir("./" + projName, 0766, function(err){
					if(err){
						console.log(error(err));
						console.log(error("Can't make the directory!"));
					} else {
						console.log(info('Writing \"') + infoHighlight('TectonicConfig.json') + info('".'));
						jf.writeFile("./" + projName + "/TectonicConfig.json", newProjConfig, function(err) {
							if (err) {
								console.log(error(err));
								console.log(error("Can't write the file!"));
							}
						});
						console.log(info("Creating components directory."));
						fs.mkdir("./" + projName + "/components", 0766, function(err){
							if(err){
								console.log(error(err));
								console.log(error("Can't make the directory!"));
							}
						});
					}
				});
			} else {
				console.log(error('The directory "') + errorHighlight(projName) + error('" exists. Please delete if necessary.'));
			}
		} else if (projName) {
			console.log(error('"') + errorHighlight(projName) + error('" is not a valid project name. Make sure to use alphanumeric character and dashes only.'));
			newProjSteps.step1();
		} else {
			prompt('Enter a valid project name', newProjSteps.step1);
		}
	}
};

module.exports = newProjSteps;