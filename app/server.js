require('dotenv').config()
const express = require('express');
const bodyParser = require('body-parser');
const querystring = require('querystring');
var cors = require('cors');

require('console-stamp')(console, { pattern: 'dd/mm/yyyy HH:MM:ss.l' });

const app = express();
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: false }))
    // parse requests of content-type - application/json
app.use(bodyParser.json())

var callLogger = (req, res, next) => {
        let qs = querystring.stringify(req.query);

        let parseIp = req.headers['x-forwarded-for'];
        if (parseIp) {
            parseIp = parseIp.split(',').shift();
        } else if (req.socket) {
            parseIp = req.socket.remoteAddress;
        }
        const host = req.headers['Host'] || req.headers['host'];
        console.log(`Req from: ${host} ${parseIp} ${req.method}: ${req.path} ${qs}`);
        console.log(`Headers ${req.headers}`)
        next();
    }
    // Add logger middleware before router middleware to express
    // .use(middleware)  is the syntax to add middleware to express
app.use(callLogger);


process.on('unhandledRejection', (err) => {
    console.log(err);
    process.exit(1);
});

// Database configurations
const mongoose = require('mongoose');
const { verifyToken } = require('./security/security');
mongoose.Promise = global.Promise;

// connect to database
mongoose.connect(process.env.DB_URL, { useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false })
    .then(() => { console.log("Successfully connected to database"); })
    .catch(err => {
        console.error("Cannot connect to the database. Exiting now", err);
        process.exit();
    })

//Get the default connection
var db = mongoose.connection;
//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));


app.options('*', cors())
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    res.header("Access-Control-Allow-Methods", "GET, HEAD, PUT, PATCH, POST");
    next();
})

// Add security as below
// app.use(function(req, res, next) {
//     verifyToken(req, res, next)
// });

// Other routes
require('./route/chef')(app);
require('./route/postcodedistrict')(app);
require('./route/servicearea')(app);
require('./route/calendar')(app);
require('./route/cuisine')(app);
require('./route/dish')(app);
require('./route/slot')(app);
require('./route/supplier')(app);
require('./route/collection')(app);
require('./route/category')(app);
require('./route/review')(app);
require('./route/menu')(app);
require('./route/partybundle')(app);
require('./route/products/product')(app);
require('./route/products/group')(app);
require('./route/products/feedback')(app);
require('./route/property/property')(app);
require('./route/property/property-enquiry')(app);
require('./route/carousel')(app);
require('./route/property/type')(app);
app.use('/health', require('./route/healthcheck'));

//Listen for requests
app.listen(process.env.PORT, () => {
    console.log(`Server listening on ${process.env.PORT}`);
    console.log(`Server Context Path ${process.env.CONTEXT_PATH}`);
});