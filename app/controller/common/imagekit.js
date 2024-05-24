const jwt = require("jsonwebtoken");
const uuid = require("uuid");
const crypto = require("crypto");
const http = require("https");
const { Buffer } = require("node:buffer");

const privateKey = process.env.IMAGEKIT_PRIVATEKEY;

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

exports.delete = (req, res) => {
    var fileId = req.query.fileId;
    console.log("Deleting image file " + fileId);
    var privateAPIKey = `${privateKey}`;
    const buf = Buffer.from(privateAPIKey);
    const base64EncodedPrivateKey = buf.toString("base64");
    console.log("Private key base64 " + base64EncodedPrivateKey);
    // Define the options object
    const options = {
        method: "DELETE", // Specify the HTTP method
        hostname: "api.imagekit.io", // Specify the hostname
        port: 443, // Specify the port (443 for HTTPS)
        path: "/v1/files/" + fileId, // Specify the path
        headers: {
            'Authorization': base64EncodedPrivateKey + ":"
        }
    };
    // Make the request
    const request = http.request(options, (response) => {
        // Handle the response
        console.log("Status code:", response.statusCode); // Print the status code
        console.log("Headers:", response.headers); // Print the headers

        // Get the data from the response
        let data = "";
        response.on("data", (chunk) => {
            data += chunk; // Concatenate the chunks
        });

        // When the response is finished, print the data
        response.on("end", () => {
            console.error("Req:", req.headers);
            console.log("Data:", data); // Print the data
        });
    });

    // Handle any errors
    request.on("error", (err) => {
        console.error("Req:", req.headers); // Print the error message
        console.error("Error:", err.message); // Print the error message
    });

    // End the request
    request.end();
    res.status(204);
    res.send();
};

exports.fullToken = (req, res) => {
    const payload = req.body;
    const token = jwt.sign(
        payload.uploadPayload,
        "private_6v4LZpKVbg5FWEccdoxrXoxWlyU=", {
            expiresIn: payload.expire,
            header: {
                alg: "HS256",
                typ: "JWT",
                kid: payload.publicKey,
            },
        }
    );

    var expire = payload.expire || parseInt(Date.now() / 1000) + 2400;
    var privateAPIKey = "private_6v4LZpKVbg5FWEccdoxrXoxWlyU=";
    var signature = crypto
        .createHmac("sha1", privateAPIKey)
        .update(token + expire)
        .digest("hex");
    res.set({
        "Access-Control-Allow-Origin": "*",
    });
    res.status(200);
    res.send({
        token: token,
        expire: expire,
        signature: signature,
    });
};