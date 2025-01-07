const multer = require("multer");
var ImageKit = require("imagekit");
const privateKey = process.env.IMAGEKIT_PRIVATEKEY;
const publicKey = process.env.IMAGEKIT_PUBLICKEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
const fs = require("node:fs");
const { Buffer } = require("node:buffer");
const controller = require("../../controller/common/imagekit.js");
const Utils = require("../../utils/utils.js");
//Require Ad Model
const Ad = require("../../model/ad/ad.js");
const Property = require("../../model/property/property.js");
const Collection = require("../../model/cloudkitchen/collection.js");
const Food = require("../../model/cloudkitchen/food.js");
const PartyBundle = require("../../model/cloudkitchen/partybundle.js");
const ImgKitImage = require("../../model/common/image.js");
const path = process.env.CONTEXT_PATH + "/imagekit";

var imagePersistenceComplete = false;

// Initialize
const imageKit = new ImageKit({
    publicKey: `${publicKey}`,
    privateKey: `${privateKey}`,
    urlEndpoint: `${urlEndpoint}`,
});

// Define storage for uploaded files
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/"); // Destination folder for uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, req.query.adReference + "-" + file.originalname); // Rename the file to include the timestamp
    },
});

const memStorage = multer.memoryStorage();

// Initialize Multer with the storage configuration
const uploadToFile = multer({ storage: storage });
const uploadToMem = multer({ storage: memStorage });


// const upload = multer({ dest: "uploads/" });
module.exports = (app) => {
    // Public routes
    app.get(path + "/token", controller.token);
    app.delete(path + "/files/:id", controller.deleteFile);
    app.get(path + "/files/:id", controller.getFile);
    app.get(path + "/files", controller.listFiles);
    // app.post(path + "/upload_images", upload.single("file"), uploadFile);

    // Upload To Imagekit
    // app.post(path + "/upload_images", uploadToMem.array("files", 5), storeFileAsync);

    // Upload To Cloudflare
    app.post(path + "/upload_images", uploadToMem.array("files", 5), storeFileAsync);
};


async function storeFileAsync(req, res) {
    var fileKeys = Object.keys(req.files);
    console.log('Files ' + fileKeys);
    var imagekitResponses = [];
    imagePersistenceComplete = false;

    // Iterate all images and upload into Image Kit Asynchronously
    await fileKeys.map(async function (key) {
        var file = req.files[key];
        const b64 = Buffer.from(file.buffer).toString("base64");
        console.log('Uploading file to ImageKit ' + file.originalname);
        const response = await imageKit.upload({ file: b64, fileName: file.originalname, extensions: [{ name: "google-auto-tagging", maxTags: 5, minConfidence: 95, },], transformation: { pre: "l-text,i-Sapadu,fs-10,l-end", post: [{ type: "transformation", value: "w-100", },], }, });
        console.log('Upload response from Imagekit ' + JSON.stringify(response));
        imagekitResponses.push(response);
    });

    // Wait until all images are uploaded
    await Utils.until(function uploaded() {
        if (req.files.length == imagekitResponses.length) {
            return true;
        } else {
            return false;
        }
    });

    var localImageSaveCount = 0;

    // Iterate all response and update relevant entities in Mongo DB
    imagekitResponses.forEach(async e => {
        //First store the Imagekit response into MongoDB collection
        await addImage(req.query.entity, req.query.entityId, e);
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

    console.log('Images persisted locally : ' + localImageSaveCount);

    if (req.query.entity === 'Ad') {
        updateAd(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'Property') {
        updateProperty(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'Collection') {
        updateCollection(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'Food') {
        await updateMenuCoverPhoto(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'PartyBundle') {
        updatePartyBundleCoverPhoto(imagekitResponses[0].url, req.query.entityId);
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
}


/**
 * Builds Ad from incoming Request.
 * @returns Ad Model
 * @param {Request} req 
 */
function buildAd(body) {
    return new Ad(body);
}

/**
 * Update the Ad with Images from ImageKit
 * @param {*} entityId 
 * @param {*} url 
 */
function updateAd(url, entityId) {
    var body = {};
    body.image = url;
    Ad.updateOne({ reference: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update Ad with image ')
            } else {
                imagePersistenceComplete = true;
                console.log(`Ad ${entityId} updated with image ${url}`);
            }
        }).catch(err => {
            console.log('Error while updating ad ' + JSON.stringify(err))
        });
}

/**
 * Update the Ad with Images from ImageKit
 * @param {*} entityId 
 * @param {*} url 
 */
function updateProperty(url, entityId) {
    var body = {};
    body.image = url;
    Property.updateOne({ reference: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update Property with image ')
            } else {
                imagePersistenceComplete = true;
                console.log(`Property ${entityId} updated with image ${url}`);
            }
        }).catch(err => {
            console.log('Error while updating Property ' + JSON.stringify(err))
        });
}

/**
 * Update the Food with Images from ImageKit
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
 * Update the PartyBundle with Images from ImageKit
 * @param {*} entityId 
 * @param {*} url 
 */
function updatePartyBundleCoverPhoto(url, entityId) {
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
 * Update the Collection with Images from ImageKit
 * @param {*} entityId 
 * @param {*} url 
 */
function updateCollection(url, entityId) {
    var body = {};
    body.image = url;
    Collection.updateOne({ _id: entityId }, body, { new: true })
        .then(data => {
            if (!data) {
                console.error('Could not update Collection with image ')
            } else {
                imagePersistenceComplete = true;
                console.log(`Collection ${entityId} updated with image ${url}`);
            }
        }).catch(err => {
            console.log('Error while updating Collection ' + JSON.stringify(err))
        });
}

async function addImage(entity, entityId, imagekitResponse) {
    var LocalImage = new ImgKitImage(buildImageJson(entity, entityId, imagekitResponse));
    LocalImage.save()
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
function buildImageJson(entity, entityId, imagekitResponse) {
    var slug = entityId.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + imagekitResponse.fileId.trim().replace(/[\W_]+/g, "_").toLowerCase();
    return {
        reference: entityId,
        entity: entity,
        fileId: imagekitResponse.fileId,
        url: imagekitResponse.url,
        name: imagekitResponse.name,
        thumbnail: imagekitResponse.thumbnail,
        active: true,
        slug: slug
    };
}