

# covid19

A simple Node.JS AWS lambda function to generate a graph of the total COVID-19
case counts in BC since the start of the pandemic. 

This function will download a large data file from the GOV website on each
invocation and generate a graph of the number of positive COVID-19 lab-tested
case counts in BC since the start of the pandemic.

Note the GOV distributed free COVID test kits starting in early 2022. Therefore 
official lab-driven counts will no longer reflect actual cases on-the-ground.

An installed instance of this function can be called via AWS Lambda at:

https://ycqzewcijzia2y6b22r7jihlca0qojcq.lambda-url.us-east-1.on.aws/

*Please Note*: The current implementation may take up to 30 seconds or more to
download the data and process the chart and may timeout. Once the image is
generated, it is cached for up to 24 hours. Hence subsequent loading should 
occur within a second or so.


## Usage

The application is meant to be deployed as a lambda function. Deployment 
method may vary. Deployment requires target AWS Lambda instance.

Deployment also requires two Lambda process environment variables for
the plotly library. Plotly username and API token are provided with a
plotly account signup at https://www.plotly.com/

 * PLOTLY_USER: Username for the plotly library
 * PLOTLY_TOKEN: API token for the plotly library

And three for the storage bucket region, name and key

 * REGION
 * BUCKET_NAME
 * BUCKET_KEY


## Data Source

http://www.bccdc.ca/Health-Info-Site/Documents/BCCDC_COVID19_Dashboard_Case_Details.csv

## Recent Improvements
 * Add to-from dates in Graph title
 * Caching image so it does not need to be generated every time
 * Added test cases

## Future Improvements: Next Steps

 * Handle waiting on graph without need of global variable (using 'promise') 
 * Auto test & deploy on commit
 * Error handling
 * ~~Caching datafile so it doesn't need to download every time (takes too long)~~


 
