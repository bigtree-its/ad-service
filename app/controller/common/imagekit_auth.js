const jwt = require('jsonwebtoken');

exports.token = (req, res) => {
  console.log("Generating imagekit token");
  const payload = req.body;
  const token = jwt.sign(payload.uploadPayload, "private_6v4LZpKVbg5FWEccdoxrXoxWlyU=", {
    expiresIn: payload.expire,
    header: {
      alg: "HS256",
      typ: "JWT",
      kid: payload.publicKey,
    },
  });
  res.set({
    "Access-Control-Allow-Origin": "*"
  })
  res.status(200);
  res.send({ token });
};