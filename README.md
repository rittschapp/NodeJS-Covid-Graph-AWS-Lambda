

# covid19

A simple Node.JS application to demononstrate how to use AWS lambda functions.

This function will download a large data file on each invocation and generate a
graph of the number of positive COVID-19 case counts in BC since the start of
the pandemic.


## Usage

The application should be zipped and uploaded to an AWS lambda function
instance. Requires two environment variables for the plotly library.

 * PLOTLY_USER: Username for the plotly library
 * PLOTLY_TOKEN: ASPI token for the plotly library

Plotly username and API token are provided with a plotly account signup at 
https://www.plotly.com/

An installed instance of this function can be called via AWS Labmda at:

https://ycqzewcijzia2y6b22r7jihlca0qojcq.lambda-url.us-east-1.on.aws/

*Please Note*:


## Developing: Next Steps

 * Deploy using AWS CLI
 * Code cleanup
 * Caching datafile so it does not need to be downloaded every time
 * Caching image so it does not need to be generated every time

