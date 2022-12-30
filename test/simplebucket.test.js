const assert = require('assert');
const SimpleBucket = require("../simplebucket");

describe('Simple bucket functions', function() {

    it('Returns an empty string', async function() {
        let imgBucket = new SimpleBucket('us-east-1', 'non-existent-bucket-name', 'non-existent-bucket-key');
        const b64ImageString = await imgBucket.getImage();
        assert.equal(b64ImageString, '');
    });

    it('Bad region raises a notfound error', async function() {
        try {
            // The region is invalid, otherwise creating bucket with given name and key is an option
            let imgBucket = new SimpleBucket(
                'ca-northpole-1',
                'non-existent-bucket-name',
                'non-existent-bucket-key'
            );
            const val = await imgBucket.getImage();
            assert.fail("Expected ENOTFOUND Error");
        }
        catch(err) {
            assert.equal(err.code, 'ENOTFOUND');
        }
    });
});
