const multer = require("multer");
var ImageKit = require("imagekit");
const privateKey = process.env.IMAGEKIT_PRIVATEKEY;
const publicKey = process.env.IMAGEKIT_PUBLICKEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;
const fs = require("node:fs");
const { Buffer } = require("node:buffer");
const controller = require("../../controller/common/imagekit.js");
//Require Ad Model
const Ad = require("../../model/ad/ad.js");
const path = process.env.CONTEXT_PATH + "/imagekit";
var counter = 0;
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
    app.post(path + "/upload_images", uploadToMem.array("files", 5), uploadFile);
};

function uploadFile(req, res) {
    var fileKeys = Object.keys(req.files);
    console.log('Files ' + fileKeys)
    fileKeys.map(function(key) { // return array of promises
        var file = req.files[key];
        return readFileFromMemStorageAndUploadToImageKit(req, file);
        // fs.readFile(file.path, "base64", (err, data) => {
        //     if (err) {
        //         console.error(err);
        //     }
        //     return uploadUsingPromise(req, data, file);
        // });
    });
    res.status(200);
    res.send({
        status: "Success"
    });
}

function readFileFromMemStorageAndUploadToImageKit(req, file) {
    console.log(`Uploading file  ${file.originalname}`);
    const b64 = Buffer.from(file.buffer).toString("base64");
    return imageKit
        .upload({
            file: b64, // File content to upload
            fileName: file.originalname, // Desired file name
            extensions: [{
                name: "google-auto-tagging",
                maxTags: 5,
                minConfidence: 95,
            }, ],
            transformation: {
                pre: "l-text,i-Imagekit,fs-50,l-end",
                post: [{
                    type: "transformation",
                    value: "w-100",
                }, ],
            },
        })
        .then((response) => {
            updateAd(req, response);
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
            }, ],
            transformation: {
                pre: "l-text,i-Imagekit,fs-50,l-end",
                post: [{
                    type: "transformation",
                    value: "w-100",
                }, ],
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
 * @param {*} req 
 * @param {*} image 
 */
function updateAd(req, image) {
    let query = Ad.find();
    query.where("reference", req.query.adReference);
    Ad.find(query)
        .then((result) => {
            console.log(
                `Found ${result.length} Ad with reference ${req.query.adReference}`
            );
            const Ad = buildAd(result[0]);
            var gallery = [].concat.apply([], Ad.gallery);
            gallery.push(image);
            Ad.gallery = gallery;
            Ad.save();
            console.log(`Added image ${image.fileId} to Ad ${req.query.adReference}`);
        })
        .catch((error) => {
            console.error("Error while fetching Ad from database. " + error.message);
        });
}