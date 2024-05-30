const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const crypto = require("crypto");
const http = require("https");
const { Buffer } = require("node:buffer");
var ImageKit = require("imagekit");
var formidable = require('formidable');

const privateKey = process.env.IMAGEKIT_PRIVATEKEY;
const publicKey = process.env.IMAGEKIT_PUBLICKEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

// Initialize
var imageKit = new ImageKit({
    publicKey: `${publicKey}`,
    privateKey: `${privateKey}`,
    urlEndpoint: `${urlEndpoint}`,
});

exports.upload = (req, res) => {
    console.log('Request Headers ' + JSON.stringify(req.headers))
    console.log('Request Files ' + JSON.stringify(req.files))
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log('Files ' + files.length)
            //   var oldpath = files.filetoupload.filepath;
            //   var newpath = 'C:/Users/Your Name/' + files.filetoupload.originalFilename;
            //   fs.rename(oldpath, newpath, function (err) {
            //     if (err) throw err;
            //     res.write('File uploaded and moved!');
            //     res.end();
            //   });
    });
    res.write('File uploaded and moved!');
    res.end();
}

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