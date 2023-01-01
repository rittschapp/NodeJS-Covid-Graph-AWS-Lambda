

# covid19

A simple Node.JS AWS lambda function to generate a daily graph of COVID-19 case
'counts' as reported by BCCDC **since the start** of the pandemic. It is
imperfect data at both ends of the chart: testing couldn't keep up to start,
tests today are no longer counted.

*Please Note*: Current implementation may take up to 30 seconds or more to
download the data and process the chart. Once the image is generated, it is
cached for up to 24 hours. Hence, subsequent requests should only take a
second or two. **Make sure to set the Timeout for the Lambda function to 
30 seconds**.

[View the lambda output here!](https://ycqzewcijzia2y6b22r7jihlca0qojcq.lambda-url.us-east-1.on.aws/)


## Usage

The application is meant to be deployed as a lambda function with a **Timeout
of 30 seconds**.

Deployment also requires Lambda *process environment variables*: 

 > for the plotly library 
    username and token are provided at https://www.plotly.com/
 * PLOTLY_USER: Username for the plotly library
 * PLOTLY_TOKEN: API token for the plotly library

> for the AWS S3 storage bucket

 * REGION
 * BUCKET_NAME
 * BUCKET_KEY



## Data Source

http://www.bccdc.ca/Health-Info-Site/Documents/BCCDC_COVID19_Dashboard_Case_Details.csv

## Recent Improvements
 * Add to-from dates in Graph title
 * Caching image so it does not need to be generated every time
 * Added test cases

## Future Improvements

 * Look into accelerated Lambda startup (snapstart)
 * Handle waiting on graph without need of global variable (using 'promise') 
 * Auto test & deploy on commit
 * Improvements to error handling (allow retrieval of stale image)
 * ~~Caching datafile so it doesn't need to download every time (takes too long)~~
