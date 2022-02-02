const webpack = require('webpack');
const path = require('path');
const utils = require('./lib/utils');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

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
				plugins: [
					new TsconfigPathsPlugin({
						configFile: path.resolve(
							staticDirectory,
							'../tsconfig.json'
						)
					})
				],
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

		const _presets = [
			__dirname + '/node_modules/@babel/preset-env',
			__dirname + '/node_modules/@babel/preset-typescript'
		];

		if (preact) {
			_presets.push([
				__dirname + '/node_modules/@babel/preset-react',
				{ pragma: 'h' }
			]);
		} else {
			_presets.push(__dirname + '/node_modules/@babel/preset-react');
		}

		const babelPlugins = [
			[
				__dirname + '/node_modules/@babel/plugin-proposal-decorators',
				{ legacy: true }
			]
		];

		if (global.onlyReact && global.hmr) {
			babelPlugins.push(require.resolve('react-refresh/babel'));
		}

		const babelSettings = {
			cacheDirectory: true,
			presets: _presets,
			compact: false,
			plugins: babelPlugins
		};

		const reactExternals = {
			react: 'React',
			'react-dom': 'ReactDOM',
			redux: 'Redux',
			'react-redux': 'ReactRedux',
			'react-router': 'ReactRouter',
			'react-router-dom': 'ReactRouterDOM',
			'redux-thunk': 'ReduxThunk',
			immutable: 'Immutable'
		};

		const defaultExternals = {
			'preact-redux': 'preactRedux',
			preact: 'preact',
			preactHooks: 'preactHooks',
			antd: 'antd'
		};

		const externals =
			global.onlyReact && global.hmr
				? defaultExternals
				: Object.assign(reactExternals, defaultExternals);

		const webpackPlugins = [
			new CaseSensitivePathsPlugin(),
			new NodePolyfillPlugin()
		];

		if (global.onlyReact && global.hmr) {
			webpackPlugins.push(new ReactRefreshWebpackPlugin());
		}

		const config = {
			context: staticJSSrcDirectory,
			entry: entry,
			plugins: webpackPlugins,
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

		const devServerConfig = {
			hot: true,
			port: 9989,
			allowedHosts: 'all'
		};

		if (global.onlyReact && global.hmr) {
			config.devServer = devServerConfig;
		}

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
			test: /\.(js|jsx|ts|tsx)$/,
			use: [{ loader: 'babel-loader', options: babelSettings }],
			exclude: [path.join(__dirname, 'node_modules')]
		};

		config.module.rules.push(jsRules);

		const compiler = webpack(config);
		if (global.onlyReact && global.hmr) {
			new WebpackDevServer(config.devServer, compiler).start();
		} else {
			let rebuildCompile = false;
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
								console.log(
									`=== ${webappName} WARNINGS end! ===`
								);
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
								`**************** ${webappName} ${
									preact ? 'preact' : 'react'
								} total compile time: ${
									Date.now() - global.startCompile[tplKey]
								}ms **************** `
							);
						}

						resolve();
					}
				}
			);
		}
	});
};
