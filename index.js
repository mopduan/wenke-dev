const path = require('path');
const utils = require('./lib/utils');
const validate = require('./lib/validate');
const chokidar = require('chokidar');
const uglifyIe8tips = require('./ie8.uglify');
const stylesCompiler = require('./style-compiler/index');

global.srcPrefix = '/src/';
global.deployPrefix = '/deploy/';
global.localStaticResourcesPrefix = /\/sf/;
global.sfPrefix = '/sf/';

module.exports = async function (program) {
	const programArguments = program._optionValues;

	if (programArguments.ie8tips) {
		uglifyIe8tips(programArguments.ie8tips);
		return;
	}

	const { entryList } = validate(programArguments);

	if (programArguments.style) {
		await stylesCompiler(programArguments);
	}

	const commonConfig = {
		cache: true,
		resolve: {
			modules: [path.join(__dirname, 'node_modules')],
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			alias: {}
		},
		resolveLoader: {
			modules: [path.join(__dirname, 'node_modules')]
		},
		devtool: 'inline-source-map',
		mode: 'development'
	};

	if (programArguments.preact) {
		commonConfig.resolve.alias['react'] = 'preact-compat';
		commonConfig.resolve.alias['react-dom'] = 'preact-compat';
	}

	//公用的客户端私有npm包需要从项目目录下查找依赖包
	commonConfig.resolve.modules.push(
		path.join(programArguments.staticFilesDirectory, '../node_modules')
	);

	const _presets = [__dirname + '/node_modules/@babel/preset-env'];

	if (programArguments.preact) {
		_presets.push([
			__dirname + '/node_modules/@babel/preset-react',
			{ pragma: 'h' }
		]);
	} else {
		_presets.push(__dirname + '/node_modules/@babel/preset-react');
	}

	const babelSettings = {
		cacheDirectory: true,
		presets: _presets,
		compact: false,
		plugins: [
			[
				__dirname + '/node_modules/@babel/plugin-proposal-decorators',
				{ legacy: true }
			]
		]
	};

	const externals = {
		react: 'React',
		'react-dom': 'ReactDOM',
		redux: 'Redux',
		'react-redux': 'ReactRedux',
		'react-router': 'ReactRouter',
		'react-router-dom': 'ReactRouterDOM',
		'preact-redux': 'preactRedux',
		'redux-thunk': 'ReduxThunk',
		immutable: 'Immutable',
		preact: 'preact',
		preactHooks: 'preactHooks',
		antd: 'antd'
	};

	const {
		staticDirectory,
		srcPrefix,
		deployPrefix,
		webappDirectoryList,
	} = global;

	require('./webpack.compiler')({
		entryList,
		externals,
		commonConfig,
		babelSettings,
		staticDirectory,
		srcPrefix,
		deployPrefix
	},
		() => {
			console.log(
				`**************** total compile time: ${Date.now() - global.startCompile
				}ms ****************`
			);

			if (!utils.hasArgument(process.argv, '--norefresh')) {
				const templateWatchFiles = [];

				webappDirectoryList.forEach(function (
					webappViewSrcDir
				) {
					templateWatchFiles.push(
						path.join(webappViewSrcDir + '/**/*.html')
					);
					templateWatchFiles.push(
						path.join(webappViewSrcDir + '/**/*.njk')
					);
				});

				console.log('templateWatchFiles List: ');
				console.log(templateWatchFiles);
				utils.startWebSocketServer();
				chokidar
					.watch(templateWatchFiles)
					.on('change', utils.triggerRefresh)
					.on('unlink', utils.triggerRefresh);
			} else {
				console.log('status: norefresh');
			}
		}
	);
};
