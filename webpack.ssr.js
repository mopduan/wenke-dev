const path = require('path');
const webpack = require('webpack');
const CaseSensitivePathsPlugin = require('case-sensitive-paths-webpack-plugin');
const utils = require('./lib/utils');

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
			modules: [path.join(__dirname, 'node_modules')],
			extensions: ['.js', '.jsx', '.ts', '.tsx'],
			alias: {}
		},
		resolveLoader: {
			modules: [path.join(__dirname, 'node_modules')]
		},
		devtool: 'source-map',
		plugins: [],
		entry: entry,
		plugins: [new CaseSensitivePathsPlugin()],
		output: {
			path: path.join(webappDirectoryPath, 'views'),
			filename: '[name].js'
		},
		target: ['node'],
		module: {
			rules: [
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
						filename: 'deploy/[name].js',
						chunks: 'initial',
						minChunks: 2,
						name: 'commons',
						maxInitialRequests: 5,
						minSize: 0 // 默认是30kb，minSize设置为0之后
						// 多次引用的utility1.js和utility2.js会被压缩到commons中
					},
					reactlib: {
						filename: 'deploy/[name].js',
						test: module => {
							return /react|redux|prop-types/.test(
								module.context
							);
						}, // 直接使用 test 来做路径匹配，抽离react相关代码
						chunks: 'initial',
						name: 'reactlib',
						priority: 10
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

				if (!(hasWarnings || hasErrors)) {
					if (rebuildCompile) {
						console.log(
							`=== ${webappName} ssr rebuild complete start! `,
							stats.endTime -
								stats.startTime +
								'ms! stats info: ==='
						);
						console.log(stats.toString());
						console.log(
							`=== ${webappName} ssr rebuild complete end! ===`
						);
						utils.triggerRefresh();
					} else {
						console.log(
							`=== ${webappName} ssr build success start! stats info: ===`
						);
						console.log(stats.toString());
						console.log(
							`=== ${webappName} ssr build success end! ===`
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
						`**************** ${webappName} ssr total compile time: ${
							Date.now() - global.ssrStartCompile[tplKey]
						}ms **************** `
					);
				}

				resolve();
			}
		);
	});
};
