const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const crypto = require("crypto");
const http = require("https");
const { Buffer } = require("node:buffer");
var ImageKit = require("imagekit");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const uploadFile = require("../../middleware/upload");
const fsPromises = require('fs/promises')

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


exports.upload3 = async(req, res) => {
    // if (!req.files || Object.keys(req.files).length === 0) {
    //     return res.status(400).send('No files were uploaded.');
    // }
    // this.useFormidable(req, res);
    // this.multerUpload(req, res);

    // console.log('req.files ' + req.files)
    //   file = req.files.FormFieldName; // here is the field name of the form
    //   this.imageKitUpload(req.files);
    //   res.send("File Uploaded " + file);
    // let imagedata = "";
    // req.on("data", (chunk) => (imagedata += chunk));

    // req.on("end", () => {
    //     const base64Data = imagedata.replace(
    //         /^data:image\/(png|jpeg|jpg);base64,/,
    //         ""
    //     );
    //     fs.writeFile("/Users/maan/Pictures/downloaded.jpg", base64Data, "base64", (err) => {
    //         if (err) throw err;
    //         console.log("File saved!");
    //     });
    //     fs.writeFile(
    //         "/Users/maan/Pictures/downloaded.jpg",
    //         imagedata,
    //         "binary",
    //         (err) => {
    //             if (err) throw err;
    //             console.log("File saved!");
    //         }
    //     );
    // });

    // const chunks = [];
    // req.on("data", (data) => {
    //     chunks.push(data);
    // });
    // req.on("end", () => {
    //     const payload = Buffer.concat(chunks).toString();
    //     this.imageKitUpload(payload);
    //     // console.log(payload);
    //     // fs.writeFile("/Users/maan/Pictures/file.text", payload, "binary", (err) => {
    //     //     if (err) throw err;
    //     //     console.log("File saved!");
    //     // });
    // });
    try {
        const buffer = await new Promise((resolve, reject) => {
                const chunks = []

                req.on('data', (chunk) => chunks.push(chunk))
                req.on('end', () => resolve(Buffer.concat(chunks)))
                req.on('error', (err) => reject(err))
            }) // <1>

        const { filename } = req.query
        const basename = path.basename(filename)
        const dirname = path.join(__dirname, 'upload')
        const destination = path.join(dirname, basename)

        await fsPromises.mkdir(dirname, { recursive: true })
        await fsPromises.writeFile(destination, buffer) // <2>

        res.status(201).end()
    } catch (err) {
        // next(err)
    }
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
                pre: "l-text,i-Imagekit,fs-50,l-end",
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