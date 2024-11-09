const uuid = require("uuid");
const crypto = require("crypto");
var ImageKit = require("imagekit");
const path = require("path");
const uploadFile = require("../../middleware/upload");

const privateKey = process.env.IMAGEKIT_PRIVATEKEY;
const publicKey = process.env.IMAGEKIT_PUBLICKEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;


exports.multerUpload = async(req, res) => {
    try {
        await uploadFile(req, res);

        if (req.file == undefined) {
            return res.status(400).send({ message: "Please upload a file!" });
        }

        res.status(200).send({
            message: "Uploaded the file successfully: " + req.file.originalname,
        });
    } catch (err) {
        res.status(500).send({
            message: `Could not upload the file: ${err}`,
        });
    }
};

// Initialize
const imageKit = new ImageKit({
    publicKey: `${publicKey}`,
    privateKey: `${privateKey}`,
    urlEndpoint: `${urlEndpoint}`,
});

exports.useFormidable = (req, res) => {
    console.log("Using formidable");
    const form = new formidable.IncomingForm();
    const uploadFolder = path.join(__dirname, "public", "files");
    form.multiples = true;
    form.maxFileSize = 50 * 1024 * 1024; // 5MB
    form.uploadDir = uploadFolder;
    console.log(form);

    form.parse(req, async(err, fields, files) => {
        console.log(fields);
        console.log("Files " + files);
        if (err) {
            console.log("Error parsing the files");
            return res.status(400).json({
                status: "Fail",
                message: "There was an error parsing the files",
                error: err,
            });
        }
    });
};


exports.imageKitUpload = (data) => {
    console.log("Uploading to ImageKit");
    imageKit
        .upload({
            file: data, // File content to upload
            fileName: "my_file_name.jpg", // Desired file name
            extensions: [{
                name: "google-auto-tagging",
                maxTags: 5,
                minConfidence: 95,
            }, ],
            transformation: {
                pre: "l-text,i-homegrub,fs-50,l-end",
                post: [{
                    type: "transformation",
                    value: "w-100",
                }, ],
            },
        })
        .then((response) => {
            console.log(response);
        })
        .catch((error) => {
            console.log(error);
        });
};

exports.upload2 = (req, res) => {
    console.log("API Endpoint for file uploads");
    const files = req.files;
    const errors = [];
    // Validate file types and sizes
    files.forEach((file) => {
        const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/gif"];
        const maxSize = 1 * 1024 * 1024; // 5MB

        if (!allowedTypes.includes(file.mimetype)) {
            errors.push(`Invalid file type: ${file.originalname}`);
        }

        if (file.size > maxSize) {
            errors.push(`File too large: ${file.originalname}`);
        }
    });

    // Handle validation errors
    if (errors.length > 0) {
        // Remove uploaded files
        return res.status(400).json({ errors });
    }
};

exports.listFiles = (req, res) => {
    var options = {};
    if (req.query.path) {
        options.path = req.query.path;
    }
    console.log("List files " + JSON.stringify(options));
    imageKit.listFiles(options, function(error, result) {
        if (error) console.log(error);
        else {
            res.send(result);
        }
    });
};

exports.deleteFile = (req, res) => {
    console.log("Deleting of file " + req.params.id);
    imageKit.deleteFile(req.params.id, function(error, result) {
        if (error) {
            console.log(error);
            res.status(400);
            res.send(error);
        } else {
            res.status(204);
            res.send(result);
        }
    });
};

exports.deleteByFileId = (fileId) => {
    console.log("Deleting a imagekit file with FileId" + fileId);
    imageKit.deleteFile(fileId, function(error, result) {
        if (error) {
            console.log(error);
        } else {
            console.log(result);
        }
    });
};


exports.getFile = (req, res) => {
    console.log("Fetching details of file " + req.params.id);
    imageKit.getFileDetails(req.params.id, function(error, result) {
        if (error) {
            console.log(error);
            res.status(400);
            res.send(error);
        } else {
            res.status(200);
            res.send(result);
        }
    });
};

exports.token = (req, res) => {
    var token = req.query.token || uuid.v4();
    var expire = req.query.expire || parseInt(Date.now() / 1000) + 2400;
    var privateAPIKey = `${privateKey}`;
    var signature = crypto
        .createHmac("sha1", privateAPIKey)
        .update(token + expire)
        .digest("hex");
    res.status(200);
    res.send({
        token: token,
        expire: expire,
        signature: signature,
    });
};