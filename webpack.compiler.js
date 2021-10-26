const webpack = require('webpack');
const path = require('path');
const utils = require('./lib/utils');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = ({
	entry,
	webappDirectoryPath,
	staticDirectory,
	staticJSSrcDirectory,
	staticJSDeployDirectory,
	webappName,
	tplKey,
	preact
}) => {
	return new Promise((resolve, reject) => {
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

		if (preact) {
			commonConfig.resolve.alias['react'] = 'preact-compat';
			commonConfig.resolve.alias['react-dom'] = 'preact-compat';
		}

		//公用的客户端私有npm包需要从项目目录下查找依赖包
		commonConfig.resolve.modules.push(
			path.join(webappDirectoryPath, 'node_modules')
		);

		const _presets = [__dirname + '/node_modules/@babel/preset-env'];

		if (preact) {
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
					__dirname +
						'/node_modules/@babel/plugin-proposal-decorators',
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

		const config = {
			context: staticJSSrcDirectory,
			entry: entry,
			plugins: [new NodePolyfillPlugin()],
			output: {
				chunkLoadingGlobal: utils.uniqueVal(),
				path: staticJSDeployDirectory,
				filename: '[name].js',
				assetModuleFilename: webappName + '.assetmodule.[name][ext]',
				chunkFilename: webappName + '.[name].chunk.bundle.js',
				publicPath: 'auto'
			},
			optimization: {
				chunkIds: 'named',
				moduleIds: 'named'
			},
			target: ['web', 'es5']
		};

		config.externals = externals;
		config.module = {
			rules: [
				{
					test: /\.(jpe?g|png|gif|svg|eot|ttf|woff|woff2)$/i,
					type: 'asset/resource'
				},
				{
					test: /\.(html|tpl)$/i,
					type: 'asset/source'
				},
				{
					test: /\.css$/i,
					use: [
						{
							loader: 'style-loader'
						},
						{
							loader: 'css-loader'
						}
					]
				}
			]
		};

		Object.assign(config, commonConfig);

		const jsRules = {
			test: /\.(js|jsx)$/,
			use: [{ loader: 'babel-loader', options: babelSettings }],
			exclude: [path.join(__dirname, 'node_modules')]
		};

		const tsRules = {
			test: /\.tsx?$/,
			use: [
				// tsc编译后，再用babel处理
				{ loader: 'babel-loader', options: babelSettings },
				{
					loader: 'ts-loader',
					options: {
						transpileOnly: true, // discard semantic checker & faster builds
						configFile: path.resolve(
							staticDirectory,
							'../tsconfig.json'
						) // 各个项目独立配置   用于 ts server 代码检查
					}
				}
			]
		};

		config.module.rules.push(jsRules);
		config.module.rules.push(tsRules);

		let rebuildCompile = false;
		const compiler = webpack(config);

		compiler.watch(
			{
				poll: 200
			},
			(err, stats) => {
				if (err) {
					reject(err);
				} else {
					const hasWarnings = stats.hasWarnings();
					const hasErrors = stats.hasErrors();

					if (!(hasWarnings || hasErrors)) {
						if (rebuildCompile) {
							console.log(
								`=== ${webappName} rebuild complete start! `,
								stats.endTime -
									stats.startTime +
									'ms! stats info: ==='
							);
							console.log(stats.toString());
							console.log(
								`=== ${webappName} rebuild complete end! ===`
							);
							utils.triggerRefresh();
						} else {
							console.log(
								`=== ${webappName} build success start! stats info: ===`
							);
							console.log(stats.toString());
							console.log(
								`=== ${webappName} build success end! ===`
							);
						}
					} else {
						if (hasWarnings) {
							console.log(
								`=== ${webappName} WARNINGS start! stats info: ===`
							);
							console.log(stats.toString());
							console.log(`=== ${webappName} WARNINGS end! ===`);
						}

						if (hasErrors) {
							console.log('=== ERRORS start ===');
							console.log(stats.toString());
							console.log('=== ERRORS end ===');
						}
					}

					if (!rebuildCompile) {
						rebuildCompile = true;
						console.log(
							`**************** ${webappName} total compile time: ${
								Date.now() - global.startCompile[tplKey]
							}ms **************** `
						);
					}

					resolve();
				}
			}
		);
	});
};
