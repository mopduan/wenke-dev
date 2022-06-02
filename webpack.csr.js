const webpack = require('webpack');
const path = require('path');
const utils = require('./lib/utils');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const WebpackDevServer = require('webpack-dev-server');
const SpeedMeasurePlugin = require('speed-measure-webpack-plugin');
const BundleAnalyzerPlugin =
	require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = ({
	entry,
	webappDirectoryPath,
	staticJSSrcDirectory,
	staticJSDeployDirectory,
	webappName,
	tplKey
}) => {
	const webpackConfig = {
		context: staticJSSrcDirectory,
		entry: entry,
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
		target: ['web', 'es5'],
		cache: true,
		resolve: {
			modules: [path.join(__dirname, 'node_modules')],
			extensions: utils.ssrTemplateExtensionList,
			alias: {
				'@src': path.join(webappDirectoryPath, 'static/src'),
				'@isomorphic': path.join(webappDirectoryPath, 'isomorphic')
			}
		},
		resolveLoader: {
			modules: [path.join(__dirname, 'node_modules')]
		},
		devtool: 'inline-source-map',
		mode: 'development',
		stats: 'none',
		watch: true,
		watchOptions: {
			poll: 200
		}
	};

	//公用的客户端私有npm包需要从项目目录下查找依赖包
	webpackConfig.resolve.modules.push(
		path.join(webappDirectoryPath, 'node_modules')
	);

	const _presets = [
		[__dirname + '/node_modules/@babel/preset-env', { modules: false }],
		__dirname + '/node_modules/@babel/preset-typescript'
	];

	_presets.push(__dirname + '/node_modules/@babel/preset-react');

	const babelPlugins = [
		[
			__dirname + '/node_modules/@babel/plugin-proposal-decorators',
			{ legacy: true }
		]
	];

	if (global.hmr) {
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
		antd: 'antd'
	};

	const externals = global.hmr
		? defaultExternals
		: Object.assign(reactExternals, defaultExternals);

	const webpackPlugins = [
		new CaseSensitivePathsPlugin(),
		new NodePolyfillPlugin()
	];

	if (global.hmr) {
		webpackPlugins.push(new ReactRefreshWebpackPlugin());
	}

	webpackConfig.plugins = webpackPlugins;
	webpackConfig.externals = externals;
	webpackConfig.module = {
		rules: [
			{
				test: /\.(jpe?g|png|gif|svg|eot|ttf|woff|woff2)$/i,
				type: 'asset/resource'
			},
			{
				test: /\.(html|tpl)$/i,
				type: 'asset/source'
			},
			utils.isomorphicCSSHashReplaceLoader,
			{
				test: /\.css$/i,
				exclude: /\/isomorphic\//i,
				use: [
					{
						loader: 'style-loader'
					}
				]
			},
			{
				test: /\.css$/i,
				use: [
					{
						loader: 'css-loader',
						options: {
							sourceMap: false
						}
					}
				]
			}
		]
	};

	if (global.esbuild) {
		webpackConfig.module.rules.push({
			test: /\.(js|jsx)$/,
			use: [
				{
					loader: 'esbuild-loader',
					options: {
						loader: 'jsx',
						target: 'esnext'
					}
				}
			],
			exclude: [path.join(__dirname, 'node_modules')]
		});

		webpackConfig.module.rules.push({
			test: /\.(ts|tsx)$/,
			use: [
				{
					loader: 'esbuild-loader',
					options: {
						loader: 'tsx',
						target: 'esnext',
						tsconfigRaw: JSON.stringify({
							compilerOptions: {
								allowJs: true,
								checkJs: false,
								noImplicitAny: true,
								jsx: 'react',
								sourceMap: true
							}
						})
					}
				}
			],
			exclude: [path.join(__dirname, 'node_modules')]
		});
	} else {
		webpackConfig.module.rules.push({
			test: /\.(js|jsx|ts|tsx)$/,
			use: [{ loader: 'babel-loader', options: babelSettings }],
			exclude: [path.join(__dirname, 'node_modules')]
		});
	}

	let rebuildCompile = false;
	const compilerCallback = (err, stats, resolve, reject) => {
		if (err) {
			if (!reject) {
				throw err;
			}
			reject(err);
			return;
		}
		const hasWarnings = stats.hasWarnings();
		const hasErrors = stats.hasErrors();

		if (!(hasWarnings || hasErrors)) {
			if (rebuildCompile) {
				console.log(
					`=== ${webappName} csr rebuild complete start! stats info: ===`
				);
				console.log(stats.toString());
				console.log(
					`=== ${webappName} csr rebuild complete end! rebuild compile time: `,
					stats.endTime - stats.startTime + 'ms! ==='
				);
			} else {
				console.log(
					`=== ${webappName} csr build success start! stats info: ===`
				);
				console.log(stats.toString());
				console.log(`=== ${webappName} csr build success end! ===`);
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
				`**************** ${webappName} csr total compile time: ${
					Date.now() - global.startCompile[tplKey]
				}ms **************** `
			);
		}

		resolve && resolve();
	};

	const finalWebpackConfig = global.smp
		? new SpeedMeasurePlugin({
				outputTarget: smpInfo => {
					console.log(`=== ${webappName} smp info start! ===`);
					console.log(smpInfo);
					console.log(`=== ${webappName} smp info end! ===`);
				}
		  }).wrap(webpackConfig)
		: webpackConfig;

	if (global.ba) {
		finalWebpackConfig.plugins.push(
			new BundleAnalyzerPlugin({
				analyzerPort:
					global.webappDirectoryList.length === 2
						? global.multiWebappBaPorts.shift()
						: 7791
			})
		);

		return new Promise((resolve, reject) => {
			webpack(finalWebpackConfig, (err, stats) => {
				compilerCallback(err, stats, resolve, reject);
			});
		});
	}

	finalWebpackConfig.devServer = {
		hot: !!global.hmr,
		port:
			global.webappDirectoryList.length === 2
				? global.multiWebappDevServerPorts.shift()
				: 9989,
		allowedHosts: 'all'
	};

	return new WebpackDevServer(
		finalWebpackConfig.devServer,
		webpack(finalWebpackConfig, (err, stats) => {
			compilerCallback(err, stats);
		})
	).start();
};
