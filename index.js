const fetch = require('node-fetch');
const Stream = require('stream');
const plotly = require('plotly')(process.env.PLOTLY_USER, process.env.PLOTLY_TOKEN);
const SimpleBucket = require("./simplebucket.js");

// Global - flag used to sleep until plotly completes the image.
let imageReady = false;


/*
 Main call of the lambda function to attempt to either retrieve the cached
 image or generate it using data from the url. If the image is generated it
 will be cached for up to 24 hours.
 */
exports.handler = async () => {

	let imgBucket = new SimpleBucket(
		process.env.REGION,
		process.env.BUCKET_NAME,
		process.env.BUCKET_KEY
	);

	// try to get the current image from the storage bucket
	let imageData = await imgBucket.getImage();

	// If needed, regenerate image from scratch. For next improvement
	// the existing image from the bucket will be used if there is an error
	// generating the new one.
	if(!imageData) {

		// Download this report as txt
		const url = "http://www.bccdc.ca/Health-Info-Site/Documents/BCCDC_COVID19_Dashboard_Case_Details.csv";
		const rawReportCSV = await getLatestReport(url);

		// Strip, transform, and process the text into an image.
		const newImageData =  await processReportDataToImage(rawReportCSV);
		if (newImageData) {
			imageData = newImageData;
			// store new image in the bucket
			await imgBucket.storeImage(imageData);
		}
	}

	// Improvement - show error in the case that imageData is completely
	// unavailable
	return {
		statusCode: 200,
		headers: {
			"content-type": "image/png"
		},
		body: imageData,
		isBase64Encoded: true
	};
};


/*
 Download the latest published report returning the raw file as text.
 */
async function getLatestReport(url) {

	// fetch the latest report
	return await fetch(url)
		.then(content => content.text())
		.then(text => {
			return text;
		});
}


/* Take raw report data (csv file) and transform it into x-y chart
 * and then call the generateGraph function to write a PNG image into
 * a Buffer object. This will summate the positive covid cases by day.
 *
 * Improvement - separate the txt processing and image generation to
 * multiple functions: process txt, set graph display options, generate
 * graph...
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

	// Set up graph data
	let x = [];
	let y = [];
	covidData.forEach(function(value, key) {
		x.push(key);
		y.push(value);
	});
	
	// Remove the last entry from the dataset as the latest day
	// never has the full total  (published at 5:00 PM PT)
	x.pop();
	y.pop();

	// Array to collect image data streamed from plotly
	const imageDataArr = [];
	const writableStream = new Stream.Writable();
	writableStream._write = (chunk, encoding, next) => {
		// Collect image data
		imageDataArr.push(chunk);
		next();
	}
	
	// Call the plotly module to generate the graph image.
	await generateGraph(writableStream, x, y);

	// The Lambda function has a max runtime that should be configured
	// to 30 seconds.
	while(imageReady === false) {
		await sleep(500);
	}

	// Return image as encoded string.
	return Buffer.concat(imageDataArr).toString('base64');
}


/* Use the data extracted from the report to generate an image in png format.
 */
async function generateGraph(writableStream, x,y) {

	// Set title and graph data
	const firstEntryDate = new Date(x[0]).toISOString().split('T')[0];
	const lastEntryDate = new Date(x[x.length-1]).toISOString().split('T')[0];
	const title = `Daily Positive Covid Tests in BC  [${firstEntryDate}  to  ${lastEntryDate}]`;
	const trace1 = {
		'x' : x,
		'y' : y,
		'type' : 'scatter',
		'trendline' : 'lowess'
	};
	const figure = {
		'data': [trace1],
		'layout' : {'title': title}
	};

	// Image output options.
	const imgOpts = {
		format: 'png',
		width: 1000,
		height: 500
	};

	// Use the plotly lib to generate a graph image.
	plotly.getImage(figure, imgOpts, function (error, imageStream) {
		// Wait until the image is written before continuing.
		imageStream.on('end', () => {
			imageReady = true;
		});
		
		// Need to handle bad data and download problems - as improvement
		// to display older image if new image cannot be produced.
		if (error) return console.log (error);

		imageStream.pipe(writableStream);
	});
}


function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}
