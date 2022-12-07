const fs = require('fs').promises;

const convert = require('xml-js');
const xmlOptions = { compact: true, spaces: 4 };

const config = require('./config.json');

start();
async function start() {
	var sitesData = await loadXml('C:\\Windows\\System32\\inetsrv\\config\\applicationHost.config');
	sitesData = sitesData.configuration['system.applicationHost'].sites.site.application;

	var sites = [];

	await asyncForEach(sitesData, async (site, i) => {
		var acumaticaVersion = 'N/A';
		if (site.virtualDirectory._attributes.physicalPath.startsWith(config.instanceInstallLocation)) {
			var acuConfig = await loadXml(`${site.virtualDirectory._attributes.physicalPath}Web.config`);
			acumaticaVersion = acuConfig.configuration.appSettings.add.find((a) => a._attributes.key == 'Version')._attributes.value;

			sites.push({
				name: site._attributes.applicationPool,
				directory: site.virtualDirectory._attributes.physicalPath,
				path: site._attributes.path,
				version: acumaticaVersion,
			});
		}
	});
	sites = sites.sort(dynamicSort('name'));

	var templateHtml = await loadHtml('template.html');
	var tableHtml = '';

	sites.forEach((site) => {
		tableHtml += `<tr>
		<td><a href="${site.path}" ${config.openInNewTab ? 'target="_blank"' : ''}>${site.name}</a></td>
		<td>${site.version}</td>
		<td>${site.directory}</td>
		</tr>`;
	});
	templateHtml = templateHtml.replace('{{row_data}}', tableHtml);

	await fs.writeFile(`${config.htmlOutput}\\index.html`, templateHtml, (err) => {
		if (err) {
			console.error(err);
		}
	});

	console.log('Complete!');
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
async function loadXml(path) {
	const data = await fs.readFile(path, 'utf8');
	return convert.xml2js(data, xmlOptions);
}
async function loadHtml(path) {
	const data = await fs.readFile(path, 'utf8');
	return data;
}
function dynamicSort(property) {
	var sortOrder = 1;
	if (property[0] === '-') {
		sortOrder = -1;
		property = property.substr(1);
	}
	return function (a, b) {
		/* next line works with strings and numbers,
		 * and you may want to customize it to your needs
		 */
		var result = a[property] < b[property] ? -1 : a[property] > b[property] ? 1 : 0;
		return result * sortOrder;
	};
}
