const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const crypto = require("crypto");
const http = require("https");
const { Buffer } = require("node:buffer");
var ImageKit = require("imagekit");

const privateKey = process.env.IMAGEKIT_PRIVATEKEY;
const publicKey = process.env.IMAGEKIT_PUBLICKEY;
const urlEndpoint = process.env.IMAGEKIT_URL_ENDPOINT;

// Initialize
var imageKit = new ImageKit({
    publicKey: `${publicKey}`,
    privateKey: `${privateKey}`,
    urlEndpoint: `${urlEndpoint}`,
});

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
    console.log("Deleting of file " + req.query.fileId);
    imageKit.deleteFile(req.query.fileId, function(error, result) {
        if (error) console.log(error);
        else {
            res.status(204);
            res.send();
        }
    });
};

exports.getFile = (req, res) => {
    console.log("Fetching details of file " + req.query.fileId);
    imageKit.getFileDetails(req.query.fileId, function(error, result) {
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