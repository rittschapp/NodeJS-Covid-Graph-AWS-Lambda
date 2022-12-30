const {S3, GetObjectCommand, PutObjectCommand, CreateBucketCommand} = require('@aws-sdk/client-s3');

/*
 Utility class to retrieve the image of the graph representing the latest data.
 Will return blank string if the bucket does not exist, or is empty, or if the
 current image graph in the bucket is stale.

 An image can be generated external to this utility and stored. The stored
 image will use the date that represents the most recent valid data.

 The date will increment after 6:00 PM PT so the image will need to be
 regenerated at that point as the previous image will then be stale.
 */
class SimpleBucket {

    #image;
    #imageDate;
    #client;
    #bucketParams;
    #bucketMetadata;
    #bucketExists = false;

    constructor(region, name, key) {
        this.#client = new S3({region: region});
        this.#imageDate = this.#getTodaysImageDate();
        this.#bucketParams = {
            Bucket: name,
            Key: key
        };
        this.#bucketMetadata = {
            // set image date to string 'yyyy-mm-dd'
            // AWS metadata keys are lowercase
            'imagedate': this.#imageDate.toLocaleString().split(',')[0]
        }
    }


    /*
     Returns the Date associated with the bucket. Used to determine
     whether the image is valid and should be returned.
     */
    getImageDate() {
        return this.#imageDate;
    }


    /*
     Get the latest base 64 encoded image data from the bucket.
     Returns blank string if the bucket does not exist or if the image in the
     bucket does not have today's date.
     May raise an exception if there is an error retrieving the bucket.
     */
    async getImage() {

        try {
            let imageBucket = await this.#getImageBucket()
            this.#bucketExists = true;
            if (imageBucket.Metadata && imageBucket.Metadata.imagedate === this.#bucketMetadata.imagedate) {
                return await imageBucket.Body.transformToString();
            }
        } catch (error) {
            // instanceof here doesn't work
            if (error.name !== 'NoSuchBucket' && error.name !== 'NoSuchKey') {
                throw error;
            }
        }
        return '';
    }


    /*
    Expects a base 64 encoded image and stores it in the bucket with
    'imageDate' in the metadata, returns the HTTP Response code 200
    if the storage operation is completed successfully.
     */
    async storeImage(imageData) {
        return await this.#storeLatestImage(imageData);
    }


    /*
     Returns a Data object adjusted for report publication datetime
      - the report is published after about 5:00 PM PT
       - previous date is returned if it's currently before 6:00 PM PT
     */
    #getTodaysImageDate() {

        // parsing the date to vancouver time as the lambda function
        // runs in a different timezone
        let imageDate = new Date();
        const dateOptions = {
            hour12: false,
            timeZone: 'America/Vancouver'
        }
        let currentDateTime = imageDate.toLocaleString("en-US", dateOptions);
        const currentHour = currentDateTime.split(',')[1].split(":")[0].trim();
        if (currentHour < 18) {
            // no new data for today - let's use yesterday's image
            imageDate.setDate(imageDate.getDate() - 1);

        }
        return imageDate;
    }


    /*
      Create or update the bucket with the base 64 encoded image data using
      today's date in the metadata.
     */
    async #storeLatestImage(imageData) {
        const bucketParams = this.#bucketParams;
        bucketParams.Body = imageData;
        bucketParams.ContentEncoding = 'base64';
        bucketParams.Metadata = this.#bucketMetadata;
        let bucketCommand = null;
        if (!this.#bucketExists) {
            bucketCommand = new CreateBucketCommand(bucketParams)
        }
        else {
            bucketCommand = new PutObjectCommand(bucketParams);
        }
        const getObjectResult = await this.#client.send(bucketCommand);
        return getObjectResult.$metadata.httpStatusCode;
    }


    /*
     Gets the image bucket or empty string if it does not exist
     */
    async #getImageBucket() {
        let getObjectResult = await this.#client.send(new GetObjectCommand(this.#bucketParams));
        return await getObjectResult;
    }
}

module.exports = SimpleBucket;