'use strict';

const url = "http://www.bccdc.ca/Health-Info-Site/Documents/BCCDC_COVID19_Dashboard_Case_Details.csv";
const http = require("http");
const fetch = require("node-fetch");
const Stream = require('stream');
var plotly = require('plotly')(process.env.PLOTLY_USER, process.env.PLOTLY_TOKEN);
const text = '';
let imageReady = false;

module.exports.hello = async function(event, context) {
	
	
	imageReady = false;
	
	// download raw report data from the gov's
	let rawReportCSV = await getLatestReport();		
	console.log(rawReportCSV);
	// strip, transform, and process the text into an image.
	// this should be divided into two functions
	let imageData =  await processReportDataToImage(rawReportCSV);
	console.log(imageData);
	return {
	    statusCode: 200,
	    headers: {
	    	"content-type": "image/png"
	    },
	    body: imageData,
	    isBase64Encoded: true
	  };

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
/* Download the latest published report as is
 * 
 */
async function getLatestReport() {
	let t = await fetch(url).then(content => content.text())
	.then(text => {return text;});
	return t;	
}

/* Use the data extracted from the report to generate an image
 * The resulting image is written to writable stream as Buffer chunks 
 * 
 */
async function generateGraph(writableStream, x,y) {

	
	// one of many lines that could be graphed
	var trace1 = {
			  'x' : x,
			  'y' : y,
			  'type' : 'scatter',
			  'trendline' : 'lowess'
			};
	
	// options for lines and overall graph labels etc...
	var figure = { 
			'data': [trace1],
			'layout' : {'title': 'Daily Positive Covid Tests in BC'}
	};

	// image ouput options 
	var imgOpts = {
	    format: 'png',
	    width: 1000,
	    height: 500
	};
	
	// use the plotly lib to generate a graph image.
	plotly.getImage(figure, imgOpts, function (error, imageStream) {		
		// again, a bit of a hack needed to allow the caller to wait until
		// the image is written and the write stream is closed before 
		// continuing. I feel like I am not doing this right.
		imageStream.on('end', () => {
			imageReady = true;
		});
		
		// need to handle bad data?
	    if (error) return console.log (error);
	    imageStream.pipe(writableStream);
	});
}


/* Take raw report data (csv file) and transform it into x-y chart
 * and then call the generateGraph function to write a PNG image into
 * a Buffer object. This will summate the positive covid cases by day.
 * 
 */
async function processReportDataToImage(text) {
			
	// remove all the " padding around field values
	text = text.replace(/\"/g,'');

	let dataLines = text.split("\n");
	
	// kill column headers
	dataLines.splice(0,1);

	// the sum per day of newly reported cases
	let covidData = new Map();	

	dataLines.forEach(function(line, index) {				
		let entry = line.split(",");
		if (entry[0] == '' ) {return;}	
		if (!covidData.has(entry[0])) {
			covidData.set(entry[0],0);
		}
		covidData.set(entry[0], covidData.get(entry[0]) + 1);		
	});

	// next is to build the graph :)
	let resultChart = "";
	let x = [];
	let y = [];
	let entryKey = '';
	covidData.forEach(function(value, key, map) {
		entryKey = key;
		x.push(key);
		y.push(value);
		resultChart += key+":"+value+"\n";
	});
		
	
	// remove the last entry from the dataset as the latest day
	// never has the full total  (published at 5:00 PM PT)
	x.pop();
	y.pop();
	console.log("Last entry removed for: "+ entryKey);

	// an array of Buffer containing image data bytes 
	const imageDataArr = [];
	const writableStream = new Stream.Writable();
	writableStream._write = (chunk, encoding, next) => {
	    imageDataArr.push(chunk);
	    next();
	}
	
	// call the plotly module to generate a graph with x,y,title,image size
	// and type 
	await generateGraph(writableStream, x, y);
	
	// I feel this is a hack that needs ironing out. Basically waiting until
	// the 'streaming' stuff plays out. But this means possible blocking and
	// maybe could be bad?
	while(imageReady === false) {
		console.info("waiting...");
		await sleep(500);
	}
	writableStream.end();
	//return writableStream;
	
	// convert entire array of Buffer objects to one Buffer. Using this instead
	// of streams because I am prepping to deploy to a serverless instance 
    let imageData = Buffer.concat(imageDataArr);
    return imageData.toString('base64')
    //return imageData;
}


/* I feel like I am one step away from not needing this! 
 * 
 */
function sleep(ms) {
	  return new Promise(resolve => setTimeout(resolve, ms));
}

