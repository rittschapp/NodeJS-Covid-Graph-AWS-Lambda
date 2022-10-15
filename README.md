

# covid19

A simple Node.JS AWS lambda function to generate a graph of the total COVID-19
case counts in BC since the start of the pandemic. 

This function will download a large data file from the GOV website on each
invocation and generate a graph of the number of positive COVID-19 lab-tested
case counts in BC since the start of the pandemic.

Note the GOV distributed free COVID test kits starting in early 2022. Therefore 
official lab-driven counts will no longer reflect actual cases on-the-ground.


## Usage

The application is meant to be deployed as a lambda function. Deployment 
method may vary. Deployment requires target AWS Lambda instance.

Deployment also requires two environment variables for the plotly library.

 * PLOTLY_USER: Username for the plotly library
 * PLOTLY_TOKEN: ASPI token for the plotly library

Plotly username and API token are provided with a plotly account signup at 
https://www.plotly.com/

An installed instance of this function can be called via AWS Labmda at:

https://ycqzewcijzia2y6b22r7jihlca0qojcq.lambda-url.us-east-1.on.aws/

*Please Note*: The current implementation takes up to 30 seconds or more to
download the data and process the chart and may timeout.


## Future Improvements: Next Steps

 * Add to-from dates in Graph title
 * Auto-deploy changes on push to github
 * Caching datafile so it doesn't need to download every time (takes too long)
 * Caching image so it does not need to be generated every time
 * Error handling

