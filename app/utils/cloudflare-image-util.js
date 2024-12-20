const CloudflareImage = require("../model/common/cloudflare-image");
const CloudflareImageApiClient = require("../controller/common/cloudflare-image-api-client.js");

exports.deleteImages = async (entityIds) => {
    console.log('Deleting images for entityIds ' + JSON.stringify(entityIds))
    let filter = CloudflareImage.find();
    filter.where({ 'entityId': { $in: entityIds } });

    // MongoDb always returns _id, we dont need it, we only need cloudflareImageId
    var records = await CloudflareImage.find(filter, 'cloudflareImageId -_id');
    if (records) {
        console.log('Found CloudflareImages : ' + JSON.stringify(records));
    }

    CloudflareImage.deleteMany(filter).then(result => {
        console.log('Deleted CloudflareImage(s) ' + JSON.stringify(result));
        if (records) {
            console.log('Deleting remote images for ' + JSON.stringify(records));
            deleteMany(records);
        }
    }).catch(err => {
        console.error('CloudflareImage Delete failed: ' + JSON.stringify(err))
    });
}

/**
 * Delete Remote Images on Cloudflare
 */
async function deleteMany(records) {
    [...records].forEach(record => {
        CloudflareImageApiClient.deleteById(record.cloudflareImageId);
    });
}

