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
const ImgKitImage = require("../../model/common/image.js");
const path = process.env.CONTEXT_PATH + "/imagekit";

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
    app.post(path + "/upload_images", uploadToMem.array("files", 5), storeFileAsync);
};

function uploadFile(req, res) {
    var fileKeys = Object.keys(req.files);
    console.log('Files ' + fileKeys)
    fileKeys.map(function (key) { // return array of promises
        var file = req.files[key];
        console.log('Uploading file ' + file.originalname)
        Promise.resolve(readFileFromMemStorageAndUploadToImageKit(req, file));

        // fs.readFile(file.path, "base64", (err, data) => {
        //     if (err) {
        //         console.error(err);
        //     }
        //     return uploadUsingPromise(req, data, file);
        // });
    });
    console.log('Sending response back to Client')
    res.status(200);
    res.send({
        status: "Success"
    });
}

async function storeFileAsync(req, res) {
    var fileKeys = Object.keys(req.files);
    console.log('Files ' + fileKeys);
    var imagekitResponses = [];
    await fileKeys.map(async function (key) {
        var file = req.files[key];
        const b64 = Buffer.from(file.buffer).toString("base64");
        console.log('Uploading file ' + file.originalname);
        const response = await imageKit.upload({ file: b64, fileName: file.originalname, extensions: [{ name: "google-auto-tagging", maxTags: 5, minConfidence: 95, },], transformation: { pre: "l-text,i-currific,fs-10,l-end", post: [{ type: "transformation", value: "w-100", },], }, });
        console.log('Upload response ' + JSON.stringify(response));
        imagekitResponses.push(response);
    });
    await Utils.until(function uploaded() {
        if (req.files.length == imagekitResponses.length) {
            return true;
        } else {
            return false;
        }
    });

    console.log('Sending response back to Client');
    res.status(200);
    res.send({ status: "Success" });
    imagekitResponses.forEach(e => {
        addImage(req.query.entityId, e);
    });
    if (req.query.entity === 'ads') {
        updateAd(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'properties') {
        updateProperty(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'collections') {
        updateCollection(imagekitResponses[0].url, req.query.entityId);
    } else if (req.query.entity === 'foods') {
        updateFood(imagekitResponses[0].url, req.query.entityId);
    }
}


function readFileFromMemStorageAndUploadToImageKit(req, file) {
    // console.log(`Uploading file  ${file.originalname}`);
    const b64 = Buffer.from(file.buffer).toString("base64");
    return imageKit
        .upload({
            file: b64, // File content to upload
            fileName: file.originalname, // Desired file name
            extensions: [{
                name: "google-auto-tagging",
                maxTags: 5,
                minConfidence: 95,
            },],
            transformation: {
                pre: "l-text,i-currific,fs-10,l-end",
                post: [{
                    type: "transformation",
                    value: "w-100",
                },],
            },
        })
        .then((response) => {
            addImage(req.query.reference, response);
            console.log('Uploading complete ' + response.url)
        })
        .catch((error) => {
            console.log(error);
        });
}

function readFilesFromDiskAndUploadToImageKit(req, data, file) {
    console.log(`Uploading ${file.path} using promise `);
    return imageKit
        .upload({
            file: data, // File content to upload
            fileName: file.originalname, // Desired file name
            extensions: [{
                name: "google-auto-tagging",
                maxTags: 5,
                minConfidence: 95,
            },],
            transformation: {
                pre: "l-text,i-currific,fs-50,l-end",
                post: [{
                    type: "transformation",
                    value: "w-100",
                },],
            },
        })
        .then((response) => {
            fs.unlinkSync(file.path);
            updateAd(req, response);
        })
        .catch((error) => {
            console.log(error);
        });
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
    body.image= url;
    Ad.updateOne({ reference: entityId }, body, { new: true })
            .then(data => {
                if (!data) {
                    console.error('Could not update Ad with image ')
                } else {
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
    body.image= url;
    Property.updateOne({ reference: entityId }, body, { new: true })
            .then(data => {
                if (!data) {
                    console.error('Could not update Property with image ')
                } else {
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
function updateFood(url, entityId) {
    var body = {};
    body.image= url;
    Food.updateOne({ _id: entityId }, body, { new: true })
            .then(data => {
                if (!data) {
                    console.error('Could not update Food with image ')
                } else {
                    console.log(`Food ${entityId} updated with image ${url}`);
                }
            }).catch(err => {
                console.log('Error while updating Food ' + JSON.stringify(err))
            });
}

/**
 * Update the Collection with Images from ImageKit
 * @param {*} entityId 
 * @param {*} url 
 */
function updateCollection(url, entityId) {
    var body = {};
    body.image= url;
    Collection.updateOne({ _id: entityId }, body, { new: true })
            .then(data => {
                if (!data) {
                    console.error('Could not update Collection with image ')
                } else {
                    console.log(`Collection ${entityId} updated with image ${url}`);
                }
            }).catch(err => {
                console.log('Error while updating Collection ' + JSON.stringify(err))
            });
}

function addImage(entityId, payload) {
    var ImgImage = new ImgKitImage(buildImageJson(entityId, payload));
    ImgImage.save()
        .then(data => {
            console.log('Saved image ' + JSON.stringify(data))
        }).catch(err => {
            console.log('Error when saving image ' + slug + ". " + err)
        });

}

/**
 * Builds Image Json from Request
 * 
 * @param {Request} payload 
 */
function buildImageJson(entityId, payload) {
    var slug = entityId.trim().replace(/[\W_]+/g, "-").toLowerCase() + "-" + payload.fileId.trim().replace(/[\W_]+/g, "_").toLowerCase();
    return {
        fileId: payload.fileId,
        reference: entityId,
        url: payload.url,
        name: payload.name,
        thumbnail: payload.thumbnail,
        active: true,
        slug: slug
    };
}