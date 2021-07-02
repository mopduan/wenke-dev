const fs = require('fs');
const path = require('path');
const UglifyJS = require('uglify-js');

module.exports = function (ie8tipsDir) {
	if (!fs.existsSync(ie8tipsDir)) {
		throw new Error('can not find this dir' + ie8tipsDir);
	}

	const filePath = path.join(ie8tipsDir, './ie8tips.js');
	const deployFolder = path.join(ie8tipsDir, './deploy');
	const start = Date.now();
	console.log('start uglify ie8tips.js');
	const result = UglifyJS.minify(fs.readFileSync(filePath, 'utf8'));
	console.log(`uglify ie8tips.js finish, cost ${Date.now() - start}ms`);

	if (result.error) {
		throw new Error('ugligy error:' + result.error);
	} else if (result.code) {
		if (!fs.existsSync(deployFolder)) {
			console.log('mkdir:' + deployFolder);
			fs.mkdirSync(deployFolder);
		}
		fs.writeFileSync(
			path.join(deployFolder, './ie8tips.bundle.js'),
			result.code
		);
		console.log(
			'ugligy success! bundled file path:' +
				path.join(deployFolder, './ie8tips.bundle.js')
		);
	}
};
