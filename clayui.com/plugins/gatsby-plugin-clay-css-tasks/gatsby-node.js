/**
 * SPDX-FileCopyrightText: © 2018 Liferay, Inc. <https://liferay.com>
 * SPDX-License-Identifier: BSD-3-Clause
 */

const fs = require('fs');
const path = require('path');
const sass = require('sass');
const sassdoc = require('sassdoc');

const aliases = require('./clay-icon-aliases');

// For autogenerated files in `/static/js`

const buildJson = (array, aliasesMap) => {
	let json = '[\n';

	for (let i = 0; i < array.length; i++) {
		let aliases = aliasesMap[array[i]];

		json += '    {\n';
		json += `        "name": "${array[i]}",\n`;
		json += '        "aliases": [';

		if (!aliases) {
			aliases = '""';
		}

		json += `${aliases}]\n`;

		if (i === array.length - 1) {
			json += '    }\n';
		} else {
			json += '    },\n';
		}
	}

	json += ']';

	return json;
};

// Compiles SVG icons in directory `clay-css/src/images/icons` into
// `static/images/icons/icons.svg` spritemap. This also autogenerates
// `static/js/flags-autogenerated.json` and `static/js/icons-autogenerated.json`
// used for search in `icons.html`.

const generateFiles = (pluginOptions) => {
	const REGEX_FILE_EXT_SVG = /(?:flags-|\.svg$)/g;
	const REGEX_HTML_COMMENTS = /<!--(?:.+?)-->\n?/gs;
	const REGEX_SVG_TAG = /(?:<\/svg|<svg[^>]+)>(?:\n|)/g;
	const REGEX_SVG_VIEWBOX = /\bviewBox="[^"]+"/g;

	const filesArr = fs.readdirSync(pluginOptions.clayCssSrcIcons);

	const flagIconsArr = [];
	const svgIconsArr = [];

	let strSprite = `<?xml version="1.0" encoding="UTF-8"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd"><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">`;

	filesArr.forEach((file) => {
		let icon = fs
			.readFileSync(
				path.join(pluginOptions.clayCssSrcIcons, file),
				'utf8'
			)
			.toString();

		const id = file.replace(REGEX_FILE_EXT_SVG, '').toLowerCase();

		const viewBox = icon.match(REGEX_SVG_VIEWBOX);

		try {
			if (!viewBox) {
				throw `Viewbox attribute not found for icon: ${id}`;
			}
		} catch (error) {
			console.warn(error);
		}

		const symbol = `<symbol id="${id}" ${viewBox}>`;

		icon = icon.replace(REGEX_HTML_COMMENTS, '');
		icon = icon.replace(REGEX_SVG_TAG, '');

		strSprite += `${symbol}${icon}</symbol>`;

		// For autogenerate files

		if (aliases.flagsData[id]) {
			flagIconsArr.push(id);
		} else {
			svgIconsArr.push(id);
		}
	});

	strSprite += '</svg>';

	fs.writeFileSync(
		path.join(pluginOptions.clayuiStatic, 'images', 'icons', 'icons.svg'),
		strSprite
	);

	fs.writeFileSync(
		path.join(pluginOptions.clayuiStatic, 'js', 'flags-autogenerated.json'),
		buildJson(flagIconsArr, aliases.flagsData)
	);

	fs.writeFileSync(
		path.join(pluginOptions.clayuiStatic, 'js', 'icons-autogenerated.json'),
		buildJson(svgIconsArr, aliases.iconsData)
	);
};

// Compiles and writes `atlas.css` and `base.css` files to `/static/css/`

const compileSass = (options) => {
	return sass.renderSync({
		data: options.data,
		file: options.file,
		includePaths: options.includePaths,
		outFile: options.outFile,
		outputStyle: 'compressed',
		sourceMap: true,
		sourceMapContents: true,
	});
};

const generateCSSFiles = (pluginOptions) => {
	const cssDir = path.join(pluginOptions.clayuiStatic, 'css');
	const scssDir = path.join(pluginOptions.clayCssSrc, 'scss');
	const clayuiSrcDir = path.join(pluginOptions.clayuiSrc, 'styles');

	const atlas = compileSass({
		file: path.join(scssDir, 'atlas.scss'),
		outFile: path.join(cssDir, 'atlas.css'),
	});

	const base = compileSass({
		file: path.join(scssDir, 'base.scss'),
		outFile: path.join(cssDir, 'base.css'),
	});

	const cadmin = compileSass({
		file: path.join(scssDir, 'cadmin.scss'),
		outFile: path.join(cssDir, 'cadmin.css'),
	});

	const colors = compileSass({
		file: path.join(clayuiSrcDir, 'colors.scss'),
		includePaths: [scssDir],
		outFile: path.join(cssDir, 'colors.css'),
	});

	const colorsBase = compileSass({
		file: path.join(clayuiSrcDir, 'colors-base.scss'),
		includePaths: [scssDir],
		outFile: path.join(cssDir, 'colors-base.css'),
	});

	fs.writeFileSync(path.join(cssDir, 'atlas.css'), atlas.css.toString());

	fs.writeFileSync(path.join(cssDir, 'atlas.css.map'), atlas.map.toString());

	fs.writeFileSync(path.join(cssDir, 'base.css'), base.css.toString());

	fs.writeFileSync(path.join(cssDir, 'base.css.map'), base.map.toString());

	fs.writeFileSync(path.join(cssDir, 'cadmin.css'), cadmin.css.toString());

	fs.writeFileSync(path.join(cssDir, 'colors.css'), colors.css.toString());

	fs.writeFileSync(
		path.join(cssDir, 'colors.css.map'),
		colors.map.toString()
	);

	fs.writeFileSync(
		path.join(cssDir, 'colors-base.css'),
		colorsBase.css.toString()
	);

	fs.writeFileSync(
		path.join(cssDir, 'colors-base.css.map'),
		colorsBase.map.toString()
	);
};

const generateSassDocs = async (pluginOptions) => {
	const pjson = require('../../package.json');

	var config = {
		dest: path.join(pluginOptions.clayuiStatic, 'sass-api'),
		// theme: path.join(__dirname, 'sassdoc-theme-clay-css'),
		groups: {
			alerts: 'Alerts',
			applicationBar: 'Application Bar',
			aspectRatio: 'Aspect Ratio',
			badges: 'Badges',
			breadcrumbs: 'Breadcrumbs',
			breakpoints: 'Breakpoints',
			bs4overwrites: 'Bootstrap 4 Overwrites',
			buttons: 'Buttons',
			cards: 'Cards',
			caret: 'Caret',
			clearfix: 'Clearfix',
			customForms: 'Custom Forms',
			drilldown: 'Drilldown',
			dropdowns: 'Dropdowns',
			float: 'Float',
			forms: 'Forms',
			globals: 'Globals',
			gradients: 'Gradients',
			grid: 'Grid',
			hover: 'Hover',
			image: 'Image',
			inputGroups: 'Input Groups',
			labels: 'Labels',
			lineClamp: 'Line Clamp',
			links: 'Links',
			listGroup: 'List Group',
			loaders: 'Loaders',
			managementBar: 'Management Bar',
			menubar: 'Menubar',
			modals: 'Modals',
			multiStepNav: 'Multi Step Nav',
			nav: 'Nav',
			navbar: 'Navbar',
			navigationBar: 'Navigation Bar',
			pagination: 'Pagination',
			panels: 'Panels',
			popovers: 'Popovers',
			progressBars: 'Progress Bars',
			quickAction: 'Quick Action',
			sheet: 'Sheet',
			sideNavigation: 'Side Navigation',
			sidebar: 'Sidebar',
			slideout: 'Slideout',
			stickers: 'Stickers',
			tables: 'Tables',
			tbar: 'Tbar',
			timelines: 'Timelines',
			toggleSwitch: 'Toggle Switch',
			tooltip: 'Tooltip',
			type: 'Type',
			undefined: 'Clay CSS',
			utilities: 'Utilities',
			vendorPrefixes: 'Vendor Prefixes',
		},
		package: {
			description: pjson.description,
			homepage: path.join('..', 'docs', 'get-started', 'index.html'),
			license: pjson.license,
			title: 'Clay CSS',
			version: pjson.version,
		},
	};

	await sassdoc(path.join(pluginOptions.clayCssSrc, 'scss'), config);
};

exports.onPostBootstrap = async ({reporter}, pluginOptions) => {
	generateFiles(pluginOptions);

	reporter.info(`Compiling icons.svg finished`);

	generateCSSFiles(pluginOptions);

	await generateSassDocs(pluginOptions);

	reporter.info(
		`Compiling 'atlas.css', 'colors.css', 'base.css', 'cadmin.css' and 'colors-base.css' finished!`
	);
};

exports.onCreateDevServer = ({reporter}, pluginOptions) => {
	const watcher = require('chokidar').watch([
		pluginOptions.clayCssSrc,
		path.join(pluginOptions.clayuiSrc, 'styles'),
	]);

	function modified(dir) {
		if (dir.match(/clay-css\/src\/images\/icons/g)) {
			generateFiles(pluginOptions);

			reporter.info(`Compiling icons.svg finished: Refresh the page!`);
		} else if (
			dir.match(/clay-css\/src\/scss/g) ||
			dir.match(/styles\/colors/g)
		) {
			generateCSSFiles(pluginOptions);

			generateSassDocs(pluginOptions);

			reporter.info(
				`Compiling 'atlas.css', 'colors.css', 'base.css', 'cadmin.css' and 'colors-base.css' finished!`
			);
		}
	}

	watcher.on(`ready`, () => {
		watcher
			.on(`add`, (path) => modified(path))
			.on(`change`, (path) => modified(path))
			.on(`unlink`, (path) => modified(path));
	});
};
