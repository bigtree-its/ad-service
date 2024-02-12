const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
    console.log("Verifying token ");
    var bearerToken = req.headers["Authorization"] || req.headers["authorization"];

    if (typeof bearerToken !== "undefined") {
        if (bearerToken.includes("Bearer")) {
            var result = bearerToken.replace(/Bearer/g, '');
            bearerToken = result.trim();
        }
        jwt.verify(bearerToken, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.error("Error when verifying token.. " + err);
                res.sendStatus(401);
            } else {
                req.decoded = decoded;
                next();
            }
        });
    } else {
        console.log("Unauthorized!");
        res.sendStatus(401);
    }
};

module.exports.verifyToken = verifyToken;