const jwt = require('jsonwebtoken');
const uuid = require('uuid');
const crypto = require("crypto");
const privateKey = process.env.IMAGEKIT_PRIVATEKEY;

exports.token = (req, res) => {
  var token = req.query.token || uuid.v4();
  var expire = req.query.expire || parseInt(Date.now()/1000)+2400;
  var privateAPIKey = `${privateKey}`;
  var signature = crypto.createHmac('sha1', privateAPIKey).update(token+expire).digest('hex');
  res.status(200);
  res.send({
      token : token,
      expire : expire,
      signature : signature
  });
};

exports.fullToken = (req, res) => {
  const payload = req.body;
  const token = jwt.sign(payload.uploadPayload, "private_6v4LZpKVbg5FWEccdoxrXoxWlyU=", {
    expiresIn: payload.expire,
    header: {
      alg: "HS256",
      typ: "JWT",
      kid: payload.publicKey,
    },
  });

  var expire = payload.expire || parseInt(Date.now() / 1000) + 2400;
  var privateAPIKey = "private_6v4LZpKVbg5FWEccdoxrXoxWlyU=";
  var signature = crypto.createHmac('sha1', privateAPIKey).update(token + expire).digest('hex');
  res.set({
    "Access-Control-Allow-Origin": "*"
  })
  res.status(200);
  res.send({
    token: token,
    expire: expire,
    signature: signature
  })
}