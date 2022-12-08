const fs = require('fs');
const fsp = require('fs').promises;

const prompt = require('prompt-sync')({ sigint: true });
const colors = require('colors');

const sql = require('mssql');
const convert = require('xml-js');
const xmlOptions = { compact: true, spaces: 4 };

const template = require('./template.json');
const { files } = require('./files.json');

var config = {};

// const contents = fs.readFileSync('favicon.ico', { encoding: 'base64' });
// var temp = { ico: contents };
// fs.writeFileSync('temp.json', JSON.stringify(temp));

fs.readFile('config.json', (err, data) => {
	if (err) {
		console.log(colors.red('Config not found. ') + 'Running setup...');

		var htmlOutput = prompt(`${colors.cyan.bold('HTML output location?')} (${colors.dim('C:\\inetpub\\wwwroot')}) : `);
		if (!htmlOutput) config.htmlOutput = `C:\\inetpub\\wwwroot`;
		else config.htmlOutput = htmlOutput;

		var instanceInstallLocation = prompt(`${colors.cyan.bold('Acumatica instance install location?')} (${colors.dim('D:\\AcuInstances')}) : `);
		if (!instanceInstallLocation) config.instanceInstallLocation = `D:\\AcuInstances`;
		else config.instanceInstallLocation = instanceInstallLocation;

		var openInNewTab = prompt(`${colors.cyan.bold('Open links in new tabs?')} (${colors.dim('Y/n')}) : `);
		if (!openInNewTab) config.openInNewTab = true;
		else config.openInNewTab = openInNewTab.toLocaleLowerCase() == 'y' ? true : false;

		fs.writeFileSync('config.json', JSON.stringify(config));
	} else {
		config = JSON.parse(data);
	}

	start();
});

async function start() {
	var sitesData = await loadXml('C:\\Windows\\System32\\inetsrv\\config\\applicationHost.config');
	sitesData = sitesData.configuration['system.applicationHost'].sites.site.application;

	var sites = [];

	await asyncForEach(sitesData, async (site, i) => {
		var acumaticaVersion = 'N/A';
		var db = null;
		if (site.virtualDirectory._attributes.physicalPath.startsWith(config.instanceInstallLocation)) {
			var acuConfig = await loadXml(`${site.virtualDirectory._attributes.physicalPath}Web.config`);
			acumaticaVersion = acuConfig.configuration.appSettings.add.find((a) => a._attributes.key == 'Version')._attributes.value;

			try {
				var connectionString = acuConfig.configuration.connectionStrings.add.find((c) => c._attributes.name == 'ProjectX')._attributes.connectionString;

				await sql.connect(`${connectionString};Encrypt=true;trustServerCertificate=true`);
				const result = await sql.query(`SELECT 
									logSizeGb = CAST(SUM(CASE WHEN type_desc = 'LOG' THEN size END) * 8. / 1024 / 1024 AS DECIMAL(12,4)),
									dbSizeGb = CAST(SUM(CASE WHEN type_desc = 'ROWS' THEN size END) * 8. / 1024 / 1024 AS DECIMAL(12,4)),
									totalSizeGb = CAST(SUM(size) * 8. / 1024 / 1024 AS DECIMAL(12,4))
								FROM sys.master_files WITH(NOWAIT)
								WHERE database_id = DB_ID()
								GROUP BY database_id`);
				await sql.close();
				db = result?.recordset?.[0];
			} catch (error) {}

			sites.push({
				name: site._attributes.applicationPool,
				directory: site.virtualDirectory._attributes.physicalPath,
				path: site._attributes.path,
				version: acumaticaVersion,
				db: db,
			});
		}
	});
	sites = sites.sort(dynamicSort('name'));
	console.log(sites);

	var templateHtml = template.html;
	var tableHtml = '';

	sites.forEach((site) => {
		tableHtml += `<tr><td><a href="${site.path}" ${config.openInNewTab ? 'target="_blank"' : ''}>${site.name}</a></td><td>${site.version}</td><td>${site.directory}</td><td>${
			site?.db
				? `<a data-bs-toggle="tooltip" data-bs-html="true" data-bs-title="DB: ${site?.db?.logSizeGb.toFixed(2)} GB<br>Log: ${site?.db?.dbSizeGb.toFixed(
						2
				  )} GB<br>Total: ${site?.db?.totalSizeGb.toFixed(2)} GB">${site?.db?.totalSizeGb.toFixed(2)} GB</a>`
				: ''
		}</td></tr>`;
	});
	templateHtml = templateHtml.replace('{{row_data}}', tableHtml);

	// Write html file
	await fsp.writeFile(`${config.htmlOutput}\\index.html`, templateHtml, (err) => {
		if (err) {
			console.error(err);
		}
	});

	// write files
	await asyncForEach(files, async (file, i) => {
		console.log(`Writing ${file.name}`);
		await fsp.writeFile(`${config.htmlOutput}\\${file.name}`, file.data, { encoding: 'base64' });
	});

	console.log('Complete!');
}

async function asyncForEach(array, callback) {
	for (let index = 0; index < array.length; index++) {
		await callback(array[index], index, array);
	}
}
async function loadXml(path) {
	const data = await fsp.readFile(path, 'utf8');
	return convert.xml2js(data, xmlOptions);
}
async function loadHtml(path) {
	const data = await fsp.readFile(path, 'utf8');
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
function dataURLtoFile(dataurl, filename) {
	var arr = dataurl.split(','),
		mime = arr[0].match(/:(.*?);/)[1],
		bstr = atob(arr[1]),
		n = bstr.length,
		u8arr = new Uint8Array(n);

	while (n--) {
		u8arr[n] = bstr.charCodeAt(n);
	}

	return new File([u8arr], filename, { type: mime });
}
