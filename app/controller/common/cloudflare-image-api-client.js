const Food = require("../../model/cloudkitchen/food.js");
const Collection = require("../../model/cloudkitchen/collection.js");
const CloudKitchen = require("../../model/cloudkitchen/cloudkitchen.js");
const PartyBundle = require("../../model/cloudkitchen/partybundle.js");
const CloudflareImage = require("../../model/common/cloudflare-image.js");
const Utils = require("../../utils/utils.js");

var imagePersistenceComplete = false;

exports.deleteById = async (id) => {
    console.log("Deleting a cloudflareImage with id" + id);
    try {
        const response = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/` + id, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${process.env.CLOUDFLARE_RW_TOKEN}`,
            }
        });
        // Your image has been deleted
        // Do something with the response, e.g. save image ID in a database
        var deleteResponse = await response.json();
        console.log("Delete response :"+ deleteResponse)
    } catch (error) {
        console.error("Delete error:" +error)
    }
};

exports.uploadImage = async (req, res) => {
    try {
        imagePersistenceComplete = false;
        console.log("Upload images to Cloud flare..")
        var fileKeys = Object.keys(req.files);
        // Iterate all images and upload into Image Kit Asynchronously
        var imageUploadResponse = [];
        await fileKeys.map(async function (key) {
            var file = req.files[key];
            // const image = fs.readFileSync('./image.jpg');
            const blob = new Blob([file.buffer]);
            const formData = new FormData();
            formData.append("file", blob, file.originalname);
            console.log('Uploading file to Cloudflare ' + file.originalname);
            const response = await fetch(
                `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.CLOUDFLARE_RW_TOKEN}`,
                },
                body: formData,
            });
            // Your image has been uploaded
            // Do something with the response, e.g. save image ID in a database
            var responseJson = await response.json();
            console.log(responseJson)
            imageUploadResponse.push(responseJson);
        });

        // Wait until all images are uploaded
        await Utils.until(function uploaded() {
            if (req.files.length == imageUploadResponse.length) {
                return true;
            } else {
                return false;
            }
        });

        var localImageSaveCount = 0;

        // Iterate all responses and update relevant entities in Mongo DB
        imageUploadResponse.forEach(async e => {
            //First store the Imagekit response into MongoDB collection
            console.log('Processing cloudflare response '+ JSON.stringify(e))
            await saveImage(req.query.entity, req.query.entityId, e);
            localImageSaveCount = localImageSaveCount + 1;
        });

        // Wait until all images are uploaded
        console.log('Waiting for all images persisted locally...')
        await Utils.until(function persisted() {
            if (req.files.length == localImageSaveCount) {
                return true;
            } else {
                return false;
            }
        });

        console.log('All Images persisted locally : ' + localImageSaveCount);

        // Now update a cover photo Url to the relevant entity
        if (req.query.entity === 'CloudKitchen') {
            await updateCloudKitchenCoverPhoto(imageUploadResponse[0].result.variants[0], req.query.entityId);
        } else if (req.query.entity === 'Collection') {
            await updateCollectionCoverPhoto(imageUploadResponse[0].result.variants[0], req.query.entityId);
        } else if (req.query.entity === 'Food') {
            await updateMenuCoverPhoto(imageUploadResponse[0].result.variants[0], req.query.entityId);
        } else if (req.query.entity === 'PartyBundle') {
            await updatePartyBundleCoverPhoto(imageUploadResponse[0].result.variants[0], req.query.entityId);
        }

        await Utils.until(function persistComplete() {
            if (imagePersistenceComplete) {
                return true;
            } else {
                return false;
            }
        });

        console.log('Sending response back to Client');
        res.status(200);
        res.send({ status: "Success" });

    } catch (error) {
        console.error(error)
        res.send({ status: "Failure" });
    }
}

/**
 * Update the Food with Images from Cloudflare
 * @param {*} entityId 
 * @param {*} url 
 */
async function updateMenuCoverPhoto(url, entityId) {
    var body = {};
    body.image = url;
    Food.updateOne({ _id: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update Food with image ')
            } else {
                console.log(`Food ${entityId} updated with image ${url}`);
                imagePersistenceComplete = true;
            }
        }).catch(err => {
            console.log('Error while updating Food ' + JSON.stringify(err))
        });
}



/**
 * Update the PartyBundle with Images from Cloudflare
 * @param {*} entityId 
 * @param {*} url 
 */
async function updatePartyBundleCoverPhoto(url, entityId) {
    var body = {};
    body.image = url;
    PartyBundle.updateOne({ _id: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update PartyBundle with image ')
            } else {
                console.log(`PartyBundle ${entityId} updated with image ${url}`);
                imagePersistenceComplete = true;
            }
        }).catch(err => {
            console.log('Error while updating PartyBundle ' + JSON.stringify(err))
        });
}


/**
 * Update the Collection with Images from Cloudflare
 * @param {*} entityId 
 * @param {*} url 
 */
async function updateCollectionCoverPhoto(url, entityId) {
    var body = {};
    body.image = url;
    Collection.updateOne({ _id: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update Collection with image ')
            } else {
                console.log(`Collection ${entityId} updated with image ${url}`);
                imagePersistenceComplete = true;
            }
        }).catch(err => {
            console.log('Error while updating Collection ' + JSON.stringify(err))
        });
}


/**
 * Update the CloudKitchen with Images from Cloudflare
 * @param {*} entityId 
 * @param {*} url 
 */
async function updateCloudKitchenCoverPhoto(url, entityId) {
    var body = {};
    body.image = url;
    CloudKitchen.updateOne({ _id: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update Cloudkitchen with image ')
            } else {
                console.log(`Cloudkitchen ${entityId} updated with image ${url}`);
                imagePersistenceComplete = true;
            }
        }).catch(err => {
            console.log('Error while updating Cloudkitchen ' + JSON.stringify(err))
        });
}


async function saveImage(entity, entityId, cloudflareResponse) {
    var CloudflareImage = buildCloudflareImageJson(entity, entityId, cloudflareResponse)
    CloudflareImage.save()
        .then(data => {
            console.log('Saved image ' + JSON.stringify(data));
        }).catch(err => {
            console.log('Error when saving image ' + slug + ". " + err)
        });

}


/**
 * Builds Image Json from Request
 * 
 * @param {Request} payload 
 */
function buildCloudflareImageJson(entity, entityId, cloudflareResponse) {
    var slug = entity.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + entityId.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + cloudflareResponse.result.id.trim().replace(/[\W_]+/g, "_").toLowerCase();
    return new CloudflareImage({
        entityId: entityId,
        entity: entity,
        cloudflareImageId: cloudflareResponse.result.id,
        cloudflareImageUrl: cloudflareResponse.result.variants[0],
        cloudflareImageFilename: cloudflareResponse.result.filename,
        uploaded: cloudflareResponse.result.uploaded,
        active: true,
        slug: slug
    });
}
