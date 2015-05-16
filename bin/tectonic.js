#!/usr/bin/env node

// Dependencies
var program = require('commander');


var prompt = function(prompt, callback) {
	stdio.question(prompt, function(err, result) {
		callback(result);
	});
};

program.version('0.0.1')
	.option('-n, --new [value]', 'Create new Tectonic Project')
	.option('-b, --build', 'Create new Tectonic Project')
	.parse(process.argv);

if (program.new) {
	require('../lib/new-proj.js').step1(program.new);
}

if (program.build) {
	require('../lib/build-proj.js')();
}

