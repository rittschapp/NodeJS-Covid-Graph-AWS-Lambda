const url = "http://www.bccdc.ca/Health-Info-Site/Documents/BCCDC_COVID19_Dashboard_Case_Details.csv";
const fetch = require('node-fetch');
const stream = require('stream');
const plotly = require('plotly')(process.env.PLOTLY_USER, process.env.PLOTLY_TOKEN);
const date = (new Date()).toISOString().split('T')[0];

// Used to wait for image stream to complete.
// Needs to be improved to use promise instead.
let imageReady = false;


exports.handler = async (event) => {

	// Download raw report data from the Gov URL
	let rawReportCSV = await getLatestReport();

	// Strip, transform, and process the text into an image.
	let imageData =  await processReportDataToImage(rawReportCSV);

	return {
		statusCode: 200,
		headers: {
			"content-type": "image/png"
		},
		body: imageData,
		isBase64Encoded: true
	};
};


/* Download the latest published report returning the raw file as text.
 */
async function getLatestReport() {
	return await fetch(url).then(content => content.text())
		.then(text => {
			return text;
		});
}


/* Take raw report data (csv file) and transform it into x-y chart
 * and then call the generateGraph function to write a PNG image into
 * a Buffer object. This will summate the positive covid cases by day.
  */
async function processReportDataToImage(text) {

	// remove all the " padding around field values
	text = text.replace(/\"/g,'');

	let dataLines = text.split("\n");
	
	// kill column headers
	dataLines.splice(0,1);

	// the sum per day of newly reported cases
	let covidData = new Map();	

	dataLines.forEach(function(line) {
		let entry = line.split(",");
		if (entry[0] === '' ) {return;}
		if (!covidData.has(entry[0])) {
			// Init entry for the given date
			covidData.set(entry[0],0);
		}
		// Increment case count for the given date
		covidData.set(entry[0], covidData.get(entry[0]) + 1);
	});

	// Next is to build the graph
	let x = [];
	let y = [];
	let entryKey = '';
	covidData.forEach(function(value, key, map) {
		entryKey = key;
		x.push(key);
		y.push(value);
	});
	
	// remove the last entry from the dataset as the latest day
	// never has the full total  (published at 5:00 PM PT)
	x.pop();
	y.pop();

	// an array of Buffer containing image data bytes 
	const imageDataArr = [];
	const writableStream = new stream.Writable();
	writableStream._write = (chunk, encoding, next) => {
		// Collect image data
		imageDataArr.push(chunk);
		next();
	}
	
	// Call the plotly module to generate the graph image.
	await generateGraph(writableStream, x, y);
	while(imageReady === false) {
		await sleep(500);
	}

	// Return image data array as encoded string.
	return Buffer.concat(imageDataArr).toString('base64');
}


/* Use the data extracted from the report to generate an image in png format.
 */
async function generateGraph(writableStream, x,y) {

	// Init details for the line to be graphed 
	// noinspection SpellCheckingInspection
	const trace1 = {
		'x' : x,
		'y' : y,
		'type' : 'scatter',
		'trendline' : 'lowess'
	};

	// Additional options for lines and overall graph labels etc.
	const figure = {
		'data': [trace1],
		'layout' : {'title': 'Daily Positive Covid Tests in BC - ' + date}
	};

	// Image output options.
	const imgOpts = {
		format: 'png',
		width: 1000,
		height: 500
	};

	// use the plotly lib to generate a graph image.
	plotly.getImage(figure, imgOpts, function (error, imageStream) {
		// Wait until the image is written before continuing.
		imageStream.on('end', () => {
			imageReady = true;
		});
		
		// Need to handle bad data and download problems - as improvement.
		if (error) return console.log (error);

		imageStream.pipe(writableStream);
	});
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

