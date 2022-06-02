const path = require('path');
const webpack = require('webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const utils = require('./lib/utils');
const nodeExternals = require('webpack-node-externals');

const babelSettings = [
	{
		loader: 'babel-loader',
		options: {
			cacheDirectory: true,
			presets: [
				__dirname + '/node_modules/@babel/preset-react',
				__dirname + '/node_modules/@babel/preset-typescript'
			],
			compact: false,
			plugins: []
		}
	}
];

module.exports = ({ entry, webappDirectoryPath, webappName, tplKey }) => {
	const webpackConfig = {
		context: path.join(webappDirectoryPath, 'views'),
		mode: 'development',
		cache: true,
		resolve: {
			modules: [path.join(webappDirectoryPath, 'node_modules')],
			extensions: utils.ssrTemplateExtensionList,
			alias: {
				'@src': path.join(webappDirectoryPath, 'static/src'),
				'@isomorphic': path.join(webappDirectoryPath, 'isomorphic')
			}
		},
		resolveLoader: {
			modules: [path.join(__dirname, 'node_modules')]
		},
		devtool: 'source-map',
		entry: entry,
		plugins: [new CaseSensitivePathsPlugin()],
		output: {
			path: webappDirectoryPath,
			filename: 'views/[name].js',
			assetModuleFilename:
				'static/deploy/ssr/' + webappName + '.assetmodule.[name][ext]',
			publicPath: '//hhy.sogoucdn.com/',
			libraryTarget: 'commonjs2'
		},
		target: ['node', 'es2022'],
		externalsPresets: { node: true },
		externals: [
			nodeExternals({
				allowlist: ['@ares/ssr/css'],
				additionalModuleDirs: [
					path.join(webappDirectoryPath, 'node_modules')
				]
			})
		],
		module: {
			rules: [
				{
					test: /\.(jpe?g|png|gif|svg|eot|ttf|woff|woff2)$/i,
					type: 'asset/resource'
				},
				{
					test: /\.css$/,
					use: [
						{
							loader: 'css-loader',
							options: {
								sourceMap: false
							}
						}
					]
				},
				utils.isomorphicCSSHashReplaceLoader,
				{
					test: /\.(js|jsx|ts|tsx)$/,
					use: babelSettings,
					exclude: [path.join(__dirname, 'node_modules')]
				}
			]
		},
		optimization: {
			splitChunks: {
				chunks: 'all',
				cacheGroups: {
					commons: {
						filename: 'views/deploy/[name].js',
						chunks: 'all',
						minChunks: 2,
						name: 'commons',
						minSize: 0
					}
				}
			},
			chunkIds: 'named',
			moduleIds: 'named'
		}
	};

	return new Promise((resolve, reject) => {
		let rebuildCompile = false;
		const compiler = webpack(webpackConfig);

		compiler.watch(
			{
				poll: 200
			},
			(err, stats) => {
				if (err) {
					reject(err);
					return;
				}

				const hasWarnings = stats.hasWarnings();
				const hasErrors = stats.hasErrors();
				const hasWarningsOrErrors = hasWarnings || hasErrors;

				let compileTimeInfo = rebuildCompile
					? stats.endTime - stats.startTime + 'ms!'
					: '';
				let buildType = rebuildCompile ? 'rebuild complete' : 'build';
				if (hasWarningsOrErrors) {
					buildType = 'WARNINGS/ERRORS';
				}
				let logStartInfo = `=== ${webappName} ssr ${buildType} start! ${compileTimeInfo} stats info: ===`;
				let logEndInfo = `=== ${webappName} ssr ${buildType} end! ===`;

				console.log(logStartInfo);
				console.log(stats.toString());
				console.log(logEndInfo);

				utils.triggerRefresh();

				if (rebuildCompile) {
					resolve();
					return;
				}

				rebuildCompile = true;
				console.log(
					`**************** ${webappName} ssr total compile time: ${
						Date.now() - global.ssrStartCompile[tplKey]
					}ms **************** `
				);
				resolve();
			}
		);
	});
};
