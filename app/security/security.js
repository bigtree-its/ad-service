const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const referer = req.headers['referer'] || req.headers['referer'];

    if ( referer && referer === 'http://localhost:5200/'){
        next();
    }else{
        console.log('Verifying token ');
        const token = req.headers['Authorization'] || req.headers['authorization'];
        if (typeof token !== 'undefined') {
            jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    
                if (err) {
                    console.error("Error when verifying token.. "+ err)
                    res.sendStatus(401);
                } else {
                    req.decoded = decoded;
                    console.log('Token verified ' + decoded)
                    next();
                }
            });
            // next();
        } else {
            console.log('Unauthorized!');
            res.sendStatus(401);
        }
    }
}

module.exports.verifyToken = verifyToken;